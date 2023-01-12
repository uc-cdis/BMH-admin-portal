import boto3
import os

class EmailHelper():
    @classmethod
    def send_credits_workspace_request_email(cls, data):
        email_domain = os.environ.get("email_domain", None)
        if email_domain is None:
            raise ValueError("Could not find root account email domain.")

        from_addr = f"request@{email_domain}"

        to_addr = os.environ.get("strides_credits_request_email", None)
        if to_addr is None:
            raise ValueError("Could not find strides credits request email")

        cls.send_workspace_request_email(to_addr, from_addr, data)

    @classmethod
    def send_grant_workspace_request_email(cls, data):
        email_domain = os.environ.get("email_domain", None)
        if email_domain is None:
            raise ValueError("Could not find root account email domain.")

        from_addr = f"request@{email_domain}"

        to_addr = os.environ.get("strides_grant_request_email", None)
        if to_addr is None:
            raise ValueError("Could not find strides grants request email")

        cls.send_workspace_request_email(to_addr, from_addr, data)

    @classmethod
    def send_workspace_request_email(cls, to_addr, from_addr, data):
        client = boto3.client('ses')

        # Build the string of data
        body_string = "\n".join([f"{k}: {v}" for k,v in data.items()])

        ses_client = boto3.client('ses')
        response = ses_client.send_email(
            Source=from_addr,
            Destination={
                'ToAddresses': [ to_addr ]
            },
            Message={
                'Subject': {
                    'Data': "Workspace Request"
                },
                'Body': {
                    'Text': {
                        'Data': body_string
                    }
                }
            }
        )
