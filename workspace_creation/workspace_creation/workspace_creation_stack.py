from aws_cdk import (
    aws_lambda as lambda_,
    aws_sns as sns,
    aws_sns_subscriptions as subscriptions,
    aws_iam as iam,
    core
)

class WorkspaceCreationStack(core.Stack):

    def __init__(self, scope: core.Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create lamba function, found in ./lambda/ directory
        ca_function = lambda_.Function(
            self, 'CreateAccountFunction',
            runtime=lambda_.Runtime.PYTHON_3_8,
            code=lambda_.Code.asset('lambda'),
            handler='create_workspace.handler'
        )

        # Add a role to allow the lambda to control Organization Resources
        ca_function.add_to_role_policy(iam.PolicyStatement(
            actions=[
                'organizations:*'
            ],
            resources=['*']
        ))
        
        # Create the SNS topic
        topic = sns.Topic(
            self, "createWorkspaceTopic", 
            display_name='Create Workspace Topic'
        )

        topic.add_subscription(subscriptions.LambdaSubscription(ca_function))