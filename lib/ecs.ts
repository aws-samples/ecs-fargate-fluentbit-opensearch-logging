import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as logs from 'aws-cdk-lib/aws-logs';
import {Construct} from "constructs";
import * as iam from 'aws-cdk-lib/aws-iam';

export interface ecsProps {
    executionRole: iam.Role,
    taskRole: iam.Role,

};

export class Ecs extends Construct {

    public readonly fluentbitECR;

    constructor(scope: Construct, id: string, props: ecsProps) {
        super(scope, id);

        const taskDefinition = new ecs.FargateTaskDefinition(this, 'NginxTaskDefinition', {
            memoryLimitMiB: 512,
            cpu: 256,
            executionRole: props.executionRole,
            taskRole: props.taskRole,
            networkMode: ecs.NetworkMode.AWS_VPC,
        });

        // add container definition
        const containerDefinition1 = taskDefinition.addContainer('nginx', {
            image: ecs.ContainerImage.fromRegistry('nginx'),
            memoryLimitMiB: 256,
            cpu: 128,
            essential: true,
            logging: ecs.LogDrivers.firelens(),
        });



    }
}
