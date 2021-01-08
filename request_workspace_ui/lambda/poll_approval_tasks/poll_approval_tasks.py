import boto3
import json
import time
from datetime import datetime

def handler(event, context):
    activity_arn = _get_activity_arn()

    sfn = boto3.client('stepfunctions')
    resp = sfn.get_activity_task(activityArn=activity_arn)

    if resp['taskToken'] == None:
        print(f"Timedout watiting for token: {datetime.now()}")
        return {}
    else:
        print(f"Received task token {resp['taskToken']}: {datetime.now()}")

    sfn.send_task_success(
        taskToken=resp['taskToken'],
        output=json.dumps({'approved':True,'approved_by':'John Doe'})
    )

    return {"success": True}

def _get_activity_arn():
    ssm = boto3.client('ssm')
    param_info = ssm.get_parameter(Name='/bmh/request-approval-activity-arn')
    return param_info['Parameter']['Value']
    
