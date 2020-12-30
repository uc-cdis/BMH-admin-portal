import setuptools


with open("README.md") as fp:
    long_description = fp.read()


setuptools.setup(
    name="request_workspace_ui",
    version="0.0.1",

    description="An empty CDK Python app",
    long_description=long_description,
    long_description_content_type="text/markdown",

    author="author",

    package_dir={"": "request_workspace_ui"},
    packages=setuptools.find_packages(where="request_workspace_ui"),

    install_requires=[
        "aws-cdk.core",
        "aws-cdk.aws-s3",
        "aws-cdk.aws-s3-deployment",
        "aws-cdk.aws-cloudfront",
        "aws-cdk.aws-cloudfront-origins",
        "aws-cdk.aws-dynamodb",
        "aws-cdk.aws-ssm",
        "aws-cdk.aws-apigatewayv2",
        "aws-cdk.aws-apigatewayv2-integrations",
    ],

    python_requires=">=3.6",

    classifiers=[
        "Development Status :: 4 - Beta",

        "Intended Audience :: Developers",

        "License :: OSI Approved :: Apache Software License",

        "Programming Language :: JavaScript",
        "Programming Language :: Python :: 3 :: Only",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",

        "Topic :: Software Development :: Code Generators",
        "Topic :: Utilities",

        "Typing :: Typed",
    ],
)
