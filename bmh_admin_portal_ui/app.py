#!/usr/bin/env python3

import sys, logging, traceback, json

import boto3
from aws_cdk import core

from bmh_admin_portal_ui.bmh_admin_portal_ui_stack import BmhAdminPortalUiStack
from webui_src.build import BmhWebUiBuilder

# Create logger
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def main():
    # Build the static site, then create the Cfn to deploy it.
    api_url = get_ssm_parameter_value("/bmh/workspace-request-api-url")
    resource_name = get_ssm_parameter_value("/bmh/workspace-request-api-resource-name")

    template_vars = {
        'api_url':api_url, 
        'resource_name':resource_name
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