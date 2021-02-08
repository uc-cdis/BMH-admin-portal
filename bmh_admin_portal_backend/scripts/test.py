import os
import sys
import boto3
import decimal

sys.path.insert(1, os.path.join(sys.path[0], '..'))
from bmh_admin_portal_backend.bmh_admin_portal_config import BMHAdminPortalBackendConfig

def main():
    # Get the dynamodb table name from SSM Parameter Store
    workspace_id = 'ec6c0842-d3e1-4692-960d-3ab52f71ffee'
    user_id = 'kggalens@amazon.com'
    dynamodb_table_name = _get_dynamodb_table_name()
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(dynamodb_table_name)

    hard_limit = "4600"
    soft_limit = "2600"

    table_response = table.update_item(
        Key={
            'bmh_workspace_id':workspace_id,
            'user_id':user_id
        },
        UpdateExpression="set #hard = :hard, #soft = :soft",
        ConditionExpression='attribute_exists(bmh_workspace_id)',
        ExpressionAttributeValues={
            ':soft': decimal.Decimal(soft_limit),
            ':hard': decimal.Decimal(hard_limit)
        },
        ExpressionAttributeNames={
            '#hard': "hard-limit",
            '#soft': "soft-limit"
        },
        ReturnValues='ALL_NEW'
    )

    print(table_response)

def _get_dynamodb_table_name():
    config = BMHAdminPortalBackendConfig.get_config()
    return _get_param(config['dynamodb_table_param_name'])   

def _get_param(param_name):
    ssm = boto3.client('ssm')
    param_info = ssm.get_parameter(Name=param_name)
    return param_info['Parameter']['Value']
    
if __name__ == "__main__":
    main()