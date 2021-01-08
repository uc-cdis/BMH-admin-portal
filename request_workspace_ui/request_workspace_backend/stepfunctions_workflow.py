from aws_cdk import (
    core,
    aws_lambda as lambda_,
    aws_stepfunctions as stepfunctions,
    aws_stepfunctions_tasks as sfn_tasks,
    aws_logs as logs,
    aws_dynamodb as dynamodb,
    aws_ssm as ssm,
    aws_events as events,
    aws_events_targets as events_targets
)

class StoreRequestInfoConstruct(core.Construct):
    """ Construct which creates a lambda function to ingest request form data
        and write it to a dynamodb table. This implements a step in the state machine """

    def __init__(self, scope: core.Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        # Create the dynamodb table and store the name in SystemsManager
        # as a Parameter.
        dynamodb_table = dynamodb.Table(
            self, "workspace-requests-table",
            partition_key=dynamodb.Attribute(name="organization", type=dynamodb.AttributeType.STRING),
            sort_key=dynamodb.Attribute(name="request_id", type=dynamodb.AttributeType.STRING),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.AWS_MANAGED
        )

        table_name_param = ssm.StringParameter(
            self, "workspace-requests-table-parameter",
            description="Dynamodb Table Name for Workspace Registration Info",
            parameter_name="/bmh/workspace-registration-dynamodb-table",
            string_value=dynamodb_table.table_name
        )

        # Create backend function to store data into dynamodb table.
        store_info_function = lambda_.Function(
            self, "workspace-requests-store-function",
            runtime=lambda_.Runtime.PYTHON_3_8,
            code=lambda_.Code.asset('lambda/store_workspace_registration_info'),
            handler='store_workspace_registration_info.handler'
        )

        # Grant the lambda access to write to the dynamodb table
        # and read the parameter
        dynamodb_table.grant_read_write_data(store_info_function)
        table_name_param.grant_read(store_info_function)

        self.function = store_info_function
        self.dynamodb_table = dynamodb_table
        self.table_name_param = table_name_param

class RequestApprovalActivity(core.Construct):
    def __init__(self, scope: core.Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create the activity
        self.activity = stepfunctions.Activity(self, "request-approval-activity")

        # Store the activity ARN in an SSM parameter
        activity_arn_param = ssm.StringParameter(
            self, "request-approval-activity-arn-parameter",
            description="Sfn Activity ARN for Workspace Request Manual Approval",
            parameter_name="/bmh/request-approval-activity-arn",
            string_value=self.activity.activity_arn
        )

        # Lambda function to poll for outstanding activity tasks.
        # This takes the place of an actual person approving this task.
        poll_for_approval_tasks = lambda_.Function(
            self, "poll-approval-tasks-function",
            runtime=lambda_.Runtime.PYTHON_3_8,
            code=lambda_.Code.asset('lambda/poll_approval_tasks'),
            handler='poll_approval_tasks.handler',
            timeout=core.Duration.seconds(80) # The polling will take at most 60 seconds.
        )

        # Grant the lambda function read permission to the parameter
        activity_arn_param.grant_read(poll_for_approval_tasks)

        self.activity.grant(
            poll_for_approval_tasks,
            "states:SendTaskSuccess",
            "states:SendTaskFailure",
            "states:GetActivityTask",
        )

        # Create a schedule for the lambda to run
        lambda_schedule = events.Schedule.rate(core.Duration.minutes(1))

        # And a target for the Rule
        event_lambda_target = events_targets.LambdaFunction(handler=poll_for_approval_tasks)

        # And finally the Rule which connects the schedule with the lambda target
        events.Rule(
            self, "poll_for_approval",
            description="Schedule for running lambda to check for new Approval tasks",
            enabled=True,
            schedule=lambda_schedule,
            targets=[event_lambda_target]
        )

class ApproveDenyTask(core.Construct):
    def __init__(self, scope: core.Construct, construct_id: str, 
        dynamodb_table: core.Construct, table_name_param: core.Construct, **kwargs) -> None:

        super().__init__(scope, construct_id, **kwargs)

        approve_deny_lambda = lambda_.Function(
            self, "approve-deny-request",
            runtime=lambda_.Runtime.PYTHON_3_8,
            code=lambda_.Code.asset('lambda/approve_deny_request'),
            handler='approve_deny_request.handler'
        )

        dynamodb_table.grant_write_data(approve_deny_lambda)
        table_name_param.grant_read(approve_deny_lambda)

        self.approve_task = sfn_tasks.LambdaInvoke(
            self, 'sfn-approve-request',
            lambda_function=approve_deny_lambda,
            payload_response_only=True,
            result_path=None
        )

        self.deny_task = sfn_tasks.LambdaInvoke(
            self, 'sfn-deny-request',
            lambda_function=approve_deny_lambda,
            payload_response_only=True,
            result_path=None
        )

class SetupWorkspaceTask(core.Construct):
    def __init__(self, scope: core.Construct, construct_id: str,
        dynamodb_table: core.Construct, table_name_param: core.Construct, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        create_workspace_lambda = lambda_.Function(
            self, 'create-workspace-function',
            runtime=lambda_.Runtime.PYTHON_3_8,
            code=lambda_.Code.asset('lambda/create_workspace'),
            handler='create_workspace.handler'
        )

        dynamodb_table.grant_write_data(create_workspace_lambda)
        table_name_param.grant_read(create_workspace_lambda)

        self.create_workspace_task = sfn_tasks.LambdaInvoke(
            self, 'create-workspace-task',
            lambda_function=create_workspace_lambda,
            payload_response_only=True,
            result_path=None
        )

class StepFunctionsWorkflow(core.Construct):
    def __init__(self, scope: core.Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        sri_construct = StoreRequestInfoConstruct(self, 'bmh-store-request-info')
        sri_task = sfn_tasks.LambdaInvoke(
            self, "sfn-store-info",
            lambda_function=sri_construct.function,
            payload_response_only=True,
            output_path="$.request_info"
        )

        approval_construct = RequestApprovalActivity(self, 'request-approval-activity')
        approval_activity_task = sfn_tasks.StepFunctionsInvokeActivity(
            self, 'invoke-approval-activity',
            activity=approval_construct.activity,
            timeout=core.Duration.days(2), ## TODO What should happen after this timesout?
            result_path="$.approval_result"
        )

        approve_deny_task = ApproveDenyTask(
            self, 'approve-deny-task',
            sri_construct.dynamodb_table,
            sri_construct.table_name_param
        )

        choice = stepfunctions.Choice(self, "Is request approved?")
        choice.when(
            stepfunctions.Condition.boolean_equals("$.approval_result.approved", True), 
            approve_deny_task.approve_task
        )
        choice.otherwise(approve_deny_task.deny_task)

        setup_workspace = SetupWorkspaceTask(
            self,'setup-workspace-task',
            sri_construct.dynamodb_table,
            sri_construct.table_name_param
        )

        transfer_account = stepfunctions.Pass(
            self, 'transfer-workspace-account',
            result=stepfunctions.Result.from_object({})
        )

        approve_deny_task.approve_task.next(setup_workspace.create_workspace_task).next(transfer_account)

        ## Add logging
        log_group = logs.LogGroup(self, "sfn-loggroup")

        state_machine = stepfunctions.StateMachine(
            self, "workflwow-request-state-machine",
            definition=sri_task.next(approval_activity_task).next(choice),
            logs={
                "destination": log_group,
                "level": stepfunctions.LogLevel.ALL
            }
        )

        self.state_machine = state_machine