""" Add Verified User to BMH Portal Cognito Pool

This script allows a user with admin privileges to add a user
to the BMH Portal Backend. This should be used for development
purposes to demonstrate login capabilities. For production,
users will authenticate using an external ID provider (such as
NIH's RAS Identify Provider).
"""

import boto3
import argparse
import logging
import os
import sys

sys.path.insert(1, os.path.join(sys.path[0], ".."))
from bmh_admin_portal_backend.bmh_admin_portal_config import BMHAdminPortalBackendConfig

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.WARN, format="%(message)s")


def main(args):

    config = BMHAdminPortalBackendConfig.get_config()

    # Grab the user pool ID from SSM
    cognito_userpool_id = _get_param(config["cognito_userpool_id_param_name"])
    cognito = boto3.client("cognito-idp")

    # For development, first delete user.
    try:
        response = cognito.admin_delete_user(
            UserPoolId=cognito_userpool_id, Username=args.email
        )
    except Exception as e:
        logger.info(f"Exception when trying to delete user: {e}")

    response = cognito.admin_create_user(
        UserPoolId=cognito_userpool_id, Username=args.email, MessageAction="SUPPRESS"
    )

    username = response["User"]["Username"]

    logger.warning(f"User created successfully: {username}")

    cognito.admin_set_user_password(
        UserPoolId=cognito_userpool_id,
        Username=username,
        Password=args.password,
        Permanent=True,
    )

    logger.info("Password set successfully")


def _get_param(param_name):
    ssm = boto3.client("ssm")
    try:
        parameter = ssm.get_parameter(Name=param_name)
    except Exception as e:
        logger.error(
            f"Error retrieving {param_name} from SSM Parameter Store. "
            "Has the backend been deployed in this Account?"
        )
        raise e

    return parameter["Parameter"]["Value"]


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Add a verified test user to AWS Cognito UserPool for BMH backend"
    )
    parser.add_argument(
        "-e", "--email", required=True, help="Username for the test user."
    )
    parser.add_argument("-p", "--password", required=True, help="Password for user")

    args = parser.parse_args()
    main(args)
