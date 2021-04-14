# © 2021 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.
# 
# This AWS Content is provided subject to the terms of the AWS Customer Agreement
# available at http://aws.amazon.com/agreement or other written agreement between
# Customer and either Amazon Web Services, Inc. or Amazon Web Services EMEA SARL or both.

## DEPRECATED. This is not currently being used. It was originally used to demo
## authentication capabilities.

from aws_cdk import (
    core,
    aws_ssm as ssm,
    aws_cognito as cognito
)

from bmh_admin_portal_backend.bmh_admin_portal_config import BMHAdminPortalBackendConfig

class BMHAdminPortalCognitoUserPool(core.Construct):
    def __init__(self, scope: core.Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        config = BMHAdminPortalBackendConfig.get_config()

        # Create a cognito user pool    
        pool = cognito.UserPool(
            self, "cognito-userpool",
            user_pool_name="bmh-userpool",
            self_sign_up_enabled=False,
            sign_in_aliases=cognito.SignInAliases(
                email=True
            ),
            standard_attributes=cognito.StandardAttributes(
                fullname=cognito.StandardAttribute(
                    required=True,
                    mutable=True
                )
            )
        )

        # Store the UserPool ID to SSM
        ssm.StringParameter(
            self, "cognito-userpool-id",
            description="Cognito UserPool ID",
            parameter_name=config['cognito_userpool_id_param_name'],
            string_value=pool.user_pool_id
        )

        app_client = pool.add_client(
            "bmh-portal-client",
            auth_flows=cognito.AuthFlow(user_srp=True),
            access_token_validity=core.Duration.hours(8),
            id_token_validity=core.Duration.hours(8),
            refresh_token_validity=core.Duration.days(30)
        )

        # Store the AppClient ID to SSM
        ssm.StringParameter(
            self, "cognito-appclient-id",
            description="Cognito AppClient ID",
            parameter_name=config['cognito_appclient_id_param_name'],
            string_value=app_client.user_pool_client_id
        )

        self.pool = pool