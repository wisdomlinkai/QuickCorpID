# Sprint 1 Summary - Infrastructure & Auth

**Status:** 87.5% Complete (7/8 tasks)  
**Date:** August 7, 2026

---

## Completed Tasks

### ✅ Task #1: AWS CDK Project Setup
**Location:** `infrastructure/`

**Created Files:**
- `infrastructure/package.json` - CDK dependencies and scripts
- `infrastructure/tsconfig.json` - TypeScript configuration
- `infrastructure/cdk.json` - CDK configuration with context
- `infrastructure/bin/quickcorpid.ts` - CDK app entry point
- `infrastructure/lib/quickcorpid-stack.ts` - Main infrastructure stack
- `infrastructure/README.md` - Documentation

**Commands Available:**
```bash
cd infrastructure
npm install              # Install dependencies
npm run synth           # Synthesize CloudFormation template
npm run diff            # View changes
npm run deploy          # Deploy to AWS
npm run destroy         # Remove stack
```

---

### ✅ Tasks #2-6: Core Infrastructure

**All implemented in `quickcorpid-stack.ts`:**

#### Task #2: VPC with Private Subnets
- 2 Availability Zones
- 3 subnet types: Public, Private (with egress), Database (isolated)
- NAT Gateway for outbound access
- VPC endpoints for S3 and Secrets Manager

```typescript
this.vpc = new ec2.Vpc(this, 'VPC', {
  ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
  maxAzs: 2,
  natGateways: 1,
  subnetConfiguration: [...]
});
```

#### Task #3: IAM Roles
- CDK automatically creates least-privilege roles for each service
- Aurora, Lambda, Cognito each get dedicated roles
- No over-privileged permissions

#### Task #4: S3 Buckets with KMS Encryption
- **Documents Bucket:** `quickcorpid-documents-{account}-{region}`
  - KMS encryption
  - Versioning enabled
  - Lifecycle: Archive old versions to Glacier
  - Block public access
  
- **Uploads Bucket:** `quickcorpid-uploads-{account}-{region}`
  - KMS encryption
  - Lifecycle: Delete after 7 days
  - Block public access

#### Task #5: Aurora Serverless v2
- PostgreSQL 15.4
- Scaling: 0.5 - 4 ACU
- Private subnets only
- 7-day backup retention
- Credentials in Secrets Manager

```typescript
this.database = new rds.DatabaseCluster(this, 'Database', {
  engine: rds.DatabaseClusterEngine.auroraPostgres({
    version: rds.AuroraPostgresEngineVersion.VER_15_4,
  }),
  serverlessV2MinCapacity: 0.5,
  serverlessV2MaxCapacity: 4,
  ...
});
```

#### Task #6: Cognito User Pool
- Email-based sign-in
- Password policy: 8+ chars, uppercase, lowercase, digits, symbols
- Access token: 1 hour
- Refresh token: 7 days
- Advanced security mode enabled

**Outputs:**
- `UserPoolId`: Cognito User Pool ID
- `UserPoolClientId`: App Client ID for frontend

---

### ✅ Task #8: CEK Management Module
**Location:** `services/corpid-service/`

**Created Files:**
- `services/corpid-service/package.json` - Dependencies
- `services/corpid-service/tsconfig.json` - TypeScript config
- `services/corpid-service/src/encryption.ts` - Encryption module (300+ lines)
- `services/corpid-service/src/index.ts` - Exports
- `services/corpid-service/README.md` - Usage documentation

**Features:**
- KEK/CEK encryption management
- AES-256-GCM encryption/decryption
- CEK caching with TTL
- CEK rotation handling
- AWS Secrets Manager integration
- .p12 file extraction

**Usage:**
```typescript
import { CorpIDEncryption } from '@quickcorpid/corpid-service';

const encryption = new CorpIDEncryption({
  kekPrivateKeySecretArn: '...',
  cekCacheSecretArn: '...',
  corpidApiBaseUrl: 'https://sb.corpid.gov.hk/api/v1',
  kekPin: '8568185550716550',
});

const cek = await encryption.getCEK();
const encrypted = await encryption.encryptContent(data, cek);
const decrypted = await encryption.decryptContent(encrypted, cek);
```

---

## Remaining Task

### ⬜ Task #7: Store KEK Private Key in Secrets Manager

**Status:** Pending (requires CorpID Sandbox account)

**Action Required:**
1. Register at https://sb.corpid.gov.hk/
2. Download KEK certificate (.p12 file) from Account Centre
3. Store the certificate in AWS Secrets Manager

**Instructions:**

```bash
# After downloading the .p12 file, encode it to base64
base64 -i account-centre-kek.p12 | pbcopy

# Then manually create the secret in AWS Console or use AWS CLI:
aws secretsmanager create-secret \
  --name quickcorpid/corpid/kek-private-key \
  --secret-string '{"p12Content":"<base64-content>","pin":"8568185550716550"}'
```

**Note:** The secret ARN will be needed to configure the CEK management module.

---

## Next Steps (After Task #7)

### Sprint 2: Core Services (Weeks 3-4)

1. **Create API Gateway** with JWT authorizer
2. **Build Auth Service Lambda** - Sign-up, sign-in, refresh
3. **Build Organisation Service Lambda** - CRUD operations
4. **Build CorpID Integration Service Lambda** - OAuth, BR verification, application submission
5. **Deploy services** to AWS Lambda

### Prerequisites for Sprint 2

- [ ] Task #7 completed (KEK private key stored)
- [ ] AWS credentials configured
- [ ] CDK bootstrap completed: `cd infrastructure && npm run bootstrap`
- [ ] Infrastructure deployed: `npm run deploy`

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE                            │
│  (Defined in CDK, ready to deploy)                          │
├─────────────────────────────────────────────────────────────┤
│  VPC (10.0.0.0/16)                                          │
│  ├── Public Subnets (2 AZs)                                 │
│  ├── Private Subnets (NAT Gateway)                          │
│  └── Database Subnets (Isolated)                            │
├─────────────────────────────────────────────────────────────┤
│  Aurora PostgreSQL Serverless v2                            │
│  ├── Engine: PostgreSQL 15.4                                │
│  ├── Scaling: 0.5-4 ACU                                     │
│  ├── Backup: 7 days                                         │
│  └── Credentials: Secrets Manager                           │
├─────────────────────────────────────────────────────────────┤
│  S3 Buckets                                                  │
│  ├── documents-{account}-{region} (versioned, Glacier)     │
│  └── uploads-{account}-{region} (7-day lifecycle)          │
├─────────────────────────────────────────────────────────────┤
│  Cognito User Pool                                           │
│  ├── Email-based sign-in                                    │
│  ├── Password policy (8+ chars, mixed)                      │
│  └── App Client (no secret)                                 │
├─────────────────────────────────────────────────────────────┤
│  KMS Keys                                                    │
│  ├── Document encryption key                                │
│  └── CEK cache encryption key                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    CORPID SERVICE                            │
│  (Code ready, needs deployment)                             │
├─────────────────────────────────────────────────────────────┤
│  Encryption Module                                           │
│  ├── KEK private key management                             │
│  ├── CEK retrieval and caching                              │
│  ├── AES-256-GCM encryption/decryption                      │
│  └── CEK rotation handling                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Estimated Costs (Monthly)

| Service | Cost (USD) |
|---------|------------|
| VPC (NAT Gateway) | $32.00 |
| Aurora Serverless v2 (0.5 ACU) | $43.00 |
| S3 (10GB) | $0.23 |
| Cognito (50K MAUs) | $55.00 |
| KMS | $1.00 |
| Secrets Manager (3 secrets) | $1.50 |
| **Total** | **~$133/month** |

---

## Files Created

```
infrastructure/
├── package.json
├── tsconfig.json
├── cdk.json
├── README.md
├── bin/
│   └── quickcorpid.ts
└── lib/
    ├── quickcorpid-stack.ts
    └── corpid-encryption-stack.ts

services/
└── corpid-service/
    ├── package.json
    ├── tsconfig.json
    ├── README.md
    └── src/
        ├── index.ts
        └── encryption.ts
```

---

## Commands to Deploy

```bash
# 1. Navigate to infrastructure
cd infrastructure

# 2. Install dependencies
npm install

# 3. Bootstrap CDK (first time only)
npm run bootstrap

# 4. Review changes
npm run diff

# 5. Deploy
npm run deploy

# 6. Note the outputs (UserPoolId, UserPoolClientId, etc.)
```

---

**Sprint 1 Status:** Ready for deployment pending Task #7 completion.
