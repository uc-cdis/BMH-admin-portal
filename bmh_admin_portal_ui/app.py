#!/usr/bin/env python3

import sys, logging, traceback, json

import boto3
from aws_cdk import core

from bmh_admin_portal_ui.bmh_admin_portal_ui_stack import BmhAdminPortalUiStack
from webui_src.build import BmhWebUiBuilder

# Create logger
logger = logging.getLogger()
logging.basicConfig(level=logging.INFO, format="%(message)s")

def main():
    # Build the static site, then create the Cfn to deploy it.
    api_url = get_ssm_parameter_value("/bmh/workspaces-api/url")
    resource_name = get_ssm_parameter_value("/bmh/workspaces-api/resource-name")

    user_pool_id = get_ssm_parameter_value("/bmh/cognito-userpool-id")
    user_pool_client_id = get_ssm_parameter_value("/bmh/cognito-appclient-id")

    region = boto3.session.Session().region_name

    template_vars = {
        'api_url':api_url, 
        'resource_name':resource_name,
        'user_pool_id':user_pool_id,
        'user_pool_client_id':user_pool_client_id,
        'region':region
    }
    dist_dir = "./webui_dist"

    try:
        BmhWebUiBuilder.build_ui(dist_dir, template_vars)
    except Exception as e:
        logger.error(f"Error building Web UI using Builder")
        raise e

    app = core.App()
    BmhAdminPortalUiStack(app, "bmh-admin-portal-ui", webui_distdir=dist_dir)
    app.synth()

def get_ssm_parameter_value(key):
    ssm_client = boto3.client('ssm')
    try:
        resp = ssm_client.get_parameter(Name=key)
        value = resp['Parameter']['Value']
    except Exception as e:
        logger.error(f"Error retrieving SSM Parameter for API URL.")
        raise e

    return value

if __name__ == "__main__":
    main()