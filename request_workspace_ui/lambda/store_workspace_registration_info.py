import base64
from urllib import parse as urlparse
import random

import boto3
from botocore.exceptions import ClientError

def handler(event, context):
    
    # The return value
    retval = {
        'message': None,
        'success': True
    }

    # Read in user registration information from event.
    decoded_body = urlparse.unquote(base64.b64decode(event['body']).decode("utf-8"))
    params = {}
    for pair in decoded_body.split("&"):
        key, value = pair.split("=")
        params[key] = value

    # Create a fake workspace ID. This would be where we'd create an account.
    params['workspace_id'] = "".join([
        str(random.randint(0,9))
        for _ in range(12)
    ])
    retval['workspace_id'] = params['workspace_id']

    # Get the dynamodb table name from SSM Parameter Store
    try:
        dynamodb_table_name = _get_dynamodb_table_name()
    except ClientError as e:
        retval['success'] = False
        retval['message'] = e.response['Error']['Code']
        return retval
    except KeyError as e:
        retval['success'] = False
        retval['message'] = (
            "KeyError: Could not find dynamodb table name. "
            " Has the backend been deployed?"
        )

    # Write the data to the table.
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(dynamodb_table_name)
    
    try:
        table.put_item(
            Item=params
        )
    except ClientError as e:
        retval['success'] = False
        retval['message'] =  e.response['Error']['Code']
        return retval

    # For now, just return event so we can figure out the format
    # of what's being passed into here
    return retval

def _get_dynamodb_table_name():
    ssm = boto3.client('ssm')
    param_info = ssm.get_parameter(Name='/bmh/workspace-registration-dynamodb-table')
    return param_info['Parameter']['Value']
    
