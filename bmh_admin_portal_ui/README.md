# BMH Admin Portal UI

This CDK application provides the code and infrastructure to deploy a simple UI form to request a workspace. This should be
deployed *after* the backend, as it relies on parameters stored in AWS Systems Manager at build time.

## Stack: bmh-admin-portal-ui

This CDK application will build the Web UI and then create CloudFormation template to deploy:
* An S3 bucket containing the static site
* A CloudFront distribution

## Deploying

### Dependencies
* AWS CDK - [go here](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html) for instructions on how to install CDK.
* Python >= 3.6 (with virtualenv)
* AWS default profile (appropriate configuration for the AWS CLI, with default 
region and account).

*Note*: This also deploys a lambda function which automatically polls for new approval activities every 1 minute. This
will work for development. And should be turned off (in EventBridge, under Rules) to avoid unnecessary Lambda polling.

After checking out the repository:
 
    $ cd request_workspace_ui
    
    # Create virtual environment
    $ python -m venv .venv
    $ source .venv/bin/activate
    
    # Will install the necessary python dependencies.
    $ pip install -r requirements.txt
    
    $ cdk ls
    bmh-admin-portal-ui
    
    # Deploy the ui.
    $ cdk deploy
