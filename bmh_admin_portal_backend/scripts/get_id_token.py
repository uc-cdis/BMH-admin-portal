""" Add Verified User to BMH Portal Cognito Pool

This script allows a user with admin privileges to add a user
to the BMH Portal Backend. This should be used for development
purposes to demonstrate login capabilities. For production,
users will authenticate using an external ID provider (such as
NIH's RAS Identify Provider).
"""

import argparse
import logging
import sys
import os

import boto3
from warrant import AWSSRP

sys.path.insert(1, os.path.join(sys.path[0], ".."))
from bmh_admin_portal_backend.bmh_admin_portal_config import BMHAdminPortalBackendConfig

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.WARN, format="%(message)s")


def main(args):

    config = BMHAdminPortalBackendConfig.get_config()

    # Grab the user pool ID from SSM
    cognito_userpool_id = _get_param(config["cognito_userpool_id_param_name"])
    cognito_appclient_id = _get_param(config["cognito_appclient_id_param_name"])

    aws = AWSSRP(
        username=args.email,
        password=args.password,
        pool_id=cognito_userpool_id,
        client_id=cognito_appclient_id,
    )

    tokens = aws.authenticate_user()
    print(tokens["AuthenticationResult"]["IdToken"])


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
