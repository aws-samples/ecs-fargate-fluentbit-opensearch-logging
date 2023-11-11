import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {Vpc} from "./vpc";
import {LogS3} from "./logS3";
import {Iam} from "./iam";
import {Ecr} from "./ecr";
import {Ecs} from "./ecs";
import {Lambda} from "./Lambda";
import {Opensearch} from "./opensearch";
import {ProxyEC2} from "./ec2";

export class FargateLogsToS3Stack extends cdk.Stack {

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const ecs_vpc = new Vpc(this,"ecs_vpc");

    const opensearchDomain = new Opensearch(this, 'log-openserach', {vpc: ecs_vpc.vpc,
      opensearchSG: ecs_vpc.opensearchSG});

    const s3Lambda = new Lambda(this, "s3lambda", {vpc: ecs_vpc.vpc, openSearchDomain: opensearchDomain.domainEndpoint})
    const logs3 = new LogS3(this, "ecs_s3", {s3EventLambda: s3Lambda.s3EventLambda, vpc: ecs_vpc.vpc});

    const ecsIam = new Iam(this, "ecsIam", {
      logs3: logs3.logs3,
    });
    const fluentbitECR = new Ecr(this,"fluentbit-ecr");

    const ecsNginx = new Ecs(this, 'nginxECS', {
      executionRole: ecsIam.ecsTaskExecutionRole,
      taskRole: ecsIam.ecsTaskRole,
      fulentBitRole: ecsIam.fluentBitRole,
      fluentBitRepository: fluentbitECR.fluentbitECR,
      ecsVpc: ecs_vpc.vpc
    });

    const opensearchProxyEC2 = new ProxyEC2(this, 'proxy-ec2', {vpc: ecs_vpc.vpc,
      ec2ProxySG: ecs_vpc.proxyEC2SG,
      domain: opensearchDomain.domain,
      domainEndpoint: opensearchDomain.domainEndpoint});

  }
}
