import {Construct} from "constructs";
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdanodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from "aws-cdk-lib/aws-ec2";

export interface lambdaProps {
    vpc: ec2.Vpc,
    openSearchDomain: string
};
export class Lambda extends Construct {

    public readonly s3EventLambda: lambda.Function;

    constructor(scope: Construct, id: string, props: lambdaProps) {
        super(scope, id);

        const s3EventRole = new iam.Role(this, 'S3EventRole', {
            roleName: `S3-Event-Lambda-Role-${cdk.Stack.of(this).region}`,
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchFullAccess'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2FullAccess'),
            ],
        });

        const functionSettings : lambdanodejs.NodejsFunctionProps = {
            handler: 'handler',
            runtime: lambda.Runtime.NODEJS_18_X,
            memorySize: 128,
            timeout: cdk.Duration.seconds(60),
            architecture: cdk.aws_lambda.Architecture.X86_64,
            role: s3EventRole,
            logRetention: cdk.aws_logs.RetentionDays.ONE_DAY,
            vpc: props.vpc,
            allowPublicSubnet: false,
            environment: {
                OPENSEARCH_HOST: props.openSearchDomain,
            }
        }

        this.s3EventLambda = new lambdanodejs.NodejsFunction(this, 'S3Event-Function', {
            functionName: 'ECS-Log-S3Event-Function',
            entry:  './resources/lambda/handle-s3-event.ts',
            ...functionSettings
        });
    }
}
