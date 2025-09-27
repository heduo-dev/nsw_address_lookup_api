import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';

export class ExpressAppStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create CloudWatch Log Group
    const logGroup = new logs.LogGroup(this, 'ExpressLambdaLogGroup', {
      logGroupName: '/aws/lambda/express-typescript-api-dev',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambda function using NodejsFunction for automatic bundling
    const expressLambda = new nodejs.NodejsFunction(this, 'ExpressFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: 'src/lambda.ts',
      handler: 'handler',
      memorySize: 128,
      timeout: cdk.Duration.seconds(30),
      environment: {
        NODE_ENV: 'dev',
      },
      logGroup: logGroup,
      bundling: {
        minify: false,              // Keep false for easier debugging
        sourceMap: true,            // Include source maps
        target: 'es2020',
        externalModules: [],        // Don't exclude any modules
        nodeModules: ['express', 'serverless-http'], // Force include these
        format: nodejs.OutputFormat.CJS, // CommonJS format
        mainFields: ['main'],       // Use 'main' field from package.json
        banner: '// Lambda function bundle',
        footer: '// End of bundle',
        define: {
          'process.env.NODE_ENV': '"dev"'
        }
      },
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'ExpressApi', {
      restApiName: 'express-typescript-api-dev',
      description: 'Express TypeScript API Gateway',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
      },
    });

    // Lambda integration
    const lambdaIntegration = new apigateway.LambdaIntegration(expressLambda, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    // Add proxy resource to handle all routes
    api.root.addMethod('ANY', lambdaIntegration);
    api.root.addProxy({
      defaultIntegration: lambdaIntegration,
      anyMethod: true,
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: expressLambda.functionName,
      description: 'Lambda Function Name',
    });
  }
}