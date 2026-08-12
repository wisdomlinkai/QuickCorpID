#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { QuickCorpIDStack } from '../lib/quickcorpid-stack';
import { AuthServiceStack } from '../lib/auth-service-stack';
import { DatabaseSchemaStack } from '../lib/database-schema-stack';
import { OrganisationServiceStack } from '../lib/organisation-service-stack';
import { CorpIDServiceStack } from '../lib/corpid-service-stack';

const app = new cdk.App();

// Environment configuration - Singapore region (ap-southeast-1)
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT || '240966654973',
  region: 'ap-southeast-1', // Singapore region
};

// Deploy to Hong Kong region
new QuickCorpIDStack(app, 'QuickCorpIDStack', {
  env,
  stackName: 'QuickCorpID',
  description: 'QuickCorpID - AWS-native infrastructure for Hong Kong CorpID integration',
  tags: {
    Project: 'QuickCorpID',
    Environment: 'development',
    ManagedBy: 'CDK',
  },
});

// Database Schema Stack - Initialize the database schema
const databaseSchemaStack = new DatabaseSchemaStack(app, 'DatabaseSchemaStack', {
  env,
  stackName: 'QuickCorpID-DatabaseSchema',
  description: 'QuickCorpID Database Schema Initialization',
  vpcId: 'vpc-0eb147dcef42bb6ae', // From infrastructure deployment
  databaseSecretArn: 'arn:aws:secretsmanager:ap-southeast-1:240966654973:secret:DatabaseSecret86DBB7B3-DiVgdXkHj1O2-r2Oz9D',
  databaseEndpoint: 'quickcorpid-databaseb269d8bb-8oydiecqaoh8.cluster-chg6i2wyozug.ap-southeast-1.rds.amazonaws.com:5432',
  databaseName: 'quickcorpid',
  tags: {
    Project: 'QuickCorpID',
    Environment: 'development',
    ManagedBy: 'CDK',
  },
});

// Auth Service Stack - deployed after infrastructure
// Note: These values should be updated after the first deployment
const authServiceStack = new AuthServiceStack(app, 'AuthServiceStack', {
  env,
  stackName: 'QuickCorpID-Auth',
  description: 'QuickCorpID Authentication Service',
  userPoolId: 'ap-southeast-1_JLjSrO6V8', // From infrastructure deployment
  userPoolClientId: '2kd1s766htbltrgbqn3q9ujkpe', // From infrastructure deployment
  databaseSecretArn: 'arn:aws:secretsmanager:ap-southeast-1:240966654973:secret:DatabaseSecret86DBB7B3-DiVgdXkHj1O2-r2Oz9D',
  databaseEndpoint: 'quickcorpid-databaseb269d8bb-8oydiecqaoh8.cluster-chg6i2wyozug.ap-southeast-1.rds.amazonaws.com:5432',
  databaseName: 'quickcorpid',
  vpcId: 'vpc-0eb147dcef42bb6ae', // From infrastructure deployment
  tags: {
    Project: 'QuickCorpID',
    Environment: 'development',
    ManagedBy: 'CDK',
  },
});

// Organisation Service Stack
const organisationServiceStack = new OrganisationServiceStack(app, 'OrganisationServiceStack', {
  env,
  stackName: 'QuickCorpID-Organisation',
  description: 'QuickCorpID Organisation Service',
  vpcId: 'vpc-0eb147dcef42bb6ae',
  databaseSecretArn: 'arn:aws:secretsmanager:ap-southeast-1:240966654973:secret:DatabaseSecret86DBB7B3-DiVgdXkHj1O2-r2Oz9D',
  databaseEndpoint: 'quickcorpid-databaseb269d8bb-8oydiecqaoh8.cluster-chg6i2wyozug.ap-southeast-1.rds.amazonaws.com:5432',
  databaseName: 'quickcorpid',
  userPoolId: 'ap-southeast-1_JLjSrO6V8',
  tags: {
    Project: 'QuickCorpID',
    Environment: 'development',
    ManagedBy: 'CDK',
  },
});

// CorpID Integration Service Stack
const corpidServiceStack = new CorpIDServiceStack(app, 'CorpIDServiceStack', {
  env,
  stackName: 'QuickCorpID-CorpID',
  description: 'QuickCorpID CorpID Integration Service',
  vpcId: 'vpc-0eb147dcef42bb6ae',
  databaseSecretArn: 'arn:aws:secretsmanager:ap-southeast-1:240966654973:secret:DatabaseSecret86DBB7B3-DiVgdXkHj1O2-r2Oz9D',
  databaseEndpoint: 'quickcorpid-databaseb269d8bb-8oydiecqaoh8.cluster-chg6i2wyozug.ap-southeast-1.rds.amazonaws.com:5432',
  databaseName: 'quickcorpid',
  userPoolId: 'ap-southeast-1_JLjSrO6V8',
  kmsKeyId: 'da1e3b12-9ad6-4b6e-8ed6-8071b6f6f958',
  kekSecretArn: 'arn:aws:secretsmanager:ap-southeast-1:240966654973:secret:CorpIDKEKCertificate-EK7VSH2mFu7q',
  tags: {
    Project: 'QuickCorpID',
    Environment: 'development',
    ManagedBy: 'CDK',
  },
});

// Synthesize the stacks
app.synth();
