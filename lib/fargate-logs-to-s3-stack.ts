import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {Vpc} from "./vpc";
import {LogS3} from "./logS3";
import {Iam} from "./iam";
import {Ecr} from "./ecr";
import {Ecs} from "./ecs";
import {Lambda} from "./Lambda";

export class FargateLogsToS3Stack extends cdk.Stack {

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const ecs_vpc = new Vpc(this,"ecs_vpc");
    const s3Lambda = new Lambda(this, "s3lambda")
    const logs3 = new LogS3(this, "ecs_s3", s3Lambda);

    const ecsIam = new Iam(this, "ecsIam", {
      logs3: logs3.logs3,
    })
    const fluentbitECR = new Ecr(this,"fluentbit-ecr")

    const ecsNginx = new Ecs(this, 'nginxECS', {
      executionRole: ecsIam.ecsTaskExecutionRole,
      taskRole: ecsIam.ecsTaskRole,
      fulentBitRole: ecsIam.fluentBitRole,
      fluentBitRepository: fluentbitECR.fluentbitECR,
      ecsVpc: ecs_vpc.vpc
    })
  }
}
