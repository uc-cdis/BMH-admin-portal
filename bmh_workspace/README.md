
# Biomedical Hub Workspace CDK

This CDK application sets up required infrastructure in a BMH Gen3 Workspace Account. This should be deployed 
when a BMH Gen3 Workspace is created.

## Stack: bmh_workspace

This CDK application deploys the following constructs:

1. AWS Cost and Usage Report: An automated report using AWS Cost and Usage Reports (CUR) service. This automatically
generates a report in an S3 bucket which holds usage information in parquet format.
2. A lambda function which is set to parse the cost and usage reports in the S3 bucket and send total usage information
to the BMH portal account.

*Note*: The BMH Portal should already exist when this is deployed. This CDK will require 

## Deployment

### Dependencies
* AWS CDK - [go here](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html) for instructions on how to install CDK.
* Python >= 3.6 (with virtualenv)
* AWS default profile (appropriate configuration for the AWS CLI, with default 
region and account).

*Note*: If this is the first time deploying a CDK application into this account, you may need to run `cdk bootstrap` before deploying this application.

*Note* The bmh_portal_admin_backend stack should be deployed in some account first. This is because the API URL, Workspace ID and API Key are
required for this CDK stack. Before running this stack you should set the following 3 environment variables for this stack to use:

1. BMH_PORTAL_URI="https://SOMEAPI.execute-api.us-east-1.amazonaws.com/api"
  * This can be found in the AWS Console, under the API Gateway service (under 'stages' menu on the left)
2. BMH_PORTAL_API_KEY=<<API Gateway API key>>
  * When a workspace is created in the BMH Portal (by sending a POST to /workspaces) an API key will automatically be created. Copy the value here.
  * This can be found in the return attributes of the POST call, or you can find it in the DynamoDB table for the BMH Portal backend
  * This will be used by the account to send updated total cost and usage information to the BMH portal account.
3. BMH_PORTAL_WORKSPACE_ID=<<Workspace ID>>
  * Similarly as the API Key, this will be automatically generated and stored in the DynamoDB table.
  * This is used to identify which workspace is sending the request to update the total cost and usage.

After checking out the repository (and setting up AWS Credentials, see CDK link above for more information):
 
    $ cd BMH-admin-portal/bmh_workspace
    
    # Create virtual environment
    $ python -m venv .venv
    $ source .venv/bin/activate
    
    # Will install the necessary python dependencies.
    $ pip install -r requirements.txt
    
    $ cdk ls
    bmh-workspace
    
    # Deploy the backend.
    $ cdk deploy

## Future

Eventually, this process will be automated as part of the Gen3 Workspace Account provisioning and will not require so many steps to deployment.