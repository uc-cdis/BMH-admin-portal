import os
import boto3
from botocore.exceptions import ClientError

ses = boto3.client("ses")


from ..util import Util
from ..db.client import DBClient


class EmailClient:
    def __init__(self):
        self.template_name = "STRIDES"
        self.db_client = DBClient()

    def create_email_template(self):
        try:
            ses.create_template(
                Template={
                    "TemplateName": self.template_name,
                    "SubjectPart": "STRIDES account update",
                    "HtmlPart": "<!DOCTYPE html PUBLIC '-//W3C//DTD HTML 4.0 Transitional//EN' 'http://www.w3.org/TR/REC-html40/loose.dtd'><html> <head> <meta http-equiv='x-ua-compatible' content='ie=edge'> <meta name='x-apple-disable-message-reformatting'> <meta name='viewport' content='width=device-width, initial-scale=1'> <meta name='format-detection' content='telephone=no, date=no, address=no, email=no'> <meta http-equiv='Content-Type' content='text/html; charset=utf-8'> <style type='text/css'> body,table,td{font-family:Helvetica,Arial,sans-serif !important}.ExternalClass{width:100%}.ExternalClass,.ExternalClass p,.ExternalClass span,.ExternalClass font,.ExternalClass td,.ExternalClass div{line-height:150%}a{text-decoration:none}*{color:inherit}a[x-apple-data-detectors],u+#body a,#MessageViewBody a{color:inherit;text-decoration:none;font-size:inherit;font-family:inherit;font-weight:inherit;line-height:inherit}img{-ms-interpolation-mode:bicubic}table:not([class^=s-]){font-family:Helvetica,Arial,sans-serif;mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px;border-collapse:collapse}table:not([class^=s-]) td{border-spacing:0px;border-collapse:collapse}@media screen and (max-width: 600px){.w-full,.w-full>tbody>tr>td{width:100% !important}*[class*=s-lg-]>tbody>tr>td{font-size:0 !important;line-height:0 !important;height:0 !important}.s-2>tbody>tr>td{font-size:8px !important;line-height:8px !important;height:8px !important}.s-3>tbody>tr>td{font-size:12px !important;line-height:12px !important;height:12px !important}.s-5>tbody>tr>td{font-size:20px !important;line-height:20px !important;height:20px !important}.s-10>tbody>tr>td{font-size:40px !important;line-height:40px !important;height:40px !important}}</style> </head> <body class='bg-light' style='outline: 0; width: 100%; min-width: 100%; height: 100%; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; font-family: Helvetica, Arial, sans-serif; line-height: 24px; font-weight: normal; font-size: 16px; -moz-box-sizing: border-box; -webkit-box-sizing: border-box; box-sizing: border-box; color: #000000; margin: 0; padding: 0; border-width: 0;' bgcolor='#f7fafc'> <table class='bg-light body' valign='top' role='presentation' border='0' cellpadding='0' cellspacing='0' style='outline: 0; width: 100%; min-width: 100%; height: 100%; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; font-family: Helvetica, Arial, sans-serif; line-height: 24px; font-weight: normal; font-size: 16px; -moz-box-sizing: border-box; -webkit-box-sizing: border-box; box-sizing: border-box; color: #000000; margin: 0; padding: 0; border-width: 0;' bgcolor='#f7fafc'> <tbody> <tr> <td valign='top' style='line-height: 24px; font-size: 16px; margin: 0;' align='left' bgcolor='#f7fafc'> <table class='container' role='presentation' border='0' cellpadding='0' cellspacing='0' style='width: 100%;'> <tbody> <tr> <td align='center' style='line-height: 24px; font-size: 16px; margin: 0; padding: 0 16px;'><!--[if (gte mso 9)|(IE)]> <table align='center' role='presentation'> <tbody> <tr> <td width='600'><![endif]--> <table align='center' role='presentation' border='0' cellpadding='0' cellspacing='0' style='width: 100%; max-width: 600px; margin: 0 auto;'> <tbody> <tr> <td style='line-height: 24px; font-size: 16px; margin: 0;' align='left'> <table class='s-10 w-full' role='presentation' border='0' cellpadding='0' cellspacing='0' style='width: 100%;' width='100%'> <tbody> <tr> <td style='line-height: 40px; font-size: 40px; width: 100%; height: 40px; margin: 0;' align='left' width='100%' height='40'> &#160; </td></tr></tbody> </table> <table class='card' role='presentation' border='0' cellpadding='0' cellspacing='0' style='border-radius: 6px; border-collapse: separate !important; width: 100%; overflow: hidden; border: 1px solid #e2e8f0;' bgcolor='#ffffff'> <tbody> <tr> <td style='line-height: 24px; font-size: 16px; width: 100%; margin: 0;' align='left' bgcolor='#ffffff'> <table class='card-body' role='presentation' border='0' cellpadding='0' cellspacing='0' style='width: 100%;'> <tbody> <tr> <td style='line-height: 24px; font-size: 16px; width: 100%; margin: 0; padding: 20px;' align='left'> <h1 class='h3' style='padding-top: 0; padding-bottom: 0; font-weight: 500; vertical-align: baseline; font-size: 28px; line-height: 33.6px; margin: 0;' align='left'>STRIDES account update</h1> <table class='s-2 w-full' role='presentation' border='0' cellpadding='0' cellspacing='0' style='width: 100%;' width='100%'> <tbody> <tr> <td style='line-height: 8px; font-size: 8px; width: 100%; height: 8px; margin: 0;' align='left' width='100%' height='8'> &#160; </td></tr></tbody> </table> <h5 class='text-teal-700' style='color: #13795b; padding-top: 0; padding-bottom: 0; font-weight: 500; vertical-align: baseline; font-size: 20px; line-height: 24px; margin: 0;' align='left'>Your account has been approved, and is ready for use</h5> <table class='s-5 w-full' role='presentation' border='0' cellpadding='0' cellspacing='0' style='width: 100%;' width='100%'> <tbody> <tr> <td style='line-height: 20px; font-size: 20px; width: 100%; height: 20px; margin: 0;' align='left' width='100%' height='20'> &#160; </td></tr></tbody> </table> <table class='hr' role='presentation' border='0' cellpadding='0' cellspacing='0' style='width: 100%;'> <tbody> <tr> <td style='line-height: 24px; font-size: 16px; border-top-width: 1px; border-top-color: #e2e8f0; border-top-style: solid; height: 1px; width: 100%; margin: 0;' align='left'> </td></tr></tbody> </table> <table class='s-5 w-full' role='presentation' border='0' cellpadding='0' cellspacing='0' style='width: 100%;' width='100%'> <tbody> <tr> <td style='line-height: 20px; font-size: 20px; width: 100%; height: 20px; margin: 0;' align='left' width='100%' height='20'> &#160; </td></tr></tbody> </table> <div class='space-y-3'> <p class='text-gray-700' style='line-height: 24px; font-size: 16px; color: #4a5568; width: 100%; margin: 0;' align='left'>Dear {{name}},</p><table class='s-3 w-full' role='presentation' border='0' cellpadding='0' cellspacing='0' style='width: 100%;' width='100%'> <tbody> <tr> <td style='line-height: 12px; font-size: 12px; width: 100%; height: 12px; margin: 0;' align='left' width='100%' height='12'> &#160; </td></tr></tbody> </table> <p class='text-gray-700' style='line-height: 24px; font-size: 16px; color: #4a5568; width: 100%; margin: 0;' align='left'>You recently requested a {{SITE}} {{ACCOUNT_TYPE}} workspace account.</p><table class='s-3 w-full' role='presentation' border='0' cellpadding='0' cellspacing='0' style='width: 100%;' width='100%'> <tbody> <tr> <td style='line-height: 12px; font-size: 12px; width: 100%; height: 12px; margin: 0;' align='left' width='100%' height='12'> &#160; </td></tr></tbody> </table> <p class='text-gray-700' style='line-height: 24px; font-size: 16px; color: #4a5568; width: 100%; margin: 0;' align='left'>We are pleased to let you know that your account has been approved and is ready to use for workspaces.</p><table class='s-3 w-full' role='presentation' border='0' cellpadding='0' cellspacing='0' style='width: 100%;' width='100%'> <tbody> <tr> <td style='line-height: 12px; font-size: 12px; width: 100%; height: 12px; margin: 0;' align='left' width='100%' height='12'> &#160; </td></tr></tbody> </table> <p class='text-gray-700' style='line-height: 24px; font-size: 16px; color: #4a5568; width: 100%; margin: 0;' align='left'>To launch workspaces, please log in to <a href='{{SITE_URL}}' style='color: #0d6efd;'>{{SITE_URL}}</a></p><table class='s-3 w-full' role='presentation' border='0' cellpadding='0' cellspacing='0' style='width: 100%;' width='100%'> <tbody> <tr> <td style='line-height: 12px; font-size: 12px; width: 100%; height: 12px; margin: 0;' align='left' width='100%' height='12'> &#160; </td></tr></tbody> </table> <p class='text-gray-700' style='line-height: 24px; font-size: 16px; color: #4a5568; width: 100%; margin: 0;' align='left'>Please see the <a href='{{DOC_LINK}}' style='color: #0d6efd;'>documentation</a> to get started and learn about our workspaces.</p></div><table class='s-5 w-full' role='presentation' border='0' cellpadding='0' cellspacing='0' style='width: 100%;' width='100%'> <tbody> <tr> <td style='line-height: 20px; font-size: 20px; width: 100%; height: 20px; margin: 0;' align='left' width='100%' height='20'> &#160; </td></tr></tbody> </table> <table class='hr' role='presentation' border='0' cellpadding='0' cellspacing='0' style='width: 100%;'> <tbody> <tr> <td style='line-height: 24px; font-size: 16px; border-top-width: 1px; border-top-color: #e2e8f0; border-top-style: solid; height: 1px; width: 100%; margin: 0;' align='left'> </td></tr></tbody> </table> <table class='s-5 w-full' role='presentation' border='0' cellpadding='0' cellspacing='0' style='width: 100%;' width='100%'> <tbody> <tr> <td style='line-height: 20px; font-size: 20px; width: 100%; height: 20px; margin: 0;' align='left' width='100%' height='20'> &#160; </td></tr></tbody> </table> <p class='text-gray-700' style='line-height: 24px; font-size: 16px; color: #4a5568; width: 100%; margin: 0;' align='left'>Best regards,</p><p class='text-gray-700' style='line-height: 24px; font-size: 16px; color: #4a5568; width: 100%; margin: 0;' align='left'>{{SITE}} Team</p></td></tr></tbody> </table> </td></tr></tbody> </table> <table class='s-10 w-full' role='presentation' border='0' cellpadding='0' cellspacing='0' style='width: 100%;' width='100%'> <tbody> <tr> <td style='line-height: 40px; font-size: 40px; width: 100%; height: 40px; margin: 0;' align='left' width='100%' height='40'> &#160; </td></tr></tbody> </table> </td></tr></tbody> </table><!--[if (gte mso 9)|(IE)]> </td></tr></tbody> </table><![endif]--> </td></tr></tbody> </table> </td></tr></tbody> </table> </body></html>",
                    "TextPart": "Dear {{name}},\n\nYou recently requested a {{SITE}} {{ACCOUNT_TYPE}} workspace account. \n\nWe are pleased to let you know that your account has been approved and is ready to use for workspaces.\n\nTo launch workspaces, please log in to {{SITE_URL}}. \n\nPlease see the documentation to get started and learn about our workspaces: {{DOC_LINK}}\n\nBest regards\n{{SITE}} Team",
                }
            )
        except Exception as e:
            print(e)
            raise e

    def email_template(self, template_name):
        try:
            template = ses.get_template(TemplateName=template_name)
        except ClientError as e:
            if e.response["Error"]["Code"] == "TemplateDoesNotExist":
                self.create_email_template()
            else:
                raise e

    def send_email(self, data):
        email = data["user_id"]
        name = data["scientific_poc"]
        workspace_type = data["workspace_type"]
        site_settings = self.get_site_data()
        email_domain = os.environ.get("email_domain", None)
        if email_domain is None:
            raise ValueError("Could not find root account email domain.")
        from_addr = f"request@{email_domain}"

        try:
            response = ses.send_templated_email(
                Source=from_addr,
                Template=self.template_name,
                Destination={"ToAddresses": [email]},
                TemplateData='{ "name":"'
                + name
                + '", "SITE": "'
                + site_settings["site"]
                + '", "ACCOUNT_TYPE":"'
                + workspace_type
                + '", "SITE_URL":"'
                + site_settings["url"]
                + '","DOC_LINK":"'
                + site_settings["doc_link"]
                + '" }',
            )
        except Exception as e:
            print("error in send_email")
            raise e

    def get_site_data(self):
        email_domain = os.environ.get("email_domain", None)
        if email_domain == "planx-pla.net":
            return {
                "site": "Gen3 QA",
                "url": "https://qa-heal.planx-pla.net",
                "doc_link": "https://qa-heal.planx-pla.net/dashboard/Public/documentation/index.html#Workspaces",
            }
        elif email_domain == "brh-portal.org":
            return {
                "site": "BRH",
                "url": "https://brh.data-commons.org",
                "doc_link": "https://brh.data-commons.org/dashboard/Public/index.html#Workspaces",
            }
        elif email_domain == "healportal.org":
            return {
                "site": "HEAL",
                "url": "https://healdata.org",
                "doc_link": "https://healdata.org/dashboard/Public/documentation/index.html#Workspaces",
            }
        else:
            raise "Domain has not been added. Please add it to the code."

    def send_welcome_email(self, workspace_request_id):
        try:
            data = self.db_client.get_all_by_workspace_request_id(workspace_request_id)
        except Exception as e:
            print("error querying db for data from workspace_request_id")
            raise e

        # verify email template exists
        self.email_template(self.template_name)

        # send email using template
        self.send_email(data)
