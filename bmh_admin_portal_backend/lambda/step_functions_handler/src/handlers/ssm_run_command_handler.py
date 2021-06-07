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

class SSMRunCommandHandler():
    """ This class handles the SSM Run Command Action and will run an ssm run command """

    def __init__(self):
        self.ssm_client = boto3.client('ssm')

    def handle(self, event):
        logger.info("Called ssm run command handler, event:")
        logger.info(event)
        commands = event['commands'] # What is this? Is this a json string?
        working_dir = event['working_directory']
        instance_id = self._get_param(event['instance_id_parameter_name'])

        response = self.ssm_client.send_command(
            InstanceIds=[instance_id],
            DocumentName="AWS-RunShellScript",
            Parameters={
                'workingDirectory':[working_dir],
                'commands':commands
            }
        )

        command = response['Command']

        logger.info("Submitted send_command")
        logger.info(response)

        return {
            'command_id': command['CommandId'],
            'instance_id': instance_id
        }

    def _get_param(self, param_name):
        ssm = boto3.client('ssm')
        param_info = ssm.get_parameter(Name=param_name)
        return param_info['Parameter']['Value']
        