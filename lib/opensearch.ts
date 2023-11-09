import {Construct} from "constructs";
import { RemovalPolicy }  from 'aws-cdk-lib';
import {EngineVersion,Domain} from 'aws-cdk-lib/aws-opensearchservice';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from "aws-cdk-lib/aws-iam";
import * as cdk from "aws-cdk-lib";

export interface opensearchProps {
    vpc: ec2.Vpc,
    opensearchSG: ec2.SecurityGroup,
};

export class Opensearch extends Construct {

    public readonly domainEndpoint;
    public readonly domain;

    constructor(scope: Construct, id: string, props: opensearchProps) {
        super(scope, id);
        const devDomain = new Domain(this, 'Domain', {
            version: EngineVersion.OPENSEARCH_2_5,
            removalPolicy: RemovalPolicy.DESTROY,
            vpc:props.vpc,
            zoneAwareness: {
                enabled:true
            },
            securityGroups: [props.opensearchSG],
            capacity: {
                dataNodes: 2,
                dataNodeInstanceType:'r6g.large.search'
            },
            vpcSubnets: [{subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS}],
            ebs: {
                volumeSize: 300,
                volumeType: ec2.EbsDeviceVolumeType.GENERAL_PURPOSE_SSD_GP3,
            },
        });

        devDomain.addAccessPolicies(new iam.PolicyStatement({

            actions: ['es:*'],
            effect: iam.Effect.ALLOW,
            principals:[new iam.AnyPrincipal()],
            resources: [`${devDomain.domainArn}/*`],
        }))


        this.domainEndpoint = devDomain.domainEndpoint;
        this.domain = devDomain;

        new cdk.CfnOutput(this, 'opensearch-domain-endpoint', {
            value: this.domainEndpoint,
        });
    }
}
