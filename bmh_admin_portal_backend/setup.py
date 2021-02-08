import setuptools


with open("README.md") as fp:
    long_description = fp.read()


setuptools.setup(
    name="bmh_admin_portal_backend",
    version="0.0.1",

    description="An empty CDK Python app",
    long_description=long_description,
    long_description_content_type="text/markdown",

    author="author",

    package_dir={"": "bmh_admin_portal_backend"},
    packages=setuptools.find_packages(where="bmh_admin_portal_backend"),

    install_requires=[
        "boto3",
        "aws-cdk.core==1.82.0",
        "aws-cdk.aws-apigateway",
        "aws-cdk.aws-logs",
        "aws-cdk.aws-lambda",
        "aws-cdk.aws-ssm",
        "aws-cdk.aws-iam",
        "aws-cdk.aws-events",
        "aws-cdk.aws-events-targets",
        "aws-cdk.aws-stepfunctions",
        "aws-cdk.aws-stepfunctions-tasks",
        "aws-cdk.aws-cognito",
        "aws-cdk.aws-sqs",
        
        "warrant"
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
