import {Construct} from "constructs";
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cdk from 'aws-cdk-lib';
import {Constants} from "./Constants";

export interface lambdaProps {
    s3EventLambda: lambda.Function
};

export class LogS3 extends Construct {

    public readonly logs3: s3.Bucket

    constructor(scope: Construct, id: string, props: lambdaProps) {
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

        // Output S3
        new cdk.CfnOutput(this, 'S3 bucket', {
            value: this.logs3.bucketName
        });
    }
}
