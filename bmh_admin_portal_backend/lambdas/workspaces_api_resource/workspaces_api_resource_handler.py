# © 2021 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.
#
# This AWS Content is provided subject to the terms of the AWS Customer Agreement
# available at http://aws.amazon.com/agreement or other written agreement between
# Customer and either Amazon Web Services, Inc. or Amazon Web Services EMEA SARL or both.

import json
import random
import uuid
import sys
import traceback
import decimal
import os
import base64
from datetime import datetime, timezone
from urllib.request import Request, urlopen

import boto3
import botocore
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key
from boto3.session import Session

# Boilerplate code to have a workaround for unit tests and AWS deployment for relative imports
sys.path.append(os.path.join(os.path.dirname(__file__)))

from email_helper.email_helper import EmailHelper


import logging

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(message)s")
logger.setLevel(logging.INFO)

DEFAULT_STRIDES_CREDITS_AMOUNT = 250

STRIDES_CREDITS_WORKSPACE_TYPE = "STRIDES Credits"
STRIDES_GRANT_WORKSPACE_TYPE = "STRIDES Grant"
DIRECT_PAY_WORKSPACE_TYPE = "Direct Pay"
VALID_WORKSPACE_TYPES = [
    STRIDES_CREDITS_WORKSPACE_TYPE,
    STRIDES_GRANT_WORKSPACE_TYPE,
    DIRECT_PAY_WORKSPACE_TYPE,
]


def handler(event, context):
    """Handles all API requests for the BMH Portal Backend
    Expects the following environment variables:
        dynamodb_table_param_name: The SSM Parameter name which stores the dynamodb table name.
        api_usage_id_param_name: The SSM Parameter name which stores the Usage Plan ID to create
            API Keys.
    """

    logger.info(json.dumps(event))

    resource = event["resource"]
    path = event["path"]
    method = event["httpMethod"]
    path_params = event["pathParameters"]
    query_string_params = event["queryStringParameters"]
    authorizer = event["requestContext"].get("authorizer", None)

    user = None
    if authorizer is not None:
        user = event["requestContext"]["authorizer"].get("user", None)

    # For API Key endpoints
    api_key = event["requestContext"]["identity"].get("apiKey", None)

    body = event.get("body", "{}")
    try:
        if body is not None:
            body = json.loads(body)
    except Exception as e:
        return create_response(
            status_code=400, body={"message": "Error: Body is not valid json"}
        )

    dispatch = {
        "/auth/get-tokens": {"GET": lambda: _get_tokens(query_string_params, api_key)},
        "/auth/refresh-tokens": {"PUT": lambda: _refresh_tokens(body, api_key)},
        "/workspaces": {
            "POST": lambda: _workspaces_post(body, user),
            "GET": lambda: _workspaces_get(path_params, user),
        },
        "/workspaces/{workspace_id}": {
            "GET": lambda: _workspaces_get(path_params, user, query_string_params)
        },
        "/workspaces/{workspace_id}/limits": {
            "PUT": lambda: _workspaces_set_limits(body, path_params, user)
        },
        "/workspaces/{workspace_id}/total-usage": {
            "PUT": lambda: _workspaces_set_total_usage(body, path_params, api_key)
        },
        "/workspaces/{workspace_id}/provision": {
            "POST": lambda: _workspace_provision(body, path_params)
        },
        "/workspaces/{workspace_id}/direct-pay-limit": {
            "PUT": lambda: _workspace_direct_pay_limit(body, path_params, user)
        },
    }

    try:
        closure = dispatch[resource][method]
    except KeyError as e:
        logger.exception(e)
        return create_response(
            status_code=400,
            body={
                "message": f"Did not know how to handle request [{resource=}, {method=}"
            },
        )

    # Handle generic exceptions. Maybe we should have specific errors to indicate the
    # status code to be returned.
    try:
        retval = closure()
    except AssertionError as e:
        return create_response(status_code=400, body={"message": str(e)})
    except Exception as e:
        logger.exception(e)
        return create_response(
            status_code=500, body={"message": f"{type(e).__name__}: {str(e)}"}
        )

    return retval


################################################################################

####################### Create API Proxy response ###############################
def create_response(status_code=200, body=None, headers=None):
    """Creates the response object to return through API Gateway as
    proxy. Should include Access-Control-Allow-Origin for CORS support:
    https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
    """

    if body is None:
        body = {}

    if headers is None:
        headers = {}

    ## TODO: This is fine for development, but should be changed to Domain
    ## used for the front end application.
    headers["Access-Control-Allow-Origin"] = "*"

    retval = {
        "statusCode": status_code,
        "headers": headers,
        "body": json.dumps(body, cls=DecimalEncoder),
    }

    logger.info("Response: ")
    logger.info(json.dumps(retval))
    return retval


################################################################################

################################################################################
#  Token Handling
################################################################################
def _get_tokens(query_string_params, api_key):
    """This will take in a code (path_params) which was retrieved from the
    auth provider (Fence) and exchange it for access and id tokens using the client
    secret."""

    try:
        code = query_string_params["code"]
    except Exception as e:
        raise AssertionError("'code' is required query string parameter to get-tokens")

    base_url = os.environ.get("auth_oidc_uri", None)
    grant_type = "authorization_code"
    redirect_uri = os.environ.get("auth_redirect_uri", None)
    client_id = os.environ.get("auth_client_id", None)
    client_secret_name = os.environ.get("auth_client_secret_name", None)

    # Grab the client secret value from SecretsManager
    client_secret = get_secret(client_secret_name)

    auth_string = f"{client_id}:{client_secret}".encode("utf-8")
    auth_b64 = base64.b64encode(auth_string).decode("utf-8")

    url = "{}/oauth2/token?grant_type={}&code={}&redirect_uri={}".format(
        base_url, grant_type, code, redirect_uri
    )

    logger.info(f"Requesting tokens: {url}")
    req = Request(url, data={})
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    req.add_header("Authorization", f"Basic {auth_b64}")

    try:
        response = urlopen(req)
    except Exception as e:
        logger.exception(e)
        raise RuntimeError("Error when exchanging code for tokens")

    if response.getcode() != 200:
        logger.info(f"Response Status Code: {response.getcode()}")
        logger.info(f"Response read: {response.read()}")
        raise RuntimeError("Error when exchanging code for tokens")

    content = json.loads(response.read())

    return create_response(status_code=200, body=content)


def _refresh_tokens(body, api_key):
    """This takes a refresh_token in the body and returns a new set of tokens"""

    try:
        refresh_token = body["refresh_token"]
    except Exception as e:
        raise AssertionError(
            "'refresh_token' not found in data provided to refresh tokens calls."
        )

    base_url = os.environ.get("auth_oidc_uri", None)
    grant_type = "refresh_token"
    client_id = os.environ.get("auth_client_id", None)
    client_secret_name = os.environ.get("auth_client_secret_name", None)

    # Grab the client secret value from SecretsManager
    client_secret = get_secret(client_secret_name)

    auth_string = f"{client_id}:{client_secret}".encode("utf-8")
    auth_b64 = base64.b64encode(auth_string).decode("utf-8")

    url = "{}/oauth2/token?grant_type={}&refresh_token={}".format(
        base_url, grant_type, refresh_token
    )
    logger.info(url)
    req = Request(url, data={})
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    req.add_header("Authorization", f"Basic {auth_b64}")

    try:
        response = urlopen(req)
    except Exception as e:
        logger.exception(e)
        raise RuntimeError("Error when exchanging code for tokens")

    if response.getcode() != 200:
        logger.info(f"Response Status Code: {response.getcode()}")
        logger.info(f"Response read: {response.read()}")
        raise RuntimeError("Error when exchanging code for tokens")

    content = json.loads(response.read())

    # We discard the access token here because the application doesn't need it.
    response_data = {
        "id_token": content["id_token"],
        "refresh_token": content["refresh_token"],
    }

    return create_response(status_code=200, body=response_data)


####################### Functions to handle API Method Calls ###################
def _workspaces_post(body, email):
    assert "workspace_type" in body
    workspace_type = body["workspace_type"]

    if workspace_type not in VALID_WORKSPACE_TYPES:
        raise ValueError(f"Invalid workspace_type: {workspace_type}")

    workspace_request_id = str(uuid.uuid4())

    # Generate email address for root account
    email_domain = os.environ.get("email_domain", None)
    if not email_domain:
        raise ValueError("Could not find root account email domain.")

    occ_email_domain = os.environ.get("occ_email_domain", None)
    if not occ_email_domain:
        raise ValueError("Could not find root occ account email domain.")

    if workspace_type == DIRECT_PAY_WORKSPACE_TYPE:
        root_email = f"root_{workspace_request_id}@{occ_email_domain}"
    else:
        root_email = f"root_{workspace_request_id}@{email_domain}"

    item = {}
    if body is not None:
        item = body

    item["workspace_request_id"] = workspace_request_id
    item["user_id"] = email
    item["root_account_email"] = root_email

    # Set some defaults
    item["bmh_workspace_id"] = workspace_request_id
    item["request_status"] = "pending"
    item["user_id"] = email
    # Storing timestamp in integer format because dynamodb does not support datetime type natively.
    # Retrieval: datetime.fromtimestamp(int(item['creation_date']))
    item["creation_date"] = int(datetime.utcnow().timestamp())

    if workspace_type == STRIDES_CREDITS_WORKSPACE_TYPE:
        item["strides-credits"] = decimal.Decimal(DEFAULT_STRIDES_CREDITS_AMOUNT)
    else:
        item["strides-credits"] = decimal.Decimal(0)

    if workspace_type == DIRECT_PAY_WORKSPACE_TYPE:
        item["soft-limit"] = 0
        item["hard-limit"] = 0
    else:
        item["soft-limit"] = decimal.Decimal(DEFAULT_STRIDES_CREDITS_AMOUNT * 0.5)
        item["hard-limit"] = decimal.Decimal(DEFAULT_STRIDES_CREDITS_AMOUNT * 0.9)
    item["total-usage"] = 0

    # Get the dynamodb table name from SSM Parameter Store
    dynamodb_table_name = _get_dynamodb_table_name()
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table(dynamodb_table_name)

    table.put_item(Item=item)

    ## Send request email
    if workspace_type == "STRIDES Credits":
        EmailHelper.send_credits_workspace_request_email(item)
    elif workspace_type == "STRIDES Grant":
        EmailHelper.send_grant_workspace_request_email(item)

    if workspace_type == "Direct Pay":
        return create_response(
            status_code=200,
            body={"message": "success", "workspace_request_id": workspace_request_id},
        )
    else:
        return create_response(status_code=200, body={"message": "success"})


def _workspace_provision(body, path_params):
    """For now, this is a place holder for the actual process
    which will create a workpace. Currently, it performs the following:
        1. Create API Key - used by Workspace accounts to communicate
            back to the portal account.
        2. Create Workspace and Account IDs (randomly generated placeholders).
        3. Create SNS topics and subscribe the user.
        4. Store information in DynamoDB and set some Account
            defaults (soft limit, hard limit, strides credits)
    """
    assert "workspace_id" in path_params
    assert "account_id" in body

    user_services_email = os.environ.get("user_services_email", None)
    if user_services_email is None:
        raise ValueError("Could not find user services email.")

    workspace_id = path_params["workspace_id"]
    account_id = body["account_id"]

    strides_credits_amount = body.get("strides_credits_amount", None)

    # Grab the current status. Don't provision unless
    # the request is pending
    status, email = _get_workspace_request_status_and_email(workspace_id)
    if status not in ["pending", "failed", "error"]:
        raise ValueError("Request must be in pending status to provision")

    apigateway = boto3.client("apigateway")
    resp = apigateway.create_api_key(
        name=f"workspace-{workspace_id}-key",
        description=f"API Key for workspace {workspace_id}",
        enabled=True,
    )
    key_id = resp["id"]
    api_key = resp["value"]

    # Grab the Usage Plan Id
    usage_plan_id = _get_param(os.environ["api_usage_id_param_name"])
    apigateway.create_usage_plan_key(
        usagePlanId=usage_plan_id, keyId=key_id, keyType="API_KEY"
    )

    # Create the SNS topic for communication back to the user.
    # TODO: Make this SNS topic a single SNS topic that notifies the admin
    # instead of a topic per workspace.
    sns = boto3.client("sns")
    response = sns.create_topic(
        Name=f"bmh-workspace-topic-{workspace_id}",
        Tags=[{"Key": "bmh_workspace_id", "Value": workspace_id}],
    )
    topic_arn = response["TopicArn"]

    sns.subscribe(TopicArn=topic_arn, Protocol="email", Endpoint=user_services_email)

    # Adding a subscription to the Lambda function that updates dynamoDB if total-usage is over the hard-limit
    lambda_arn = os.environ.get("total_usage_trigger_lambda_arn")
    if lambda_arn:
        sns.subscribe(TopicArn=topic_arn, Protocol="lambda", Endpoint=lambda_arn)

    # Add permission to the function to allow SNS to invoke it
    lambda_client = boto3.client("lambda")
    statement = {
        "StatementId": f"sns-trigger-{workspace_id}",
        "Action": "lambda:InvokeFunction",
        "Principal": "sns.amazonaws.com",
        "SourceArn": topic_arn,
    }

    # Add SNS permission
    try:
        response = lambda_client.add_permission(
            FunctionName=lambda_arn,
            StatementId=statement["StatementId"],
            Action=statement["Action"],
            Principal=statement["Principal"],
            SourceArn=statement["SourceArn"],
        )
        logger.info("Policy statement added successfully")
        logger.info(response)
    except ClientError as e:
        if e.response["Error"]["Code"] == "ResourceConflictException":
            logger.info("Policy statement already exists")
        else:
            raise e

    # Get the dynamodb table name from SSM Parameter Store
    dynamodb_table_name = _get_dynamodb_table_name()
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table(dynamodb_table_name)

    update_expression = "set #apikey = :apikey, #snstopic = :snstopic, #requeststatus = :requeststatus, #accountid = :accountid, #provisiontime = :provisiontime"
    expression_attribute_values = {
        ":apikey": api_key,
        ":snstopic": topic_arn,
        ":requeststatus": "provisioning",
        ":accountid": account_id,
        ":provisiontime": int(datetime.utcnow().timestamp()),
    }
    expression_attribute_names = {
        "#apikey": "api-key",
        "#snstopic": "sns-topic",
        "#requeststatus": "request_status",
        "#accountid": "account_id",
        "#provisiontime": "provision_time",
    }

    if strides_credits_amount is not None:
        update_expression += ", #stridescredits = :stridescredits"
        expression_attribute_names["#stridescredits"] = "strides-credits"
        expression_attribute_values[":stridescredits"] = (
            decimal.Decimal(strides_credits_amount),
        )

    try:
        table_response = table.update_item(
            Key={"bmh_workspace_id": workspace_id, "user_id": email},
            UpdateExpression=update_expression,
            ConditionExpression="attribute_exists(bmh_workspace_id)",
            ExpressionAttributeValues=expression_attribute_values,
            ExpressionAttributeNames=expression_attribute_names,
            ReturnValues="ALL_NEW",
        )
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            raise Exception("Could not find Workspace " f"with id {workspace_id}")
        else:
            raise e

    _start_sfn_workflow(workspace_id, api_key, account_id)

    return create_response(status_code=200, body={"message": "success"})


def _start_sfn_workflow(workspace_id, api_key, account_id):

    # We'll need to change this to something representing a CTDS email address.
    email = "placeholder@email.com"

    # Much of this is not used as part of the lambda function, but is required to have
    # present in the payload to run without error.
    payload = {
        "ddi_lambda_input": {
            "RequestType": "Create",
            "ResourceProperties": {
                "SkipCloudCheckr": "true",
                "AdminApiKey": "",
                "AccountEmail": email,
                "StackRegion": os.environ.get("AWS_REGION", "us-east-1"),
                "BaselineTemplate": "Accountbaseline-brh.yml",  ## Parameterize
                "AccountBilling": "BRH",
                "CloudTrailBucket": "",
                "SourceBucket": os.environ["account_creation_asset_bucket_name"],
                "CurBucket": "",
                "CCStackName": "",
                "DbrBucket": "",
                "ConfigBucket": "",
                "OrganizationalUnitName": "None",
                "StackName": "avm-baseline-stack",
                "AccountName": f"BRH {workspace_id}",
                "test_account_id": str(account_id),
            },
        },
        "brh_infrastructure": {"workspace_id": workspace_id, "api_key": api_key},
    }

    state_machine_arn = os.environ.get("state_machine_arn")
    execution_uuid = str(uuid.uuid4())
    execution_name = f"create-{workspace_id}_{execution_uuid}"

    sfn = boto3.client("stepfunctions")
    response = sfn.start_execution(
        stateMachineArn=state_machine_arn,
        name=execution_name,
        input=json.dumps(payload),
    )
    logger.info(f"Calling create_account state machine {execution_name}")
    logger.info(f"start_execution response: {response}")

    return response


# GET workspaces
# GET workspaces/{workspace_id}
def _workspaces_get(path_params, email, query_string_params=None):
    """Will return a list of workspaces rows based the email
    of the user"""
    dynamodb_table_name = _get_dynamodb_table_name()
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table(dynamodb_table_name)

    # Use expression attributes because dashes are not
    # allowed.

    projection = ", ".join(
        [
            "#bmhworkspaceid",
            "#nihaward",
            "#requeststatus",
            "#workspacetype",
            "#totalusage",
            "#stridescredits",
            "#softlimit",
            "#hardlimit",
            "#directpaylimit",
        ]
    )

    expression_attribute_names = {
        "#bmhworkspaceid": "bmh_workspace_id",
        "#nihaward": "nih_funded_award_number",
        "#requeststatus": "request_status",
        "#workspacetype": "workspace_type",
        "#totalusage": "total-usage",
        "#stridescredits": "strides-credits",
        "#softlimit": "soft-limit",
        "#hardlimit": "hard-limit",
        "#directpaylimit": "direct_pay_limit",
    }

    status_code = 200
    retval = []

    if path_params is not None and "workspace_id" in path_params:
        if path_params["workspace_id"] == "admin_all":
            response = table.scan()
            retval = response.get("Items", [])
            if len(retval) == 0:
                status_code = 204  # No content, resource was found, but it's empty.
        else:
            # Email is None for requests made by an application using client_credentials.
            if not email:
                if query_string_params and "user" in query_string_params:
                    email = query_string_params["user"]
                else:
                    raise Exception("Required `user` query parameter")
            response = table.get_item(
                Key={"bmh_workspace_id": path_params["workspace_id"], "user_id": email},
                ProjectionExpression=projection,
                ExpressionAttributeNames=expression_attribute_names,
            )
            retval = response.get("Item", None)
            if retval is None:
                status_code = 404

    else:
        response = table.query(
            KeyConditionExpression=Key("user_id").eq(email),
            ProjectionExpression=projection,
            ExpressionAttributeNames=expression_attribute_names,
        )

        retval = response.get("Items", [])
        if len(retval) == 0:
            status_code = 204  # No content, resource was found, but it's empty.

    return create_response(status_code=status_code, body=retval)


def _workspaces_set_limits(body, path_params, user):
    logger.info(f"Called 'set limit': {body}")

    # Validate body and path_params
    assert "workspace_id" in path_params
    assert "soft-limit" in body
    assert "hard-limit" in body

    # User is None for requests made by an application using client_credentials.
    if not user:
        if "user" in body:
            user = body["user"]
        else:
            raise Exception("Required `user` parameter in request body")

    # User is None for requests made by an application using client_credentials.
    if not user:
        if "user" in body:
            user = body["user"]
        else:
            raise Exception("Required `user` parameter in request body")

    # Get the dynamodb table name from SSM Parameter Store
    workspace_id = path_params["workspace_id"]
    dynamodb_table_name = _get_dynamodb_table_name()
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table(dynamodb_table_name)

    soft_limit = round(decimal.Decimal(body["soft-limit"]), 2)
    hard_limit = round(decimal.Decimal(body["hard-limit"]), 2)

    if soft_limit >= hard_limit:
        raise ValueError("Hard limit must be larger than soft limit")

    try:
        table_response = table.update_item(
            Key={"bmh_workspace_id": workspace_id, "user_id": user},
            UpdateExpression="set #hard = :hard, #soft = :soft, #limitupdatetime = :limitupdatetime",
            ConditionExpression="attribute_exists(bmh_workspace_id)",
            ExpressionAttributeValues={
                ":soft": round(decimal.Decimal(body["soft-limit"]), 2),
                ":hard": round(decimal.Decimal(body["hard-limit"]), 2),
                ":limitupdatetime": int(datetime.utcnow().timestamp()),
            },
            ExpressionAttributeNames={
                "#soft": "soft-limit",
                "#hard": "hard-limit",
                "#limitupdatetime": "limit_update_time",
            },
            ReturnValues="ALL_NEW",
        )
        logger.info(f"Table response: {table_response}")
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            raise Exception("Could not find BMH Workspace " f"with id {workspace_id}")
        else:
            raise e

    if not "sns-topic" in table_response["Attributes"]:
        logger.warning(f"SNS topic ARN does not exist yet.")
    else:
        sns_topic_arn = table_response["Attributes"]["sns-topic"]
        total_usage = table_response["Attributes"]["total-usage"]
        workspace_type = table_response["Attributes"]["workspace_type"]
        site_name = _get_site_info()

        subject = f"[{site_name}] Workspace : Soft and Hard limits updated"
        message = f"""There has been an update in the limits for the following user in {site_name}.
        Workspace info:
            User ID : {user}
            Workspace Type: {workspace_type}
            workspace_id: {workspace_id}
            Total Usage: {total_usage}
            Soft Usage Limit: {soft_limit}
            Hard Usage Limit: {hard_limit}

        """
        attributes = {
            "workspace_id": {"DataType": "String", "StringValue": workspace_id},
            "user_id": {"DataType": "String", "StringValue": user},
            "total_usage": {
                "DataType": "String",
                "StringValue": str(total_usage),
            },
            "hard_limit": {"DataType": "String", "StringValue": str(hard_limit)},
        }
        #  TODO: Publish to admin email instead of per user
        try:
            _publish_to_sns_topic(sns_topic_arn, subject, message, attributes)
        except ClientError as e:
            logger.error(f"SNS topic ARN exists but publishing SNS topic failed.")
            logger.error(e)

    return create_response(status_code=200, body=table_response["Attributes"])


def _workspaces_set_total_usage(body, path_params, api_key):
    """This function handles calls to update total-usage of a workspace.
    This is expected to be called by a Gen3 Workspace Account and is not authenticated
    like the rest of the methods."""

    # Validate inputs
    assert "workspace_id" in path_params
    assert "total-usage" in body
    assert api_key is not None

    # Where is the API Key? We should validate that
    dynamodb_table_name = _get_dynamodb_table_name()
    dynamodb_index_name = _get_dynamodb_index_name()
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table(dynamodb_table_name)
    total_usage = body["total-usage"]

    # Query the Global Secondary Index to get the User.
    try:
        index_response = table.query(
            IndexName=dynamodb_index_name,
            KeyConditionExpression=Key("bmh_workspace_id").eq(
                path_params["workspace_id"]
            ),
            ReturnConsumedCapacity="NONE",
        )
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            return create_response(
                status_code=400,
                body={"message": f"Could not find Workspace with id {workspace_id}"},
            )
        else:
            raise e

    ## TODO: Confirm that the API key matches the Workspace ID

    # And now update the row.
    items = index_response.get("Items", [])
    assert len(items) == 1
    workspace_id = items[0]["bmh_workspace_id"]
    user_id = items[0]["user_id"]
    formatted_total_usage = round(decimal.Decimal(total_usage), 2)

    try:
        table_response = table.update_item(
            Key={"bmh_workspace_id": workspace_id, "user_id": user_id},
            UpdateExpression="set #totalUsage = :totalUsage, #usageupdatetime = :usageupdatetime",
            ConditionExpression="attribute_exists(bmh_workspace_id)",
            ExpressionAttributeValues={
                ":totalUsage": formatted_total_usage,
                ":usageupdatetime": int(datetime.utcnow().timestamp()),
            },
            ExpressionAttributeNames={
                "#totalUsage": "total-usage",
                "#usageupdatetime": "usage_update_time",
            },
            ReturnValues="ALL_OLD",
        )
        logger.info(f"Table response: {json.dumps(table_response, cls=DecimalEncoder)}")
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            raise Exception("Could not find Workspace " f"with id {workspace_id}")
        else:
            raise e

    old_total_usage = table_response["Attributes"]["total-usage"]
    soft_limit = table_response["Attributes"]["soft-limit"]
    hard_limit = table_response["Attributes"]["hard-limit"]
    workspace_type = table_response["Attributes"]["workspace_type"]
    site_name = _get_site_info()

    sns_topic_arn = table_response["Attributes"]["sns-topic"]
    message = "Success"
    if old_total_usage < hard_limit <= formatted_total_usage:
        logger.info(
            f"Surpassed the hard limit: {old_total_usage=} {formatted_total_usage=} {hard_limit=}"
        )

        subject = f"[{site_name}] Workspace : Total usage exceeds Hard limit"
        message = f"""Total usage exceeds the set Hard limit for the following user in {site_name}.
            Workspace info:
            User ID : {user_id}
            Workspace Type: {workspace_type}
            workspace_id: {workspace_id}
            Total Usage: {total_usage}
            Soft Usage Limit: {soft_limit}
            Hard Usage Limit: {hard_limit}

            User services, please use this email template : https://docs.google.com/document/d/1BAkRsYlcJLyzGueVMEZ8xGiJgMd_yAzK6t5mmsiOW7E/edit?pli=1#heading=h.f36t295d0h33
        """
        attributes = {
            "workspace_id": {"DataType": "String", "StringValue": workspace_id},
            "user_id": {"DataType": "String", "StringValue": user_id},
            "total_usage": {
                "DataType": "String",
                "StringValue": str(formatted_total_usage),
            },
            "hard_limit": {"DataType": "String", "StringValue": str(hard_limit)},
        }
        #  TODO: Publish to admin email instead of per user
        _publish_to_sns_topic(sns_topic_arn, subject, message, attributes)

    elif old_total_usage < soft_limit <= formatted_total_usage:
        logger.info(
            f"Surpassed the soft limit: {old_total_usage=} {formatted_total_usage=} {soft_limit=}"
        )

        subject = f"[{site_name}] Workspace : Total usage exceeds Soft limit"
        message = f"""Total usage exceeds the set Soft limit for the following user in {site_name}.
            Workspace info:
            User ID : {user_id}
            Workspace Type: {workspace_type}
            workspace_id: {workspace_id}
            Total Usage: {total_usage}
            Soft Usage Limit: {soft_limit}
            Hard Usage Limit: {hard_limit}

            User services, please use this email template : https://docs.google.com/document/d/1BAkRsYlcJLyzGueVMEZ8xGiJgMd_yAzK6t5mmsiOW7E/edit?pli=1#heading=h.2c3nxovihdgc

        """
        #  TODO: Publish to admin email instead of per user
        _publish_to_sns_topic(sns_topic_arn, subject, message)

    return create_response(status_code=200, body={})


def _workspace_direct_pay_limit(body, path_params, user):
    logger.info(f"Called 'set limit': {body}")

    # Validate body and path_params
    assert "workspace_id" in path_params
    assert "direct_pay_limit" in body

    # User is None for requests made by an application using client_credentials.
    if not user:
        if "user" in body:
            user = body["user"]
        else:
            raise Exception("Required `user` parameter in request body")

    # Get the dynamodb table name from SSM Parameter Store
    workspace_id = path_params["workspace_id"]
    dynamodb_table_name = _get_dynamodb_table_name()
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table(dynamodb_table_name)
    projection = ", ".join(
        [
            "#bmhworkspaceid",
            "#requeststatus",
            "#workspacetype",
            "#totalusage",
            "#softlimit",
            "#hardlimit",
            "#directpaylimit",
        ]
    )

    expression_attribute_names = {
        "#bmhworkspaceid": "bmh_workspace_id",
        "#requeststatus": "request_status",
        "#workspacetype": "workspace_type",
        "#totalusage": "total-usage",
        "#softlimit": "soft-limit",
        "#hardlimit": "hard-limit",
        "#directpaylimit": "direct_pay_limit",
    }

    try:
        direct_pay_limit = round(decimal.Decimal(body["direct_pay_limit"]), 2)
    except Exception as e:
        raise ValueError(
            "Direct pay limit must be a number, issue in converting direct_pay_limit from UI. Error: "
            + str(e)
        )

    if direct_pay_limit < 0:
        raise ValueError("Direct pay limit must be a positive number")

    try:
        response = table.get_item(
            Key={"bmh_workspace_id": workspace_id, "user_id": user},
            ProjectionExpression=projection,
            ExpressionAttributeNames=expression_attribute_names,
        )
        retval = response.get("Item", None)
    except Exception as e:
        raise ValueError(
            "Could not find record with existing workspace_id and user. Error:" + str(e)
        )

    if (
        direct_pay_limit < retval["hard-limit"]
        or direct_pay_limit < retval["soft-limit"]
    ):
        raise ValueError(
            "The new direct pay amount is less than the soft limit or hard limit"
        )
    elif direct_pay_limit < retval["direct_pay_limit"]:
        raise ValueError(
            "The new direct pay amount is less than the old direct pay amount"
        )

    try:
        table_response = table.update_item(
            Key={"bmh_workspace_id": workspace_id, "user_id": user},
            UpdateExpression="set #direct = :direct",
            ConditionExpression="attribute_exists(bmh_workspace_id)",
            ExpressionAttributeValues={":direct": direct_pay_limit},
            ExpressionAttributeNames={"#direct": "direct_pay_limit"},
            ReturnValues="ALL_NEW",
        )
        logger.info(f"Table response: {table_response}")
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            raise Exception("Could not find BMH Workspace " f"with id {workspace_id}")
        else:
            raise e

    return create_response(status_code=200, body=table_response["Attributes"])


################################################################################


################################ Helper Methods ################################
def _get_workspace_request_status_and_email(workspace_request_id):
    # Get the dynamodb table name from SSM Parameter Store
    dynamodb_table_name = _get_dynamodb_table_name()
    dynamodb_index_name = _get_dynamodb_index_name()
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table(dynamodb_table_name)

    retval = None
    try:
        response = table.query(
            IndexName=dynamodb_index_name,
            KeyConditionExpression=Key("bmh_workspace_id").eq(workspace_request_id),
            ReturnConsumedCapacity="NONE",
        )
    except Exception as e:
        raise e

    items = response.get("Items", [])
    assert len(items) == 1
    # TODO:
    # This (poc_email) is the right way, but need more testing
    # Need to add to dyanmodb INDEX?
    # Needed for RAS integration.
    # email = items[0]['poc_email']
    email = items[0]["user_id"]

    try:
        response = table.get_item(
            Key={"bmh_workspace_id": workspace_request_id, "user_id": email},
            ProjectionExpression="request_status",
        )
    except Exception as e:
        raise ValueError()

    return response["Item"]["request_status"], email


#  TODO: Publish to admin email instead of per user
#  TODO: Create this admin SNS topic via CDK so we only subscribe to a single topic per environment.
def _publish_to_sns_topic(topic_arn, subject, message, attributes={}):
    sns = boto3.client("sns")
    sns.publish(
        TopicArn=topic_arn,
        Subject=subject,
        Message=message,
        MessageAttributes=attributes,
    )


def _get_dynamodb_index_name():
    return _get_param(os.environ["dynamodb_index_param_name"])


def _get_dynamodb_table_name():
    return _get_param(os.environ["dynamodb_table_param_name"])


def _get_param(param_name):
    ssm = boto3.client("ssm")
    param_info = ssm.get_parameter(Name=param_name)
    return param_info["Parameter"]["Value"]


def _get_site_info():
    email_domain = os.environ["email_domain"]
    site_info = {
        "planx-pla.net": "QA-BRH",
        "brh-portal.org": "BRH",
        "healportal.org": "HEAL",
    }
    return site_info.get(email_domain, None)


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


def get_secret(secret_name):
    # secret_name = "/brh/fence_client_secret"

    # Create a Secrets Manager client
    session = boto3.session.Session()
    client = session.client(service_name="secretsmanager")

    # In this sample we only handle the specific exceptions for the 'GetSecretValue' API.
    # See https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
    # We rethrow the exception by default.
    secret = None

    try:
        get_secret_value_response = client.get_secret_value(SecretId=secret_name)
    except ClientError as e:
        if e.response["Error"]["Code"] == "DecryptionFailureException":
            # Secrets Manager can't decrypt the protected secret text using the provided KMS key.
            # Deal with the exception here, and/or rethrow at your discretion.
            raise e
        elif e.response["Error"]["Code"] == "InternalServiceErrorException":
            # An error occurred on the server side.
            # Deal with the exception here, and/or rethrow at your discretion.
            raise e
        elif e.response["Error"]["Code"] == "InvalidParameterException":
            # You provided an invalid value for a parameter.
            # Deal with the exception here, and/or rethrow at your discretion.
            raise e
        elif e.response["Error"]["Code"] == "InvalidRequestException":
            # You provided a parameter value that is not valid for the current state of the resource.
            # Deal with the exception here, and/or rethrow at your discretion.
            raise e
        elif e.response["Error"]["Code"] == "ResourceNotFoundException":
            # We can't find the resource that you asked for.
            # Deal with the exception here, and/or rethrow at your discretion.
            raise e
        else:
            raise e
    else:
        secret = get_secret_value_response["SecretString"]

    # Actually returned as a json string. So just get the value.
    data = json.loads(secret)
    return data["fence_client_secret"]


################################################################################
