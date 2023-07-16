import {Construct} from "constructs";
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';

export interface iamProps {
    logs3: s3.Bucket
};

export class Iam extends Construct {

    public readonly ecsTaskRole: iam.Role
    public readonly ecsTaskExecutionRole: iam.Role
    public readonly fluentBitRole: iam.Role

    constructor(scope: Construct, id: string, props: iamProps) {
        super(scope, id);

        const executionPolicy = iam.ManagedPolicy.fromManagedPolicyArn(this, 'AmazonECSTaskExecutionRolePolicy',
            'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy')

        this.ecsTaskExecutionRole = new iam.Role(this, 'ecs-task-execution-role', {
            roleName: `ecs-task-execution-role-${cdk.Stack.of(this).region}`,
            assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        });
        this.ecsTaskExecutionRole.addManagedPolicy(executionPolicy)

        this.ecsTaskRole = new iam.Role(this, 'ecs-task-role', {
            roleName: `ecs-task-role-${cdk.Stack.of(this).region}`,
            assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        });
        this.ecsTaskRole.addManagedPolicy(executionPolicy)

        // policy document
        const fluentbitRolePolicyDocument = iam.PolicyDocument.fromJson({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents",
                            "logs:DescribeLogStreams"
                        ],
                        "Resource": [
                            "arn:aws:logs:*:*:*"
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:PutObject"
                        ],
                        "Resource": props.logs3.bucketArn + "/*",
                    }
                ]
            }
        );

        const fluentbitPolicy  = new iam.Policy(this, 'fluentbitPolicy', {
            policyName: 'ecs-fluentbit-policy',
            document: fluentbitRolePolicyDocument,
        });
        this.fluentBitRole = new iam.Role(this, 'fluentBitRole', {
            assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
            roleName: "ecs-fluentbit-role"
        })
        this.fluentBitRole.attachInlinePolicy(fluentbitPolicy);
    }
}
