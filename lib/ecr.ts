import {Construct} from "constructs";
import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as assets from 'aws-cdk-lib/aws-ecr-assets';
import * as ecrdeploy from 'cdk-ecr-deployment';

export class Ecr extends Construct {

    public readonly fluentbitECR;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        this.fluentbitECR = new ecr.Repository(this, 'fluentbit-ecr', {
            repositoryName: 'fluentbit-nginx'
        });

        const dockerImage = new assets.DockerImageAsset(this, 'fluent-bit-image',
        {
            directory: './lib/fluentbit', // 指向包含 Dockerfile 和应用程序代码的目录
        });

        new ecrdeploy.ECRDeployment(this, 'fluent-bit-ecr-dockerimage', {
            src: new ecrdeploy.DockerImageName(dockerImage.imageUri),
            dest: new ecrdeploy.DockerImageName(`${cdk.Aws.ACCOUNT_ID}.dkr.ecr.${cdk.Aws.REGION}.amazonaws.com/${this.fluentbitECR.repositoryName}:latest`),
        });

        new cdk.CfnOutput(this, 'ECR-Repo', {
            value: this.fluentbitECR.repositoryArn
        });

        new cdk.CfnOutput(this, 'DockerImageUri', {
            value: dockerImage.imageUri,
        });
    }
}
