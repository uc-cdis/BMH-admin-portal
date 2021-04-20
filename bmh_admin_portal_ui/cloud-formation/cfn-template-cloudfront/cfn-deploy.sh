# Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# Builders
# Carlos Ramos: @carrams

#This shell scripts provides parameters, packages and deploys the CloudFormation template
  
#Deployment bucket
DeploymentBucket="cfn-deployment-artifacts"

#Parameters  
WebsiteBucketName="nih-site-4122021"
DomainName="tls-endpoint.com"
AlternateDomainName="www.tls-endpoint.com"
Compress="false"
DefaultTTL="0"
MaxTTL="0"
MinTTL="0"
PriceClass="PriceClass_All"
TTL=600

#Packaging
aws cloudformation package --profile nih \
    --template-file CloudFront.yaml \
    --s3-bucket ${DeploymentBucket} \
    --output-template-file packaged.yaml

#Deployment
aws cloudformation deploy --profile nih \
    --stack-name BRHStack \
    --template-file packaged.yaml \
    --parameter-overrides \
        WebsiteBucketName=${WebsiteBucketName} \
        DomainName=${DomainName} \
        AlternateDomainName=${AlternateDomainName} \
        Compress=${Compress} \
        DefaultTTL=${DefaultTTL} \
        MaxTTL=${MaxTTL} \
        MinTTL=${MinTTL} \
        PriceClass=${PriceClass} \
        TTL=${TTL}