# Workspace Account Management Portal Frontend Infrastructure

## Overview
The Workspace Account Management Portal (formerly known as the BMH Admin Portal) FrontEnd component is a React application deployed using S3 hosting with a CloudFront distribution for a CDN. For instructions on deploying the frontend, see [Frontend Deployment Instructions](../workspace_account_manager_ui/README_DEPLOYMENT.md)

## Authentication (Fence)
Authentication is performed by using [Fence](https://github.com/uc-cdis/fence). The site was tested using Google and RAS logins (this can be configured in `workspace_account_manager_ui/.env`).

## Authorization (Arborist)
Authorization is performed by using [Arborist](https://github.com/uc-cdis/arborist). There are 2 resources which apply to the Workspace Account Management Portal (these can be configured in `workspace_account_manager_ui/config.json`).

1. /workspace_stride_credits (service: workspace_stride_credits)
2. /workspace_stride_grants (service: workspace_stride_grants)

If a user has access to either of the above resource/service entries, the user is allowed to log in. The Strides Credits resource allows a user to request a STRIDES Credits account and the Strides Grants resource allows users to request a STRIDES Grants account. If the user has access to both, they will be allowed to request either/both types of workspaces.

## Workspaces Page
The workspace page shows a list of requested workspaces, their statuses (Pending, Provisioning, Active, etc.). This also allows the user to set the soft and hard limits for the usage of the account.

## Request Workspace Page
This page implements forms which are used to request a new workspace. The form provided will be sent directly to the configured emails (in the backend bmh_admin_portal_config.py file).

## Running Front End Unit Tests
cd workspace_account_manager_ui
npm ci
npm run build --if-present
npm test .
