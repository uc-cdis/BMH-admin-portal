# © 2021 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.
# 
# This AWS Content is provided subject to the terms of the AWS Customer Agreement
# available at http://aws.amazon.com/agreement or other written agreement between
# Customer and either Amazon Web Services, Inc. or Amazon Web Services EMEA SARL or both.
import boto3
import json

import logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(message)s")
logger.setLevel(logging.INFO)

class SSMCommandStatus():
    """ This class checks the SSM Command Status """

    def __init__(self):
        self.ssm_client = boto3.client('ssm')

    def handle(self, event):
        logger.info("Called ssm run command handler, event:")
        logger.info(event)

        command_id = event['command_polling']['command_id']
        instance_id = event['command_polling']['instance_id']
        

        response = self.ssm_client.get_command_invocation(
            CommandId=command_id,
            InstanceId=instance_id
        )

        logger.info("Checking command status:")
        logger.info(response)

        retval = "PENDING"
        status = response['Status']
        if status in ['Success']:
            retval = "SUCCESS"
        elif status in ['Cancelled', 'TimedOut', 'Failed', 'Cancelling']:
            retval = "FAILED"

        return retval

    def _get_param(self, param_name):
        ssm = boto3.client('ssm')
        param_info = ssm.get_parameter(Name=param_name)
        return param_info['Parameter']['Value']
        