import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import {Construct} from "constructs";
import {readFileSync} from 'fs';
import {Domain} from 'aws-cdk-lib/aws-opensearchservice';
import {AmazonLinuxCpuType, AmazonLinuxGeneration, MachineImage} from "aws-cdk-lib/aws-ec2";

export interface ec2Props {
    vpc: ec2.Vpc,
    ec2ProxySG: ec2.SecurityGroup,
    domainEndpoint: string,
    domain: Domain,
};

export class ProxyEC2 extends Construct {

    constructor(scope: Construct, id: string, props: ec2Props) {
        super(scope, id);

        const role = new iam.Role(this, 'ec2Role', {
            assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com')
        })

        role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'))

        const ami = new ec2.AmazonLinuxImage({
            generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2023,
            cpuType: ec2.AmazonLinuxCpuType.X86_64
        });

        // Create the instance using the Security Group, AMI, and KeyPair defined in the VPC created
        const ec2Instance = new ec2.Instance(this, 'ProxyInstance', {
            vpc: props.vpc,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
            machineImage: MachineImage.latestAmazonLinux2023({
                cpuType: AmazonLinuxCpuType.X86_64,
            }),
            securityGroup: props.ec2ProxySG,
            vpcSubnets: {subnetType: ec2.SubnetType.PUBLIC},

            role: role
        });
        const userDataScript = readFileSync('./lib/ec2/user-data.sh', 'utf8')
            .replace("${OpenSearch_Endpoint}", props.domainEndpoint);
        ec2Instance.addUserData(userDataScript)
    }
}
