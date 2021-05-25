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
   * auth_oidc_uri - base url for communicating with auth provider (i.e. https://fence.url/user)
   * auth_client_secret_arn and auth_client_secret_name - The backend lambda uses the client secret to communicate to Fence. An AWS SecretManager secret needs to be created manually. The arn and name are required here. This will work with default encryption. If a CMK is used to encrypt the secret, that will need to be added to the CDK application so that the Lambda can be granted permissions to use the Key.
   * account_creation_lambda_arn - The arn of the OCC/DDI deployed lambda function.
   * email_domain - The domain used for autogenerating emails to be used as root accounts.
   * strides_credits_request_email - Email to send requests to when a STRIDES credits account is requested.
   * strides_grant_request_email - Email to send requests to when a STRIDES Grant account type is request.
  
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

## TMP

    dispatch = {
        '/auth/get-tokens':{
            'GET': lambda: _get_tokens(query_string_params, api_key)
        },
        '/auth/refresh-tokens':{
            'PUT': lambda: _refresh_tokens(body, api_key)
        },
        '/workspaces':{
            'POST': lambda: _workspaces_post(body, email),
            'GET': lambda: _workspaces_get(path_params, email)
        },
        '/workspaces/{workspace_id}':{
            'GET': lambda: _workspaces_get(path_params, email)
        },
        '/workspaces/{workspace_id}/limits':{
            'PUT': lambda: _workspaces_set_limits(body, path_params, email)
        },
        '/workspaces/{workspace_id}/total-usage':{
            'PUT': lambda: _workspaces_set_total_usage(body, path_params, api_key)
        },
        '/workspaces/{workspace_id}/provision':{
            'POST': lambda: _workspace_provision(body, path_params)
        }
    }

## API
### GET api/auth/get-tokens
* **Authorization**: Required, API Key.

* **Description** This request takes a `code` as a query string parameter and exchanges this code for user credentials with the configured auth service (OAuth) using the client id and client secret. Used by UI frontend.

### GET api/auth/refresh-tokens
* **Authorization**: Required, API Key
  
* **Description**: Takes a refresh token and exchanges it for a new ID Token from the configured Auth service (OAuth).

### POST api/workspaces
* **Authorziation**: Required, valid JWT token.

* **Description:** Currently, it performs the following steps:
  1. Assigns a unique workspace request ID and sends provided information to configured email for workspace request account creation.
  
* **Request:** Body should be a json encoded key value attributes. Currently, there are no required parameters. This represents creating a new Gen3 Workspace Request.

* **Response:** Will return json encoded key-value attributes same as input, with the following attributes added:
  1. Workspace Request ID: unique ID for the "created" workspace and default request attributes.

### GET api/workspaces
* **Authorziation**: Required, valid JWT Token

* **Description:** This request will return a list of Workspaces from DynamoDB which are associated with the provided email address.

* **Response:** Return all attributes used as input for the POST api/workspaces called. Will only return the Workspaces associated with the user how is authenticated. If no workspaces are found associated with the user, will return a status code of 204.

      [{
          "sns-topic-arn": "arn:aws:sns:us-east-1:807499094734:bmh-workspace-topic-74cfc35d-92d9-4561-a684-0611059bd557",
          "total-usage": 216.73,
          "api_key": "RxP50W3Cmz9jStnndhG4o67g0xGAbX8s2jZQScBP",
          "account_id": "PSEUDO_220144521636",
          "strides-id": "",
          "strides-credits": 5000,
          "hard-limit": 4500,
          "user_id": "researcher@university.edu",
          "organization": "Research University",
          "bmh_workspace_id": "2bbdfd3b-b402-47a2-b244-b0b053dde101",
          "soft-limit": 2500
      },
      ....
      ]

### GET api/workspaces/{workspace_id}
* **Authorziation**: Required, valid JWT token

* **Description:** This request will return a single workspace representation (see above), if a resource exists with the specified workspace_id. 

* **Response:** Will return a single representation of a workspace. Otherwise, will return status code 404.

      {
          "sns-topic-arn": "arn:aws:sns:us-east-1:807499094734:bmh-workspace-topic-74cfc35d-92d9-4561-a684-0611059bd557",
          "total-usage": 216.73,
          "api_key": "RxP50W3Cmz9jStnndhG4o67g0xGAbX8s2jZQScBP",
          "account_id": "PSEUDO_220144521636",
          "strides-id": "",
          "strides-credits": 5000,
          "hard-limit": 4500,
          "user_id": "researcher@university.edu",
          "organization": "Research University",
          "bmh_workspace_id": "2bbdfd3b-b402-47a2-b244-b0b053dde101",
          "soft-limit": 2500
      }

### POST api/workspaces/{workspace_id}/provision
* **Authorization**: Required, API Key
* **Description**: Will begin the provisioning process for a BRH Workspace.
  1. Create account specific API Key and SNS topic.
  2. Store status in database.
  3. Start step functions workflow (OCC/DDI Lambda, BRH Provision Lambda).

* **Response**: Status code 200 on success (empty body).

### PUT api/workspaces/{workspace_id}/limits
* **Authorziation**: Required, API Key

* **Description:** Used to set the hard and soft cost and usage limits of a single workspace. Separate endpoints for hard or soft limits do not exist. Stores new values in the DynamoDB table.

* **Request:**
  
      {
          "soft-limit": 2500,
          "hard-limit": 4750
      }

* **Response:** Returns a full representation of the workspace (see above) with the new values for hard and soft limits. 404 if the workspace was not found.

### PUT api/workspaces/{workspace_id}/total-usage
* **Authorization**: Valid API Key (associated with Workspace Account)

* **Description:** Used by the workspace account to automatically set total cost and usage of that account. This method will store that information to the DynamoDB table. This will also publish a method to the configured SNS topic alerting if the current total cost and usage exceeds either of the limits. This should only happen when the old total cost and usage is less than the limit, and the new cost and usage is greater than the limit.

* **Request:**

      {
          "total-usage": 234.84
      }

* **Response:** Will return 200 status code on success (with empty body '{}'). 

