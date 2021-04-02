# © 2021 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.
# 
# This AWS Content is provided subject to the terms of the AWS Customer Agreement
# available at http://aws.amazon.com/agreement or other written agreement between
# Customer and either Amazon Web Services, Inc. or Amazon Web Services EMEA SARL or both.

import boto3
import botocore
import json
import os

from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key

def handler(event, context):

    # Handle Input
    account_id = event['workspace_creation_result']['account_id']
    workspace_id = event['brh_infrastructure']['workspace_id']
    api_key = event['brh_infrastructure']['api_key']

    # Write the account id to the database.
    write_account_id_to_dynamo(workspace_id, account_id)

    # This is created by the account provisioning lambda.
    # It's hardcoded there and isn't returned.
    target_account_role = "OrganizationAccountAccessRole"

    # Get a few parameters
    orig_bucket_name = _get_param(os.environ.get('brh_asset_bucket_param_name', None))
    orig_bucket_prefix = "artifacts"

   #def _deploy_brh_infrastructure(account_id, workspace_id, api_key): 
    # Add to bucket policy
    s3 = boto3.client('s3')
    sid = f"account_{account_id}"

    try:
        response = s3.get_bucket_policy(Bucket=orig_bucket_name)

        # We already ave a policy
        policy = json.loads(response["Policy"])
        
    except botocore.exceptions.ClientError as err:
        policy = {
            'Version': '2012-10-17',
            'Statement': []
        }

    # Do we have a statement already matching this ID?
    matches = [x for x in policy['Statement'] if x.get('Sid', None) == sid]
    if len(matches) == 0:
        statement = {
            'Sid': sid,
            'Effect': 'Allow',
            'Principal': {"AWS":f'arn:aws:iam::{account_id}:role/{target_account_role}'},
            'Action': ['s3:GetObject'],
            'Resource': f'arn:aws:s3:::{orig_bucket_name}/*'
        }

        policy['Statement'].append(statement)
        response = s3.put_bucket_policy(
            Bucket=orig_bucket_name,
            Policy=json.dumps(policy)
        )

    ####################################################
    # Assume Role
    sts = boto3.client('sts')
    brh_workspace_account = sts.assume_role(
        RoleArn=f"arn:aws:iam::{account_id}:role/{target_account_role}",
        RoleSessionName="deploy_brh_infrastructure"
    )
    creds = brh_workspace_account['Credentials']

    cfn = boto3.client(
        'cloudformation',
        aws_access_key_id=creds['AccessKeyId'],
        aws_secret_access_key=creds['SecretAccessKey'],
        aws_session_token=creds['SessionToken']
    )

    region = os.environ.get('AWS_REGION', 'us-east-1')
    template_url=f"https://{orig_bucket_name}.s3.{region}.amazonaws.com/{orig_bucket_prefix}/BMHAccountBaseline.yml"

    brh_portal_url = _get_param(os.environ.get("brh_portal_url", None))

    try:
        response = cfn.create_stack(
            StackName='brh-infrastructure',
            TemplateURL=template_url,
            Parameters=[
                {
                    "ParameterKey":   "ArtifactBucket",
                    "ParameterValue": orig_bucket_name
                },{
                    "ParameterKey":   "ArtifactPrefix",
                    "ParameterValue": orig_bucket_prefix
                },
                {
                    "ParameterKey":   "BRHWorkspaceId",
                    "ParameterValue": workspace_id
                },{
                    "ParameterKey":   "BRHPortalAPIURI",
                    "ParameterValue": brh_portal_url
                },{
                    "ParameterKey":   "APIKey",
                    "ParameterValue": api_key
                }
            ],
            Capabilities=['CAPABILITY_IAM']
        )
    except botocore.exceptions.ClientError as err:
        raise err

    ## Wait for the stack to complete. Expectation is this should
    ## take less than 5 minutes
    total_minutes = 5
    delay = 10
    max_attempts = int(total_minutes*60 / 10)

    waiter = cfn.get_waiter('stack_create_complete')
    waiter.wait(
        StackName='brh-infrastructure',
        WaiterConfig={
            "Delay":delay,
            "MaxAttempts":max_attempts
        }
    )

    return {'success':True}


def write_account_id_to_dynamo(workspace_id, account_id):
    # Where is the API Key? We should validate that
    dynamodb_table_name = _get_dynamodb_table_name()
    dynamodb_index_name = _get_dynamodb_index_name()
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(dynamodb_table_name)

    # Query the Global Secondary Index to get the User.
    try:
        index_response = table.query(
            IndexName=dynamodb_index_name,
            KeyConditionExpression=Key('bmh_workspace_id').eq(workspace_id),
            ReturnConsumedCapacity='NONE',
        )
    except ClientError as e:
        if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
            return {
                "statusCode":404,
                "message":json.dumps({"message":"Could not find BRH Workspace "
                    f"with id {workspace_id}"})
            }
        else:
            raise e

    # And now update the row.
    items = index_response.get('Items',[])
    assert len(items) == 1
    workspace_id = items[0]['bmh_workspace_id']
    user_id = items[0]['user_id']

    try:
        table_response = table.update_item(
            Key={
                'bmh_workspace_id':workspace_id,
                'user_id':user_id
            },
            UpdateExpression="set #accountId = :accountId",
            ConditionExpression='attribute_exists(bmh_workspace_id)',
            ExpressionAttributeValues={
                ':accountId': account_id,
            },
            ExpressionAttributeNames={
                '#accountId': 'account_id'
            },
            ReturnValues='ALL_OLD'
        )
    except ClientError as e:
        if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
            raise Exception("Could not find BMH Workspace "
                f"with id {workspace_id}")
        else:
            raise e

def _get_dynamodb_index_name():
    return _get_param(os.environ['dynamodb_index_param_name'])
def _get_dynamodb_table_name():
    return _get_param(os.environ['dynamodb_table_param_name'])   

def _get_param(param_name):
    ssm = boto3.client('ssm')
    param_info = ssm.get_parameter(Name=param_name)
    return param_info['Parameter']['Value']