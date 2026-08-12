import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
// import { CorpIDEncryptionStack } from './corpid-encryption-stack';

export interface QuickCorpIDStackProps extends cdk.StackProps {
  readonly environment?: string;
}

export class QuickCorpIDStack extends cdk.Stack {
  // VPC
  public readonly vpc: ec2.Vpc;
  
  // Database
  public readonly database: rds.DatabaseCluster;
  public readonly databaseSecret: secretsmanager.Secret;
  
  // S3 Buckets
  public readonly documentsBucket: s3.Bucket;
  public readonly uploadsBucket: s3.Bucket;
  
  // Cognito
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  
  // KMS Keys
  public readonly encryptionKey: kms.Key;
  
  // CorpID Encryption - commented out for initial deployment
  // public readonly corpidEncryption: CorpIDEncryptionStack;
  
  constructor(scope: Construct, id: string, props?: QuickCorpIDStackProps) {
    super(scope, id, props);

    // ========================================================================
    // KMS Encryption Key
    // ========================================================================
    
    this.encryptionKey = new kms.Key(this, 'EncryptionKey', {
      description: 'QuickCorpID encryption key for documents and data',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ========================================================================
    // VPC Configuration
    // ========================================================================
    
    this.vpc = new ec2.Vpc(this, 'VPC', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      natGateways: 0, // No NAT gateway for simplicity
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // VPC Endpoints for private AWS access
    this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    this.vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
    });

    // ========================================================================
    // S3 Buckets
    // ========================================================================
    
    // Documents bucket - stores company documents
    this.documentsBucket = new s3.Bucket(this, 'DocumentsBucket', {
      bucketName: `quickcorpid-documents-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'ArchiveOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(90),
          noncurrentVersionTransitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Uploads bucket - temporary uploads
    this.uploadsBucket = new s3.Bucket(this, 'UploadsBucket', {
      bucketName: `quickcorpid-uploads-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'DeleteOldUploads',
          enabled: true,
          expiration: cdk.Duration.days(7),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ========================================================================
    // Aurora PostgreSQL Serverless v2
    // ========================================================================
    
    // Database credentials
    this.databaseSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      description: 'QuickCorpID Aurora PostgreSQL credentials',
      generateSecretString: {
        generateStringKey: 'password',
        secretStringTemplate: JSON.stringify({ username: 'quickcorpid_admin' }),
        excludePunctuation: false,
        includeSpace: false,
        passwordLength: 32,
      },
    });

    // Database cluster parameter group
    const parameterGroup = new rds.ParameterGroup(this, 'DatabaseParameterGroup', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_10,
      }),
      parameters: {
        'log_min_duration_statement': '1000', // Log slow queries
        'auto_explain.log_min_duration': '1000',
      },
    });

    // Aurora Serverless v2 cluster
    this.database = new rds.DatabaseCluster(this, 'Database', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_10,
      }),
      parameterGroup,
      credentials: rds.Credentials.fromSecret(this.databaseSecret),
      defaultDatabaseName: 'quickcorpid',
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      serverlessV2MinCapacity: 0.5, // Minimum ACU
      serverlessV2MaxCapacity: 4, // Maximum ACU
      writer: rds.ClusterInstance.serverlessV2('Writer', {
        autoMinorVersionUpgrade: true,
        instanceIdentifier: 'quickcorpid-writer', // Shorter identifier
      }),
      backup: {
        retention: cdk.Duration.days(7),
        preferredWindow: '03:00-04:00', // 3-4 AM HKT
      },
      preferredMaintenanceWindow: 'Mon:04:00-Mon:05:00', // Monday 4-5 AM HKT
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
    });

    // ========================================================================
    // Cognito User Pool
    // ========================================================================
    
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: 'QuickCorpID-Users',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: false,
      },
      autoVerify: {
        email: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireDigits: true,
        requireSymbols: true,
        tempPasswordValidity: cdk.Duration.days(3),
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      // Note: Advanced security features can be enabled in Cognito console if needed
    });

    // User Pool Client
    this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool: this.userPool,
      userPoolClientName: 'QuickCorpID-Web',
      generateSecret: false, // No secret for frontend
      authFlows: {
        userPassword: true,
        userSrp: true,
        adminUserPassword: false,
      },
      preventUserExistenceErrors: true,
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(7),
    });

    // ========================================================================
    // CorpID Encryption Stack
    // ========================================================================
    
    // Commented out for initial deployment - will be added later
    // this.corpidEncryption = new CorpIDEncryptionStack(this, 'CorpIDEncryption', {
    //   description: 'CorpID encryption keys and secrets',
    // });

    // ========================================================================
    // Outputs
    // ========================================================================
    
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'DocumentsBucketName', {
      value: this.documentsBucket.bucketName,
      description: 'Documents S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.database.clusterEndpoint.socketAddress,
      description: 'Aurora Cluster Endpoint',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'EncryptionKeyId', {
      value: this.encryptionKey.keyId,
      description: 'KMS Encryption Key ID',
    });
  }
}
