import {Construct} from "constructs";
import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';

export class Ecr extends Construct {

    public readonly fluentbitECR;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        this.fluentbitECR = new ecr.Repository(this, 'fluentbit-ecr', {
            repositoryName: 'fluentbit-nginx'
        });

        new cdk.CfnOutput(this, 'ECR-Repo', {
            value: this.fluentbitECR.repositoryArn
        });
    }
}
