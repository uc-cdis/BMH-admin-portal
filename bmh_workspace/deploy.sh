#!/bin/bash

ARTIFACT_BUCKET="brh-workspace-artifacts-deploy"
ARTIFACT_PREFIX="artifacts"
STACK_NAME="test-brh-provision"

WORKSPACE_ID="test-workspace"
PORTAL_URL="https://u2300076p7.execute-api.us-east-1.amazonaws.com/api"
API_KEY="RPX2wB4PYwa5xgUH4zoab2mOpHPH10g86bpVKJop"

if [[ $1 == "delete" ]]
then
    aws cloudformation delete-stack --stack-name $STACK_NAME
    exit 0
fi

# zip up the lambda and ulpoad
pushd lambdas/custom_cost_and_usage_report_cfn
zip -r custom_cost_and_usage_report_cfn.zip custom_cost_and_usage_report_cfn.py
aws s3 cp custom_cost_and_usage_report_cfn.zip s3://$ARTIFACT_BUCKET/$ARTIFACT_PREFIX/
popd

pushd lambdas/parse_cost_and_usage_lambda
zip -r parse_cost_and_usage_lambda.zip parse_cost_and_usage_lambda.py
aws s3 cp parse_cost_and_usage_lambda.zip s3://$ARTIFACT_BUCKET/$ARTIFACT_PREFIX/
popd

aws s3 sync lambdas/ s3://$ARTIFACT_BUCKET/$ARTIFACT_PREFIX/ --exclude '*' --include awswrangler-layer-2.4.0-py3.8.zip
aws s3 sync templates/ s3://$ARTIFACT_BUCKET/$ARTIFACT_PREFIX/

TEMPLATE_URL="https://$ARTIFACT_BUCKET.s3.$AWS_DEFAULT_REGION.amazonaws.com/$ARTIFACT_PREFIX/BMHAccountBaseline.yml"
echo $TEMPLATE_URL

if [[ $1 == "deploy" ]]
then
    aws cloudformation create-stack --stack-name $STACK_NAME --template-url $TEMPLATE_URL \
            --parameters ParameterKey=ArtifactBucket,ParameterValue="$ARTIFACT_BUCKET" \
            ParameterKey=ArtifactPrefix,ParameterValue=$ARTIFACT_PREFIX \
            ParameterKey=BRHWorkspaceId,ParameterValue=$WORKSPACE_ID \
            ParameterKey=BRHPortalAPIURI,ParameterValue=$PORTAL_URL \
            ParameterKey=APIKey,ParameterValue=$API_KEY \
            --capabilities "CAPABILITY_IAM"
fi

