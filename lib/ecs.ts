import * as ecs from 'aws-cdk-lib/aws-ecs';
import {Construct} from "constructs";
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import {Duration} from "aws-cdk-lib";
import * as cdk from 'aws-cdk-lib';

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

        //Cluster
        const cluster = new ecs.Cluster(this, 'Cluster', {
            vpc: props.ecsVpc,
            clusterName: 'Nginx-Cluster',
            enableFargateCapacityProviders: true,
        });

        //Task Definition
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
            ],
            healthCheck: {
                command: [ "CMD-SHELL", "curl -f http://localhost/ || exit 1" ],
                // the properties below are optional
                interval: Duration.seconds(30),
                retries: 3,
                startPeriod: Duration.seconds(10),
                timeout: Duration.seconds(30),
            },
        });

        const fluentBitContainer = taskDefinition.addContainer('fluent-bit', {
            image: ecs.ContainerImage.fromEcrRepository(props.fluentBitRepository),
            memoryLimitMiB: 256,
            cpu: 128,
            essential: true,
            logging: fluentBitLog,
        });

        // Service
        const sg_service = new ec2.SecurityGroup(this, 'MySGService', { vpc: props.ecsVpc });
        sg_service.addIngressRule(ec2.Peer.ipv4('0.0.0.0/0'), ec2.Port.tcp(80));
        const ecsService = new ecs.FargateService(this, 'NginxService', {
            cluster,
            taskDefinition,
            securityGroups: [sg_service],
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

        // Setup AutoScaling policy
        const scaling = ecsService.autoScaleTaskCount({ maxCapacity: 2, minCapacity: 1 });
        scaling.scaleOnCpuUtilization('CpuScaling', {
            targetUtilizationPercent: 60,
            scaleInCooldown: Duration.seconds(60),
            scaleOutCooldown: Duration.seconds(60)
        });

        // ALB
        const lb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
            vpc: props.ecsVpc,
            internetFacing: true
        });

        const listener = lb.addListener('Listener', {
            port: 80,
        });

        listener.addTargets('Target', {
            port: 80,
            targets: [ecsService],
            healthCheck: { path: '/' }
        });

        listener.connections.allowDefaultPortFromAnyIpv4('Open to the world');

        new cdk.CfnOutput(this, 'albDNS', {
            value: lb.loadBalancerDnsName,
        });

    }
}
