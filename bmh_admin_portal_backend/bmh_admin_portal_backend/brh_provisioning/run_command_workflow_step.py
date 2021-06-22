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

DEFAULT_WAIT_TIME=15 #seconds

class RunCommandWorkflowStep(core.Construct):
    def __init__(self, scope: core.Construct, construct_id: str, 
        step_fn_lambda=None,
        working_directory="",
        commands=None,
        wait_time_seconds=DEFAULT_WAIT_TIME,

        **kwargs) -> None:
        
        super().__init__(scope, construct_id, **kwargs)

        config = BMHAdminPortalBackendConfig.get_config()

        self.step_fn_lambda = step_fn_lambda
        # We need X tasks.
        # 1. Submit the run command (Task: Lambda)
        # 2. Wait for some time. (Wait)
        # 3. Check job status (Task: Lambda)
        # 4. Job Complete (Choice) [Check a variable from previous output, if one of choices, go to final state or default back to Wait.]
        # 5. Final Job Status

        submit_command_task = self.create_submit_command_task(working_directory, commands, config)
        self.chain = submit_command_task

        wait_task = stepfunctions.Wait(
            self, 'wait-polling-task',
            time=stepfunctions.WaitTime.duration(core.Duration.seconds(wait_time_seconds))
        )
        self.chain = self.chain.next(wait_task)

        check_status_task = self.create_check_status()
        self.chain = self.chain.next(check_status_task)

        fail_task = stepfunctions.Fail(
            self, "JobFailed",
            cause="SSM Run Command Failed.",
            error="SSM Run Command Failed. See StepFn workflow."
        )
        pass_task = stepfunctions.Pass(
            self, "pass-task"
        )

        choice_task = stepfunctions.Choice(
            self, 'choice-task-command-polling',
            output_path="$"
        )
        self.chain = self.chain.next(
            choice_task
            .when(stepfunctions.Condition.string_equals("$.command_status", "FAILED"), fail_task)
            .when(stepfunctions.Condition.string_equals("$.command_status", "SUCCESS"), pass_task)
            .otherwise(wait_task)
        )

        self.first_task = submit_command_task
        self.last_task = pass_task


    def create_check_status(self):
        check_status_task = sfn_tasks.LambdaInvoke(
            self, 'ssm-check-status-task',
            lambda_function=self.step_fn_lambda,
            payload_response_only=True,
            payload=stepfunctions.TaskInput.from_object({
                'action':'ssm_command_status',
                'command_polling.$':'$.command_polling'
            }),
            result_path="$.command_status"
        )
        return check_status_task

    def create_submit_command_task(self, working_directory, commands, config):
        run_command_task = sfn_tasks.LambdaInvoke(
            self, 'ssm-run-command-task',
            lambda_function=self.step_fn_lambda,
            payload_response_only=True,
            payload=stepfunctions.TaskInput.from_object({
                'action':'ssm_run_command',
                'working_directory': working_directory,
                'commands': commands,
                'instance_id_parameter_name': config['admin_vm_instance_id_param_name'],
                'input.$':'$'
            }),
            result_path="$.command_polling"
        )
        return run_command_task

    def next(self, task):
        return self.task.next(task)