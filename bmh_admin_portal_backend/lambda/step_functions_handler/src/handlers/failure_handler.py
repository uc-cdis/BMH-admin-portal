# © 2021 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.
# 
# This AWS Content is provided subject to the terms of the AWS Customer Agreement
# available at http://aws.amazon.com/agreement or other written agreement between
# Customer and either Amazon Web Services, Inc. or Amazon Web Services EMEA SARL or both.
import boto3
import os

from ..db.client import DBClient

import logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(message)s")
logger.setLevel(logging.INFO)

class FailureHandler():
    """ This class handles failures in the step functions workflows. Will set the status
        of the appropriate item in the database to 'failed' and then send a notification with
        the error to an SNS topic. """

    def __init__(self):
        self.db_client = DBClient()

    def handle(self, event):
        """ Handles a failure event by publishing the error to an SNS topic.
        
            Expects the data to be included with key 'input'.
        """

        # Try to get the workspace request id to update the database.
        workspace_request_id = None
        try:
            workspace_request_id = event['input']['brh_infrastructure']['workspace_id']
        except KeyError as e:
            logger.info("Could not find workspace request id. Not updating database.")
        else: 
            self.db_client.set_status(workspace_request_id, 'failed')

        # Send something to an SNS topic for notificaitons
        sns_topic_arn = os.environ.get('provision_workspace_sns_topic',None)
        if sns_topic_arn is not None:
            message = f"Error provisioning workspace for request {workspace_request_id}.\n"
            message += f"Error: {event['input']['error']}"

            subject = f"Error provisioning BRH Workspace for request {workspace_request_id}"

            client = boto3.client('sns')
            client.publish(
                TopicArn=sns_topic_arn,
                Message=message,
                Subject=subject
            )


        return True