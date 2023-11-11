import {Construct} from "constructs";
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import {Constants} from "./Constants";

export interface logS3Props {
    s3EventLambda: lambda.Function,
    vpc: ec2.Vpc
};

export class LogS3 extends Construct {

    public readonly logs3: s3.Bucket

    constructor(scope: Construct, id: string, props: logS3Props) {
        super(scope, id);
        // S3 -------------------------------------------------------------------------------------------
        // Create S3
        this.logs3 = new s3.Bucket(this, 'MyBucket', {
            bucketName: Constants.LOG_BUCKET,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            publicReadAccess: false,
            autoDeleteObjects: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY, // destroy s3 when delete stack.
        });

        this.logs3.addEventNotification(
            s3.EventType.OBJECT_CREATED,
            new s3n.LambdaDestination(props.s3EventLambda),
            // 👇 only invoke lambda if object matches the filter
            {prefix: 'fluent-bit-logs/'},
        );

        this.logs3.grantRead(props.s3EventLambda)
        const s3VpcEndpoint = props.vpc.addGatewayEndpoint('S3VpcEndpoint', {
            service: ec2.GatewayVpcEndpointAwsService.S3,
            subnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
        });

        // Output S3
        new cdk.CfnOutput(this, 'S3 bucket', {
            value: this.logs3.bucketName
        });
    }
}
