import boto3

def handler(event, context):
    dynamodb_table_name = _get_dynamodb_table_name()
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(dynamodb_table_name)

    request_id = event['request_id']
    organization = event['organization']
    approval_result = event['approval_result']

    table.update_item(
        Key={
            'organization':organization,
            'request_id':request_id
        },
        UpdateExpression="set approved=:a",
        ExpressionAttributeValues={
            ':a': approval_result['approved']
        }
    )


def _get_dynamodb_table_name():
    ssm = boto3.client('ssm')
    param_info = ssm.get_parameter(Name='/bmh/workspace-registration-dynamodb-table')
    return param_info['Parameter']['Value']