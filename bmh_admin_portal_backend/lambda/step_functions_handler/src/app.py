# © 2021 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.
#
# This AWS Content is provided subject to the terms of the AWS Customer Agreement
# available at http://aws.amazon.com/agreement or other written agreement between
# Customer and either Amazon Web Services, Inc. or Amazon Web Services EMEA SARL or both.
import json
from enum import Enum

from .handlers import (
    ProvisionBRHHandler,
    FailureHandler,
    SuccessHandler,
    EmailHandler,
)

import logging

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(message)s")
logger.setLevel(logging.INFO)


def handler(event, context):
    logger.info(json.dumps(event))

    dispatch = {
        Actions.BRH_PROVISION.value: ProvisionBRHHandler,
        Actions.SUCCESS.value: SuccessHandler,
        Actions.FAILURE.value: FailureHandler,
        Actions.EMAIL.value: EmailHandler,
    }

    action = event.get("action", None)

    if action is None or action not in dispatch:
        valid_actions = [e.value for e in Actions]
        raise InvalidActionException(
            f"Action {event['action']} is not a valid action. Valid actions: {valid_actions}"
        )

    retval = None
    try:
        logger.info(f"Dispacthing {action} action")
        handler = dispatch[action]()
        retval = handler.handle(event)
    except Exception as e:
        logger.exception(e)
        # Not sure if we need this or not.
        raise e

    return retval


class InvalidActionException(Exception):
    """Used to indicate that an invalid exception was used to acces this function"""


class Actions(Enum):
    BRH_PROVISION = "provision_brh"
    SUCCESS = "success"
    FAILURE = "failure"
    EMAIL = "email"
