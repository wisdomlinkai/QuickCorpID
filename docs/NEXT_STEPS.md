# QuickCorpID - Next Steps and Current Status

**Date:** August 11, 2026  
**Current Sprint:** Transitioning from Sprint 2 to Sprint 3  
**Region:** ap-southeast-1 (Singapore)

---

## Current Status Summary

### ✅ Completed (Sprint 2)

1. **Infrastructure Deployed**
   - VPC with private subnets (vpc-0eb147dcef42bb6ae)
   - Aurora PostgreSQL Serverless v2
   - S3 buckets for documents
   - Cognito User Pool (ap-southeast-1_JLjSrO6V8)
   - KMS encryption keys
   - Secrets Manager for credentials

2. **Organisation Service**
   - ✅ Lambda function built and deployed
   - ✅ API Gateway live at: `https://2cbejgemyi.execute-api.ap-southeast-1.amazonaws.com/v1/`
   - ✅ Cognito authentication configured
   - ✅ VPC integration for database access
   - ✅ All CRUD endpoints operational

3. **CorpID Integration Service**
   - ✅ Lambda function built (145.2kb)
   - ✅ TypeScript implementation complete
   - ✅ Encryption utilities with KMS
   - ✅ OAuth/token exchange ready
   - ✅ QR code generation ready
   - ✅ Document Wallet sync ready
   - ⏳ CDK stack created, ready for deployment

4. **Database Schema Lambda**
   - ✅ Created with all required tables
   - ⏳ Ready to invoke for schema initialization

---

## Immediate Next Steps (Priority Order)

### 1. Initialize Database Schema ⏳

**Why:** Required before any service can function  
**Status:** Lambda function ready, needs invocation

**Steps:**
1. Locate the schema initialization Lambda function
2. Invoke it to create all tables in Aurora
3. Verify table creation with a test query

**Expected Tables:**
- users
- organisations
- organisation_members
- corpid_connections
- documents
- signing_requests
- compliance_items
- audit_logs
- subscriptions
- notifications

---

### 2. Test Organisation Service API ⏳

**Why:** Verify deployed service is working correctly  
**API Endpoint:** `https://2cbejgemyi.execute-api.ap-southeast-1.amazonaws.com/v1/`

**Test Scenarios:**
1. **Create Organisation**
   ```bash
   POST /organisations
   Authorization: Bearer [cognito_token]
   {
     "name": "Test Company Ltd",
     "br_number": "12345678",
     "cr_number": "98765432"
   }
   ```

2. **List Organisations**
   ```bash
   GET /organisations
   Authorization: Bearer [cognito_token]
   ```

3. **Get Organisation Details**
   ```bash
   GET /organisations/{org_id}
   Authorization: Bearer [cognito_token]
   ```

**Requirements:**
- Valid Cognito JWT token
- API testing tool (Postman, curl, or similar)

---

### 3. Deploy CorpID Service ⏳

**Why:** Enable CorpID integration capabilities  
**Status:** Lambda built, CDK stack ready

**Deployment Approach:**
Since CDK deployment has PowerShell interaction issues, use manual CloudFormation:

1. **Create Lambda deployment package:**
   ```bash
   cd infrastructure/lambdas/corpid-service
   zip -r corpid-lambda.zip *
   ```

2. **Upload to S3:**
   ```bash
   aws s3 cp corpid-lambda.zip s3://cdk-hnb659fds-assets-240966654973-ap-southeast-1/corpid-lambda.zip
   ```

3. **Create CloudFormation stack:**
   - Use AWS Console or AWS CLI
   - Template: Manual creation or simplified template
   - Required parameters:
     - VPC ID: vpc-0eb147dcef42bb6ae
     - Database Secret ARN
     - KMS Key ID: da1e3b12-9ad6-4b6e-8ed6-8071b6f6f958
     - User Pool ID: ap-southeast-1_JLjSrO6V8

---

### 4. Frontend Authentication Integration ⏳

**Why:** Enable user login/registration in the web app  
**Current Frontend:** Next.js app in `/src` directory

**Required Changes:**

1. **Update Cognito Configuration**
   - File: `src/lib/AuthContext.tsx`
   - Update with deployed Cognito values:
     ```typescript
     const userPool = new CognitoUserPool({
       UserPoolId: 'ap-southeast-1_JLjSrO6V8',
       ClientId: '2kd1s766htbltrgbqn3q9ujkpe'
     });
     ```

2. **Configure API Endpoints**
   - Update environment variables
   - Point to Organisation Service API
   - Configure CorpID Service API (when deployed)

3. **Test Authentication Flow**
   - User registration
   - Email verification
   - Login/logout
   - Token refresh

---

### 5. CorpID Sandbox Environment Setup ⏳

**Why:** Enable testing with CorpID sandbox before production

**Required Information:**
- CorpID Sandbox Client ID
- CorpID Sandbox Client Secret
- CorpID Sandbox API endpoint
- OAuth redirect URI configuration

**Steps:**
1. Store credentials in AWS Secrets Manager
2. Update Lambda environment variables
3. Configure OAuth redirect URI
4. Test connection flow

---

## Architecture Decisions Made

### 1. Region Selection: Singapore (ap-southeast-1)
- **Reason:** User requested switch from Hong Kong
- **Status:** All infrastructure deployed to Singapore
- **Consideration:** CorpID API still Hong Kong-based, but AWS services in Singapore provide lower latency for regional users

### 2. Serverless-First Architecture
- **Services:** Lambda, API Gateway, Aurora Serverless v2
- **Benefits:** Cost-effective, auto-scaling, pay-per-use
- **Trade-offs:** Cold start latency (acceptable for this use case)

### 3. Encryption Strategy
- **KMS:** For general encryption (database credentials, API tokens)
- **KEK/CEK:** For CorpID-specific token encryption (follows CorpID specification)
- **Storage:** Secrets Manager for all sensitive data

### 4. Database: Aurora PostgreSQL Serverless v2
- **Reason:** Managed PostgreSQL with auto-scaling
- **Benefits:** No server management, automatic backups, high availability
- **Cost:** Pay per second of usage

---

## Known Issues and Workarounds

### 1. PowerShell/CDK Interaction Issues
**Problem:** `cdk deploy` commands hang or fail on Windows  
**Workaround:** Manual CloudFormation stack creation with template upload  
**Status:** Successful workaround used for Organisation Service

### 2. Large Lambda Bundles
**Problem:** Bundled Lambda code exceeds ideal size  
**Files:** Organisation Service (1.3mb), CorpID Service (145kb)  
**Impact:** Slightly longer cold starts  
**Mitigation:** Using Provisioned Concurrency if needed

### 3. Database Schema Not Initialized
**Problem:** Schema Lambda created but not invoked  
**Status:** Ready to invoke  
**Next Step:** Manual invocation or CloudFormation custom resource

---

## Environment Configuration

### Production Values (Singapore)

```bash
# AWS Region
VITE_AWS_REGION=ap-southeast-1

# Cognito
VITE_COGNITO_USER_POOL_ID=ap-southeast-1_JLjSrO6V8
VITE_COGNITO_CLIENT_ID=2kd1s766htbltrgbqn3q9ujkpe

# S3
VITE_S3_BUCKET=quickcorpid-documents-240966654973-ap-southeast-1

# Database (internal, not exposed)
DATABASE_ENDPOINT=quickcorpid-databaseb269d8bb-8oydiecqaoh8.cluster-chg6i2wyozug.ap-southeast-1.rds.amazonaws.com:5432
DATABASE_NAME=quickcorpid

# KMS
KMS_KEY_ID=da1e3b12-9ad6-4b6e-8ed6-8071b6f6f958

# VPC
VPC_ID=vpc-0eb147dcef42bb6ae

# Organisation API
ORGANISATION_API_URL=https://2cbejgemyi.execute-api.ap-southeast-1.amazonaws.com/v1/

# CorpID (when deployed)
CORPID_API_URL=https://[pending].execute-api.ap-southeast-1.amazonaws.com/v1/
```

---

## Testing Checklist

### Backend Services

- [ ] Database schema initialized
- [ ] Organisation Service: Create organisation
- [ ] Organisation Service: List organisations
- [ ] Organisation Service: Update organisation
- [ ] Organisation Service: Add member
- [ ] Organisation Service: Remove member
- [ ] CorpID Service: Connect CorpID
- [ ] CorpID Service: Generate QR code
- [ ] CorpID Service: Sync Document Wallet
- [ ] CorpID Service: Initiate signing

### Frontend Integration

- [ ] Cognito authentication working
- [ ] API calls authenticated
- [ ] Organisation management UI
- [ ] CorpID connection UI
- [ ] Document Wallet view

---

## Cost Estimation (Monthly)

**Based on moderate usage (1000 users, 100 organisations):**

- **Aurora Serverless v2:** ~$50-100
- **Lambda:** ~$5-10
- **API Gateway:** ~$5-10
- **Cognito:** ~$0-5 (free tier)
- **S3:** ~$5-10
- **KMS:** ~$1
- **Secrets Manager:** ~$1-2
- **VPC (NAT Gateway):** ~$32

**Total:** ~$100-170/month

---

## Timeline

### Completed
- ✅ Sprint 1: Infrastructure setup
- ✅ Sprint 2: Backend services development

### Upcoming
- 🔄 Sprint 3: Database initialization and testing (1-2 days)
- 🔄 Sprint 4: Frontend integration (3-5 days)
- 🔄 Sprint 5: CorpID Sandbox integration (2-3 days)
- 🔄 Sprint 6: Document Service (3-5 days)
- 🔄 Sprint 7: Signing Service (3-5 days)
- 🔄 Sprint 8: Compliance Service (3-5 days)
- 🔄 Sprint 9: Integration testing (5-7 days)
- 🔄 Sprint 10: Production deployment (2-3 days)

**Estimated MVP Launch:** End of September 2026

---

## Success Metrics

### Technical
- All API endpoints responding < 300ms
- 99.9% uptime SLA
- Zero security vulnerabilities
- All tests passing

### Business
- User can register and login
- User can create organisation
- User can connect CorpID
- User can view Document Wallet
- User can initiate digital signing

---

## Risk Mitigation

### 1. CorpID Sandbox Availability
**Risk:** CorpID sandbox may have limited availability  
**Mitigation:** Build mock CorpID service for development/testing

### 2. PowerShell/CDK Issues
**Risk:** Continued deployment issues on Windows  
**Mitigation:** Use WSL2 or Linux VM for CDK operations, or continue with manual CloudFormation

### 3. Token Encryption Complexity
**Risk:** CorpID encryption specification may be complex  
**Mitigation:** Simplified implementation for MVP, enhance later

### 4. Database Migration
**Risk:** Schema changes may be difficult post-deployment  
**Mitigation:** Use migration tool (Prisma Migrate or custom scripts)

---

## Resources

### Documentation
- [Comprehensive Development Documentation](./COMPREHENSIVE_DEVELOPMENT_DOCUMENTATION.md)
- [Feasibility Research Findings](./FEASIBILITY_RESEARCH_FINDINGS.md)
- [Sprint 2 Completion Summary](./SPRINT2_COMPLETION_SUMMARY.md)

### External
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [CorpID Requirements](./CORPID_REQUIREMENTS.md)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)

---

## Contact & Support

- **Developer:** Kiro AI Assistant
- **Repository:** c:\QuickCorpID
- **AWS Account:** 240966654973
- **Primary Region:** ap-southeast-1 (Singapore)

---

**Last Updated:** August 11, 2026, 12:35 PM
