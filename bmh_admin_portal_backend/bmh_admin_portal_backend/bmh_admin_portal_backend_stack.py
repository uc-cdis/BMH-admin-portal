import json
import os

from aws_cdk import (
    core,
    aws_lambda as lambda_,
    aws_apigateway as apigateway,
    aws_logs as logs,
    aws_iam as iam,
    aws_ssm as ssm,
    aws_sns as sns,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_s3_deployment as s3_deployment,
    aws_stepfunctions as stepfunctions,
    aws_stepfunctions_tasks as sfn_tasks,
    aws_secretsmanager as secretsmanager
)
from aws_cdk.aws_lambda_python import PythonFunction

from .bmh_cognito_userpool import BMHAdminPortalCognitoUserPool
from .bmh_admin_portal_config import BMHAdminPortalBackendConfig

class BmhAdminPortalBackendStack(core.Stack):
    def __init__(self, scope: core.Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        config = BMHAdminPortalBackendConfig.get_config()

        # Create the user pool, ssm parameteres and app client.
        #cognito_user_pool = BMHAdminPortalCognitoUserPool(self, "cognito-user-pool")

        # Create the dynamodb table and store the name in SystemsManager
        # as a Parameter.
        dynamodb_table = dynamodb.Table(
            self, "bmh-workspace-table",
            partition_key=dynamodb.Attribute(name="user_id", type=dynamodb.AttributeType.STRING),
            sort_key=dynamodb.Attribute(name="bmh_workspace_id", type=dynamodb.AttributeType.STRING),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.AWS_MANAGED
        )

        # This should be unique per stack deployment, but consistent
        # for each time this is deployed (unless the Node Tree is changed)
        index_name = "bmh-workspace-index-" + dynamodb_table.node.addr

        # Used to get partiion/sort key with only Workspace ID
        dynamodb_table.add_global_secondary_index(
            partition_key=dynamodb.Attribute(name="bmh_workspace_id", type=dynamodb.AttributeType.STRING),
            index_name=index_name,
            projection_type=dynamodb.ProjectionType.KEYS_ONLY
        )

        ssm.StringParameter(
            self, "workspace-dynamodb-table-parameter",
            description="Dynamodb Table Name for Workspace Info",
            parameter_name=config['dynamodb_table_param_name'],
            string_value=dynamodb_table.table_name
        )
        ssm.StringParameter(
            self, "workspace-dynamodb-gsi-parameter",
            description="Dynamodb Table GSI name for Workspace Info",
            parameter_name=config['dynamodb_index_param_name'],
            string_value=index_name
        )

        ############################### Create API ##########################################
        log_group = logs.LogGroup(self, 'bmh-workspaces-api-loggroup')
        api = apigateway.RestApi(
            self, 'bmh-workspaces-api',
            deploy_options=apigateway.StageOptions(
                data_trace_enabled=True,
                logging_level=apigateway.MethodLoggingLevel.INFO,
                metrics_enabled=True,
                access_log_destination=apigateway.LogGroupLogDestination(log_group),
                stage_name="api"
            ),
            default_cors_preflight_options={
                "allow_origins": apigateway.Cors.ALL_ORIGINS
            }
        )

        # Store the API URL in SSM parameter store 
        api_url_param = ssm.StringParameter(
            self, "workspaces-api-url-parameter",
            description="API URL for workspace request API",
            parameter_name=config['api_url_param_name'],
            string_value=api.url
        )

        auth_fn = PythonFunction(
            self, "workspaces-auth-lambda",
            runtime=lambda_.Runtime.PYTHON_3_8,
            entry="lambda/lambda_authorizer",
            index="lambda_authorizer.py",
            handler="lambda_handler",
            description="Lambda token authorizer function",
            environment={
                'auth_base_url': config['auth_oidc_uri']
            }
        )

        # Create token authorizer
        token_authorizer = apigateway.TokenAuthorizer(
            scope=self, id='apigateway-lambda-token-authorizer',
            handler=auth_fn
        )

        apigateway.GatewayResponse(
            self, "gateway-response-401",
            rest_api=api,
            type=apigateway.ResponseType.UNAUTHORIZED,
            response_headers={
                'Access-Control-Allow-Origin': "'*'"
            }
        )
        #####################################################################################

        #####################################################################################
        ####### BRH Workspace Assets
        brh_workspace_builddir = os.path.join(os.getcwd(), "..", "bmh_workspace", "build")

        # Create the s3 bucket
        brh_workspace_assets_bucket = s3.Bucket(
            self, "brh-workspace-assets",
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL
        )
        
        deployment = s3_deployment.BucketDeployment(
            self, "brh-workspace-assets-deployment",
            sources=[s3_deployment.Source.asset(brh_workspace_builddir)],
            destination_bucket=brh_workspace_assets_bucket,
            destination_key_prefix="artifacts",
            server_side_encryption=s3_deployment.ServerSideEncryption.AES_256,
        )
        ssm.StringParameter(
            self, "brh-workspace-assets-bucket",
            description="Dynamodb Table GSI name for Workspace Info",
            parameter_name=config['brh-workspace-assets-bucket'],
            string_value=brh_workspace_assets_bucket.bucket_name
        )
        ########################################################################################

        ########################################################################################
        ##### Step Functions Workflow
        ########################################################################################
        step_fn_workflow = self.create_step_functions_workflow(brh_workspace_assets_bucket, dynamodb_table, config)
        ########################################################################################

        ## Secret for Authorization Client secret. If an non-default encryption key was
        ## used, we'll need to add it here so that we can grant read permissions to the lambda.
        ## See from_secret_attributes() here: 
        ## https://docs.aws.amazon.com/cdk/api/latest/python/aws_cdk.aws_secretsmanager/Secret.html
        auth_client_secret_param = secretsmanager.Secret.from_secret_complete_arn(
            self, 'auth_client_secret',
            secret_complete_arn=config['auth_client_secret_arn']
        )

        ## Lambda function which handles the API Gateway endpoints.
        workspaces_resource_lambda = lambda_.Function(
            self, 'workspaces-resource-function',
            runtime=lambda_.Runtime.PYTHON_3_8,
            code=lambda_.Code.asset('lambda/workspaces_api_resource'),
            handler='workspaces_api_resource_handler.handler',
            timeout=core.Duration.seconds(600),
            description="Function which handles API Gateway requests for BRH Admin Portal",
            environment={
                'dynamodb_table_param_name': config['dynamodb_table_param_name'],
                'dynamodb_index_param_name': config['dynamodb_index_param_name'],
                'api_usage_id_param_name': config['api_usage_id_param_name'],
                'brh_asset_bucket': brh_workspace_assets_bucket.bucket_name,
                'brh_portal_url': config['api_url_param_name'],
                'state_machine_arn': step_fn_workflow.state_machine_arn,
                'auth_redirect_uri': config['auth_redirect_uri'],
                'auth_client_id': config['auth_client_id'],
                'auth_client_secret_name': config['auth_client_secret_name'],
                'auth_oidc_uri': config['auth_oidc_uri'],
                'email_domain': config['email_domain'],
                'strides_credits_request_email': config['strides_credits_request_email'],
                'strides_grant_request_email': config['strides_grant_request_email']
            }
        )

        auth_client_secret_param.grant_read(workspaces_resource_lambda)
        step_fn_workflow.grant_start_execution(workspaces_resource_lambda)

        ## Grant read/write to all SSM Parameters in the /bmh namespace.
        ## This is done to get rid of circular dependencies.
        workspaces_resource_lambda.add_to_role_policy(iam.PolicyStatement(
            actions=[
                "ssm:DescribeParameters",
                "ssm:GetParameters",
                "ssm:GetParameter",
                "ssm:GetParameterHistory"
            ],
            resources=[f"arn:aws:ssm:{self.region}:{self.account}:parameter/bmh/*"]
        ))

        ## Also give the lambda permission to create API Keys and add them to 
        ## a usage plan. Unfortunately, we allow this lambda to POST to all usage plans,
        ## which avoids creating a circular dependency.
        workspaces_resource_lambda.add_to_role_policy(iam.PolicyStatement(
            actions=["apigateway:POST"],
            resources=[
                f"arn:aws:apigateway:{self.region}::/apikeys",
                f"arn:aws:apigateway:{self.region}::/usageplans/*/keys",
            ]
        ))

        ## The lambda will also create an SNS topic when a new workspace is created.
        ## Here we give it access to create SNS Topics.
        workspaces_resource_lambda.add_to_role_policy(iam.PolicyStatement(
            actions=[
                "sns:CreateTopic",
                "sns:TagResource",
                "sns:Subscribe",
                "sns:Publish"
            ],
            resources=["*"]
        ))

        ## The lambda will need to send emails using SES
        workspaces_resource_lambda.add_to_role_policy(iam.PolicyStatement(
            actions=["ses:SendEmail"],
            resources=[
                "*"
            ]
        ))

        # Allow lambda to read the dynamodb table 
        dynamodb_table.grant_read_write_data(workspaces_resource_lambda)

        workspaces_resource_lambda_integration = apigateway.LambdaIntegration(
            handler=workspaces_resource_lambda
        )

        ################################ GET /auth/get-tokens ##############################
        auth_resource = api.root.add_resource('auth')
        get_tokens = auth_resource.add_resource("get-tokens")
        get_method = get_tokens.add_method(
            "GET", workspaces_resource_lambda_integration,
            api_key_required=True
        )
        ####################################################################################

        ################################ PUT /auth/refresh-tokens ##########################
        refresh_tokens = auth_resource.add_resource("refresh-tokens")
        put_method = refresh_tokens.add_method(
            "PUT", workspaces_resource_lambda_integration,
            api_key_required=True
        )
        ####################################################################################

        workspaces_resource = api.root.add_resource("workspaces")
        
        ################################ GET workspaces/ ####################################
        get_method = workspaces_resource.add_method(
            "GET", workspaces_resource_lambda_integration,
            authorizer=token_authorizer
        )
        #####################################################################################

        ############################### POST workspaces/ ####################################
        post_method = workspaces_resource.add_method(
            "POST", workspaces_resource_lambda_integration,
            authorizer=token_authorizer
        )
        ######################################################################################

        ############################## GET workspaces/{workspace_id} #########################
        workspace_resource = workspaces_resource.add_resource("{workspace_id}")
        workspace_get = workspace_resource.add_method(
            "GET", workspaces_resource_lambda_integration,
            authorizer=token_authorizer

        )
        ######################################################################################

        ############################## POST workspaces/{workspace_id}/provision #########################
        ws_provision_resource = workspace_resource.add_resource("provision")
        workspace_provision = ws_provision_resource.add_method(
            "POST", workspaces_resource_lambda_integration,
            api_key_required=True
        )
        ######################################################################################

        ################ PUT workspaces/{workspace_id}/limits #############################
        limits_resource = workspace_resource.add_resource("limits")
        limits_put = limits_resource.add_method(
            "PUT", workspaces_resource_lambda_integration,
            authorizer=token_authorizer
        )
        ######################################################################################

        ################ PUT workspaces/{workspace_id}/total-usage #############################
        total_usage = workspace_resource.add_resource("total-usage")
        total_usage.add_method(
            "PUT", workspaces_resource_lambda_integration,
            api_key_required=True
        )

        default_usage_plan = apigateway.UsagePlan(
            self, "default-usage-plan",
            api_stages=[apigateway.UsagePlanPerApiStage(
                api=api,
                stage=api.deployment_stage
            )],
            name="default",
            description="Default configured usage plan for default deployment."
        )

        # Create a test API Key which can be used to initial interactions with API
        default_apikey = apigateway.ApiKey(
            self, "default-test-apikey",
            description="API Key which can be used for initial testing."
        )
        default_usage_plan.add_api_key(default_apikey)

        usage_plan_id_param = ssm.StringParameter(
            self, "api-usage-plan-id_param",
            description="Usage plan for API Keys",
            parameter_name=config['api_usage_id_param_name'],
            string_value=default_usage_plan.usage_plan_id
        )
        ######################################################################################


    def create_step_functions_workflow(self, brh_asset_bucket, dynamodb_table, config):
        create_workspace_lambda = lambda_.Function.from_function_arn(
            self, 'workspace-occ-create-function',
            function_arn=config['account_creation_lambda_arn']
        )

        # Create an SNS topic to publish errors and success messages to.
        stepfn_event_topic = sns.Topic(
            self, "stepfn-topic",
            display_name="Provision Workspace StepFunction SNS Topic",
        )
        
        create_workspace_task = sfn_tasks.LambdaInvoke(
            self, 'create-workspace-task',
            lambda_function=create_workspace_lambda,
            payload_response_only=True,
            input_path="$.ddi_lambda_input",
            result_path="$.brh_infrastructure.ddi_lambda_output"
        )

        deploy_brh_infra = lambda_.Function(
            self, 'create-workspace-function',
            runtime=lambda_.Runtime.PYTHON_3_8,
            timeout=core.Duration.seconds(600),
            code=lambda_.Code.asset('lambda/step_functions_handler'),
            handler='src.app.handler',
            description='Function which deploys BRH specific infrastructure (cost and usage, etc.) to member accounts.',
            environment={
                'brh_asset_bucket_param_name': config['brh-workspace-assets-bucket'],
                "brh_portal_url": config['api_url_param_name'],
                "dynamodb_index_param_name": config['dynamodb_index_param_name'],
                "dynamodb_table_param_name": config['dynamodb_table_param_name'],
                "cross_account_role_name": config['cross_account_role_name'],
                "provision_workspace_sns_topic": stepfn_event_topic.topic_arn
            }
        )

        stepfn_event_topic.grant_publish(deploy_brh_infra)

        handle_error_task = sfn_tasks.LambdaInvoke(
            self, 'handle-error-task',
            lambda_function=deploy_brh_infra,
            payload_response_only=True,
            payload=stepfunctions.TaskInput.from_object({
                'action':'failure',
                'input.$':'$'
            })
        )

        create_workspace_task.add_catch(
            handle_error_task,
            result_path="$.error"
        )

        # Allow lambda to read the dynamodb table 
        dynamodb_table.grant_read_write_data(deploy_brh_infra)

        deploy_brh_infra.add_to_role_policy(iam.PolicyStatement(
            actions=[
                "s3:PutBucketPolicy",
                "s3:GetBucketPolicy",
            ],
            resources=[brh_asset_bucket.bucket_arn]
        ))

        deploy_brh_infra.add_to_role_policy(iam.PolicyStatement(
            actions=[
                "sts:AssumeRole"
            ],
            resources=["arn:aws:iam::*:role/OrganizationAccountAccessRole"]
        ))

        ## Grant read/write to all SSM Parameters in the /bmh namespace.
        ## This is done to get rid of circular dependencies.
        deploy_brh_infra.add_to_role_policy(iam.PolicyStatement(
            actions=[
                "ssm:DescribeParameters",
                "ssm:GetParameters",
                "ssm:GetParameter",
                "ssm:GetParameterHistory"
            ],
            resources=[f"arn:aws:ssm:{self.region}:{self.account}:parameter/bmh/*"]
        ))

        deploy_brh_infra_task = sfn_tasks.LambdaInvoke(
            self, 'deploy_brh_infra_task',
            lambda_function=deploy_brh_infra,
            payload_response_only=True,
            payload=stepfunctions.TaskInput.from_object({
                'action':'provision_brh',
                'input.$':'$.brh_infrastructure'
            }),
            result_path="$.deploy_brh_infra_result"
        )

        deploy_brh_infra_task.add_catch(
            handle_error_task,
            result_path="$.error"
        )

        finish_task = sfn_tasks.LambdaInvoke(
            self, 'stepfn-success',
            lambda_function=deploy_brh_infra,
            payload_response_only=True,
            payload=stepfunctions.TaskInput.from_object({
                'action':'success',
                'input.$':'$'
            })
        )

        chain = create_workspace_task.next(deploy_brh_infra_task).next(finish_task)

        ## Add logging
        log_group = logs.LogGroup(self, "sfn-loggroup")

        state_machine = stepfunctions.StateMachine(
            self, "workflow-request-state-machine",
            definition=chain,
            logs={
                "destination": log_group,
                "level": stepfunctions.LogLevel.ALL
            }
        )

        return state_machine
