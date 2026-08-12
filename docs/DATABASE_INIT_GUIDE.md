# Database Initialization - Quick Guide

## Current Status

The Database Init Lambda has been deployed and configured, but is experiencing connection timeouts. This guide provides alternative approaches to initialize the database schema.

---

## Option 1: Use AWS Console (Recommended)

### Steps:
1. Log into AWS Console (Singapore region)
2. Go to Lambda → QuickCorpID-DatabaseInit
3. Click "Test" tab
4. Create a test event with empty JSON: `{}`
5. Click "Test" button
6. Check CloudWatch Logs for results

### Expected Output:
```json
{
  "statusCode": 200,
  "body": {
    "message": "Database schema initialized successfully",
    "tablesCreated": 12,
    "successCount": 50,
    "errorCount": 0
  }
}
```

---

## Option 2: Manual SQL Execution via EC2

### Prerequisites:
- EC2 instance in the same VPC
- PostgreSQL client installed

### Steps:
1. Launch a temporary EC2 instance in VPC `vpc-0eb147dcef42bb6ae`
2. Install PostgreSQL client:
   ```bash
   sudo yum install postgresql
   ```
3. Connect to database:
   ```bash
   psql -h quickcorpid-databaseb269d8bb-8oydiecqaoh8.cluster-chg6i2wyozug.ap-southeast-1.rds.amazonaws.com \
     -U [username] \
     -d quickcorpid
   ```
4. Run the schema from: `infrastructure/database/schema.sql`

---

## Option 3: Use AWS Cloud9

### Steps:
1. Create a Cloud9 environment in Singapore region
2. Ensure it's in the same VPC
3. Use the built-in terminal to connect to PostgreSQL
4. Execute the schema SQL

---

## Option 4: Lambda Function URL (Direct Invocation)

### Steps:
1. Add Function URL to the Lambda:
   ```bash
   aws lambda create-function-url-config \
     --function-name QuickCorpID-DatabaseInit \
     --auth-type NONE \
     --region ap-southeast-1
   ```
2. Invoke via HTTP:
   ```bash
   curl -X POST [function-url]
   ```

---

## Schema File Location

The complete database schema is located at:
```
c:\QuickCorpID\infrastructure\database\schema.sql
```

---

## Tables to be Created

1. **users** - User profiles and authentication
2. **organisations** - Company information  
3. **organisation_members** - User-organisation relationships
4. **corpid_connections** - CorpID integration data
5. **documents** - Document metadata
6. **document_shares** - Document sharing permissions
7. **signing_requests** - Digital signing workflows
8. **compliance_items** - Compliance calendar and deadlines
9. **audit_logs** - Immutable audit trail
10. **subscriptions** - Billing and plans
11. **usage_metrics** - Usage tracking
12. **notifications** - User notifications

---

## Security Group Configuration

### Current Setup:
- **Lambda Security Group:** `sg-09ef614e63a71b755` (same as Organisation Lambda)
- **Database Security Group:** `sg-0fcbaed1f5d8f69d4`
- **Inbound Rule:** Database SG allows connections from `sg-0ed61a2026caaf360`

### Required Fix:
The Lambda should be able to connect now that it's using the Organisation Lambda's security group.

---

## Troubleshooting

### If Connection Still Times Out:

1. **Check Lambda VPC Config:**
   ```bash
   aws lambda get-function-configuration \
     --function-name QuickCorpID-DatabaseInit \
     --region ap-southeast-1 \
     --query "VpcConfig"
   ```

2. **Check Database Security Group:**
   ```bash
   aws ec2 describe-security-groups \
     --group-ids sg-0fcbaed1f5d8f69d4 \
     --region ap-southeast-1
   ```

3. **Check Subnet Route Tables:**
   Ensure Lambda subnets have route to database subnets

4. **Check Database Status:**
   ```bash
   aws rds describe-db-clusters \
     --db-cluster-identifier quickcorpid-database \
     --region ap-southeast-1 \
     --query "DBClusters[0].Status"
   ```

---

## Verification Steps

After successful schema initialization:

1. **Check Tables:**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```

2. **Check Indexes:**
   ```sql
   SELECT indexname, tablename 
   FROM pg_indexes 
   WHERE schemaname = 'public';
   ```

3. **Check Triggers:**
   ```sql
   SELECT trigger_name, event_object_table 
   FROM information_schema.triggers;
   ```

---

## Next Steps After Schema Initialization

1. **Test Organisation Service API**
   - Create organisation
   - List organisations
   - Add members

2. **Deploy CorpID Service**
   - Upload Lambda to S3
   - Create CloudFormation stack

3. **Update Frontend Configuration**
   - Configure Cognito
   - Set API endpoints

---

## Alternative: Skip Manual Initialization

If Lambda continues to have issues, the tables will be created automatically when:
- Organisation Service creates the first organisation
- CorpID Service creates the first connection

However, explicit schema creation is recommended for production.

---

## Contact & Support

- **AWS Region:** ap-southeast-1 (Singapore)
- **Account:** 240966654973
- **VPC:** vpc-0eb147dcef42bb6ae
- **Database:** quickcorpid (Aurora PostgreSQL Serverless v2)

---

**Last Updated:** August 11, 2026, 1:45 PM
