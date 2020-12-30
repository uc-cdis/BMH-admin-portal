#!/usr/bin/env python3

import os

from aws_cdk import core

from workspace_creation.workspace_creation_stack import WorkspaceCreationStack


app = core.App()
WorkspaceCreationStack(app, "workspace-creation", env=core.Environment(
    account=os.environ["CDK_DEFAULT_ACCOUNT"],
    region=os.environ["CDK_DEFAULT_REGION"]))

app.synth()
