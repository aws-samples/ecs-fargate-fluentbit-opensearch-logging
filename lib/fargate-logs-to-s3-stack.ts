import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {Vpc} from "./vpc";
import {Ecss3} from "./ecss3";
import {Iam} from "./iam";

export class FargateLogsToS3Stack extends cdk.Stack {

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const ecs_vpc = new Vpc(this,"ecs_vpc");
    const ecss3 = new Ecss3(this, "ecs_s3");
    const ecsIam = new Iam(this, "ecsIam", {
      logs3: ecss3.logs3,
    })


  }
}
