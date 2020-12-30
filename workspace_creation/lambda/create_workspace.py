import json
import boto3
import datetime

## TODO:
# 1. Best practices for lambda error handlilng? For example, if email or account name are missing or invalid.
# 2. The create_account call is asynchronous. What's a good way of handling this? 
#    We probably want to perform an actions when the process is complete. Maybe this will tie back 
#    into the SWF or Step Functions?

def handler(event, context):
    org_client = boto3.client("organizations")
    msg_attrs = event['Records'][0]['Sns']['MessageAttributes']

    test_mode = msg_attrs.get('TestMode', False)

    response = {'result':'success', 'test':True}
    if not test_mode:
        response = org_client.create_account(
            Email=msg_attrs['Email']['Value'],
            AccountName=msg_attrs['AccountName']['Value'],
            IamUserAccessToBilling='ALLOW',
        )
    else:
        print("Test Mode, not really doing anything.")

    def default(o):
        if isinstance(o, (datetime.datetime, datetime.date)):
            return o.isoformat()

    # Because datetimes are not serializable. We first serialize
    # with a default encoder/serializer, then re-jsonify for response. 
    json_str = json.dumps(response, default=default)
    return json.loads(json_str)
