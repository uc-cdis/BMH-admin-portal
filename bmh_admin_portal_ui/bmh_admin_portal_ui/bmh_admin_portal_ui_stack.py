from aws_cdk import (
    core,
    aws_s3 as s3,
    aws_s3_deployment as s3_deployment,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as cloudfront_origins
)


class BmhAdminPortalUiStack(core.Stack):

    def __init__(self, scope: core.Construct, construct_id: str, webui_distdir: str,
                 **kwargs) -> None:

        super().__init__(scope, construct_id, **kwargs)

        # Create the s3 bucket
        request_ui_bucket = s3.Bucket(
            self, "RequestWorkspaceUI",
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL
        )

        cf_distribution = cloudfront.Distribution(
            self, "DistributionForRequestUI",
            default_behavior=cloudfront.BehaviorOptions(
                origin=cloudfront_origins.S3Origin(request_ui_bucket)
            ),
            default_root_object="index.html"
        )

        deployment = s3_deployment.BucketDeployment(
            self, "DeployRequestWorksapceUI",
            sources=[s3_deployment.Source.asset(webui_distdir)],
            destination_bucket=request_ui_bucket,
            distribution=cf_distribution,
            server_side_encryption=s3_deployment.ServerSideEncryption.AES_256,
        )