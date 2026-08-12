import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as path from 'path';

interface CorpIDServiceStackProps extends cdk.StackProps {
  vpcId: string;
  databaseSecretArn: string;
  databaseEndpoint: string;
  databaseName: string;
  userPoolId: string;
  kmsKeyId: string;
  kekSecretArn: string;
  apiGatewayId?: string;
  apiGatewayRootResourceId?: string;
}

export class CorpIDServiceStack extends cdk.Stack {
  public readonly api: apigateway.RestApi | undefined;
  
  constructor(scope: Construct, id: string, props: CorpIDServiceStackProps) {
    super(scope, id, props);

    // Import VPC
    const vpc = ec2.Vpc.fromVpcAttributes(this, 'Vpc', {
      vpcId: props.vpcId,
      availabilityZones: ['ap-southeast-1a', 'ap-southeast-1b'],
      privateSubnetIds: ['subnet-04a07f91847b4d134', 'subnet-0f252ab4bf49d1ee8'],
    });

    // Create security group for the Lambda function
    const securityGroup = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc,
      description: 'Security group for CorpID service Lambda',
      allowAllOutbound: true,
    });

    // Import database secret
    const databaseSecret = secretsmanager.Secret.fromSecretCompleteArn(
      this,
      'DatabaseSecret',
      props.databaseSecretArn
    );

    // Lambda function
    const corpidLambda = new lambda.Function(this, 'CorpIDLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambdas/corpid-service')),
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(30),
      vpc,
      securityGroups: [securityGroup],
      environment: {
        DATABASE_SECRET_ARN: props.databaseSecretArn,
        DATABASE_ENDPOINT: props.databaseEndpoint,
        DATABASE_NAME: props.databaseName,
        USER_POOL_ID: props.userPoolId,
        KMS_KEY_ID: props.kmsKeyId,
        KEK_SECRET_ARN: props.kekSecretArn,
        CORPID_SANDBOX_URL: 'https://sandbox.corpid.gov.hk/api/v1',
        CORPID_PRODUCTION_URL: 'https://api.corpid.gov.hk/v1',
        CORPID_REDIRECT_URI: 'https://app.quickcorpid.com/callback/corpid',
      },
    });

    // Grant permissions
    databaseSecret.grantRead(corpidLambda);
    corpidLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['secretsmanager:GetSecretValue'],
      resources: [
        props.databaseSecretArn,
        props.kekSecretArn,
      ],
    }));

    // Grant KMS permissions
    corpidLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'kms:Encrypt',
        'kms:Decrypt',
        'kms:GenerateDataKey',
      ],
      resources: [`arn:aws:kms:${this.region}:${this.account}:key/${props.kmsKeyId}`],
    }));

    // Create or use existing API Gateway
    if (props.apiGatewayId && props.apiGatewayRootResourceId) {
      // Import existing API Gateway
      const api = apigateway.RestApi.fromRestApiAttributes(this, 'RestApi', {
        restApiId: props.apiGatewayId,
        rootResourceId: props.apiGatewayRootResourceId,
      });
      
      // Create corpid resource
      const corpid = api.root.addResource('corpid');
      corpid.addMethod('ANY', new apigateway.LambdaIntegration(corpidLambda));
      
      // Create proxy for nested resources
      const corpidProxy = corpid.addResource('{proxy+}');
      corpidProxy.addMethod('ANY', new apigateway.LambdaIntegration(corpidLambda));
    } else {
      // Create new API Gateway
      this.api = new apigateway.RestApi(this, 'RestApi', {
        restApiName: 'QuickCorpID CorpID Integration Service',
        description: 'API for CorpID integration',
        deployOptions: {
          stageName: 'v1',
          tracingEnabled: true,
          metricsEnabled: true,
        },
        defaultCorsPreflightOptions: {
          allowOrigins: apigateway.Cors.ALL_ORIGINS,
          allowMethods: apigateway.Cors.ALL_METHODS,
          allowHeaders: ['Content-Type', 'Authorization'],
        },
      });

      // Create authorizer using Cognito
      const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
        cognitoUserPools: [
          cognito.UserPool.fromUserPoolId(this, 'UserPool', props.userPoolId),
        ],
      });

      // Create corpid resource
      const corpid = this.api.root.addResource('corpid');
      
      // Connection endpoints
      const connection = corpid.addResource('connection');
      connection.addMethod('GET', new apigateway.LambdaIntegration(corpidLambda), {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      });
      connection.addMethod('DELETE', new apigateway.LambdaIntegration(corpidLambda), {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      });

      // Connect endpoint (OAuth callback)
      const connect = corpid.addResource('connect');
      connect.addMethod('POST', new apigateway.LambdaIntegration(corpidLambda), {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      });

      // QR code endpoints
      const qrcode = corpid.addResource('qrcode');
      qrcode.addMethod('POST', new apigateway.LambdaIntegration(corpidLambda), {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      });
      
      const qrcodeId = qrcode.addResource('{qrCodeId}');
      qrcodeId.addMethod('GET', new apigateway.LambdaIntegration(corpidLambda), {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      });

      // Document Wallet endpoints
      const documents = corpid.addResource('documents');
      const sync = documents.addResource('sync');
      sync.addMethod('POST', new apigateway.LambdaIntegration(corpidLambda), {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      });

      // Token refresh endpoint
      const token = corpid.addResource('token');
      const refresh = token.addResource('refresh');
      refresh.addMethod('POST', new apigateway.LambdaIntegration(corpidLambda), {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      });

      // Signing endpoints
      const signing = corpid.addResource('signing');
      const initiate = signing.addResource('initiate');
      initiate.addMethod('POST', new apigateway.LambdaIntegration(corpidLambda), {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      });
      
      const signingRequestId = signing.addResource('{signingRequestId}');
      signingRequestId.addMethod('GET', new apigateway.LambdaIntegration(corpidLambda), {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      });

      // Output
      new cdk.CfnOutput(this, 'ApiUrl', {
        value: this.api.url,
        description: 'CorpID Service API URL',
      });
    }
  }
}
