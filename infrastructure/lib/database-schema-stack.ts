import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda_base from 'aws-cdk-lib/aws-lambda';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as custom from 'aws-cdk-lib/custom-resources';
import * as path from 'path';

interface DatabaseSchemaStackProps extends cdk.StackProps {
  vpcId: string;
  databaseSecretArn: string;
  databaseEndpoint: string;
  databaseName: string;
}

export class DatabaseSchemaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DatabaseSchemaStackProps) {
    super(scope, id, props);

    // Create security group for the Lambda function
    const securityGroup = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc: ec2.Vpc.fromVpcAttributes(this, 'Vpc', {
        vpcId: props.vpcId,
        availabilityZones: cdk.Fn.getAzs(),
      }),
      description: 'Security group for database schema initializer Lambda',
      allowAllOutbound: true,
    });

    // Import database secret
    const databaseSecret = secretsmanager.Secret.fromSecretCompleteArn(
      this,
      'DatabaseSecret',
      props.databaseSecretArn
    );

    // Lambda function to initialize schema
    const schemaInitializer = new lambda_base.Function(this, 'SchemaInitializer', {
      runtime: lambda_base.Runtime.NODEJS_20_X,
      code: lambda_base.Code.fromAsset(path.join(__dirname, '../../lambdas/schema-init')),
      handler: 'index.handler',
      timeout: cdk.Duration.minutes(5),
      vpc: ec2.Vpc.fromVpcAttributes(this, 'VpcForLambda', {
        vpcId: props.vpcId,
        availabilityZones: cdk.Fn.getAzs(),
        privateSubnetIds: ['subnet-04a07f91847b4d134', 'subnet-0f252ab4bf49d1ee8'],
      }),
      securityGroups: [securityGroup],
      environment: {
        DATABASE_SECRET_ARN: props.databaseSecretArn,
        DATABASE_ENDPOINT: props.databaseEndpoint,
        DATABASE_NAME: props.databaseName,
      },
    });

    // Grant permissions
    databaseSecret.grantRead(schemaInitializer);
    schemaInitializer.addToRolePolicy(new iam.PolicyStatement({
      actions: ['secretsmanager:GetSecretValue'],
      resources: [props.databaseSecretArn],
    }));

    // Custom resource to trigger schema initialization
    const provider = new custom.Provider(this, 'SchemaProvider', {
      onEventHandler: schemaInitializer,
    });

    // Trigger the schema initialization
    new cdk.CustomResource(this, 'SchemaResource', {
      serviceToken: provider.serviceToken,
      properties: {
        // Force update on each deployment if needed
        Timestamp: new Date().toISOString(),
      },
    });

    // Output
    new cdk.CfnOutput(this, 'SchemaInitStatus', {
      value: 'Initialized',
      description: 'Database schema initialization status',
    });
  }
}
