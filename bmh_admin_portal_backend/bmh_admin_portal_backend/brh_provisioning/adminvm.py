from aws_cdk import (
    core,
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_ssm as ssm,
)

from ..bmh_admin_portal_config import BMHAdminPortalBackendConfig


class AdminVM(core.Construct):
    def __init__(self, scope: core.Construct, construct_id: str, **kwargs) -> None:
        
        super().__init__(scope, construct_id, **kwargs)
        
        config = BMHAdminPortalBackendConfig.get_config()

        vpc = ec2.Vpc(
            self, 'adminvm-vpc',
            subnet_configuration=[ec2.SubnetConfiguration(
                cidr_mask=28,
                name='AdminVM-Public',
                subnet_type=ec2.SubnetType.PUBLIC
            )]
        )

        instance = ec2.Instance(
            self, "brh-admin-vm",
            instance_type=ec2.InstanceType("t3.medium"),
            machine_image=ec2.MachineImage.latest_amazon_linux(),
            vpc=vpc,
            instance_name='Gen3-Admin-VM-BRH'
        )
        instance.role.add_managed_policy(iam.ManagedPolicy.from_aws_managed_policy_name("AdministratorAccess"))

        ssm.StringParameter(
            self, "admin-vm-instance-id-parameter",
            description="Admin VM Instance ID parameter",
            parameter_name=config['admin_vm_instance_id_param_name'],
            string_value=instance.instance_id
        )


