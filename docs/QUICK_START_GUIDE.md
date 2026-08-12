# QuickCorpID - Quick Start Guide

**Last Updated:** August 11, 2026

---

## 🚀 Immediate Actions Required

### 1. Initialize Database Schema (CRITICAL)

**Option A: AWS Console**
1. Go to Lambda in AWS Console (Singapore region)
2. Find the schema initialization Lambda
3. Create a test event with empty JSON: `{}`
4. Click "Test" to invoke
5. Check CloudWatch Logs for success/failure

**Option B: AWS CLI**
```bash
aws lambda invoke \
  --function-name [schema-lambda-name] \
  --region ap-southeast-1 \
  --payload '{}' \
  response.json

cat response.json
```

---

### 2. Test Organisation Service API

**Get Cognito Token:**
```bash
# Using AWS CLI
aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --auth-parameters USERNAME=test@example.com,PASSWORD=TestPassword123! \
  --client-id 2kd1s766htbltrgbqn3q9ujkpe \
  --region ap-southeast-1
```

**Test API:**
```bash
# Create organisation
curl -X POST https://2cbejgemyi.execute-api.ap-southeast-1.amazonaws.com/v1/organisations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Company Ltd",
    "br_number": "12345678",
    "cr_number": "98765432"
  }'

# List organisations
curl -X GET https://2cbejgemyi.execute-api.ap-southeast-1.amazonaws.com/v1/organisations \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. Update Frontend Configuration

**File:** `src/lib/AuthContext.tsx`

```typescript
import { CognitoUserPool } from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: 'ap-southeast-1_JLjSrO6V8',
  ClientId: '2kd1s766htbltrgbqn3q9ujkpe'
};

export const userPool = new CognitoUserPool(poolData);
```

**File:** `.env` or `.env.local`

```bash
VITE_AWS_REGION=ap-southeast-1
VITE_COGNITO_USER_POOL_ID=ap-southeast-1_JLjSrO6V8
VITE_COGNITO_CLIENT_ID=2kd1s766htbltrgbqn3q9ujkpe
VITE_API_BASE_URL=https://2cbejgemyi.execute-api.ap-southeast-1.amazonaws.com/v1
```

---

## 📋 Deployment Checklist

### Infrastructure (✅ Complete)
- [x] VPC created
- [x] Aurora PostgreSQL deployed
- [x] S3 buckets created
- [x] Cognito User Pool created
- [x] KMS keys created
- [x] Secrets Manager configured

### Backend Services
- [x] Organisation Service deployed
- [ ] CorpID Service deployed
- [ ] Database schema initialized
- [ ] API endpoints tested

### Frontend
- [ ] Cognito integration updated
- [ ] API client configured
- [ ] Authentication flow tested
- [ ] Organisation management UI working

---

## 🔧 Useful Commands

### Check CloudFormation Stack Status
```bash
aws cloudformation describe-stacks \
  --stack-name QuickCorpID-Organisation \
  --region ap-southeast-1 \
  --query "Stacks[0].StackStatus"
```

### View Lambda Logs
```bash
aws logs tail /aws/lambda/[function-name] \
  --region ap-southeast-1 \
  --since 1h
```

### Test Database Connection
```bash
# Get database credentials
aws secretsmanager get-secret-value \
  --secret-id DatabaseSecret86DBB7B3-DiVgdXkHj1O2-r2Oz9D \
  --region ap-southeast-1 \
  --query SecretString \
  --output text | jq '.'

# Connect to database (from EC2 in same VPC)
psql -h quickcorpid-databaseb269d8bb-8oydiecqaoh8.cluster-chg6i2wyozug.ap-southeast-1.rds.amazonaws.com \
  -U [username] \
  -d quickcorpid
```

### Invoke Lambda Function
```bash
aws lambda invoke \
  --function-name [function-name] \
  --region ap-southeast-1 \
  --payload '{"test": true}' \
  response.json
```

---

## 🐛 Common Issues & Solutions

### Issue: Lambda cannot connect to database
**Solution:** Check security group rules allow Lambda security group to access database security group on port 5432

### Issue: API returns 401 Unauthorized
**Solution:** Ensure Cognito token is valid and not expired. Check token format: `Bearer [token]`

### Issue: CDK deploy fails on Windows
**Solution:** Use manual CloudFormation deployment with template upload to S3

### Issue: Database schema not created
**Solution:** Manually invoke the schema Lambda function via AWS Console or CLI

---

## 📊 Monitoring & Logs

### CloudWatch Dashboards
- Lambda function metrics
- API Gateway metrics
- Aurora PostgreSQL metrics

### Log Groups
- `/aws/lambda/QuickCorpID-Organisation-*`
- `/aws/lambda/QuickCorpID-CorpID-*`
- `API-Gateway-Execution-Logs_*`

---

## 🔐 Security Notes

1. **Never commit secrets to Git**
   - Use `.env.local` for local development
   - Use Secrets Manager for production

2. **API Authentication**
   - All endpoints require Cognito JWT token
   - Token format: `Authorization: Bearer [token]`

3. **Database Access**
   - Only accessible from within VPC
   - Credentials stored in Secrets Manager
   - Encryption at rest enabled

4. **CorpID Tokens**
   - Encrypted with KMS before storage
   - KEK certificate stored in Secrets Manager
   - Follows CorpID security specification

---

## 📞 Support

**AWS Resources:**
- Region: ap-southeast-1 (Singapore)
- Account: 240966654973

**Documentation:**
- [Next Steps](./NEXT_STEPS.md)
- [Sprint 2 Summary](./SPRINT2_COMPLETION_SUMMARY.md)
- [Full Documentation](./COMPREHENSIVE_DEVELOPMENT_DOCUMENTATION.md)

---

## ✅ Definition of Done

For each feature:
- [ ] Code complete and tested
- [ ] Database schema updated (if needed)
- [ ] API endpoints documented
- [ ] Lambda functions deployed
- [ ] CloudWatch logs accessible
- [ ] Security reviewed
- [ ] Frontend integrated (if applicable)
- [ ] User acceptance testing complete

---

**Ready to start? Begin with Step 1: Initialize Database Schema**
