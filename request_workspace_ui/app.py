#!/usr/bin/env python3

from aws_cdk import core

from request_workspace_backend.request_workspace_backend_stack import RequestWorkspaceBackendStack
from request_workspace_ui.request_workspace_ui_stack import RequestWorkspaceUiStack


app = core.App()

RequestWorkspaceBackendStack(app, "request-workspace-backend")
RequestWorkspaceUiStack(app, "request-workspace-ui")

app.synth()