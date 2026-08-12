import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as path from 'path';

interface OrganisationServiceStackProps extends cdk.StackProps {
  vpcId: string;
  databaseSecretArn: string;
  databaseEndpoint: string;
  databaseName: string;
  userPoolId: string;
  apiGatewayId?: string;
  apiGatewayRootResourceId?: string;
}

export class OrganisationServiceStack extends cdk.Stack {
  public readonly api: apigateway.RestApi | undefined;
  
  constructor(scope: Construct, id: string, props: OrganisationServiceStackProps) {
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
      description: 'Security group for organisation service Lambda',
      allowAllOutbound: true,
    });

    // Import database secret
    const databaseSecret = secretsmanager.Secret.fromSecretCompleteArn(
      this,
      'DatabaseSecret',
      props.databaseSecretArn
    );

    // Lambda function
    const organisationLambda = new lambda.Function(this, 'OrganisationLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambdas/organisation-service')),
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(30),
      vpc,
      securityGroups: [securityGroup],
      environment: {
        DATABASE_SECRET_ARN: props.databaseSecretArn,
        DATABASE_ENDPOINT: props.databaseEndpoint,
        DATABASE_NAME: props.databaseName,
        USER_POOL_ID: props.userPoolId,
      },
    });

    // Grant permissions
    databaseSecret.grantRead(organisationLambda);
    organisationLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['secretsmanager:GetSecretValue'],
      resources: [props.databaseSecretArn],
    }));

    // Create or use existing API Gateway
    if (props.apiGatewayId && props.apiGatewayRootResourceId) {
      // Import existing API Gateway
      const api = apigateway.RestApi.fromRestApiAttributes(this, 'RestApi', {
        restApiId: props.apiGatewayId,
        rootResourceId: props.apiGatewayRootResourceId,
      });
      
      // Create organisation resource
      const organisations = api.root.addResource('organisations');
      organisations.addMethod('ANY', new apigateway.LambdaIntegration(organisationLambda));
      
      // Create proxy for nested resources
      const organisationProxy = organisations.addResource('{proxy+}');
      organisationProxy.addMethod('ANY', new apigateway.LambdaIntegration(organisationLambda));
    } else {
      // Create new API Gateway
      this.api = new apigateway.RestApi(this, 'RestApi', {
        restApiName: 'QuickCorpID Organisation Service',
        description: 'API for organisation management',
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

      // Create organisation resource
      const organisations = this.api.root.addResource('organisations');
      
      // Organisation endpoints
      organisations.addMethod('GET', new apigateway.LambdaIntegration(organisationLambda), {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      });
      
      organisations.addMethod('POST', new apigateway.LambdaIntegration(organisationLambda), {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      });

      // Single organisation endpoints
      const organisation = organisations.addResource('{orgId}');
      
      organisation.addMethod('GET', new apigateway.LambdaIntegration(organisationLambda), {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      });
      
      organisation.addMethod('PUT', new apigateway.LambdaIntegration(organisationLambda), {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      });
      
      organisation.addMethod('DELETE', new apigateway.LambdaIntegration(organisationLambda), {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      });

      // Member endpoints
      const members = organisation.addResource('members');
      
      members.addMethod('GET', new apigateway.LambdaIntegration(organisationLambda), {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      });
      
      members.addMethod('POST', new apigateway.LambdaIntegration(organisationLambda), {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      });

      const member = members.addResource('{memberId}');
      
      member.addMethod('PUT', new apigateway.LambdaIntegration(organisationLambda), {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      });
      
      member.addMethod('DELETE', new apigateway.LambdaIntegration(organisationLambda), {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      });

      // Output
      new cdk.CfnOutput(this, 'ApiUrl', {
        value: this.api.url,
        description: 'Organisation Service API URL',
      });
    }
  }
}
