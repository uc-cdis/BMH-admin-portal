"""
Conf Test for Portal Backend test suite
"""

import importlib
import json
from collections import defaultdict
import pytest
import os
from unittest import mock
from unittest.mock import MagicMock, patch

import boto3
from moto import mock_dynamodb


@pytest.fixture(autouse=True, scope="session")
def setup_env_vars():
    with mock.patch.dict(
        os.environ,
        {
            "dynamodb_table_param_name": "testTable",
            "AWS_DEFAULT_REGION": "us-east-1",
            "dynamodb_index_param_name": "testIndex",
            "email_domain": "uchicago.edu",
            "strides_credits_request_email": "occ_test@uchicago.edu",
            "state_machine_arn": "testArn",
            "account_creation_asset_bucket_name": "testBucket",
            "api_usage_id_param_name": "testUsageId",
            "total_usage_trigger_lambda_arn": "testTotalUsageArn",
        },
    ):
        yield


@pytest.fixture()
def dynamodb_table():

    with mock_dynamodb():
        dynamodb = boto3.resource("dynamodb")
        table = dynamodb.create_table(
            TableName="testTable",
            GlobalSecondaryIndexes=[
                {
                    "IndexName": "testIndex",
                    "KeySchema": [
                        {"AttributeName": "bmh_workspace_id", "KeyType": "HASH"}
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 1,
                        "WriteCapacityUnits": 1,
                    },
                }
            ],
            KeySchema=[
                {"AttributeName": "user_id", "KeyType": "HASH"},
                {"AttributeName": "bmh_workspace_id", "KeyType": "RANGE"},
            ],
            AttributeDefinitions=[
                {"AttributeName": "user_id", "AttributeType": "S"},
                {"AttributeName": "bmh_workspace_id", "AttributeType": "S"},
            ],
            ProvisionedThroughput={"ReadCapacityUnits": 10, "WriteCapacityUnits": 10},
        )
        yield table
