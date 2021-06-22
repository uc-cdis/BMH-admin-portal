#!/bin/bash

BINDIR=`dirname $0`
DISTDIR=$BINDIR/build
mkdir -p $DISTDIR

# zip up the lambda and ulpoad
pushd $BINDIR/lambdas/custom_cost_and_usage_report_cfn
zip -r custom_cost_and_usage_report_cfn.zip custom_cost_and_usage_report_cfn.py
popd
cp $BINDIR/lambdas/custom_cost_and_usage_report_cfn/custom_cost_and_usage_report_cfn.zip $DISTDIR/

pushd $BINDIR/lambdas/parse_cost_and_usage_lambda
zip -r parse_cost_and_usage_lambda.zip parse_cost_and_usage_lambda.py
popd
cp $BINDIR/lambdas/parse_cost_and_usage_lambda/parse_cost_and_usage_lambda.zip $DISTDIR/

cp $BINDIR/lambdas/awswrangler-layer-2.4.0-py3.8.zip $DISTDIR/
cp $BINDIR/templates/BMHAccountBaseline.yml $DISTDIR/

echo "Done Building. Upload $DISTDIR to S3."