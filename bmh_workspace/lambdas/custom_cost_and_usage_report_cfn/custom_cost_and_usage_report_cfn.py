# © 2021 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.
#
# This AWS Content is provided subject to the terms of the AWS Customer Agreement
# available at http://aws.amazon.com/agreement or other written agreement between
# Customer and either Amazon Web Services, Inc. or Amazon Web Services EMEA SARL or both.

import logging
import json
import urllib3
import hashlib

import boto3

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(message)s")
logger.setLevel(logging.INFO)


def handler(event, context):

    logger.info(event)

    try:
        report_definition = _parse_resource_properties(event["ResourceProperties"])
        logger.info(f"Sending report_definition: {report_definition}")
    except Exception as e:
        logger.exception(e)
        _respond_failed(event, context, {"error": str(e)})

    client = boto3.client("cur")

    response = None

    if event["RequestType"] == "Create":
        logger.info("Creating resource")
        try:
            response = _create_cur(event, context, client, report_definition)
        except Exception as e:
            logger.exception(e)
            _respond_failed(event, context, {"error": str(e)})
            raise e

    elif event["RequestType"] == "Update":
        logger.info("Updating resource")
        try:
            response = _update_cur(event, context, client, report_definition)
        except Exception as e:
            logger.exception(e)
            _respond_failed(event, context, {"error": str(e)})
            raise e

    elif event["RequestType"] == "Delete":
        logger.info("Deleting resource")
        try:
            response = _delete_cur(event, context, client, report_definition)
        except Exception as e:
            logger.exception(e)
            _respond_failed(event, context, {"error": str(e)})
            raise e

    else:
        message = f"Invalid RequestType {event['RequestType']}"
        logger.error(message)
        _respond_failed(event, context, {"error": message})
        raise ValueError(message)

    logger.info(f"Response: {response}")
    logger.info(f"Responding success!")
    _respond_success(event, context, {})


def _create_cur(event, context, client, report_definition):
    logger.info(f"Creating Report: {report_definition['ReportName']}")
    logger.info(f"Report Definition: {json.dumps(report_definition)}")
    response = client.put_report_definition(ReportDefinition=report_definition)
    logger.info(f"Finished Creating Report: {report_definition['ReportName']}")
    return response


def _update_cur(event, context, client, report_definition):
    logger.info(f"Updating Report: {report_definition['ReportName']}")
    response = client.modify_report_definition(
        ReportName=report_definition["ReportName"], ReportDefinition=report_definition
    )
    logger.info(f"Finished Updating Report: {report_definition['ReportName']}")
    return response


def _delete_cur(event, context, client, report_definition):
    logger.info(f"Deleting Report: {report_definition['ReportName']}")
    response = client.delete_report_definition(
        ReportName=report_definition["ReportName"]
    )
    logger.info(f"Finished Deleting Report: {report_definition['ReportName']}")
    return response


def _respond_success(event, context, data):
    send(event, context, "SUCCESS", data)


def _respond_failed(event, context, data):
    send(event, context, "FAILED", data)


def _parse_resource_properties(input_data):
    req = [
        "ReportName",
        "Format",
        "Compression",
        "S3Bucket",
        "S3Prefix",
        "S3Region",
        "ReportVersioning",
        "TimeUnit",
    ]

    retval = {"AdditionalSchemaElements": []}
    for i in req:
        if i in input_data:
            retval[i] = input_data[i]

    # I'm not checking for the other required parameters.
    # This should raise an exception when the SDK CUR API calls fail
    # AWS Validation.
    assert "ReportName" in retval

    return retval


############ Included cfnresponse module
### https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/cfn-lambda-function-code-cfnresponsemodule.html
def send(
    event,
    context,
    responseStatus,
    responseData,
    physicalResourceId=None,
    noEcho=False,
    reason=None,
):
    http = urllib3.PoolManager()

    responseUrl = event["ResponseURL"]

    responseBody = {
        "Status": responseStatus,
        "Reason": reason
        or "See the details in CloudWatch Log Stream: {}".format(
            context.log_stream_name
        ),
        "PhysicalResourceId": physicalResourceId or context.log_stream_name,
        "StackId": event["StackId"],
        "RequestId": event["RequestId"],
        "LogicalResourceId": event["LogicalResourceId"],
        "NoEcho": noEcho,
        "Data": responseData,
    }

    json_responseBody = json.dumps(responseBody)

    headers = {"content-type": "", "content-length": str(len(json_responseBody))}

    try:
        response = http.request(
            "PUT", responseUrl, headers=headers, body=json_responseBody
        )
        print("Status code:", response.status)

    except Exception as e:

        print("send(..) failed executing http.request(..):", e)
