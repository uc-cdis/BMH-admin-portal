# Request Workspace UI

This CDK application provides the code and infrastructure to deploy a simple UI form to request a workspace. 
There are 2 Stacks defined: `request-workspace-backend` and `request-workspace-ui`.

## Stack: request-workspace-backend

This stack generates the CloudFormation templates which deploy the following resources:
* DynamoDB for persisting request information.
* Lambda function which recieves input from the form and persists to DynamoDB
* API Gateway HTTP API endpoint for receiving requests from the frontend.

## Stack request-workspace-ui

This stack generates the CloudFormation templates to deploy the UI. The
frontend is a static website hosted on S3 with a simple cloudfront front end.

## Deploying

### Dependencies
* AWS CDK - [go here](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html) for instructions on how to install CDK.
* Python >= 3.6 (with virtualenv)
* AWS default profile (appropriate configuration for the AWS CLI, with default 
region and account).

After checking out the repository:
 
    $ cd request_workspace_ui
    
    # Create virtual environment
    $ python -m venv .venv
    $ source .venv/bin/activate
    
    # Will install the necessary python dependencies.
    $ pip install -r requirements.txt
    
    $ cdk ls
    request-workspace-backend
    request-workspace-ui
    
    # Deploy the backend.
    $ cdk deploy request-workspace-backend

For the moment (until we setup a build process for the frontend), we'll need to
manually enter the backend API URL into the UI. After the backend has completed
deployment, go to the AWS console, find the `store-registration-info` API in API
Gateway. Copy the Invoke URL and add it to the `request_workspace_ui/webui-dist/js/default.js` on line 21 (replace `<< ENTER URL HERE >>`). Save this file.

    $ cdk deploy request-workspace-ui
    
This will deploy a CloudFront distribution which will contain a URL to access 
the website. View the details of the CloudFront distribution in the AWS Console 
which refers to the request-workspace* origin, under the domain attribute. We'll 
eventually replace this with a custom domain. For now, it should look something like this: `<random string>.cloudfront.net`.

Navigate to the URL in a browser, enter some details and submit the form. A 
confirmation of a workspace ID should be alerted. You can confirm the data was 
persisted by viewing the dynamodb table in the AWS Console.