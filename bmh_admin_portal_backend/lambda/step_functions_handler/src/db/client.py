import os
import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key, Attr

from ..util import Util


class DBClient:
    def __init__(self):
        self.table_name = Util.get_dynamodb_table_name()
        self.index_name = Util.get_dynamodb_index_name()

        dynamodb = boto3.resource("dynamodb")
        self.table = dynamodb.Table(self.table_name)

    def set_status(self, workspace_request_id, status, email=None):
        """Will set the account ID given a workspace request ID

        args:
            workspace_request_id: (string) Request ID which should already exist in database.
            status: (string) request status
            email: (string, optional) Email/user_id. If not provided, will look up in GSI.

        return:
            table_response (dict): response for update_item call

        """
        return self._update_single_attribute(
            "request_status", status, workspace_request_id, email
        )

    def set_account_id(self, workspace_request_id, account_id, email=None):
        """Will set the account ID given a workspace request ID

        args:
            workspace_request_id: (string) Request ID which should already exist in database.
            account_id: (string) AWS account ID
            email: (string, optional) Email/user_id. If not provided, will look up in GSI.

        return:
            table_response (dict): response for update_item call

        """
        return self._update_single_attribute(
            "account_id", account_id, workspace_request_id, email
        )

    def get_all_by_workspace_request_id(self, workspace_request_id):
        """Looks up all attributes based on workspace_request_id and user_id

        args:
            workspace_request_id: (string) Request ID which should already exist in database.

        return:
            email (string): User ID stored in GSI based on Workspace Request ID.

        raises:
            InvalidWorkspaceRequestException: When workspace request ID does not exist.
        """

        # Query the Global Secondary Index to get the User.
        try:
            response = self.table.scan(
                FilterExpression=Attr("bmh_workspace_id").eq(workspace_request_id)
            )
        except ClientError as e:
            if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
                raise InvalidWorkspaceRequestIdException(
                    f"Could find workspace request {workspace_request_id}"
                )
            else:
                raise e

        # And now update the row.
        items = response.get("Items", [])
        assert len(items) == 1
        data = items[0]
        return data

    def get_email_by_workspace_request_id(self, workspace_request_id):
        """Looks up an email (user_id) based on workspace request id

        args:
            workspace_request_id: (string) Request ID which should already exist in database.

        return:
            email (string): User ID stored in GSI based on Workspace Request ID.

        raises:
            InvalidWorkspaceRequestException: When workspace request ID does not exist.
        """

        # Query the Global Secondary Index to get the User.
        try:
            index_response = self.table.query(
                IndexName=self.index_name,
                KeyConditionExpression=Key("bmh_workspace_id").eq(workspace_request_id),
                ReturnConsumedCapacity="NONE",
            )
        except ClientError as e:
            if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
                raise InvalidWorkspaceRequestIdException(
                    f"Could find workspace request {workspace_request_id}"
                )
            else:
                raise e

        # And now update the row.
        items = index_response.get("Items", [])
        assert len(items) == 1
        user_id = items[0]["user_id"]
        return user_id

    def _update_single_attribute(
        self, attribute_name, attribute_value, workspace_request_id, email=None
    ):
        """Will update a single attribute given a request ID

        args:
            attribute_name: (string) Name of attribute to update.
            attribute_value: (Any) Value to update in the database.
            workspace_request_id: (string) Request ID which should already exist in database.
            email: (string, optional) The user id for the primary key of the dynamo table. If not provided,
                will look up the value in the GSI.

        return:
            table_response (dict): The response returned by the update_item called to DynamoDB Table

        raises:
            InvalidWorkspaceRequestException: When workspace request ID does not exist.
        """
        if email is None:
            email = self.get_email_by_workspace_request_id(workspace_request_id)

        try:
            table_response = self.table.update_item(
                Key={"bmh_workspace_id": workspace_request_id, "user_id": email},
                UpdateExpression="set #attributename = :attributevalue",
                ConditionExpression="attribute_exists(bmh_workspace_id)",
                ExpressionAttributeValues={":attributevalue": attribute_value},
                ExpressionAttributeNames={"#attributename": attribute_name},
                ReturnValues="ALL_NEW",
            )
        except ClientError as e:
            if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
                raise InvalidWorkspaceRequestIdException(
                    f"Could find workspace request {workspace_request_id}"
                )
            else:
                raise e

        return table_response


class InvalidWorkspaceRequestIdException(Exception):
    """Raised when a workspace request id is expected to exist and does not"""
