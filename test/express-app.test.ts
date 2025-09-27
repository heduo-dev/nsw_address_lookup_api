import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { ExpressAppStack } from '../lib/express-app-stack';

describe('ExpressAppStack', () => {
  let template: Template;

  beforeEach(() => {
    const app = new cdk.App();
    const stack = new ExpressAppStack(app, 'TestStack');
    template = Template.fromStack(stack);
  });

  test('Lambda Function Created', () => {
    // NodejsFunction creates a Lambda function
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs20.x',
      Handler: 'index.handler', // NodejsFunction uses 'index.handler' by default
      MemorySize: 128,
      Timeout: 30,
    });
  });

  test('Lambda Function has correct environment variables', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Environment: {
        Variables: {
          NODE_ENV: 'dev',
        },
      },
    });
  });

  test('API Gateway Created', () => {
    template.hasResourceProperties('AWS::ApiGateway::RestApi', {
      Name: 'express-typescript-api-dev',
    });
  });

  test('API Gateway has CORS enabled', () => {
    // Check that CORS is configured
    template.hasResourceProperties('AWS::ApiGateway::Method', {
      HttpMethod: 'OPTIONS',
    });
  });

  test('CloudWatch Log Group Created', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: '/aws/lambda/express-typescript-api-dev',
      RetentionInDays: 7,
    });
  });

  test('Lambda has permission to write to CloudWatch', () => {
    // NodejsFunction automatically creates IAM role with CloudWatch permissions
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      },
    });
  });

  test('Stack outputs are created', () => {
    // Check that the stack has the expected outputs
    const outputs = template.findOutputs('*');
    expect(Object.keys(outputs)).toContain('ApiUrl');
    expect(Object.keys(outputs)).toContain('LambdaFunctionName');
  });
});