import setuptools


with open("README.md") as fp:
    long_description = fp.read()


setuptools.setup(
    name="bmh_workspace",
    version="0.0.1",

    description="CDK Application to deploy resources into a Gen3 Workspace Managed by BMH Admin Portal",
    long_description=long_description,
    long_description_content_type="text/markdown",

    package_dir={"": "bmh_workspace"},
    packages=setuptools.find_packages(where="bmh_workspace"),

    install_requires=[
        "aws-cdk.core==1.87.1",
        "aws-cdk.aws-iam",
        "aws-cdk.aws-ssm",
        "aws-cdk.aws-lambda",
        "aws-cdk.custom-resources",
        "aws-cdk.aws-logs",
        "aws-cdk.aws-s3",
        "aws-cdk.aws-s3-notifications",
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
    ],
)
