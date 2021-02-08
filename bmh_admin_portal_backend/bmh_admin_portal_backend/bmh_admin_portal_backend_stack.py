import json

from aws_cdk import (
    core,
    aws_lambda as lambda_,
    aws_apigateway as apigateway,
    aws_logs as logs,
    aws_iam as iam,
    aws_ssm as ssm,
    aws_sqs as sqs,
    aws_dynamodb as dynamodb
)

from .bmh_cognito_userpool import BMHAdminPortalCognitoUserPool
from .bmh_admin_portal_config import BMHAdminPortalBackendConfig

class BmhAdminPortalBackendStack(core.Stack):
    def __init__(self, scope: core.Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        config = BMHAdminPortalBackendConfig.get_config()

        # Create the user pool, ssm parameteres and app client.
        cognito_user_pool = BMHAdminPortalCognitoUserPool(self, "cognito-user-pool")

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
        ssm.StringParameter(
            self, "workspaces-api-url-parameter",
            description="API URL for workspace request API",
            parameter_name=config['api_url_param_name'],
            string_value=api.url
        )

        # Create COGNITO authorizer
        cognito_authorizer = apigateway.CfnAuthorizer(
            scope=self, id='apigateway-cognito-userpool-authorizer',
            name='CognitoUserPool-Authorizer',
            rest_api_id=api.rest_api_id,
            type='COGNITO_USER_POOLS',
            provider_arns=[cognito_user_pool.pool.user_pool_arn],
            identity_source="method.request.header.Authorization",
        )
        #####################################################################################

        workspaces_resource_lambda = lambda_.Function(
            self, 'workspaces-resource-function',
            runtime=lambda_.Runtime.PYTHON_3_8,
            code=lambda_.Code.asset('lambda/workspaces_api_resource'),
            handler='workspaces_api_resource_handler.handler',
            timeout=core.Duration.seconds(60),
            environment={
                'dynamodb_table_param_name': config['dynamodb_table_param_name'],
                'dynamodb_index_param_name': config['dynamodb_index_param_name'],
                'api_usage_id_param_name': config['api_usage_id_param_name']
            }
        )

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
        ## which avoids creating a circular dependency. We cannot
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

        

        # Allow lambda to read the dynamodb table 
        dynamodb_table.grant_read_write_data(workspaces_resource_lambda)

        workspaces_resource_lambda_integration = apigateway.LambdaIntegration(
            handler=workspaces_resource_lambda
        )
        workspaces_resource = api.root.add_resource("workspaces")

        ################################ GET workspaces/ ####################################
        get_method = workspaces_resource.add_method(
            "GET", workspaces_resource_lambda_integration,
            authorization_type=apigateway.AuthorizationType.COGNITO
        )
        get_method_resource = get_method.node.find_child('Resource')
        get_method_resource.add_property_override(
            'AuthorizerId',
            {'Ref': cognito_authorizer.logical_id}
        )
        #####################################################################################

        ############################### POST workspaces/ ####################################
        post_method = workspaces_resource.add_method(
            "POST", workspaces_resource_lambda_integration, 
            authorization_type=apigateway.AuthorizationType.COGNITO
        )
        post_method_resource = post_method.node.find_child('Resource')
        post_method_resource.add_property_override(
            'AuthorizerId',
            {'Ref': cognito_authorizer.logical_id}
        )
        ######################################################################################

        ############################## GET workspaces/{workspace_id} #########################
        workspace_resource = workspaces_resource.add_resource("{workspace_id}")
        workspace_get = workspace_resource.add_method(
            "GET", workspaces_resource_lambda_integration,
            authorization_type=apigateway.AuthorizationType.COGNITO
        )
        workspace_get_child = workspace_get.node.find_child('Resource')
        workspace_get_child.add_property_override(
            'AuthorizerId',
            {'Ref': cognito_authorizer.logical_id}
        )
        ######################################################################################

        ################ PUT workspaces/{workspace_id}/limits #############################
        limits_resource = workspace_resource.add_resource("limits")
        limits_put = limits_resource.add_method(
            "PUT", workspaces_resource_lambda_integration,
            authorization_type=apigateway.AuthorizationType.COGNITO
        )
        limits_put_child = limits_put.node.find_child('Resource')
        limits_put_child.add_property_override(
            'AuthorizerId',
            {'Ref': cognito_authorizer.logical_id}
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


