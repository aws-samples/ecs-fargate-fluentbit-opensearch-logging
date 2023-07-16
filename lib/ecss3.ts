import {Construct} from "constructs";
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cdk from 'aws-cdk-lib';
import {Constants} from "./Constants";

export class Ecss3 extends Construct {

    public readonly logs3: s3.Bucket

    constructor(scope: Construct, id: string) {
        super(scope, id);
        // S3 -------------------------------------------------------------------------------------------
        // Create S3
        this.logs3 = new s3.Bucket(this, 'MyBucket', {
            bucketName: Constants.LOG_BUCKET,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            publicReadAccess: false,
            removalPolicy: cdk.RemovalPolicy.DESTROY, // destroy s3 when delete stack.
        });

        // Output S3
        new cdk.CfnOutput(this, 'S3 bucket', {
            value: this.logs3.bucketName
        });
    }
}
