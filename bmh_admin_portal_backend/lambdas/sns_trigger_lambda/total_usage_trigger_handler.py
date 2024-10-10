import os
import json
import boto3


import logging

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(message)s")
logger.setLevel(logging.INFO)

OVER_THE_LIMIT_STATUS = "above limit"
ACTIVE_STATUS = "active"


def handler(event, context):
    logger.info(json.dumps(event))
    records = event["Records"]

    dynamodb = boto3.resource("dynamodb")
    dynamodb_table_name = _get_dynamodb_table_name()
    table = dynamodb.Table(dynamodb_table_name)

    for record in records:
        attributes = record["Sns"]["MessageAttributes"]
        if not attributes:
            continue

        logger.info(f"{attributes=}")
        workspace_id = attributes["workspace_id"]["Value"]
        user_id = attributes["user_id"]["Value"]
        total_usage = attributes["total_usage"]["Value"]
        hard_limit = attributes["hard_limit"]["Value"]
        update_status = (
            OVER_THE_LIMIT_STATUS
            if float(total_usage) > float(hard_limit)
            else ACTIVE_STATUS
        )
        try:
            table_response = table.update_item(
                Key={"bmh_workspace_id": workspace_id, "user_id": user_id},
                UpdateExpression="set #req_stat = :status",
                ConditionExpression="attribute_exists(bmh_workspace_id)",
                ExpressionAttributeValues={
                    ":status": update_status,
                },
                ExpressionAttributeNames={"#req_stat": "request_status"},
                ReturnValues="ALL_NEW",
            )
            logger.info(f"Table response: {table_response}")
        except Exception as e:
            raise e


################################ Helper Methods ################################
def _get_dynamodb_table_name():
    return _get_param(os.environ["dynamodb_table_param_name"])


def _get_param(param_name):
    ssm = boto3.client("ssm")
    param_info = ssm.get_parameter(Name=param_name)
    return param_info["Parameter"]["Value"]
