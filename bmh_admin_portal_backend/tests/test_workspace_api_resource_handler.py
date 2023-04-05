from unittest import mock
from unittest.mock import patch, MagicMock, ANY
import pytest
import uuid
import decimal
import json
import os
import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
from boto3.dynamodb import table
from lambdas.workspaces_api_resource import workspaces_api_resource_handler
from moto import mock_apigateway, mock_sns, mock_lambda, mock_iam

api_key = "testKey"
test_email_1 = "test1@uchicago.com"
test_email_2 = "test2@uchicago.com"
# Mock Dynamodb query parameters
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
}


def test_get_tokens():
    # TODO:

    # Mock the urlopen method to return a preset value based on the input
    # Mock the environment variables auth_oidc_uri, auth_redirect_uri, auth_client_id, auth_client_secret_name
    #  with some dummy values.
    # Mock the get_secret method to return a certain value for the give client_secret_name

    # Success scenario#
    # Call the _get_tokens method with valid data as input.

    # Verify urlopen method is called with a Request object as its param
    # Verify the request.full_url is matching with the hardcoded url
    # Verify the headers Content-type and Authorization are present and their values are as expected

    # Allow the urlopen method to throw an exception
    # Verify that RuntimeError

    # Mock the response.getcode method to return a non 200 response
    # Verify RuntimeError is thrown
    assert True


def test_refresh_tokens():
    # TODO:

    # Same mock tests as the previous test, except with a different key in the first argument.
    assert True


def test_workspaces_post(dynamodb_table):

    # Failure responses#
    # Send an Invalid Workspace type and verify ValueError is being thrown
    json = {"workspace_type": "fake type"}
    with pytest.raises(ValueError):
        workspaces_api_resource_handler._workspaces_post(json, test_email_1)

    # Remove email_domain from OS settings and verify ValueError is being thrown
    json = {"workspace_type": "STRIDES Credits"}
    os.environ.pop("email_domain")
    with pytest.raises(ValueError):
        workspaces_api_resource_handler._workspaces_post(json, test_email_1)

    # Verify a success response is returned from the function and workspace request is saved in database
    os.environ["email_domain"] = "uchicago.edu"
    with patch(
        "lambdas.workspaces_api_resource.workspaces_api_resource_handler.EmailHelper"
    ) as mock_email_client:
        with patch.object(
            workspaces_api_resource_handler, "_get_dynamodb_table_name"
        ) as mock_get_table_name:
            mock_get_table_name.return_value = "testTable"
            # Post Function returns success status
            assert (
                workspaces_api_resource_handler._workspaces_post(
                    email=test_email_1, body=json
                )["statusCode"]
                == 200
            )
            # Correct Email Function Called
            mock_email_client.send_credits_workspace_request_email.assert_called()

            # Query the table for item by email
            response = dynamodb_table.query(
                KeyConditionExpression=Key("user_id").eq(test_email_1),
                ProjectionExpression=projection,
                ExpressionAttributeNames=expression_attribute_names,
            )
            retval = response.get("Items", [])
            assert (
                len(retval) == 1
                and retval[0]["workspace_type"] == "STRIDES Credits"
                and retval[0]["request_status"] == "pending"
            )

            # Test grant type workspace request
            json = {"workspace_type": "STRIDES Grant"}
            assert (
                workspaces_api_resource_handler._workspaces_post(
                    email=test_email_2, body=json
                )["statusCode"]
                == 200
            )

            # read the data from Table
            response = dynamodb_table.query(
                KeyConditionExpression=Key("user_id").eq(test_email_2),
                ProjectionExpression=projection,
                ExpressionAttributeNames=expression_attribute_names,
            )
            retval = response.get("Items", [])
            assert (
                len(retval) == 1
                and retval[0]["workspace_type"] == "STRIDES Grant"
                and retval[0]["request_status"] == "pending"
            )

            mock_email_client.send_grant_workspace_request_email.assert_called()


def test_workspace_provision(dynamodb_table):

    # Mock the Dynamodb table with an exiting workspace records
    id1 = str(uuid.uuid4())
    item1 = {
        "workspace_request_id": id1,
        "user_id": test_email_1,
        "root_account_email": "ctds@uchicago.edu",
        "bmh_workspace_id": id1,
        "request_status": "pending",
        "strides-credits": decimal.Decimal("0"),
        "soft-limit": decimal.Decimal("0"),
        "hard-limit": decimal.Decimal("0"),
        "total-usage": 0,
    }

    dynamodb_table.put_item(Item=item1)

    # Success Response#
    with mock.patch.object(
        workspaces_api_resource_handler, "_get_dynamodb_table_name"
    ) as mock_get_table_name:
        with mock.patch.object(
            workspaces_api_resource_handler, "_get_dynamodb_index_name"
        ) as mock_get_index_name:
            with mock.patch.object(
                workspaces_api_resource_handler, "_start_sfn_workflow"
            ) as mock_start_workflow:
                with mock.patch.object(
                    workspaces_api_resource_handler, "_get_param"
                ) as mock_get_param:
                    with mock_apigateway():
                        with mock_sns():
                            # Todo: Ensure apigateway's create_api_key and create_usage_plan_key is called with appropriate params
                            # Ensure sns's create_topic is called with suitable params and return a mock 'TopicArn' in response
                            mock_get_table_name.return_value = "testTable"
                            mock_get_index_name.return_value = "testIndex"
                            mock_get_param.return_value = "testUsageId"
                            # Success Response#
                            body = {"account_id": "testAccount"}
                            path_params = {"workspace_id": id1}
                            # Verify a success response is returned from the function
                            resp = workspaces_api_resource_handler._workspace_provision(
                                body, path_params
                            )
                            assert resp["statusCode"] == 200
                            # Mock the _start_sfn_workflow to do nothing and ensure it is called once.
                            mock_start_workflow.assert_called_once()

    # Query the table for item by email
    response = dynamodb_table.query(
        KeyConditionExpression=Key("user_id").eq(test_email_1),
        ProjectionExpression=projection,
        ExpressionAttributeNames=expression_attribute_names,
    )
    retval = response.get("Items", [])
    assert len(retval) == 1 and retval[0]["request_status"] == "provisioning"


def test_workspace_provision_failures():
    with mock.patch.object(
        workspaces_api_resource_handler, "_get_dynamodb_table_name"
    ) as mock_get_table_name:
        with mock.patch.object(
            workspaces_api_resource_handler, "_get_dynamodb_index_name"
        ) as mock_get_index_name:
            mock_get_table_name.return_value = "testTable"
            mock_get_index_name.return_value = "testIndex"

            # Failure responses#
            # Send path_params without workspace_id -- verify for AssertionError
            body = {"account_id": "testAccount"}
            path_params = {}
            with pytest.raises(AssertionError):
                workspaces_api_resource_handler._workspace_provision(body, path_params)

            # Send body without account_id -- verify for AssertionError
            body = {}
            path_params = {"workspace_id": "testId"}
            with pytest.raises(AssertionError):
                workspaces_api_resource_handler._workspace_provision(body, path_params)

            # Mock `_get_workspace_request_status_and_email` method to return a value which is not 'pending','failed','error'
            #   verify for a ValueError
            with mock.patch.object(
                workspaces_api_resource_handler,
                "_get_workspace_request_status_and_email",
            ) as mock_get_request_status:
                mock_get_request_status.return_value = "provisioning", "dummy@gmail.com"
                body = {"account_id": "testAccount"}
                path_params = {"workspace_id": "testId"}
                with pytest.raises(ValueError):
                    workspaces_api_resource_handler._workspace_provision(
                        body, path_params
                    )

            # Mock table.update_item to throw an exception and verify the caught exception
            with mock.patch.object(
                workspaces_api_resource_handler,
                "_get_workspace_request_status_and_email",
            ) as mock_get_request_status:
                with mock.patch.object(
                    workspaces_api_resource_handler, "_get_param"
                ) as mock_get_param:
                    with mock_apigateway():
                        with mock_sns():
                            mock_get_request_status.return_value = (
                                "pending",
                                "dummy@gmail.com",
                            )
                            mock_get_param.return_value = "testUsageId"
                            body = {"account_id": "testAccount"}
                            path_params = {"workspace_id": "testId"}
                            with pytest.raises(ClientError):
                                workspaces_api_resource_handler._workspace_provision(
                                    body, path_params
                                )


def test_start_sfn_workflow():
    workspace_id = "testId"
    api_key = "testApiKey"
    account_id = "testAccountId"
    # Mock Boto3 Client Api Call
    def mock_make_api_call(self, operation_name, kwarg):
        retval = {"operation_name": operation_name, "statusCode": "200"}
        return retval

    with patch("botocore.client.BaseClient._make_api_call", new=mock_make_api_call):
        # Success Response#
        resp = workspaces_api_resource_handler._start_sfn_workflow(
            workspace_id, api_key, account_id
        )
        assert (
            resp["statusCode"] == "200" and resp["operation_name"] == "StartExecution"
        )


def test_workspaces_get(dynamodb_table):

    # No data in database, not found
    with mock.patch.object(
        workspaces_api_resource_handler, "_get_dynamodb_table_name"
    ) as mock_get_table_name:
        mock_get_table_name.return_value = "testTable"
        assert (
            workspaces_api_resource_handler._workspaces_get(None, "test@uchicago.com")[
                "statusCode"
            ]
            == 204
        )

        # Mock the Dynamodb table with a few records with a dummy email address and
        #    a few other records with a different emails

        id1 = str(uuid.uuid4())
        item1 = {
            "workspace_request_id": id1,
            "user_id": test_email_1,
            "root_account_email": "ctds@uchicago.edu",
            "bmh_workspace_id": id1,
            "request_status": "pending",
            "strides-credits": decimal.Decimal("1000"),
            "soft-limit": decimal.Decimal("500"),
            "hard-limit": decimal.Decimal("9000"),
            "total-usage": 0,
        }
        id2 = str(uuid.uuid4())
        item2 = item1.copy()
        item2["user_id"] = test_email_2
        item2["workspace_request_id"] = item2["bmh_workspace_id"] = id2

        dynamodb_table.put_item(Item=item1)
        dynamodb_table.put_item(Item=item2)

        # Scenario 1
        # Send `path_params` as None and the preset dummy email address
        # Verify the return table has all the records of the presented dummy email address
        resp = workspaces_api_resource_handler._workspaces_get(None, email=test_email_1)
        assert resp["statusCode"] == 200 and len(json.loads(resp["body"])) == 1

        # Scenario 2
        # Send `path_params` with `workspace_id` as admin_all
        # Verify the return table has all the records of the table
        param = {"workspace_id": "admin_all"}
        resp = workspaces_api_resource_handler._workspaces_get(param, None)
        assert resp["statusCode"] == 200 and len(json.loads(resp["body"])) == 2

        # Scenario 3
        # Send `path_params` with `workspace_id` as one of the workspace_id of one of the rows
        # Verify the return table has the record with the given `workspace_id` of the table
        param = {"workspace_id": id2}
        resp = workspaces_api_resource_handler._workspaces_get(param, test_email_2)
        assert (
            resp["statusCode"] == 200
            and json.loads(resp["body"])["bmh_workspace_id"] == id2
        )


def test_workspaces_set_limits(dynamodb_table):

    with mock.patch.object(
        workspaces_api_resource_handler, "_get_dynamodb_table_name"
    ) as mock_get_table_name:
        mock_get_table_name.return_value = "testTable"

        # Mock the Dynamodb table with an exiting workspace records
        id1 = str(uuid.uuid4())
        item1 = {
            "workspace_request_id": id1,
            "user_id": test_email_1,
            "root_account_email": "ctds@uchicago.edu",
            "bmh_workspace_id": id1,
            "request_status": "pending",
            "strides-credits": decimal.Decimal("0"),
            "soft-limit": decimal.Decimal("0"),
            "hard-limit": decimal.Decimal("0"),
            "total-usage": 0,
        }

        dynamodb_table.put_item(Item=item1)

        # Failure responses#
        # Send path_params without workspace_id -- verify for AssertionError
        body = {"soft-limit": "160", "hard-limit": "200"}
        path_params = {}
        with pytest.raises(AssertionError):
            workspaces_api_resource_handler._workspaces_set_limits(
                body, path_params, test_email_1
            )

        # Send body without soft-limit (also hard-limit) -- verify for AssertionError
        body = {}
        path_params = {"workspace_id": id1}
        with pytest.raises(AssertionError):
            workspaces_api_resource_handler._workspaces_set_limits(
                body, path_params, test_email_1
            )

        # Send body without soft-limit >= hard-limit -- verify for ValueError
        body = {"soft-limit": "200", "hard-limit": "160"}
        path_params = {"workspace_id": id1}
        with pytest.raises(ValueError):
            workspaces_api_resource_handler._workspaces_set_limits(
                body, path_params, test_email_1
            )

        # Success Response
        body = {"soft-limit": "160", "hard-limit": "200"}
        path_params = {"workspace_id": id1}
        resp = workspaces_api_resource_handler._workspaces_set_limits(
            body, path_params, test_email_1
        )
        assert resp["statusCode"] == 200

        # Query the table for item by email
        response = dynamodb_table.query(
            KeyConditionExpression=Key("user_id").eq(test_email_1),
            ProjectionExpression=projection,
            ExpressionAttributeNames=expression_attribute_names,
        )
        retval = response.get("Items", [])
        assert (
            len(retval) == 1
            and retval[0]["soft-limit"] == 160.0
            and retval[0]["hard-limit"] == 200.0
        )


def test_workspaces_set_limits_db_error():
    # Test for function to catch exception from db resource error
    with mock.patch.object(
        workspaces_api_resource_handler, "_get_dynamodb_table_name"
    ) as mock_get_table_name:
        mock_get_table_name.return_value = "testTable"
        with pytest.raises(Exception):
            body = {"soft-limit": "160", "hard-limit": "200"}
            path_params = {"workspace_id": "testId"}
            resp = workspaces_api_resource_handler._workspaces_set_limits(
                body, path_params, test_email_1
            )


def test_workspaces_set_total_usage(dynamodb_table):

    with mock.patch.object(
        workspaces_api_resource_handler, "_get_dynamodb_table_name"
    ) as mock_get_table_name:
        with mock.patch.object(
            workspaces_api_resource_handler, "_get_dynamodb_index_name"
        ) as mock_get_index_name:
            mock_get_table_name.return_value = "testTable"
            mock_get_index_name.return_value = "testIndex"

            # Failure responses#
            # Send path_params without workspace_id -- verify for AssertionError
            body = {"total-usage": "200"}
            path_params = {}
            with pytest.raises(AssertionError):
                workspaces_api_resource_handler._workspaces_set_total_usage(
                    body, path_params, api_key
                )

            id1 = str(uuid.uuid4())

            # Send body without total-usage -- verify for AssertionError
            body = {}
            path_params = {"workspace_id": id1}
            with pytest.raises(AssertionError):
                workspaces_api_resource_handler._workspaces_set_total_usage(
                    body, path_params, api_key
                )

            # Invoke the method without an `api_key` -- verify for ValueError
            body = {"total-usage": "200"}
            path_params = {"workspace_id": id1}
            with pytest.raises(AssertionError):
                workspaces_api_resource_handler._workspaces_set_total_usage(
                    body, path_params, None
                )

            # Success Response#

            # Scenario 1:
            # In the mock db record, set hard limit greater than total_usage but less than the one in body
            # Mock the _publish_to_sns_topic with appropriate params
            item1 = {
                "workspace_request_id": id1,
                "user_id": test_email_1,
                "root_account_email": "ctds@uchicago.edu",
                "bmh_workspace_id": id1,
                "request_status": "pending",
                "strides-credits": decimal.Decimal("0"),
                "soft-limit": decimal.Decimal("160"),
                "hard-limit": decimal.Decimal("200"),
                "sns-topic": "testSNSTopic",
                "total-usage": decimal.Decimal("100"),
            }

            dynamodb_table.put_item(Item=item1)

            body = {"total-usage": "200"}
            path_params = {"workspace_id": id1}
            with patch(
                "lambdas.workspaces_api_resource.workspaces_api_resource_handler._publish_to_sns_topic"
            ) as mock_sns:
                resp = workspaces_api_resource_handler._workspaces_set_total_usage(
                    body, path_params, api_key
                )
                assert resp["statusCode"] == 200
                mock_sns.assert_called()

            # Query the table for item by email
            response = dynamodb_table.query(
                KeyConditionExpression=Key("user_id").eq(test_email_1),
                ProjectionExpression=projection,
                ExpressionAttributeNames=expression_attribute_names,
            )
            retval = response.get("Items", [])
            assert len(retval) == 1 and retval[0]["total-usage"] == 200.0

            # Scenario 2:
            # In the mock db record, set soft limit greater than total_usage but less than the one in body
            # Mock the _publish_to_sns_topic with appropriate params
            id2 = str(uuid.uuid4())
            item2 = {
                "workspace_request_id": id2,
                "user_id": test_email_2,
                "root_account_email": "ctds@uchicago.edu",
                "bmh_workspace_id": id2,
                "request_status": "pending",
                "strides-credits": decimal.Decimal("0"),
                "soft-limit": decimal.Decimal("160"),
                "hard-limit": decimal.Decimal("200"),
                "sns-topic": "testTopic",
                "total-usage": decimal.Decimal("100"),
            }

            dynamodb_table.put_item(Item=item2)

            body = {"total-usage": "180"}
            path_params = {"workspace_id": id2}
            with patch(
                "lambdas.workspaces_api_resource.workspaces_api_resource_handler._publish_to_sns_topic"
            ) as mock_sns:
                resp = workspaces_api_resource_handler._workspaces_set_total_usage(
                    body, path_params, api_key
                )
                assert resp["statusCode"] == 200
                mock_sns.assert_called()

            # Query the table for item by email
            response = dynamodb_table.query(
                KeyConditionExpression=Key("user_id").eq(test_email_2),
                ProjectionExpression=projection,
                ExpressionAttributeNames=expression_attribute_names,
            )
            retval = response.get("Items", [])
            assert len(retval) == 1 and retval[0]["total-usage"] == 180.0


def test_workspaces_set_total_usage_db_error():
    # Test for function to catch exception from db resource error
    with mock.patch.object(
        workspaces_api_resource_handler, "_get_dynamodb_table_name"
    ) as mock_get_table_name:
        with mock.patch.object(
            workspaces_api_resource_handler, "_get_dynamodb_index_name"
        ) as mock_get_index_name:
            mock_get_table_name.return_value = "testTable"
            mock_get_index_name.return_value = "testIndex"

            api_key = "api_key"
            body = {"total-usage": "200"}
            path_params = {"workspace_id": "testId"}
            with pytest.raises(Exception):
                workspaces_api_resource_handler._workspaces_set_total_usage(
                    body, path_params, api_key
                )
