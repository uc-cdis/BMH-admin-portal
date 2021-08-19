# BMH-admin-portal
Shared Codebase for the Biomedical Research Hub Initiative. This repository contains information realted to the BRH Admin Portal.
# Developer Documentation
An overview of the application and infrastructure (including architecture diagram) can be found:
* [Developer Documentation](./docs/README.md)

# Deployment Instructions

## OCC/DDI Account Provisioning Infrastructure
The first step in the process is to deploy the OCC/DDI Lambda for creating a new workspace. The code for this is portion can be found on the [occ-data repo](https://github.com/occ-data/ddi-pay-per-compute/tree/main/account_creation_automation/backend). As the time of writing this, we should be using the `feature/ctds-brh-integration` branch.

```bash
git clone git@github.com:occ-data/ddi-pay-per-compute.git
git checkout feature/ctds-brh-integration
cd ddi-pay-per-compute/account_creation_automation/backend

# Create a zip file for deploying the Account creation lambda
zip -r AccountCreationLambda.zip AccountCreationLambda.py

# Create a bucket to upload the deployment artifacts to.
# This should be unique.
aws s3 mb s3://occ-account-deploy
aws s3 sync . s3://occ-account-deploy
```

You should then be ready to deploy the CloudFormation template `AccountCreationLambdaSetup-cfn.yaml`. This can be done using the AWS Console:
1. Go to CloudFormation within the console and create a stack using new resources.
2. Enter the `https` url for the `AccountCreationLambdaSetup-cfn.yaml` just uploaded.
3. Fill out the required parameter:
   1.  AccountAdministrator - IAM arn for Admin (i.e `arn:aws:iam::<ACCOUNTID>:role/Admin`)
   2.  AccountVendingMachineName - Name to give the Vending Machine (ServiceCatalog)
   3.  AccountVendingMachineSupportEmail - Will be displayed as part of the Vending Machine product (any email address)
   4.  ArtifactBucketName - The bucket name from above where deployment artifacts are located (i.e. occ-acccount-deploy, no `s3://` or `https://` prefixes)
   5.  ServiceCatalogTag - Tag used for the service catalog infrastructure (not used for BRH, but required in the CloudFormation)

## Deploy BRH Admin Portal Backend
This will deploy the backend API which will handle requests. The deployment instructions can be found [here](bmh_admin_portal_backend/README.md).

## Deploy BRH Admin Portal Frontend
This will deploy the front end React application. The deployment instructions can be found [here](bmh_admin_portal_ui/README_DEPLOYMENT.md).