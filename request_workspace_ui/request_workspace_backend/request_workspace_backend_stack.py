import json

from aws_cdk import (
    core,
    aws_lambda as lambda_,
    aws_apigateway as apigateway,
    aws_logs as logs,
    aws_iam as iam
)

from .stepfunctions_workflow import StepFunctionsWorkflow

class RequestWorkspaceBackendStack(core.Stack):
    def __init__(self, scope: core.Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        sf_workflow = StepFunctionsWorkflow(self, 'request-workspace-workflow')

        ## Create a role for the API Integration
        api_role = iam.Role(
            self, "api-role-for-step-fn",
            description="Role for BMH API to control StepFn State Machine",
            role_name="bmh-api-to-stepfn",
            assumed_by=iam.ServicePrincipal("apigateway.amazonaws.com")
        )
        sf_workflow.state_machine.grant_start_execution(api_role)

        log_group = logs.LogGroup(self, 'bmh-api-loggroup')
        api = apigateway.RestApi(
            self, 'workspace-request-api',
            deploy_options=apigateway.StageOptions(
                data_trace_enabled=True,
                logging_level=apigateway.MethodLoggingLevel.INFO,
                metrics_enabled=True,
                access_log_destination=apigateway.LogGroupLogDestination(log_group),
                stage_name="test"
            ),
            default_cors_preflight_options={
                "allow_origins": apigateway.Cors.ALL_ORIGINS
            }
        )

        mapping_template = {
            'application/json': json.dumps({
                'stateMachineArn': sf_workflow.state_machine.state_machine_arn,
                'input': "$util.escapeJavaScript($input.json('$'))"
            })
        }

        integration_response = [apigateway.IntegrationResponse(
            selection_pattern = '200',
            status_code = '200',
            response_parameters = {
                'method.response.header.access-control-allow-origin': "'*'"
            },
            response_templates = {
                'application/json': "$input.json('$')"
            }
        )]

        workspace_request = api.root.add_resource("workspace-request")
        step_functions_integration = apigateway.AwsIntegration(
            service='states', 
            action='StartExecution',
            options=apigateway.IntegrationOptions(
                passthrough_behavior=apigateway.PassthroughBehavior.WHEN_NO_TEMPLATES,
                request_templates=mapping_template,
                integration_responses=integration_response,
                credentials_role=api_role
            )
        )

        method_response = [apigateway.MethodResponse(
                status_code='200',
                response_parameters={
                    'method.response.header.access-control-allow-origin': True
                },
                response_models={
                    'application/json': apigateway.EmptyModel()
                }
        )]
        
        workspace_request.add_method(
            "POST", step_functions_integration, 
            method_responses=method_response
        )
       