from aws_cdk import (
    core,
    aws_lambda as lambda_,
    aws_stepfunctions as stepfunctions,
    aws_stepfunctions_tasks as sfn_tasks,
    aws_sns as sns,
    aws_iam as iam,
    aws_logs as logs,
)
from ..bmh_admin_portal_config import BMHAdminPortalBackendConfig
from .run_command_workflow_step import RunCommandWorkflowStep


class ProvisioningWorkflow(core.Construct):
    def __init__(self, scope: core.Construct, construct_id: str, brh_asset_bucket=None, dynamodb_table=None, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Defaults
        self.handle_error_task = None

        config = BMHAdminPortalBackendConfig.get_config()

        #############################################################################
        # Create some resources which will be shared throughout the StepFn Workflow #
        #    SNS Topic for notifications.                                           #
        #    Lambda function to handle actions.                                     #
        #############################################################################
        
        # Create SNS topic which will be used for notifications of status changes.
        self.stepfn_event_topic = sns.Topic(
            self, "stepfn-topic",
            display_name="Provision Workspace StepFunction SNS Topic",
        )

        # Create Lambda function to handle events.
        self.stepfn_lambda = self.create_stepfn_lambda(config, brh_asset_bucket, dynamodb_table)
        ###################################################################################

        ###################################################################################
        # Create the tasks in the workflow                                                #
        #     - OCC Lambda Task                                                           #
        #     - BRH Provision Task                                                        #
        #     - Example Run Command Task                                                  #
        ###################################################################################
        self.occ_lambda_task = self.create_occ_lambda_task(config)
        self.brh_provision_task = self.create_brh_provision_task()
        self.run_command_task = self.create_run_command_task()

        self.workflow = self.create_step_functions_workflow()

    def create_run_command_task(self):
        run_command_task = RunCommandWorkflowStep(
            self, 'test-run-command',
            step_fn_lambda=self.stepfn_lambda,
            working_directory="",
            commands=["pwd","ls","sleep 45"]
        )
        return run_command_task

    def create_stepfn_lambda(self, config, brh_asset_bucket, dynamodb_table):
        """ Creates the lambda (and necessary permissions) which handles step function tasks """

        stepfn_lambda = lambda_.Function(
            self, 'stepfn-handler',
            runtime=lambda_.Runtime.PYTHON_3_8,
            timeout=core.Duration.seconds(600),
            code=lambda_.Code.asset('lambda/step_functions_handler'),
            handler='src.app.handler',
            description='Function which deploys BRH specific infrastructure (cost and usage, etc.) to member accounts.',
            environment={
                'brh_asset_bucket_param_name': config['brh-workspace-assets-bucket'],
                "brh_portal_url": config['api_url_param_name'],
                "dynamodb_index_param_name": config['dynamodb_index_param_name'],
                "dynamodb_table_param_name": config['dynamodb_table_param_name'],
                "cross_account_role_name": config['cross_account_role_name'],
                "provision_workspace_sns_topic": self.stepfn_event_topic.topic_arn
            }
        )
        self.stepfn_event_topic.grant_publish(stepfn_lambda)
        dynamodb_table.grant_read_write_data(stepfn_lambda)

        stepfn_lambda.add_to_role_policy(iam.PolicyStatement(
            actions=[
                "s3:PutBucketPolicy",
                "s3:GetBucketPolicy",
            ],
            resources=[brh_asset_bucket.bucket_arn]
        ))

        stepfn_lambda.add_to_role_policy(iam.PolicyStatement(
            actions=[
                "sts:AssumeRole"
            ],
            resources=[f"arn:aws:iam::*:role/{config['cross_account_role_name']}"]
        ))

        ## Grant read/write to all SSM Parameters in the /bmh namespace.
        ## This is done to get rid of circular dependencies.
        stepfn_lambda.add_to_role_policy(iam.PolicyStatement(
            actions=[
                "ssm:DescribeParameters",
                "ssm:GetParameters",
                "ssm:GetParameter",
                "ssm:GetParameterHistory",
            ],
            resources=[f"arn:aws:ssm:{core.Aws.REGION}:{core.Aws.ACCOUNT_ID}:parameter/bmh/*"]
        ))

        ## Grant permissions to run commands using SSM.
        stepfn_lambda.add_to_role_policy(iam.PolicyStatement(
            actions=[
                "ssm:*"
            ],
            resources=["*"]
        ))

        return stepfn_lambda

    def create_occ_lambda_task(self, config):
        create_workspace_lambda = lambda_.Function.from_function_arn(
            self, 'workspace-occ-create-function',
            function_arn=config['account_creation_lambda_arn']
        )

        create_workspace_task = sfn_tasks.LambdaInvoke(
            self, 'create-workspace-task',
            lambda_function=create_workspace_lambda,
            payload_response_only=True,
            input_path="$.ddi_lambda_input",
            result_path="$.brh_infrastructure.ddi_lambda_output"
        )

        create_workspace_task.add_catch(
            self.get_handle_error_task(),
            result_path="$.error"
        )
        return create_workspace_task
    
    def get_handle_error_task(self):
        if self.handle_error_task == None:
            self.handle_error_task = sfn_tasks.LambdaInvoke(
                self, 'handle-error-task',
                lambda_function=self.stepfn_lambda,
                payload_response_only=True,
                payload=stepfunctions.TaskInput.from_object({
                    'action':'failure',
                    'input.$':'$'
                })
            )
        return self.handle_error_task    

    def create_brh_provision_task(self):
        brh_provision_task = sfn_tasks.LambdaInvoke(
            self, 'deploy_brh_infra_task',
            lambda_function=self.stepfn_lambda,
            payload_response_only=True,
            payload=stepfunctions.TaskInput.from_object({
                'action':'provision_brh',
                'input.$':'$.brh_infrastructure'
            }),
            result_path="$.deploy_brh_infra_result"
        )

        brh_provision_task.add_catch(
            self.get_handle_error_task(),
            result_path="$.error"
        )
        return brh_provision_task

    def create_step_functions_workflow(self):
        finish_task = stepfunctions.Succeed(self, "succeed-task")

        chain = (
            self.occ_lambda_task
            .next(self.brh_provision_task)
        )
        chain = chain.next(self.run_command_task.first_task)
        self.run_command_task.last_task.next(finish_task)

        ## Add logging
        log_group = logs.LogGroup(self, "sfn-loggroup")

        state_machine = stepfunctions.StateMachine(
            self, "workflow-request-state-machine",
            definition=chain,
            logs={
                "destination": log_group,
                "level": stepfunctions.LogLevel.ALL
            }
        )

        return state_machine
