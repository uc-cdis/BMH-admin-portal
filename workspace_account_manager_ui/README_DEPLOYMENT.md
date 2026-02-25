# BMH Admin Portal CloudFront Distribution and React Application

## Introduction

This document contains the instructions for deploying the CloudFormation templates that will deploy the BRH Portal CloudFront distribution, and set up an S3 bucket as the source for the React static files.

## Pre-Requisites

This guide assumes that you have created an S3 bucket in your account to load the CloudFormation deployment artifacts.

This guide also assumes that you have installed the AWS CLI and configured the credentials file with a secret access key and secret access key id. For more information about this step, visit this link: [https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html)

## Important - You must validate the ACM certificate in order for the CloudFormation template to deploy correctly

When you use the AWS::CertificateManager::Certificate resource in a CloudFormation stack if the domain is not hosted in Route 53 (i.e. domain is hosted on Google domains), then the stack will remain in the CREATE_IN_PROGRESS state. Further stack operations are delayed until you validate the certificate request.

When your CloudFormation stack gets stuck in the CREATE_IN_PROGRESS state, complete the ACM certificate validation by following these steps:

Step 1 - In the ACM console, click the "Create record in Route 53" button - [https://aws.amazon.com/blogs/security/easier-certificate-validation-using-dns-with-aws-certificate-manager/](https://aws.amazon.com/blogs/security/easier-certificate-validation-using-dns-with-aws-certificate-manager/)

Step 2 - Update Google Domain name servers [https://support.google.com/domains/answer/3290309?hl=en](https://support.google.com/domains/answer/3290309?hl=en)

Once the ACM certificate is validated, the CloudFormation stack will create the remaining resources.

For more information, see [https://docs.aws.amazon.com/acm/latest/userguide/dns-validation.html](https://docs.aws.amazon.com/acm/latest/userguide/dns-validation.html) and [https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-certificatemanager-certificate.html#cfn-certificatemanager-certificate-domainname](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-certificatemanager-certificate.html#cfn-certificatemanager-certificate-domainname).

## Launching the CloudFormation template

Navigate to the following directory:

```sh
cd workspace_account_manager_ui/cloud-formation/cfn-template/
```

In that directory, you will find the **cfn-deploy.sh** script. This script packages and deploys the CloudFormation stack. This is also where you will enter the parameters specific to your AWS account environment.

Fill out the Deployment bucket and Parameters section of the script (note, these values will vary depending on your environment, e.g. the name of the Website bucket will be different):

```sh
#This shell scripts provides parameters, packages and deploys the CloudFormation template

#Deployment bucket
DeploymentBucket="cfn-deployments-carrams"

#Parameters
WebsiteBucketName="bmh-admin-portal-bucket"
DomainName="bmh-admin-portal.com"
AlternateDomainName="gen3.bmh-admin-portal.com"
Compress="false"
DefaultTTL="0"
MaxTTL="0"
MinTTL="0"
PriceClass="PriceClass_All"
TTL=600
```

Once you have filled out th appropriate values, run the shell script:

```sh
sh cfn-deploy.sh
```

Once the deployment is complete, use your AWS console to verify that the CloudFront distribution has been created, the dns records have been created in Route 53, and the S3 bucket to host the web files has been created and given the correct resource policy.

## Preparing the React app static files for deployment

### Create .env
The react application expects certain environment variables to be present during the build step. Add these values to a file named `.env` in the top-level UI directory.

* NEXT_PUBLIC_OIDC_AUTH_URI: E.g. https://fence.planx-pla.net/user/oauth2/authorize
* NEXT_PUBLIC_AUTH_SERVICE: IdP in Fence, e.g. google
* NEXT_PUBLIC_OIDC_CLIENT_ID: Fence client ID
* NEXT_PUBLIC_OIDC_REDIRECT_URI: https://www.brh_domain.com/login/callback
* NEXT_PUBLIC_API_GW_ENDPOINT: API Gateway Endpoint deployed in backend (e.g. https://b6ojr32w.execute-api.us-east-1.amazonaws.com/api)
* NEXT_PUBLIC_API_KEY: API Key created when back end is deployed
* NEXT_PUBLIC_ARBORIST_URI: https://fence.planx-pla.net/authz/mapping
* NEXT_PUBLIC_HELP_EMAIL: help@brh.org
* NEXT_PUBLIC_ROOT_EMAIL_DOMAIN: brh.org
* NEXT_PUBLIC_DISPLAY_NAME: "BMH TEST Portal"
* NEXT_PUBLIC_DISPLAY_NAME_ABBREVIATION: "BMH"
* NEXT_PUBLIC_DISABLED_FORMS: Optional, an array of form names that to be hidden from the UI (e.g. `["stridesCredits", "directPay"]`)
* NEXT_PUBLIC_OCC_EMAIL_DOMAIN: occ-data.org
* NEXT_PUBLIC_OCC_HELPER_URL: API Gateway Endpoint deployed in backend for OCC

### Build and deploy static files

Navigate to the following directory:

```sh
cd workspace_account_manager_ui
```

Open the **package.json** file in a text editor. Under the **scripts** section of the file, you will need to update the **s3upload** script. You will enter the name of the s3 bucket that will hold your website files. In the example below, the name of the s3 bucket is **bmh-admin-portal-bucket**.

```sh
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "s3upload": "npm run build && aws s3 sync ./out s3://bmh-admin-portal-bucket --sse AES256 --delete"
  }
```

Once the edit is complete you will need to install the npm packages needed by React. Run the following command:

```sh
npm install
```

Once the packages are installed, you can run the **s3upload** script. This command will package your React application into static files and then load them to the S3 bucket that will hold your website files.

```sh
npm run s3upload
```



Once the script completes execution, open your web browser and navigate to **gen3.bmh-admin-portal.com** to verify that the site deployed correctly.
