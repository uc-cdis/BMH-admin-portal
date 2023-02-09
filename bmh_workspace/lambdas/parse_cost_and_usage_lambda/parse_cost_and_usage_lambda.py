# © 2021 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.
#
# This AWS Content is provided subject to the terms of the AWS Customer Agreement
# available at http://aws.amazon.com/agreement or other written agreement between
# Customer and either Amazon Web Services, Inc. or Amazon Web Services EMEA SARL or both.

import boto3
import os
import logging
import json
import urllib.request

import awswrangler as wr
import pandas as pd

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

COST_COL = "line_item_unblended_cost"
START_DATE_COL = "bill_billing_period_start_date"
END_DATE_COL = "bill_billing_period_end_date"

OUTPUT_SUMMARY_PREFIX = "parsed_reports"


def handler(event, context):
    """This lambda function is meant to handle any change to the Cost and Usage Parquet Reports.
    It should be triggered from an S3 object creation event on files with the suffix 'parquet'.
    These files are automatically written by AWS Cost and Usage reports and will create individual files
    for each month of cost. The function has the following 2 responsibilities:
        1. Parse all the parquet files under the prefix to get total usage/cost.
        2. Update the BMH Portal with this total (via the BMH Portal API)
    """
    logger.info(event)

    reports_prefix = os.environ["cur_prefix"]
    reports_name = os.environ["cur_report_name"]
    bucket_name = os.environ["cur_bucket_name"]

    # Parse all the parquet files at this path
    path = "/".join(["s3:/", bucket_name, reports_prefix, reports_name, reports_name])
    df = wr.s3.read_parquet(path=path, dataset=True)

    # This will get the cost per month, but we just need the total of all months
    # sum_df = df.groupby(['year','month']).agg({COST_COL: 'sum'})
    total = df[COST_COL].sum()
    logger.info(f"Total Cost: {total}")

    update_portal(total)


def update_portal(total):
    """Will send an https request to the update total usage endopint
    of the BMH Portal API"""
    base_uri = _get_ssm_param(os.environ["brh_portal_uri"])
    workspace_id = _get_ssm_param(os.environ["workspace_id"])
    api_key = _get_ssm_param(os.environ["api_key"])

    headers = {"Content-Type": "application/json; charset=utf-8", "x-api-key": api_key}
    uri = "/".join([base_uri, "workspaces", workspace_id, "total-usage"])
    str_data = json.dumps({"total-usage": round(total, 2)})

    logger.info(f"PUT {uri} [{str_data}]")

    byte_data = str_data.encode("utf-8")
    req = urllib.request.Request(uri, data=byte_data, headers=headers, method="PUT")

    # This should throw an exception on most errors
    resp = urllib.request.urlopen(req)

    if resp.status != 200:
        raise Exception(
            f"Error setting total-usage [{workspace_id=}, Status Code: {resp.status}]"
        )


def _get_ssm_param(param_name):
    ssm = boto3.client("ssm")
    param_info = ssm.get_parameter(Name=param_name)
    return param_info["Parameter"]["Value"]
