import {Construct} from "constructs";
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cdk from 'aws-cdk-lib';
import {Constants} from "./Constants";

export class Vpc extends Construct {

    public readonly vpc: ec2.Vpc;
    public readonly publicHttpSG: ec2.SecurityGroup;
    public readonly containerHttpSG: ec2.SecurityGroup;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        // create a vpc
        this.vpc = new ec2.Vpc(this, 'MyVPC', {
            ipAddresses: ec2.IpAddresses.cidr(Constants.VPC_CIDR),
            maxAzs: 2,
            subnetConfiguration: [
                {
                    name: 'PublicSubnet',
                    subnetType: ec2.SubnetType.PUBLIC,
                    cidrMask: 24
                },
                {
                    name: 'PrivateSubnet',
                    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidrMask: 24
                }
            ],
        });

        // Security group -------------------------------------------------------------------------------------------
        this.publicHttpSG = new ec2.SecurityGroup(this, 'public-http', {
            securityGroupName: 'public-http-sg',
            vpc: this.vpc,
            allowAllOutbound: true,
        });

        // Ingress Rule
        this.publicHttpSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP traffic');
        this.publicHttpSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow HTTPS traffic');

        // container-http security group
        this.containerHttpSG = new ec2.SecurityGroup(this, 'container-http', {
            securityGroupName: 'container-http-sg',
            vpc: this.vpc,
            allowAllOutbound: true,
        });

        // Ingress Rule
        this.containerHttpSG.addIngressRule(this.publicHttpSG, ec2.Port.tcp(80), 'Allow HTTP traffic');
        this.containerHttpSG.addIngressRule(this.publicHttpSG, ec2.Port.tcp(443), 'Allow HTTPS traffic');

        // Security Group -------------------------------------------------------------------------------------------

        // Output VPC ID
        new cdk.CfnOutput(this, 'VPCId', {
            value: this.vpc.vpcId
        });

    }
}
