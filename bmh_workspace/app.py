#!/usr/bin/env python3
import os

from aws_cdk import core

from bmh_workspace.bmh_workspace_stack import BMHWorkspaceStack

app = core.App()
BMHWorkspaceStack(app, "bmh-workspace")

app.synth()
