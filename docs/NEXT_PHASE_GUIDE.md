# QuickCorpID - Next Phase Implementation Guide

**Date:** August 11, 2026  
**Status:** Ready for Testing & CorpID Deployment  
**Phase:** Sprint 3 - Database & Testing

---

## ✅ Current Status

### Working & Verified
- ✅ Organisation Service API responding correctly (401 auth check working)
- ✅ API Gateway deployed: `https://2cbejgemyi.execute-api.ap-southeast-1.amazonaws.com/v1/`
- ✅ Cognito authentication configured
- ✅ CorpID Service Lambda built (145.2kb)
- ✅ Database schema Lambda deployed

### Pending
- ⏳ Database schema initialization
- ⏳ Get Cognito token for API testing
- ⏳ Test Organisation Service endpoints
- ⏳ Deploy CorpID Service

---

## 🎯 Phase 3 Objectives

### Objective 1: Initialize Database Schema
**Priority:** CRITICAL  
**Time:** 5-10 minutes

#### Option A: AWS Console (Recommended)
1. Navigate to AWS Lambda Console (Singapore region)
2. Find function: `QuickCorpID-DatabaseInit`
3. Click "Test" tab
4. Create test event: `{}`
5. Click "Test" button
6. Verify success in logs

#### Option B: Direct psql Connection
If you have access to an EC2 instance in the VPC:
```bash
psql -h quickcorpid-databaseb269d8bb-8oydiecqaoh8.cluster-chg6i2wyozug.ap-southeast-1.rds.amazonaws.com \
  -U [username] \
  -d quickcorpid \
  -f infrastructure/database/schema.sql
```

#### Verification
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;
```

Expected: 12 tables listed

---

### Objective 2: Test Organisation Service API
**Priority:** HIGH  
**Time:** 15-20 minutes

#### Step 1: Create Cognito Test User
```bash
aws cognito-idp sign-up \
  --client-id 2kd1s766htbltrgbqn3q9ujkpe \
  --username test@example.com \
  --password TestPassword123! \
  --user-attributes Name=email,Value=test@example.com \
  --region ap-southeast-1
```

#### Step 2: Confirm User
Check email for confirmation code, then:
```bash
aws cognito-idp confirm-sign-up \
  --client-id 2kd1s766htbltrgbqn3q9ujkpe \
  --username test@example.com \
  --confirmation-code [CODE] \
  --region ap-southeast-1
```

#### Step 3: Get Authentication Token
```bash
aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --auth-parameters USERNAME=test@example.com,PASSWORD=TestPassword123! \
  --client-id 2kd1s766htbltrgbqn3q9ujkpe \
  --region ap-southeast-1 \
  --query "AuthenticationResult.IdToken" \
  --output text
```

#### Step 4: Test API Endpoints

**Create Organisation:**
```bash
curl -X POST https://2cbejgemyi.execute-api.ap-southeast-1.amazonaws.com/v1/organisations \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Company Ltd",
    "br_number": "12345678",
    "cr_number": "98765432",
    "contact_email": "test@example.com"
  }'
```

**List Organisations:**
```bash
curl -X GET https://2cbejgemyi.execute-api.ap-southeast-1.amazonaws.com/v1/organisations \
  -H "Authorization: Bearer [TOKEN]"
```

**Get Organisation:**
```bash
curl -X GET https://2cbejgemyi.execute-api.ap-southeast-1.amazonaws.com/v1/organisations/[ORG_ID] \
  -H "Authorization: Bearer [TOKEN]"
```

---

### Objective 3: Deploy CorpID Service
**Priority:** HIGH  
**Time:** 20-30 minutes

#### Step 1: Package Lambda
```bash
cd infrastructure/lambdas/corpid-service
zip -r corpid-service.zip *
```

#### Step 2: Upload to S3
```bash
aws s3 cp corpid-service.zip \
  s3://cdk-hnb659fds-assets-240966654973-ap-southeast-1/corpid-service.zip \
  --region ap-southeast-1
```

#### Step 3: Create Lambda Function
Use AWS Console or CLI:
```bash
aws lambda create-function \
  --function-name QuickCorpID-CorpID-Service \
  --runtime nodejs20.x \
  --role arn:aws:iam::240966654973:role/QuickCorpID-Organisation-OrganisationLambdaServiceR-zb0eAmyoVSX5 \
  --handler index.handler \
  --code S3Bucket=cdk-hnb659fds-assets-240966654973-ap-southeast-1,S3Key=corpid-service.zip \
  --timeout 30 \
  --environment Variables={
    DATABASE_SECRET_ARN=arn:aws:secretsmanager:ap-southeast-1:240966654973:secret:DatabaseSecret86DBB7B3-DiVgdXkHj1O2-r2Oz9D,
    DATABASE_ENDPOINT=quickcorpid-databaseb269d8bb-8oydiecqaoh8.cluster-chg6i2wyozug.ap-southeast-1.rds.amazonaws.com:5432,
    DATABASE_NAME=quickcorpid,
    USER_POOL_ID=ap-southeast-1_JLjSrO6V8,
    KMS_KEY_ID=da1e3b12-9ad6-4b6e-8ed6-8071b6f6f958,
    KEK_SECRET_ARN=arn:aws:secretsmanager:ap-southeast-1:240966654973:secret:CorpIDKEKCertificate-EK7VSH2mFu7q
  } \
  --vpc-config SubnetIds=subnet-04a07f91847b4d134,subnet-0f252ab4bf49d1ee8,SecurityGroupIds=sg-09ef614e63a71b755 \
  --region ap-southeast-1
```

#### Step 4: Create API Gateway
Create new API Gateway or add resources to existing one.

---

### Objective 4: Frontend Integration
**Priority:** MEDIUM  
**Time:** 30-45 minutes

#### Update Authentication Configuration

**File:** `src/lib/AuthContext.tsx`
```typescript
import { CognitoUserPool } from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: 'ap-southeast-1_JLjSrO6V8',
  ClientId: '2kd1s766htbltrgbqn3q9ujkpe'
};

export const userPool = new CognitoUserPool(poolData);
```

#### Update Environment Variables

**File:** `.env` or `.env.local`
```bash
VITE_AWS_REGION=ap-southeast-1
VITE_COGNITO_USER_POOL_ID=ap-southeast-1_JLjSrO6V8
VITE_COGNITO_CLIENT_ID=2kd1s766htbltrgbqn3q9ujkpe
VITE_API_BASE_URL=https://2cbejgemyi.execute-api.ap-southeast-1.amazonaws.com/v1
```

#### Test Authentication Flow
1. User registration
2. Email verification
3. Login
4. Token refresh
5. Logout

---

## 📋 Testing Checklist

### Database
- [ ] Schema initialized successfully
- [ ] All 12 tables created
- [ ] Indexes created
- [ ] Triggers working

### Organisation Service
- [ ] Create organisation
- [ ] List organisations
- [ ] Get organisation details
- [ ] Update organisation
- [ ] Delete organisation
- [ ] Add member
- [ ] List members
- [ ] Update member
- [ ] Remove member

### CorpID Service
- [ ] Lambda deployed
- [ ] API Gateway configured
- [ ] Connect CorpID (OAuth)
- [ ] Generate QR code
- [ ] Sync Document Wallet
- [ ] Initiate signing

### Frontend
- [ ] Cognito configuration updated
- [ ] API client configured
- [ ] Authentication flow working
- [ ] Organisation management UI working

---

## 🚨 Known Issues & Solutions

### Issue 1: AWS CLI Timeouts
**Solution:** Use AWS Console for operations

### Issue 2: Lambda Connection Timeout
**Solution:** Ensure Lambda uses correct security group (sg-09ef614e63a71b755)

### Issue 3: Cognito Token Expiry
**Solution:** Implement token refresh logic in frontend

---

## 📊 Success Metrics

### Technical Metrics
- API response time < 500ms
- Database queries < 100ms
- Lambda cold start < 3s
- All tests passing

### Business Metrics
- User can register and login
- User can create organisation
- User can invite members
- User can connect CorpID (when sandbox available)

---

## 🎓 Best Practices

1. **Always use HTTPS** for API calls
2. **Validate tokens** on every request
3. **Use pagination** for list endpoints
4. **Implement retry logic** for transient failures
5. **Log all errors** to CloudWatch
6. **Use structured logging** (JSON format)
7. **Implement rate limiting** at API Gateway level
8. **Encrypt sensitive data** before storage

---

## 📞 Support

**AWS Console:** https://ap-southeast-1.console.aws.amazon.com  
**Region:** ap-southeast-1 (Singapore)  
**Account:** 240966654973  

**Documentation:**
- [Session Summary](./SESSION_SUMMARY_AUG11.md)
- [Database Init Guide](./DATABASE_INIT_GUIDE.md)
- [Quick Start Guide](./QUICK_START_GUIDE.md)

---

## ⏱️ Time Estimates

- Database initialization: 5-10 min
- API testing: 15-20 min
- CorpID Service deployment: 20-30 min
- Frontend integration: 30-45 min
- **Total:** 70-105 minutes (~1.5-2 hours)

---

**Ready to begin? Start with Objective 1: Initialize Database Schema**
