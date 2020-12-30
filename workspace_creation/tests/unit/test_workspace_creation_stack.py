import json
import pytest

from aws_cdk import core
from workspace_creation.workspace_creation_stack import WorkspaceCreationStack


def get_template():
    app = core.App()
    WorkspaceCreationStack(app, "workspace-creation")
    return json.dumps(app.synth().get_stack("workspace-creation").template)


def test_lambda_function_created():
    assert("AWS::Lambda::Function" in get_template())


def test_sns_topic_created():
    assert("AWS::SNS::Topic" in get_template())
