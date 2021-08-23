# BRH Workspace Infrastructure

## Overview
The infrastructure deployed to each individual workspace performs the following 2 tasks:
1. Calculate total usage (using AWS Cost and Usage Reports)
2. Update total usage via the BRH Admin Portal REST API

## AWS Cost and Usage Reports
* To calculate total usage for an individual account, we are making use of AWS Cost and Usage Reports ([documentation](https://docs.aws.amazon.com/cur/latest/userguide/what-is-cur.html)).
* This AWS service will automatically create reports and write them to S3 (~ 3x/day). When a new report is written, a lambda function is triggered, which parses the data and updates the new information via the BRH Admin Portal REST API.
* The reports are written in Parquet format and parsed using AWS Data Wrangler library (packaged in this Github repository).
* Each workspace is assigned an API Key when it is provisioned (which is what's used to authenticate an individual account for the BMH Admin Portal REST API).

## Deployment
To help in deploying the infrastructure a build script has been provided (`build.sh`) which performs the following steps:
1. Creates a zip file for the custom CloudFormation resource (CUR) Lambda Function.
2. Creates a zip file for the lambda function which parses the Cost and Usage Reports in Parquet formats.
3. Copies these archives (as well as the CloudFormation template and AWS Data Wrangler lambda layer) into the build directory.

This build directory is then uploaded directly to S3 and used when provisioning new BRH Workspace Accounts.
