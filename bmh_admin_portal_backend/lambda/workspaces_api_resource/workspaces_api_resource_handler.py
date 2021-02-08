import json
import random
import uuid
import sys
import traceback
import decimal
import os

import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key
from boto3.session import Session


import logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(message)s")
logger.setLevel(logging.INFO)

DEFAULT_STRIDES_CREDITS_AMOUNT = 5000

def handler(event, context):
    """ Handles all API requests for the BMH Portal Backend
    Expects the following environment variables:
        dynamodb_table_param_name: The SSM Parameter name which stores the dynamodb table name.
        api_usage_id_param_name: The SSM Parameter name which stores the Usage Plan ID to create
            API Keys.
    """

    dispatch = {
        '/workspaces':{
            'POST': _workspaces_post,
            'GET': _workspaces_get
        },
        '/workspaces/{workspace_id}':{
            'GET': _workspaces_get,
        },
        '/workspaces/{workspace_id}/limits':{
            'PUT': _workspaces_set_limits
        },
        '/workspaces/{workspace_id}/total-usage':{
            'PUT': _workspaces_set_total_usage
        }
    }

    logger.info(json.dumps(event))

    resource = event['resource']
    path = event['path']
    method = event['httpMethod']
    path_params = event['pathParameters']
    
    # For authenticated endpoints
    auth_claims = None
    authorizer = event['requestContext'].get('authorizer',None)
    if authorizer is not None:
        auth_claims = event['requestContext']['authorizer']['claims']

    # For API Key enpoints
    api_key = event['requestContext']['identity'].get('apiKey',None)

    body = event.get("body", "{}")
    if body is not None:
        body = json.loads(body)
    
    try:
        method = dispatch[resource][method]
    except KeyError as e:
        logger.exception(e)
        return {
            "statusCode":400,
            "body":json.dumps({'message':"Did not know how to handle request"})
        }

    # Handle generic exceptions. Assuming it's a input/user issue.
    try:
        retval = method(body, path_params, auth_claims, api_key)
    except Exception as e:
        logger.exception(e)
        return {
            "statusCode":400,
            "body":json.dumps({"message":f"{type(e).__name__}: {str(e)}"})
        }
    
    return retval
################################################################################

####################### Functions to handle API Method Calls ###################
def _workspaces_post(body, path_params, auth_claims, api_key):
    """ For now, this is a place holder for the actual process
    which will create a workpace. For now, it performs the following:
        1. Create API Key - used by Workspace accounts to communicate 
            back to the portal account.
        2. Create Workspace and Account IDs (randomly generated placeholders).
        3. Create SNS topics and subscribe the user. 
        4. Store information in DynamoDB and set some Account
            defaults (soft limit, hard limit, strides credits)
    """
    workspace_id = str(uuid.uuid4())

    apigateway = boto3.client('apigateway')
    resp = apigateway.create_api_key(
        name=f'workspace-{workspace_id}-key',
        description=f'API Key for workspace {workspace_id}',
        enabled=True
    )
    key_id = resp['id']
    api_key = resp['value']

    # Grab the Usage Plan Id
    usage_plan_id = _get_param(os.environ['api_usage_id_param_name'])
    apigateway.create_usage_plan_key(
        usagePlanId=usage_plan_id,
        keyId=key_id,
        keyType='API_KEY'
    )

    # Create the SNS topic for communication back to the user.
    sns = boto3.client('sns')
    response = sns.create_topic(
        Name=f'bmh-workspace-topic-{workspace_id}',
        Tags=[
            {'Key': "bmh_workspace_id","Value":workspace_id}
        ]
    )
    topic_arn = response['TopicArn']
    sns.subscribe(
        TopicArn=topic_arn,
        Protocol="email",
        Endpoint=auth_claims['email']
    )

    # Convert the input format.
    params = {x['name']:x['value'] for x in body}
    params['bmh_workspace_id'] = str(uuid.uuid4())
    params['user_id'] = auth_claims['email']
    params['api_key'] = api_key
    params['account_id'] = "PSEUDO_" + ''.join(str(random.randint(0,9)) for _ in range(12))
    params['strides-credits'] = decimal.Decimal(DEFAULT_STRIDES_CREDITS_AMOUNT)
    params['soft-limit'] = decimal.Decimal(DEFAULT_STRIDES_CREDITS_AMOUNT * .5)
    params['hard-limit'] = decimal.Decimal(DEFAULT_STRIDES_CREDITS_AMOUNT * .9)
    params['total-usage'] = 0
    params['sns-topic-arn'] = topic_arn

    # Get the dynamodb table name from SSM Parameter Store
    dynamodb_table_name = _get_dynamodb_table_name()
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(dynamodb_table_name)

    table.put_item(
        Item=params
    )

    return {
        'statusCode': 200,
        'body': json.dumps(params, cls=DecimalEncoder)
    }

def _workspaces_get(body, path_params, auth_claims, api_key):
    """ Will return a list of workspaces rows based the email 
    of the user """

    dynamodb_table_name = _get_dynamodb_table_name()
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(dynamodb_table_name)

    status_code = 200
    retval = []
    if path_params is not None and 'workspace_id' in path_params:
        response = table.get_item(
            Key={
                'bmh_workspace_id':path_params['workspace_id'],
                'user_id':auth_claims['email']
            }
        )
        retval = response.get('Item', None)
        if retval is None:
            status_code = 404

    else:
        response = table.query(
            KeyConditionExpression=Key('user_id').eq(auth_claims['email'])
        )
        
        retval = response.get('Items',[])
        if len(retval) == 0:
            status_code = 204 # No content, resource was found, but it's empty.

    return {
        "statusCode":status_code,
        "body": json.dumps(retval, cls=DecimalEncoder)
    }

def _workspaces_set_limits(body, path_params, auth_claims, api_key):
    logger.info(f"Called 'set limit': {body}")

    # Validate body and path_params
    assert 'workspace_id' in path_params
    assert 'soft-limit' in body
    assert 'hard-limit' in body
    assert 'email' in auth_claims

    # Get the dynamodb table name from SSM Parameter Store
    workspace_id = path_params['workspace_id']
    user_id = auth_claims['email']
    dynamodb_table_name = _get_dynamodb_table_name()
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(dynamodb_table_name)

    soft_limit = round(decimal.Decimal(body['soft-limit']),2)
    hard_limit = round(decimal.Decimal(body['hard-limit']),2)

    if soft_limit >= hard_limit:
        raise ValueError("Hard limit must be larger than soft limit")

    try:
        table_response = table.update_item(
            Key={
                'bmh_workspace_id':workspace_id,
                'user_id':user_id
            },
            UpdateExpression="set #hard = :hard, #soft = :soft",
            ConditionExpression='attribute_exists(bmh_workspace_id)',
            ExpressionAttributeValues={
                ':soft': round(decimal.Decimal(body['soft-limit']),2),
                ':hard': round(decimal.Decimal(body['hard-limit']),2)
            },
            ExpressionAttributeNames={
                '#soft': 'soft-limit',
                '#hard': 'hard-limit'
            },
            ReturnValues='ALL_NEW'
        )
        logger.info(f"Table response: {table_response}")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
            raise Exception("Could not find BMH Workspace "
                f"with id {workspace_id}")
        else:
            raise e

    return {
        'statusCode':200,
        'body':json.dumps(table_response['Attributes'], cls=DecimalEncoder)
    }


def _workspaces_set_total_usage(body, path_params, auth_claims, api_key):
    """ This function handles calls to update total-usage of a workspace.
    This is expected to be called by a Gen3 Workspace Account and is not authenticated
    like the rest of the methods (so auth_claims won't be useful)."""

    logger.info("Called set total-usage")
    logger.info(auth_claims)

    # Validate inputs
    assert 'workspace_id' in path_params
    assert 'total-usage' in body
    assert api_key is not None

    # Where is the API Key? We should validate that
    dynamodb_table_name = _get_dynamodb_table_name()
    dynamodb_index_name = _get_dynamodb_index_name()
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(dynamodb_table_name)
    total_usage = body['total-usage']

    # Query the Global Secondary Index to get the User.
    try:
        index_response = table.query(
            IndexName=dynamodb_index_name,
            KeyConditionExpression=Key('bmh_workspace_id').eq(path_params['workspace_id']),
            ReturnConsumedCapacity='NONE',
        )
    except ClientError as e:
        if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
            raise Exception("Could not find BMH Workspace "
                f"with id {workspace_id}")
        else:
            raise e

    ## TODO: Confirm that the API key matches the BMH Workspace ID

    # And now update the row.
    items = index_response.get('Items',[])
    assert len(items) == 1
    workspace_id = items[0]['bmh_workspace_id']
    user_id = items[0]['user_id']
    formatted_total_usage = round(decimal.Decimal(total_usage),2)

    try:
        table_response = table.update_item(
            Key={
                'bmh_workspace_id':workspace_id,
                'user_id':user_id
            },
            UpdateExpression="set #totalUsage = :totalUsage",
            ConditionExpression='attribute_exists(bmh_workspace_id)',
            ExpressionAttributeValues={
                ':totalUsage': formatted_total_usage,
            },
            ExpressionAttributeNames={
                '#totalUsage': 'total-usage'
            },
            ReturnValues='ALL_OLD'
        )
        logger.info(f"Table response: {json.dumps(table_response, cls=DecimalEncoder)}")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
            raise Exception("Could not find BMH Workspace "
                f"with id {workspace_id}")
        else:
            raise e

    old_total_usage = table_response['Attributes']['total-usage']
    soft_limit = table_response['Attributes']['soft-limit']
    hard_limit = table_response['Attributes']['hard-limit']

    # Did we just pass the billing limits? 
    # TODO: These should probably be their own lambdas, but for now, just
    # sends something to the SNS topic for demonstration purposes.
    sns_topic_arn = table_response['Attributes']['sns-topic-arn']
    message = "Success"
    if old_total_usage < hard_limit and formatted_total_usage >= hard_limit:
        logger.info(f"Surpassed the hard limit: {old_total_usage=} {formatted_total_usage=} {hard_limit=}")

        subject = f"Biomedical Hub Workspace {workspace_id}: exceeded usage hard limit"
        message = f"""The Biomedial Hub Workspace ({workspace_id}) has exceeded the usage hard limit.
        Total Usage: {formatted_total_usage}
        Soft Usage Limit: {soft_limit}
        Hard Usage Limit: {hard_limit}
        """
        _publish_to_sns_topic(sns_topic_arn, subject, message)

    elif old_total_usage < soft_limit and formatted_total_usage >= soft_limit:
        logger.info(f"Surpassed the hard limit: {old_total_usage=} {formatted_total_usage=} {soft_limit=}")

        subject = f"Biomedical Hub Workspace {workspace_id}: exceeded usage soft limit"
        message = f"""The Biomedial Hub Workspace ({workspace_id}) has exceeded the usage soft limit.
        Total Usage: {formatted_total_usage}
        Soft Usage Limit: {soft_limit}
        Hard Usage Limit: {hard_limit}
        """
        _publish_to_sns_topic(sns_topic_arn, subject, message)

    return {
        'statusCode':200,
        'body':json.dumps({})
    }

################################################################################

################################ Helper Methods ################################
def _publish_to_sns_topic(topic_arn, subject, message):
    sns = boto3.client('sns')
    sns.publish(
        TopicArn=topic_arn,
        Subject=subject,
        Message=message
    )

def _get_dynamodb_index_name():
    return _get_param(os.environ['dynamodb_index_param_name'])
def _get_dynamodb_table_name():
    return _get_param(os.environ['dynamodb_table_param_name'])   

def _get_param(param_name):
    ssm = boto3.client('ssm')
    param_info = ssm.get_parameter(Name=param_name)
    return param_info['Parameter']['Value']
    
# Helper class to convert a DynamoDB item to JSON.
class DecimalEncoder(json.JSONEncoder):
    # Usage explained here:
    # https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GettingStarted.Python.03.html
    def default(self, o):
        if isinstance(o, decimal.Decimal):
            if o % 1 > 0:
                return float(o)
            else:
                return int(o)
        return super(DecimalEncoder, self).default(o)
################################################################################