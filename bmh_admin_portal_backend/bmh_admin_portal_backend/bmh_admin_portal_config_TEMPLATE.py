class BMHAdminPortalBackendConfig():
    """ Convenience class used to store SSM Paramter names among other 
    parameters which need to be internally consistent. Note: lambda functions
    which need to read these parameters will have access to read *all* parameters that
    have a /bmh/ prefix (i.e. if you include a parameter name without this prefix, most of
    the lambda functions will not be able to read them.) 
    
    This also includes system level configuration parameters.
    """

    @classmethod
    def get_config(cls):
        return {
            "dynamodb_table_param_name":   "/bmh/workspace-dynamodb-table",
            "dynamodb_index_param_name":   "/bmh/workspace-dynamodb-gsindex",
            "api_url_param_name":          "/bmh/workspaces-api/url",
            "api_usage_id_param_name":     "/bmh/usage_plan_id",
            "brh-workspace-assets-bucket": "/bmh/workspace-assets-bucket",
            "admin_vm_instance_id_param_name": "/brh/admin_vm_instance_id",


            # This is the ARN of the lambda function deployed for the OCC/DDI account creation lambda.
            # That will also deploy an S3 bucket with an Account Baseline yaml file. That bucket name is 
            # necessary to run the lambda function wihout error.
            "account_creation_lambda_arn": "",
            "account_creation_asset_bucket_name": "",

            # Used in provisioning newly created workspace accounts. Should match the
            # role name in new accounts. Expects admin privileges and should trust the account
            # the BRH applicaiton is deployed into.
            "cross_account_role_name": "",

            ## This should be removed before checking in
            "auth_redirect_uri": "",
            "auth_client_id": "",
            "auth_oidc_uri": "",

            # This is a secret that should have already been created in the deployment account.
            # If this uses a CMK or other encryption key, you may need to add additional permissions to allow
            # the lambda to use that key.
            "auth_client_secret_arn": "",
            "auth_client_secret_name": "",
            # Used to automatically generate emails for root account access.
            # Also used as the from address for outgoing emails.
            "email_domain": "",
            "occ_email_domain": "",

            # Where emails will be sent when a form is filled out.
            # *Note*: These email addresses will need to be verified before SES will allow sending email addresses to them.
            # https://docs.aws.amazon.com/ses/latest/DeveloperGuide/verify-email-addresses-procedure.html
            "strides_credits_request_email": "",
            "strides_grant_request_email": "",
            "direct_pay_request_email": ""
        }