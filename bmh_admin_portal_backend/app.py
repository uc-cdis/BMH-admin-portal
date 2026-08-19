#!/usr/bin/env python3

from aws_cdk import App

from bmh_admin_portal_backend.bmh_admin_portal_backend_stack import (
    BmhAdminPortalBackendStack,
)


app = App()
BmhAdminPortalBackendStack(app, "bmh-admin-portal-backend")

app.synth()
