import setuptools


with open("README.md") as fp:
    long_description = fp.read()


setuptools.setup(
    name="bmh_admin_portal_ui",
    version="0.0.1",

    description="Deploys BMH Admin Portal as a CDK app",
    long_description=long_description,
    long_description_content_type="text/markdown",

    author="University of Chicago/NIH",

    package_dir={"": "bmh_admin_portal_ui"},
    packages=setuptools.find_packages(where="bmh_admin_portal_ui"),

    install_requires=[
        "boto3",
        "jinja2",
        "aws-cdk.core==1.82.0",
        "aws-cdk.aws-s3",
        "aws-cdk.aws-s3-deployment",
        "aws-cdk.aws-cloudfront",
        "aws-cdk.aws-cloudfront-origins"
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
