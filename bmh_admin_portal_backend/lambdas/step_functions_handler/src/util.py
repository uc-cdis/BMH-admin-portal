# © 2021 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.
#
# This AWS Content is provided subject to the terms of the AWS Customer Agreement
# available at http://aws.amazon.com/agreement or other written agreement between
# Customer and either Amazon Web Services, Inc. or Amazon Web Services EMEA SARL or both.

""" Module to hold utility functions shared across modules,
    such as getting paramter values, etc. """

import os
import boto3

class Util():
    @classmethod
    def get_dynamodb_index_name(cls):
        return cls.get_param(os.environ['dynamodb_index_param_name'])

    @classmethod
    def get_dynamodb_table_name(cls):
        return cls.get_param(os.environ['dynamodb_table_param_name'])

    @classmethod
    def get_param(cls, param_name):
        ssm = boto3.client('ssm')
        param_info = ssm.get_parameter(Name=param_name)
        return param_info['Parameter']['Value']
