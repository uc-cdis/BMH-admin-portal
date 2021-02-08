import os
import uuid

from aws_cdk import (
    core,
    aws_iam as iam,
    aws_ssm as ssm,
    aws_lambda as lambda_,
    aws_logs as logs,
    aws_s3 as s3,
    aws_s3_notifications as s3_notifications
)
from aws_cdk.custom_resources import (
    AwsCustomResource,
    AwsCustomResourcePolicy,
    AwsSdkCall,
    PhysicalResourceId,
)

from .bmh_workspace_config import BMHWorkspaceConfig

class BMHWorkspaceStack(core.Stack):
    """ This CDK stack will deploy required services for provisioning a new 
    BMH Gen3 Workspace Account. Some environment variables are required with 
    relevant information:
        1. BMH_PORTAL_URI: URL for interacting with the BMH Portal (ex: https://domain.portal.com/api)
        2. BMH_PORTAL_API_KEY: The API key assigned to this workspace.
        3. BMH_PORTAL_WORKSPACE_ID: The workspace ID assigned to this workspace
    """

    # Some names which need to be internally consistent. We shoudln't need these
    # outside of this code (we store those in SSM Parameters)
    COST_USAGE_REPORT_NAME_PREFIX="bmh-cost-and-usage"
    S3_REPORT_BUCKET_PREFIX="reports"

    REQUIRED_ENVVARS = ['BMH_PORTAL_URI', 'BMH_PORTAL_API_KEY', 'BMH_PORTAL_WORKSPACE_ID']

    def __init__(self, scope: core.Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        ## Check for a couple environment variables which should be present before running
        self._check_envvars()

        ## Read in param name config
        self._param_name_config = BMHWorkspaceConfig.get_config()

        self.set_workspace_params()
        self.setup_cost_and_usage_report()
        self.setup_cost_and_usage_parser()
        
    def set_workspace_params(self):
        self.workspace_id_param = ssm.StringParameter(
            self, "bmh-workspace-id-param",
            description="Workspace ID number for this account",
            parameter_name=self._param_name_config['workspace_id'],
            string_value=os.environ['BMH_PORTAL_WORKSPACE_ID']
        )

        self.api_key_param = ssm.StringParameter(
            self, "bmh-api-key",
            description="API Key to interact with BMH Portal API",
            parameter_name=self._param_name_config['api_key'],
            string_value=os.environ['BMH_PORTAL_API_KEY']
        )

        self.portal_uri_param = ssm.StringParameter(
            self, "bmh-api-url",
            description="The BMH Portal URI for the API",
            parameter_name=self._param_name_config['bmh_portal_uri'],
            string_value=os.environ['BMH_PORTAL_URI']
        )

    def setup_cost_and_usage_parser(self):
        ## Setup a lambda to handle any changes to the bucket
        ## and give permissions to necessary parameters.

        prefix = self.__class__.S3_REPORT_BUCKET_PREFIX

        awswrangler_layer = lambda_.LayerVersion(
            self, "cur-parser-wrangler-layer",
            code=lambda_.Code.from_asset(path='lambdas/awswrangler-layer-2.4.0-py3.8.zip'),
            compatible_runtimes=[lambda_.Runtime.PYTHON_3_8]
        )

        handle_s3_event = lambda_.Function(
            self, "handle-s3-event",
            runtime=lambda_.Runtime.PYTHON_3_8,
            code=lambda_.Code.asset('lambdas/handle_s3_event'),
            handler='handle_s3_event.handler',
            function_name='bmh-workspace-parse-cost-and-usage',
            layers=[awswrangler_layer],
            log_retention=logs.RetentionDays.ONE_MONTH,
            timeout=core.Duration.minutes(10),
            environment=self._param_name_config
            
        )

        self.bucket_name_param.grant_read(handle_s3_event)
        self.report_name_param.grant_read(handle_s3_event)
        self.prefix_param.grant_read(handle_s3_event)
        self.portal_uri_param.grant_read(handle_s3_event)
        self.api_key_param.grant_read(handle_s3_event)
        self.workspace_id_param.grant_read(handle_s3_event)
        self.cost_and_usage_report.bucket.grant_read_write(handle_s3_event)

        self.cost_and_usage_report.bucket.add_event_notification(
            s3.EventType.OBJECT_CREATED,
            s3_notifications.LambdaDestination(handle_s3_event),
            s3.NotificationKeyFilter(
                prefix=prefix,
                suffix='parquet'
            )
        )

    def setup_cost_and_usage_report(self):     

        prefix = self.__class__.S3_REPORT_BUCKET_PREFIX
        report_name = self.__class__.COST_USAGE_REPORT_NAME_PREFIX

        # Create the bucket which will store the reports and
        # configure the policy required by the Cost and Usage Report 
        # tool
        cur_bucket = s3.Bucket(
            self, "cur-report-bucket",
            encryption=s3.BucketEncryption.S3_MANAGED
        )
        cur_bucket.add_to_resource_policy(iam.PolicyStatement(
            actions=[
                "s3:GetBucketAcl",
                "s3:GetBucketPolicy"
            ],
            principals=[iam.ServicePrincipal('billingreports.amazonaws.com')],
            resources=[cur_bucket.bucket_arn]
        ))
        cur_bucket.add_to_resource_policy(iam.PolicyStatement(
            actions=["s3:PutObject"],
            principals=[iam.ServicePrincipal('billingreports.amazonaws.com')],
            resources=[cur_bucket.arn_for_objects('*')]
        ))

        self.bucket_name_param = ssm.StringParameter(
            self, "cost-and-usage-bucket-name",
            description="S3 Bucket name where cost and usage reports are written",
            parameter_name=self._param_name_config['cur_bucket_name'],
            string_value=cur_bucket.bucket_name
        )

        self.report_name_param = ssm.StringParameter(
            self, "cost-and-usage-report-name",
            description="Report name for Cost and Usage Reports",
            parameter_name=self._param_name_config['cur_report_name'],
            string_value=report_name
        )

        self.prefix_param = ssm.StringParameter(
            self, "cost-and-usage-prefix",
            description="S3 Bucket prefix used to store Cost and Usage reports",
            parameter_name=self._param_name_config['cur_prefix'],
            string_value=prefix
        )

        # Create the cost and usage report using the above parameters
        self.cost_and_usage_report = CostAndUsageReport(
            self, "cost-and-usage-report",
            report_name_prefix=report_name,
            bucket=cur_bucket,
            prefix=prefix
        )

    def _check_envvars(self):
        missing = []
        for ev in self.__class__.REQUIRED_ENVVARS:
            v = os.environ.get(ev, None)
            if v is None:
                missing.append(ev)
        
        if len(missing) > 0:
            raise Exception(f"Missing required environment variables: {', '.join(missing)}")
        


class CostAndUsageReport(core.Construct):
    def __init__(
        self, scope: core.Construct, construct_id: str, report_name_prefix: str, 
        bucket: core.Construct, prefix: str) -> None:
        """ Custom construct to generate a Cost and Usage Report. Takes the following parameters:
                scope: Scope in which to create the construct. See CDK Docs
                construct_id: ID of this construct, unique within scope.
                report_name_prefix: Used as the base of the report name. Will create a unique
                    report name based on the tree the node is in.
                bucket: S3 Bucket to write the reports to. Should have correct permissions
                    to allow billing.amazonaws.com write capabilities.

        """
        super().__init__(scope, construct_id)
        
        self.report_name = report_name_prefix + scope.node.addr
        self.bucket = bucket
        self.prefix = prefix
        self.region = scope.region

        on_create = self.get_on_create()
        on_update = self.get_on_update()
        on_delete = self.get_on_delete()

        policy = AwsCustomResourcePolicy.from_sdk_calls(
            resources=AwsCustomResourcePolicy.ANY_RESOURCE
        )
        lambda_role = self.get_provisioning_lambda_role(construct_id=construct_id)

        AwsCustomResource(
            scope=scope,id=f'{id}-AWSCustomResource',
            policy=policy,
            log_retention=logs.RetentionDays.FIVE_DAYS,
            on_create=on_create,
            on_update=on_update,
            on_delete=on_delete,
            resource_type='Custom::AWS-CUR-Report',
            role=lambda_role
        )


    def get_on_create(self):
        on_create = AwsSdkCall(
            action='putReportDefinition',
            service='CUR',
            parameters={
                "ReportDefinition": {
                    'ReportName': self.report_name,
                    'Format': "Parquet",
                    'Compression': "Parquet",
                    'AdditionalSchemaElements': [],
                    'S3Bucket': self.bucket.bucket_name,
                    'S3Prefix': self.prefix,
                    'S3Region': self.region,
                    'ReportVersioning': "OVERWRITE_REPORT",
                    'TimeUnit': 'MONTHLY'
                }
            },
            physical_resource_id=PhysicalResourceId.of(self.report_name)
        )

        return on_create

    def get_on_update(self):
        on_update = AwsSdkCall(
            action='modifyReportDefinition',
            service='CUR',
            parameters={
                "ReportName": self.report_name,
                "ReportDefinition": {
                    'ReportName': self.report_name,
                    'Format': "Parquet",
                    'Compression': "Parquet",
                    'AdditionalSchemaElements': [],
                    'S3Bucket': self.bucket.bucket_name,
                    'S3Prefix': self.prefix,
                    'S3Region': self.region,
                    'ReportVersioning': "OVERWRITE_REPORT",
                    'TimeUnit': 'MONTHLY'
                }
            },
            physical_resource_id=PhysicalResourceId.of(self.report_name)
        )
        return on_update

    def get_on_delete(self):
        on_delete = AwsSdkCall(
            action="deleteReportDefinition",
            service='CUR',
            parameters={
                "ReportName":self.report_name
            },
            physical_resource_id=PhysicalResourceId.of(self.report_name)
        )
        return on_delete

    def get_provisioning_lambda_role(self, construct_id: str):
        return iam.Role(
            scope=self,
            id=f'{construct_id}-LambdaRole',
            assumed_by=iam.ServicePrincipal('lambda.amazonaws.com'),
            managed_policies=[iam.ManagedPolicy.from_aws_managed_policy_name(
                "service-role/AWSLambdaBasicExecutionRole"
            )]
        )
