import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface AuthServiceStackProps extends cdk.StackProps {
  readonly userPoolId: string;
  readonly userPoolClientId: string;
  readonly databaseSecretArn: string;
  readonly databaseEndpoint: string;
  readonly databaseName: string;
  readonly vpcId: string;
}

export class AuthServiceStack extends cdk.Stack {
  public readonly apiEndpoint: string;
  public readonly lambdaFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: AuthServiceStackProps) {
    super(scope, id, props);

    // ========================================================================
    // IAM Role for Lambda
    // ========================================================================

    const lambdaRole = new iam.Role(this, 'AuthLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
      ],
      inlinePolicies: {
        CognitoPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'cognito-idp:AdminInitiateAuth',
                'cognito-idp:AdminRespondToAuthChallenge',
                'cognito-idp:SignUp',
                'cognito-idp:InitiateAuth',
                'cognito-idp:GetUser',
                'cognito-idp:UpdateUserAttributes',
                'cognito-idp:GlobalSignOut',
                'cognito-idp:ForgotPassword',
                'cognito-idp:ConfirmForgotPassword',
              ],
              resources: [`arn:aws:cognito-idp:${this.region}:${this.account}:userpool/${props.userPoolId}`],
            }),
          ],
        }),
        SecretsManagerPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['secretsmanager:GetSecretValue'],
              resources: [props.databaseSecretArn],
            }),
          ],
        }),
      },
    });

    // ========================================================================
    // Lambda Function
    // ========================================================================

    this.lambdaFunction = new lambda.Function(this, 'AuthLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../services/auth-service/dist'),
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        USER_POOL_ID: props.userPoolId,
        USER_POOL_CLIENT_ID: props.userPoolClientId,
        DATABASE_SECRET_ARN: props.databaseSecretArn,
        DATABASE_HOST: props.databaseEndpoint.split(':')[0],
        DATABASE_NAME: props.databaseName,
        STAGE: 'dev',
      },
      loggingFormat: lambda.LoggingFormat.JSON,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // ========================================================================
    // API Gateway
    // ========================================================================

    const api = new apigateway.RestApi(this, 'AuthApi', {
      restApiName: 'QuickCorpID Auth API',
      description: 'Authentication endpoints for QuickCorpID',
      deployOptions: {
        stageName: 'v1',
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: false, // Disable for production
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token'],
      },
    });

    // Auth routes
    const authResource = api.root.addResource('auth');

    // POST /auth/signup
    authResource.addResource('signup').addMethod('POST', new apigateway.LambdaIntegration(this.lambdaFunction));

    // POST /auth/signin
    authResource.addResource('signin').addMethod('POST', new apigateway.LambdaIntegration(this.lambdaFunction));

    // POST /auth/refresh
    authResource.addResource('refresh').addMethod('POST', new apigateway.LambdaIntegration(this.lambdaFunction));

    // POST /auth/logout
    authResource.addResource('logout').addMethod('POST', new apigateway.LambdaIntegration(this.lambdaFunction));

    // GET/PUT /auth/me
    const meResource = authResource.addResource('me');
    meResource.addMethod('GET', new apigateway.LambdaIntegration(this.lambdaFunction));
    meResource.addMethod('PUT', new apigateway.LambdaIntegration(this.lambdaFunction));

    // POST /auth/forgot-password
    authResource.addResource('forgot-password').addMethod('POST', new apigateway.LambdaIntegration(this.lambdaFunction));

    // ========================================================================
    // Outputs
    // ========================================================================

    this.apiEndpoint = api.url;

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'Auth API Gateway endpoint',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: this.lambdaFunction.functionName,
      description: 'Auth Lambda function name',
    });
  }
}
