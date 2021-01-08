import boto3
import random

def handler(event, context):

    # Get the dynamodb table name from SSM Parameter Store
    dynamodb_table_name = _get_dynamodb_table_name()
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(dynamodb_table_name)

    # This is where we could create a Workspace, but instead
    # here is a random 12 digit ID.
    workspace_id = "".join([str(random.randint(0,9)) for x in range(12)])

    # And we need to add it to the correct request.
    request_id = event['request_id']
    organization = event['organization']
    table.update_item(
        Key={
            'organization':organization,
            'request_id':request_id
        },
        UpdateExpression="set workspace_account_id=:a",
        ExpressionAttributeValues={
            ':a': workspace_id
        }
    )

def _get_dynamodb_table_name():
    ssm = boto3.client('ssm')
    param_info = ssm.get_parameter(Name='/bmh/workspace-registration-dynamodb-table')
    return param_info['Parameter']['Value']