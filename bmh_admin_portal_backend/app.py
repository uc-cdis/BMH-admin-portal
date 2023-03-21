#!/usr/bin/env python3

from aws_cdk import core

from bmh_admin_portal_backend.bmh_admin_portal_backend_stack import (
    BmhAdminPortalBackendStack,
)


app = core.App()
BmhAdminPortalBackendStack(app, "bmh-admin-portal-backend")

app.synth()
