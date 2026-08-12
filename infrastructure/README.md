# QuickCorpID Infrastructure

AWS CDK infrastructure for QuickCorpID - Hong Kong CorpID integration platform.

## Prerequisites

- Node.js 20+
- AWS CLI configured with credentials
- AWS CDK CLI installed globally: `npm install -g aws-cdk`

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure AWS credentials:
   ```bash
   aws configure
   ```

3. Bootstrap CDK (first time only):
   ```bash
   npm run bootstrap
   ```

## Deployment

### Synthesize CloudFormation template:
```bash
npm run synth
```

### Deploy to AWS:
```bash
npm run deploy
```

### View changes before deploying:
```bash
npm run diff
```

### Destroy stack:
```bash
npm run destroy
```

## Architecture

This stack creates:

- **VPC**: 2 AZs with public, private, and database subnets
- **Aurora PostgreSQL Serverless v2**: Auto-scaling database (0.5-4 ACU)
- **S3 Buckets**: Documents and uploads with KMS encryption
- **Cognito User Pool**: Email-based authentication
- **KMS Key**: Encryption for documents and secrets

## Environment Variables

Set these environment variables before deploying:

- `CDK_DEFAULT_ACCOUNT`: AWS account ID
- `CDK_DEFAULT_REGION`: AWS region (default: ap-east-1 for Hong Kong)

## Outputs

After deployment, note these outputs:

- `VpcId`: VPC identifier
- `DocumentsBucketName`: S3 bucket for documents
- `DatabaseEndpoint`: Aurora cluster endpoint
- `UserPoolId`: Cognito User Pool ID
- `UserPoolClientId`: Cognito User Pool Client ID
- `EncryptionKeyId`: KMS key ID

## Cost Estimate

Estimated monthly cost for development environment:

- VPC (NAT Gateway): ~$32/month
- Aurora Serverless v2: ~$43/month (at 0.5 ACU)
- S3 (10GB): ~$0.23/month
- Cognito (50K MAUs): ~$55/month
- KMS: ~$1/month
- **Total**: ~$131/month

## Security

- All S3 buckets block public access
- KMS encryption for all data at rest
- VPC endpoints for private AWS access
- Least privilege IAM roles
- Aurora in private subnets only

## Next Steps

After deploying infrastructure:

1. Run database migrations (Prisma)
2. Deploy Lambda services
3. Configure CorpID Sandbox integration
4. Deploy frontend application
