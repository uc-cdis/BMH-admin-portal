from ..db.client import DBClient
from ..email.email import EmailClient


class EmailHandler:
    """This class handles sending email notifications to the users, upon success."""

    def __init__(self):
        self.db_client = DBClient()
        self.email_client = EmailClient()

    def handle(self, event):
        # Can not send emails to users yet, FEDRAMP.
        return  # Remove this line when the time is right.
        # Try to get the workspace request id to update the database.
        workspace_request_id = None
        try:
            workspace_request_id = event["input"]["brh_infrastructure"]["workspace_id"]
        except Exception as e:
            print("Could not find workspace_request_id")
            raise e

        try:
            self.email_client.send_welcome_email(workspace_request_id)
        except Exception as e:
            print("error in EmailHandler")
            raise e

        return {"success": True}
