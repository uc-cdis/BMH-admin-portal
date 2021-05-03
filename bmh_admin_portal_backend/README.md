# BMH Admin Portal Backend

This CDK application provides the code and infrastructure to deploy the backend infrastructure used by the 
BMH Portal.

## Stack: bmh-admin-portal-backend

This stack generates the CloudFormation templates which deploy the following resources:
* DynamoDB for persisting request information.
* API Gateway REST API endpoints for receiving requests from the frontend.
* Lambda function to handle REST API calls
* Cognito User Pool, used by (most of) the REST API endpoints for Authorization

## Deployment

### Dependencies
* AWS CDK - [go here](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html) for instructions on how to install CDK.
* Python >= 3.6 (with virtualenv)
* AWS default profile (appropriate configuration for the AWS CLI, with default 
region and account).
* The OCC/DDI Account Vending Automation ([DDI Github](https://github.com/occ-data/ddi-pay-per-compute/tree/main/account_creation_automation))

*Note*: If this is the first time deploying a CDK application into this account, you may need to run `cdk bootstrap` before deploying this application.

1. Configure the deployment. Copy `bmh_admin_portal_backend/bmh_admin_portal_backend/bmh_admin_portal_config_TEMPLATE.py` to `bmh_admin_portal_backend/bmh_admin_portal_backend/bmh_admin_portal_config.py`. 
   * auth_redirect_uri - Callback URL for Auth server (Fence)
   * auth_client_id - Client Id provided from Auth provider (Fence)
   * auth_oidc_uri - base url for communicating with auth provider (i.e. https://fence.url/user)
   * auth_client_secret_arn and auth_client_secret_name - The backend lambda uses the client secret to communicate to Fence. A AWS SecretManager secret needs to be created manually. The arn and name are required here. This will work with default encryption. If a CMK is used to encrypt the secret, that will need to be added to the CDK application so that the Lambda can be granted permissions to use the Key.
   * account_creation_lambda_arn - The arn of the OCC/DDI deployed lambda function.
  
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

## API
### POST api/workspaces
* **Authorziation**: Required, API Key.

* **Description:** Currently, it performs the following steps:
  1. Assigns a unique workspace ID
  2. Creates an API Key which can be used by the Workspace account to communicate to the BRH Portal
  3. Creates an SNS topic and subscribes the Workspace Admin to receive email notifications (based on email parameter)
  4. Writes this information to DynamoDB
  5. Kicks off Step Functions to create account, baseline account, and deploys BRH infrastructure.

* **Request:** Body should be a json encoded key value attributes. Currently, there are no required parameters (this will change in the future). This represents creating a new Gen3 Workspace Request.

* **Response:** Will return json encoded key-value attributes same as input, with the following attributes added:
  1. workspace ID: unique ID for the "created" workspace
  2. Account ID: AWS account ID for the "created" workspace (placeholder)
  3. API Key: The API key for the newly "created" workspace to communicate to the BMH Portal.
  4. STRIDES Credits (default: 5000), Hard-limit (default 90% of STRIDES credits), and Soft-limit (default 50% of STRIDES credits)

### GET api/workspaces
* **Authorziation**: Required, API Key.

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
* **Authorziation**: Required, API Key.

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

### PUT api/workspaces/{workspace_id}/limits
* **Authorziation**: Required, API Key.

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

