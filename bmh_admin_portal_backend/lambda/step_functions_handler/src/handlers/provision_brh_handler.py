# © 2021 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.
#
# This AWS Content is provided subject to the terms of the AWS Customer Agreement
# available at http://aws.amazon.com/agreement or other written agreement between
# Customer and either Amazon Web Services, Inc. or Amazon Web Services EMEA SARL or both.

import os
import json

import boto3
import botocore
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key

from ..util import Util
from ..db.client import DBClient


class ProvisionBRHHandler:
    def __init__(self):
        self.db_client = DBClient()

    def handle(self, raw_event):
        event = raw_event["input"]

        # Check required attributes.
        assert "ddi_lambda_output" in event
        assert "workspace_id" in event
        assert "api_key" in event

        # Handle Input
        account_id = event["ddi_lambda_output"]["account_id"]
        workspace_request_id = event["workspace_id"]
        api_key = event["api_key"]

        # Write the account id to the database.
        self.db_client.set_account_id(workspace_request_id, account_id)

        # This is expected to exist in the newly created BRH workspace accounts.
        target_account_role = os.environ["cross_account_role_name"]

        # Get the bucket name from SSM Parameter store.
        orig_bucket_name = Util.get_param(
            os.environ.get("brh_asset_bucket_param_name", None)
        )
        orig_bucket_prefix = "artifacts"

        # Add to bucket policy
        s3 = boto3.client("s3")
        sid = f"account_{account_id}"

        try:
            response = s3.get_bucket_policy(Bucket=orig_bucket_name)

            # We already ave a policy
            policy = json.loads(response["Policy"])

        except botocore.exceptions.ClientError as err:
            policy = {"Version": "2012-10-17", "Statement": []}

        # Do we have a statement already matching this ID?
        matches = [x for x in policy["Statement"] if x.get("Sid", None) == sid]
        if len(matches) == 0:
            statement = {
                "Sid": sid,
                "Effect": "Allow",
                "Principal": {
                    "AWS": f"arn:aws:iam::{account_id}:role/{target_account_role}"
                },
                "Action": ["s3:GetObject"],
                "Resource": f"arn:aws:s3:::{orig_bucket_name}/*",
            }

            policy["Statement"].append(statement)
            print(orig_bucket_name)
            response = s3.put_bucket_policy(
                Bucket=orig_bucket_name, Policy=json.dumps(policy)
            )

        ####################################################
        # Assume Role
        sts = boto3.client("sts")
        brh_workspace_account = sts.assume_role(
            RoleArn=f"arn:aws:iam::{account_id}:role/{target_account_role}",
            RoleSessionName="deploy_brh_infrastructure",
        )
        creds = brh_workspace_account["Credentials"]

        cfn = boto3.client(
            "cloudformation",
            aws_access_key_id=creds["AccessKeyId"],
            aws_secret_access_key=creds["SecretAccessKey"],
            aws_session_token=creds["SessionToken"],
        )

        region = os.environ.get("AWS_REGION", "us-east-1")
        template_url = f"https://{orig_bucket_name}.s3.{region}.amazonaws.com/{orig_bucket_prefix}/BMHAccountBaseline.yml"

        brh_portal_url = Util.get_param(os.environ.get("brh_portal_url", None))

        stack_name = "brh-infrastructure-cur"
        try:
            response = cfn.create_stack(
                StackName=stack_name,
                TemplateURL=template_url,
                Parameters=[
                    {
                        "ParameterKey": "ArtifactBucket",
                        "ParameterValue": orig_bucket_name,
                    },
                    {
                        "ParameterKey": "ArtifactPrefix",
                        "ParameterValue": orig_bucket_prefix,
                    },
                    {
                        "ParameterKey": "BRHWorkspaceId",
                        "ParameterValue": workspace_request_id,
                    },
                    {
                        "ParameterKey": "BRHPortalAPIURI",
                        "ParameterValue": brh_portal_url,
                    },
                    {"ParameterKey": "APIKey", "ParameterValue": api_key},
                ],
                Capabilities=["CAPABILITY_IAM"],
            )
        except botocore.exceptions.ClientError as error:
            if error.response["Error"]["Code"] == "AlreadyExistsException":
                # Not a problem. We should actually ensure that it finished successfully...
                return {"success": True}
            else:
                raise error

        ## Wait for the stack to complete. Expectation is this should
        ## take less than 5 minutes
        total_minutes = 5
        delay = 10
        max_attempts = int(total_minutes * 60 / delay)

        waiter = cfn.get_waiter("stack_create_complete")
        waiter.wait(
            StackName=stack_name,
            WaiterConfig={"Delay": delay, "MaxAttempts": max_attempts},
        )

        return {"success": True}
