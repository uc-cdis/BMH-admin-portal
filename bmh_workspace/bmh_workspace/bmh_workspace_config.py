class BMHWorkspaceConfig():
    """ Convenience class used to store SSM Paramter names among other 
    parameters which need to be internally consistent. Note: lambda functions
    which need to read these parameters will have access to read *all* parameters that
    have a /bmh/ prefix (i.e. if you include a parameter name without this prefix, most of
    the lambda functions will not be able to read them.) """

    @classmethod
    def get_config(cls):
        return {
            "cur_bucket_name": "/bmh/cost-and-usage-report/bucket-name",
            "cur_prefix":      "/bmh/cost-and-usage-report/prefix",
            "cur_report_name": "/bmh/cost-and-usage-report/report-name",
            "bmh_portal_uri":  "/bmh/portal_uri",
            "workspace_id":    "/bmh/workspace_id",
            "api_key":         "/bmh/portal_api_key"
        }