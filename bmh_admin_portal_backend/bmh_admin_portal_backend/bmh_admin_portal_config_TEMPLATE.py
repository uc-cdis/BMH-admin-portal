class BMHAdminPortalBackendConfig():
    """ Convenience class used to store SSM Paramter names among other 
    parameters which need to be internally consistent. Note: lambda functions
    which need to read these parameters will have access to read *all* parameters that
    have a /bmh/ prefix (i.e. if you include a parameter name without this prefix, most of
    the lambda functions will not be able to read them.) """

    @classmethod
    def get_config(cls):
        return {
            "dynamodb_table_param_name":   "/bmh/workspace-dynamodb-table",
            "dynamodb_index_param_name":   "/bmh/workspace-dynamodb-gsindex",
            "api_url_param_name":          "/bmh/workspaces-api/url",
            "api_usage_id_param_name":     "/bmh/usage_plan_id",
            "brh-workspace-assets-bucket": "/bmh/workspace-assets-bucket",

            "cognito_userpool_id_param_name":  "/bmh/cognito-userpool-id",
            "cognito_appclient_id_param_name": "/bmh/cognito-appclient-id",

            "account_creation_lambda_arn": "",

            ## This should be removed before checking in
            "auth_redirect_uri": "",
            "auth_client_id": "",
            "auth_oidc_uri": "",

            # This is a secret that should have already been created in the deployment account.
            # If this uses a CMK or other encryption key, you may need to add additional permissions to allow
            # the lambda to use that key.
            "auth_client_secret_arn": "",
            "auth_client_secret_name": ""



        }