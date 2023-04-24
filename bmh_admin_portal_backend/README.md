# BMH Admin Portal Backend

This CDK application provides the code and infrastructure to deploy the backend infrastructure used by the
BMH Portal.

## Stack: bmh-admin-portal-backend

This stack generates the CloudFormation templates which deploy the following resources:
* DynamoDB for persisting request information.
* API Gateway REST API endpoints for receiving requests from the frontend.
* Lambda function to handle REST API calls
* Step Functions to coordinate BRH Workspace Provisioning Process
* SNS Topic used for status updates of the provisioning process.

## Deployment
### Dependencies
* AWS CDK - [go here](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html) for instructions on how to install CDK.
* Python >= 3.6 (with virtualenv)
* AWS default profile (appropriate configuration for the AWS CLI, with default
region and account).
* The OCC/DDI Account Vending Automation ([DDI Github](https://github.com/occ-data/ddi-pay-per-compute/tree/main/account_creation_automation))

*Note*: If this is the first time deploying a CDK application into this account, you may need to run `cdk bootstrap` before deploying this application.

1. Configure the deployment. Copy `bmh_admin_portal_backend/bmh_admin_portal_backend/bmh_admin_portal_config_TEMPLATE.py` to `bmh_admin_portal_backend/bmh_admin_portal_backend/bmh_admin_portal_config.py`.
   * cross_account_role_name - Name of the role to be used when provisioning BRH workspaces in target account.
   * auth_redirect_uri - Callback URL for Auth server (Fence)
   * auth_client_id - Client Id provided from Auth provider (Fence)
   * allowed_client_id_audience - A `|` seperated string of client_ids of valid API audience.
   * auth_oidc_uri - base url for communicating with auth provider (i.e. https://fence.url/user)
   * auth_client_secret_arn and auth_client_secret_name - The backend lambda uses the client secret to communicate to Fence. An AWS SecretManager secret needs to be created manually. The arn and name are required here. This will work with default encryption. If a CMK is used to encrypt the secret, that will need to be added to the CDK application so that the Lambda can be granted permissions to use the Key.
   * account_creation_lambda_arn - The arn of the OCC/DDI deployed lambda function.
   * account_creation_asset_bucket_name - The bucket created when the OCC/DDI lambda function is deployed. Contains Account baseline CloudFormation template.
   * email_domain - The domain used for auto generating emails to be used as root accounts.
   * strides_credits_request_email - Email to send requests to when a STRIDES credits account is requested.
   * strides_grant_request_email - Email to send requests to when a STRIDES Grant account type is request.
   * occ_email_domain - The domain used for auto generating emails to be used as root accounts for direct pay.

2. Run the following commands to deploy:

    ```bash
    $ cd bmh_admin_portal_backend

    # Create virtual environment
    $ python -m venv .venv
    $ source .venv/bin/activate

    # Will install the necessary python dependencies.
    $ pip install -r requirements.txt

    $ cdk ls
    bmh-admin-portal-backend

    # Bootstrap
    $ cdk bootstrap

    # Deploy the backend.
    $ cdk deploy
    ```

## Post Deployment
### Subscribe to SNS Topic
The CDK application will have created an SNS topic where status notifications will be sent during the BRH Workspace provisioning process (success and failure). You can subscribe to the topic from the AWS Console with whichever email(s) should receive these notifications. ([SNS - AWS Console](https://console.aws.amazon.com/sns/v3/home?region=us-east-1#/dashboard)). The Topic should be named similarly to `bmh-admin-portal-backend-stepfntopic<UNIQUEID>`.

## Developer Documentation
For additional description of backend components, see:
* [BRH Admin Portal Developer Documentation](../docs/README.md)
* [BRH Admin Portal Backend Documentation](../docs/backend/developer-backend.md)
