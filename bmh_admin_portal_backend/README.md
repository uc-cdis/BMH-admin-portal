# BMH Admin Portal Backend

This CDK application provides the code and infrastructure to deploy the backend infrastructure used by the 
BMH Portal.

## Stack: bmh-admin-portal-backend

This stack generates the CloudFormation templates which deploy the following resources:
* DynamoDB for persisting request information.
* API Gateway HTTP API endpoint for receiving requests from the frontend.
* Step Functions worklow which orchestrates the backend workspace request process

*Note*: This also deploys a lambda function which automatically polls for new approval activities every 1 minute. This
will work for development. And should be turned off (in EventBridge, under Rules) to avoid unnecessary Lambda polling.

## Deploying

### Dependencies
* AWS CDK - [go here](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html) for instructions on how to install CDK.
* Python >= 3.6 (with virtualenv)
* AWS default profile (appropriate configuration for the AWS CLI, with default 
region and account).

*Note*: If this is the first time deploying a CDK application into this account, you may need to run `cdk bootstrap` before deploying this application.

After checking out the repository:
 
    $ cd request_workspace_ui
    
    # Create virtual environment
    $ python -m venv .venv
    $ source .venv/bin/activate
    
    # Will install the necessary python dependencies.
    $ pip install -r requirements.txt
    
    $ cdk ls
    bmh-admin-portal-backend
    
    # Deploy the backend.
    $ cdk deploy
