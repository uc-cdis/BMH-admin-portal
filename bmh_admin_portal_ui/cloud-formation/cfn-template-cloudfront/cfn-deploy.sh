# Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# Builders
# Carlos Ramos: @carrams

#This shell scripts provides parameters, packages and deploys the CloudFormation template

#Deployment bucket
DeploymentBucket="ctds-brh-website-cloudfront"

#Parameters
AcmCertificate="arn:aws:acm:us-east-1:707767160287:certificate/520ede2f-fc82-4bb9-af96-4b4af7deabbd"
WebsiteBucketName="ctds-brh-website"
DomainName="brh-test.planx-pla.net"
AlternateDomainName="www.brh-test.planx-pla.net"
Compress="false"
DefaultTTL="0"
MaxTTL="0"
MinTTL="0"
PriceClass="PriceClass_All"
TTL=600

#Packaging
aws cloudformation package  \
    --template-file CloudFront.yaml \
    --s3-bucket ${DeploymentBucket} \
    --output-template-file packaged.yaml

#Deployment
aws cloudformation deploy  \
    --stack-name BRHStack \
    --template-file packaged.yaml \
    --parameter-overrides \
        AcmCertificate=${AcmCertificate} \
        WebsiteBucketName=${WebsiteBucketName} \
        DomainName=${DomainName} \
        AlternateDomainName=${AlternateDomainName} \
        Compress=${Compress} \
        DefaultTTL=${DefaultTTL} \
        MaxTTL=${MaxTTL} \
        MinTTL=${MinTTL} \
        PriceClass=${PriceClass} \
        TTL=${TTL}
