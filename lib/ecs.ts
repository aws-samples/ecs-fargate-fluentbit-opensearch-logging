import * as ecs from 'aws-cdk-lib/aws-ecs';
import {Construct} from "constructs";
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export interface ecsProps {
    executionRole: iam.Role,
    taskRole: iam.Role,
    fulentBitRole: iam.Role
    fluentBitRepository: ecr.IRepository
    ecsVpc: ec2.Vpc;
};

export class Ecs extends Construct {

    constructor(scope: Construct, id: string, props: ecsProps) {
        super(scope, id);

        const cluster = new ecs.Cluster(this, 'Cluster', {
            vpc: props.ecsVpc,
            clusterName: 'Nginx-Cluster',
            enableFargateCapacityProviders: true,
        });

        const taskDefinition = new ecs.FargateTaskDefinition(this, 'NginxTaskDefinition', {
            memoryLimitMiB: 1024,
            cpu: 512,
            executionRole: props.executionRole,
            taskRole: props.taskRole,
        });

        const nginxLog = new ecs.AwsLogDriver({
            streamPrefix: "nginx-log",
        })

        const fluentBitLog = new ecs.AwsLogDriver({
            streamPrefix: "fluent-bit-log",
        })

        //add container definition
        const nginxContainer = taskDefinition.addContainer('nginx', {
            image: ecs.ContainerImage.fromRegistry('nginx'),
            memoryLimitMiB: 256,
            cpu: 128,
            essential: true,
            logging: nginxLog,
            portMappings: [
                {
                    containerPort:80,
                    hostPort:80
                }
            ]
        });

        const fluentBitContainer = taskDefinition.addContainer('fluent-bit', {
            image: ecs.ContainerImage.fromEcrRepository(props.fluentBitRepository),
            memoryLimitMiB: 256,
            cpu: 128,
            essential: true,
            logging: fluentBitLog,
        });

        const ecsService = new ecs.FargateService(this, 'NginxService', {
            cluster,
            taskDefinition,
            capacityProviderStrategies: [
                {
                    capacityProvider: 'FARGATE_SPOT',
                    weight: 2,
                },
                {
                    capacityProvider: 'FARGATE',
                    weight: 1,
                },
            ]
        });

    }
}
