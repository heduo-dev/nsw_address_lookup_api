#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ExpressAppStack } from '../lib/express-app-stack';

const app = new cdk.App();

new ExpressAppStack(app, 'ExpressAppStack-dev', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  tags: {
    Environment: 'dev',
    Application: 'express-typescript-api',
  },
});