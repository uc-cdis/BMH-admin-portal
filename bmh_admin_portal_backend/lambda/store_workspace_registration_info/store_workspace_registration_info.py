import uuid
import random

import boto3
from botocore.exceptions import ClientError

def handler(event, context):

    # event format expectations:
    #  event = [
    #   {'name':'first_name','value':'Jane'},
    #   {'name':'last_name','value':'Doe'},
    # ]
    # Convert that to dict
    params = {x['name']:x['value'] for x in event}

    # Create a unique request ID for the workspace request
    request_id = str(uuid.uuid4())
    params['request_id'] = request_id
    retval = {
        'request_id': request_id,
        'organization': params['organization']
    }

    # Get the dynamodb table name from SSM Parameter Store
    dynamodb_table_name = _get_dynamodb_table_name()
    
    # Write the data to the table.
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(dynamodb_table_name)
    
    table.put_item(
        Item=params
    )
    
    # For now, just return event so we can figure out the format
    # of what's being passed into here
    return {'request_info':retval}

def _get_dynamodb_table_name():
    ssm = boto3.client('ssm')
    param_info = ssm.get_parameter(Name='/bmh/workspace-registration-dynamodb-table')
    return param_info['Parameter']['Value']
    
