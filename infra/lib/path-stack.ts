import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3assets from "aws-cdk-lib/aws-s3-assets";
import { aws_bedrockagentcore as bedrockagentcore } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as path from "path";

export class PathStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ──────────────────────────────────────────────
    // 1. DynamoDB Table — session storage
    // ──────────────────────────────────────────────

    const sessionsTable = new dynamodb.Table(this, "SessionsTable", {
      tableName: "path-agent-designer-sessions",
      partitionKey: { name: "session_id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
    });

    // ──────────────────────────────────────────────
    // 2. Agent Code Asset — S3 upload of deployment ZIP
    // ──────────────────────────────────────────────

    const agentCodeAsset = new s3assets.Asset(this, "AgentCodeAsset", {
      path: path.join(__dirname, "../../path-strands-agent/deployment_package.zip"),
    });

    // ──────────────────────────────────────────────
    // 3. IAM Role — AgentCore Runtime execution
    // ──────────────────────────────────────────────

    const agentRole = new iam.Role(this, "AgentCoreRole", {
      roleName: "PATH-AgentCore-Runtime",
      assumedBy: new iam.ServicePrincipal("bedrock-agentcore.amazonaws.com"),
      description: "IAM role for P.A.T.H AgentCore Runtime",
    });

    // Bedrock model invocation
    agentRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream",
        ],
        resources: [
          "arn:aws:bedrock:*::foundation-model/*",
          `arn:aws:bedrock:*:${this.account}:*`,
        ],
      }),
    );

    // S3 read access for code artifact
    agentRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["s3:GetObject", "s3:GetBucketLocation"],
        resources: [
          agentCodeAsset.bucket.bucketArn,
          `${agentCodeAsset.bucket.bucketArn}/*`,
        ],
      }),
    );

    // CloudWatch Logs
    agentRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
        ],
        resources: [
          `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/bedrock-agentcore/runtimes/*`,
        ],
      }),
    );

    // X-Ray tracing
    agentRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords",
          "xray:GetSamplingRules",
          "xray:GetSamplingTargets",
        ],
        resources: ["*"],
      }),
    );

    // CloudWatch metrics
    agentRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["cloudwatch:PutMetricData"],
        resources: ["*"],
        conditions: {
          StringEquals: { "cloudwatch:namespace": "bedrock-agentcore" },
        },
      }),
    );

    // Workload identity (required by AgentCore)
    agentRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "bedrock-agentcore:GetWorkloadAccessToken",
          "bedrock-agentcore:GetWorkloadAccessTokenForJWT",
          "bedrock-agentcore:GetWorkloadAccessTokenForUserId",
        ],
        resources: [
          `arn:aws:bedrock-agentcore:${this.region}:${this.account}:workload-identity-directory/default`,
          `arn:aws:bedrock-agentcore:${this.region}:${this.account}:workload-identity-directory/default/workload-identity/*`,
        ],
      }),
    );

    // ──────────────────────────────────────────────
    // 4. AgentCore Runtime — Direct Code Deploy
    // ──────────────────────────────────────────────

    const runtime = new bedrockagentcore.CfnRuntime(this, "AgentRuntime", {
      agentRuntimeName: "PATH_Agent_Designer",
      description: "P.A.T.H Agent Designer — Feasibility, Pattern, Spec agents",
      agentRuntimeArtifact: {
        codeConfiguration: {
          code: {
            s3: {
              bucket: agentCodeAsset.s3BucketName,
              prefix: agentCodeAsset.s3ObjectKey,
            },
          },
          entryPoint: ["agentcore_entrypoint.py"],
          runtime: "PYTHON_3_11",
        },
      },
      networkConfiguration: {
        networkMode: "PUBLIC",
      },
      protocolConfiguration: "HTTP",
      roleArn: agentRole.roleArn,
      environmentVariables: {
        AWS_DEFAULT_REGION: this.region,
        BEDROCK_MODEL_ID: "global.anthropic.claude-opus-4-6-v1",
      },
    });

    runtime.node.addDependency(agentRole);

    // ──────────────────────────────────────────────
    // 5. AgentCore Runtime Endpoint — invokable endpoint
    // ──────────────────────────────────────────────

    const endpoint = new bedrockagentcore.CfnRuntimeEndpoint(
      this,
      "AgentEndpoint",
      {
        agentRuntimeId: runtime.attrAgentRuntimeId,
        name: "PATH_Agent_Endpoint",
        description: "Default endpoint for PATH Agent Designer",
      },
    );

    endpoint.node.addDependency(runtime);

    // ──────────────────────────────────────────────
    // 6. IAM Role — Amplify (Next.js) execution
    // ──────────────────────────────────────────────

    const amplifyRole = new iam.Role(this, "AmplifyRole", {
      roleName: "PATH-Amplify-Execution",
      assumedBy: new iam.ServicePrincipal("amplify.amazonaws.com"),
      description: "IAM role for P.A.T.H Amplify Next.js app",
    });

    // AgentCore invocation
    amplifyRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["bedrock-agentcore:InvokeAgentRuntime"],
        resources: [
          runtime.attrAgentRuntimeArn,
          `${runtime.attrAgentRuntimeArn}/*`,
        ],
      }),
    );

    // DynamoDB CRUD for sessions
    sessionsTable.grantReadWriteData(amplifyRole);

    // ──────────────────────────────────────────────
    // Outputs
    // ──────────────────────────────────────────────

    new cdk.CfnOutput(this, "AgentRuntimeArn", {
      value: runtime.attrAgentRuntimeArn,
      description: "AgentCore Runtime ARN (set as AGENT_RUNTIME_ARN in Amplify env)",
    });

    new cdk.CfnOutput(this, "AgentRuntimeId", {
      value: runtime.attrAgentRuntimeId,
      description: "AgentCore Runtime ID",
    });

    new cdk.CfnOutput(this, "AgentEndpointArn", {
      value: endpoint.attrAgentRuntimeEndpointArn,
      description: "AgentCore Runtime Endpoint ARN",
    });

    new cdk.CfnOutput(this, "SessionsTableName", {
      value: sessionsTable.tableName,
      description: "DynamoDB sessions table name",
    });

    new cdk.CfnOutput(this, "AmplifyRoleArn", {
      value: amplifyRole.roleArn,
      description: "Amplify execution role ARN",
    });
  }
}
