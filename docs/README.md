# BRH Admin Portal Infrastructure Documentation

## Overview
![BMH Admin Portal Infrastructure Diagram](./images/full_architecture.png?raw=true "BMH Infrastructure")

## OCC/DDI
The BRH Admin Portal relies on some infrastructure developed under the OCC/DDI project. Instructions on how to deploy can be found in the [occ-data repo](https://github.com/occ-data/ddi-pay-per-compute/tree/main/account_creation_automation/backend). This infrastructure provides a lambda function which will baseline an account with a provided CloudFormation template. It can additionally create a new AWS account (this functionality is not currently being used). The lambda function provided from this repository is called as the first step in the Workspace Provisioning Step Functions workflow.

## Backend
The backend infrastructure for the admin portal implements a REST API which performs many of the tasks required by the UI.
* [Infrastructure Documentation](./backend/developer-backend.md).
* [Deployment Instructions](../bmh_admin_portal_backend/README.md)

## UI
The front-end component is a React application which interacts with the backend infrastructure through the REST API.
* [Infrastructure Documentation](./frontend/developer-frontend.md)
* [Deployment Instructions](../bmh_admin_portal_ui/README_DEPLOYMENT.md)

## Workspace Infrastructure
During the Workspace provisioning Step Functions State Machine, a set of BRH related resources will be deployed to the target workspace account. The infrastructure which deploys the CloudFormation in this step is setup and configured during the backend deployment (i.e. it doesn't need to be deployed separately as part of this application.)
* [Infrastructure Documentation](./workspace/developer-workspace.md)
