from aws_cdk import (
    core,
    aws_dynamodb as dynamodb,
    aws_ssm as ssm,
    aws_lambda as lambda_,
    aws_apigatewayv2 as apigateway,
    aws_apigatewayv2_integrations as apigateway_integrations
)


class RequestWorkspaceBackendStack(core.Stack):

    def __init__(self, scope: core.Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create the dynamodb table and store the name in SystemsManager
        # as a Parameter.
        dynamodb_table = dynamodb.Table(
            self, "Gen3WorkspaceRegistrationTable",
            partition_key=dynamodb.Attribute(name="organization", type=dynamodb.AttributeType.STRING),
            sort_key=dynamodb.Attribute(name="workspace_id", type=dynamodb.AttributeType.STRING),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.AWS_MANAGED
        )

        table_name_param = ssm.StringParameter(
            self, "workspace-registration-table",
            description="Dynamodb Table Name for Workspace Registration Info",
            parameter_name="/bmh/workspace-registration-dynamodb-table",
            string_value=dynamodb_table.table_name
        )

        # Create backend function to store data into dynamodb table.
        store_info_function = lambda_.Function(
            self, 'StoreRegistrationInfoFunction',
            runtime=lambda_.Runtime.PYTHON_3_8,
            code=lambda_.Code.asset('lambda'),
            handler='store_workspace_registration_info.handler'
        )

        # Grant the lambda access to write to the dynamodb table
        # and read the parameter
        dynamodb_table.grant_read_write_data(store_info_function)
        table_name_param.grant_read(store_info_function)

        http_api = apigateway.HttpApi(
            self, "store-registration-info",
            cors_preflight={
                "allow_origins": ["*"], # We should probably make this something more specific when we know what it should be.
            }
        )

        lambda_integration = apigateway_integrations.LambdaProxyIntegration(
            handler=store_info_function
        )

        http_api.add_routes(
            path="/store-request-info",
            methods=[apigateway.HttpMethod.POST],
            integration=lambda_integration
        )

        ssm.StringParameter(
            self, "workspace-registration-url",
            description="API URI for storing workspace registration details",
            parameter_name="/bmh/workspace-registration-url",
            string_value=http_api.url
        )
        