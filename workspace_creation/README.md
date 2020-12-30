# Workspace Creation Demo

This CDK application provides an example infrastructure for creating a child account within an AWS organization.

## Stack: workspace-creation

This stack creates the CloudFormation templates for a SNS topic and a Lambda function which responds to said topic.

## Deploy

### Dependencies
* AWS CDK - [go here](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html) for instructions on how to install CDK.
* Python >= 3.6 (with virtualenv)
* AWS default profile (appropriate configuration for the AWS CLI, with default 
region and account).

**Note:** This should only be deployed into a management account for an AWS Organization. The Lambda cannot create accounts unless it runs from a management account.

After checking out the repository:
 
    $ cd request_workspace_ui
    
    # Create virtual environment
    $ python -m venv .venv
    $ source .venv/bin/activate
    
    # Will install the necessary python dependencies.
    $ pip install -r requirements.txt
    
    $ cdk ls
    workspace-creation

    # This will print the generated Cfn to the terminal.
    $ cdk synth

    $ cdk deploy

Then, you can test by sending a message to the newly created topic. You'll need to get the Topic ARN from the AWS Console and should be able to use the test script found in the `./scripts` directory:
    $ python ./scripts/send_message.py <SNS Topic ARN>

This submits a test message (no actual account will be created, because a test flag is sent as a message attribute). To create an actual account, set the TestMode option to `False`.


### Message Format
* [AWS CLI Reference](https://docs.aws.amazon.com/cli/latest/reference/sns/publish.html)

The `message` portion is currently ignored. All options are sent as structured message_attributes:
* Email (Required)
* AccountName (Required)
* TestMode (Optional, default: False)
