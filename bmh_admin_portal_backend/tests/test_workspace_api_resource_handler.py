from unittest.mock import patch, Mock

from lambdas.workspaces_api_resource import workspaces_api_resource_handler

def test_get_tokens():
    #TODO:

    # Mock the urlopen method to return a preset value based on the input
    # Mock the environment variables auth_oidc_uri, auth_redirect_uri, auth_client_id, auth_client_secret_name
    #  with some dummy values
    # Mock the get_secret method to return a certain value for the give client_secret_name

    #Success scenario#
    #Call the _get_tokens method with valid data as input.

    # Verify urlopen method is called with a Request object as its param
    # Verify the request.full_url is matching with the hardcoded url
    # Verify the headers Content-type and Authorization are present and their values are as expected

    # Allow the urlopen method to throw an exception
    # Verify that RuntimeError

    #Mock the response.getcode method to return a non 200 response
    # Verify RuntimeError is thrown
    assert True


def test_refresh_tokens():
#TODO:

# Same mock tests as the previous test, except with a different key in the first argument.
    assert True

def test_workspaces_post():
#TODO:
    # AWS services to mock
    #   1. boto3.resource('dynamodb')

    #Success Response#
    # Add mock environment variables as needed.
    # Mock _get_param() method to return mock values based on the input param
    # Mock send_credits_workspace_request_email & send_grant_workspace_request_email and
    #       verify they are called exactly once based on the wokspace_type
    # Hardcode the `item` in the function and ensure the mock dynamo table consists it as a record
    # Verify a success response is returned from the function

    #Failure responses#
    # Send an Invalid Workspace type and verify ValueError is being thrown
    # Ensure email_domain is unset in environment_variables and verify if ValueError is being thrown

    assert True


def test_workspace_provision():
#TODO:
    # AWS services to mock
    #   1. boto3.client('apigateway')
    #   2. boto3.client('sns')
    #   3. boto3.resource('dynamodb')

    #Success Response#
    # Add mock environment variables as needed.
    # Ensure apigateway's create_api_key and create_usage_plan_key is called with appropriate params
    # Ensure sns's create_topic is called with suitable params and return a mock 'TopicArn' in response
    # Hardcode the `updated_row` and ensure the mock dynamo table consists it as a record
    # Mock the _start_sfn_workflow to do nothing and ensure it is called once.
    # Verify a success response is returned from the function

    #Failure responses#
    # Send path_params without workspace_id -- verify for AssertionError
    # Send body without account_id -- verify for AssertionError
    # Mock `_get_workspace_request_status_and_email` method to return a value which is not 'pending','failed','error'
    #   verify for a ValueError
    # Mock table.update_item to throw an exception and verify the caught exception

    assert True

def test_start_sfn_workflow():
#TODO:
    # AWS services to mock
    #   1. boto3.client('stepfunctions')

    #Success Response#
    # Add mock environment variables as needed.
    # Ensure sfn's start_execution method is called with appropriate parameters.
    # Verify the mocked response is returned from the function
    assert True


def test_workspaces_get():
#TODO:
    # AWS services to mock
    #   1. boto3.resource('dynamodb')

    #Success Response#
    # Add mock environment variables as needed.
    # Mock the Dynamodb table with a few records with a dummy email address and
    #    a few other records with a different emails

    # Scenario 1
    # Send `path_params` as None and the preset dummy email address
    # Verify the return table has all the records of the presented dummy email address

    # Scenario 2
    # Send `path_params` with `workspace_id` as admin_all
    # Verify the return table has all the records of the table

    # Scenario 3
    # Send `path_params` with `workspace_id` as one of the workspace_id of one of the rows
    # Verify the return table has the record with the given `workspace_id` of the table

    # Verify the mocked response is returned from the function
    assert True

def test_workspaces_set_limits():
    #TODO:
    # AWS services to mock
    #   1. boto3.resource('dynamodb')

    #Failure responses#
    # Send path_params without workspace_id -- verify for AssertionError
    # Send body without soft-limit (also hard-limit) -- verify for AssertionError
    # Send body without soft-limit >= hard-limit -- verify for ValueError
    # Mock table.update_item to throw an exception and verify the caught exception

    #Success Response
    # Add mock environment variables as needed.
    # Hardcode the `updated_row` and ensure the mock dynamo table consists it as a record
    # Verify a success response is returned from the function
    assert True


def test_workspaces_set_total_usage():
    #TODO:
    # AWS services to mock
    #   1. boto3.resource('dynamodb')

    #Failure responses#
    # Send path_params without workspace_id -- verify for AssertionError
    # Send body without total-usage -- verify for AssertionError
    # Invoke the method without an `api_key` -- verify for ValueError
    # #FIXME: Need to find out when do we implement the TODO in the function
    # Mock table.query to throw an exception and verify the caught exception
    # Mock the Dynamodb table with multiple records with the given workspace_id -- verify for AssertionError


    #Success Response#
    # Add mock environment variables as needed.
    # Mock the Dynamodb table with a record with the given workspace_id

    #Scenario 1:
    # In the mock db record, set hard limit greater than total_usage but less than the one in body
    # Mock the _publish_to_sns_topic with appropriate params

    #Scenario 2:
    # In the mock db record, set soft limit greater than total_usage but less than the one in body
    # Mock the _publish_to_sns_topic with appropriate params

    assert True
