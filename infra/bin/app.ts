#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { PathStack } from "../lib/path-stack";

const app = new cdk.App();

new PathStack(app, "PathAgentDesigner", {
  env: {
    region: process.env.CDK_DEFAULT_REGION || "ap-northeast-2",
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
  description: "P.A.T.H Agent Designer — Amplify + AgentCore",
});
