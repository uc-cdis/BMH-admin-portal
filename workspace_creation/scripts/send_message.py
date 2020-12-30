#!/usr/bin/env python

import boto3
import sys

def run(topic_arn):
    client = boto3.client('sns')
    response = client.publish(
        TopicArn=topic_arn,
        Message='Test Message',
        MessageAttributes={
            'Email':{
                'DataType':'String',
                'StringValue':'kggalens+testacctcreation@amazon.com'
            },
            'AccountName':{
                'DataType':'String',
                'StringValue':'TestAcctCreation'
            },
            'TestMode':{
                'DataType':'String',
                'StringValue':'True'
            }
        }
    )
    print(response)

if __name__ == "__main__":
    
    if len(sys.argv) < 2: 
        print("Please provide SNS Topic ARN")
        exit(1)
    
    run(sys.argv[1])