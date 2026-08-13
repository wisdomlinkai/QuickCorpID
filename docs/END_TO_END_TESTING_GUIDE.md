# QuickCorpID - End-to-End Testing Guide

## Prerequisites

1. **Environment Setup**
   ```bash
   # Install dependencies
   npm install
   
   # Verify .env file has correct values
   cat .env
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   The app should be available at `http://localhost:5173`

## Test Credentials

**Cognito User:**
- Email: `testuser@example.com`
- Password: `TestPass123!`

## Test Scenarios

### Scenario 1: User Registration Flow

**Steps:**
1. Navigate to `http://localhost:5173`
2. Click "Sign Up" in navbar
3. Fill in registration form:
   - Full Name: `Test User`
   - Email: `newuser@example.com`
   - Password: `TestPass123!` (must have uppercase, lowercase, numbers)
   - Confirm Password: `TestPass123!`
   - Check terms checkbox
4. Click "Create Account"
5. Verify success message appears
6. Check email for verification link (Cognito)
7. Click verification link
8. Navigate to login page

**Expected Results:**
- ✅ Form validation works (password mismatch, weak password)
- ✅ Success screen shows after registration
- ✅ User receives verification email
- ✅ User can login after verification

### Scenario 2: User Login Flow

**Steps:**
1. Navigate to `/login`
2. Enter credentials:
   - Email: `testuser@example.com`
   - Password: `TestPass123!`
3. Click "Sign In"
4. Should redirect to `/dashboard`

**Expected Results:**
- ✅ Login successful
- ✅ Redirect to dashboard
- ✅ User name appears in navbar
- ✅ Sign out button visible

### Scenario 3: Organisation Management

**Steps:**
1. Login to application
2. Navigate to `/organisations`
3. If no organisations exist:
   - Click "Create Organisation"
   - Fill in form:
     - Organisation Name: `Test Company Ltd`
     - BR Number: `12345678`
     - CR Number: (optional)
   - Click "Create"
4. Verify organisation appears in list
5. Click "Invite Member"
6. Fill in invite form:
   - Email: `colleague@example.com`
   - Role: `Admin`
7. Click "Send Invite"

**Expected Results:**
- ✅ Organisation created successfully
- ✅ Organisation appears in list
- ✅ Invite sent (pending status shows)
- ✅ Member appears in member list

### Scenario 4: Dashboard Overview

**Steps:**
1. Login to application
2. Navigate to `/dashboard`
3. Verify stats cards show:
   - Organisations count
   - Documents count
   - CorpID Connections count
4. Check "My Organisations" section
5. Check "Recent Documents" section

**Expected Results:**
- ✅ All stats display correctly
- ✅ Recent items show
- ✅ CorpID banner appears for unconnected orgs
- ✅ Quick action links work

### Scenario 5: CorpID Connection

**Steps:**
1. Login and navigate to `/corpid`
2. Select organisation from dropdown (if multiple)
3. Verify current connection status shows
4. If not connected:
   - Click "Show QR Code" button
   - Verify QR code modal opens
   - Check countdown timer shows
   - Wait for polling (every 3 seconds)
5. If connected:
   - Verify connection status shows
   - Check features enabled icons

**Expected Results:**
- ✅ QR code generates successfully
- ✅ QR code modal displays properly
- ✅ Polling starts automatically
- ✅ Connection status updates when connected
- ✅ Disconnect works with confirmation

### Scenario 6: Document Upload

**Steps:**
1. Login and navigate to `/documents`
2. Select organisation (if multiple)
3. Click "Upload Document"
4. Select a file (PDF, DOC, DOCX, JPG, PNG)
5. Verify upload progress shows
6. Check document appears in list
7. Click download button
8. Click share button

**Expected Results:**
- ✅ File uploads successfully to S3
- ✅ Document metadata saves to database
- ✅ Document appears in list with correct status
- ✅ Download generates pre-signed URL
- ✅ Share modal opens with options

### Scenario 7: Document Management

**Steps:**
1. Navigate to `/documents`
2. Find a document in list
3. Click download button - verify file downloads
4. Click share button - verify share modal opens
5. Click delete button - verify confirmation appears
6. Confirm deletion - verify document removed from list

**Expected Results:**
- ✅ Download works
- ✅ Share modal shows email and copy link options
- ✅ Delete confirmation appears
- ✅ Document removed after confirmation

### Scenario 8: Settings Management

**Steps:**
1. Navigate to `/settings`
2. Test Profile tab:
   - Update name
   - Click "Save Changes"
   - Verify success message
3. Test Notifications tab:
   - Toggle notification preferences
   - Verify switches animate
4. Test Security tab:
   - Review security options
   - Change language (if supported)
5. Test Organisation tab:
   - Click links to verify they navigate

**Expected Results:**
- ✅ All tabs render correctly
- ✅ Profile updates save successfully
- ✅ Toggle switches work
- ✅ Navigation links work
- ✅ Success/error messages display

### Scenario 9: Protected Routes

**Steps:**
1. Logout (if logged in)
2. Try to navigate directly to `/dashboard`
3. Should redirect to `/login`
4. Try to navigate to `/organisations`
5. Should redirect to `/login`
6. Try to navigate to `/documents`
7. Should redirect to `/login`

**Expected Results:**
- ✅ All protected routes require authentication
- ✅ Redirect to login page works
- ✅ After login, redirects back to intended page

### Scenario 10: Error Handling

**Steps:**
1. Test invalid login credentials
2. Test network errors (disconnect internet)
3. Test file upload with invalid file type
4. Test file upload with file > 5MB (if enforced)

**Expected Results:**
- ✅ Error messages display clearly
- ✅ Loading states show during operations
- ✅ User can retry after errors
- ✅ Errors don't crash the application

## API Endpoint Verification

### Auth Service API
```bash
# Test auth endpoints
curl https://v3sz1loura.execute-api.ap-southeast-1.amazonaws.com/v1/
```

### Organisation Service API
```bash
# Test organisation endpoints (requires auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://2cbejgemyi.execute-api.ap-southeast-1.amazonaws.com/v1/organisations
```

### CorpID Service API
```bash
# Test CorpID endpoints
curl https://y4zdzgdoff.execute-api.ap-southeast-1.amazonaws.com/v1/
```

### Document Service API
```bash
# Test document endpoints
curl https://i7i8airnmk.execute-api.ap-southeast-1.amazonaws.com/v1/
```

## Database Verification

### Check Tables
```sql
-- Connect to Aurora PostgreSQL
psql -h quickcorpid-databaseb269d8bb-8oydiecqaoh8.cluster-chg6i2wyozug.ap-southeast-1.rds.amazonaws.com \
  -U postgres \
  -d quickcorpid

-- List all tables
\dt

-- Check users
SELECT * FROM users;

-- Check organisations
SELECT * FROM organisations;

-- Check documents
SELECT * FROM documents;

-- Check organisation_members
SELECT * FROM organisation_members;
```

## Infrastructure Verification

### S3 Bucket
```bash
# List objects in S3 bucket
aws s3 ls s3://quickcorpid-documents-240966654973-ap-southeast-1/ --region ap-southeast-1

# Check bucket encryption
aws s3api get-bucket-encryption \
  --bucket quickcorpid-documents-240966654973-ap-southeast-1 \
  --region ap-southeast-1
```

### Lambda Functions
```bash
# List Lambda functions
aws lambda list-functions --region ap-southeast-1

# Check specific function
aws lambda get-function \
  --function-name quickcorpid-document-service-dev \
  --region ap-southeast-1
```

### API Gateway
```bash
# List APIs
aws apigatewayv2 get-apis --region ap-southeast-1

# Check Document Service API
aws apigatewayv2 get-api \
  --api-id i7i8airnmk \
  --region ap-southeast-1
```

## Performance Testing

### Load Testing
```bash
# Install k6
brew install k6

# Create load test script
# Run load tests on API endpoints
k6 run load-test.js
```

### Response Time Check
- Dashboard load: < 2 seconds
- Organisation list: < 1 second
- Document list: < 1 second
- File upload: Depends on file size
- API responses: < 500ms

## Security Testing

### Authentication
- ✅ Invalid tokens rejected
- ✅ Expired tokens handled
- ✅ Session timeout works
- ✅ Password requirements enforced

### Authorization
- ✅ Non-members can't access organisations
- ✅ Role-based access works
- ✅ Protected routes enforce authentication

### Data Protection
- ✅ S3 uploads use pre-signed URLs
- ✅ Documents encrypted with KMS
- ✅ Database uses SSL connections
- ✅ Secrets stored in Secrets Manager

## Browser Compatibility

Test in:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)

## Responsive Design Testing

Test at breakpoints:
- ✅ Mobile (320px - 640px)
- ✅ Tablet (641px - 1024px)
- ✅ Desktop (1025px+)
- ✅ Large Desktop (1440px+)

## Final Checklist

### Functionality
- [ ] User registration works
- [ ] User login works
- [ ] Organisation creation works
- [ ] Member invitation works
- [ ] CorpID connection works
- [ ] Document upload works
- [ ] Document download works
- [ ] Settings save works

### UI/UX
- [ ] All pages render correctly
- [ ] Responsive design works
- [ ] Loading states display
- [ ] Error messages show
- [ ] Success confirmations show
- [ ] Bilingual support works

### API Integration
- [ ] Auth API connects
- [ ] Organisation API connects
- [ ] CorpID API connects
- [ ] Document API connects

### Data Persistence
- [ ] Data saves to database
- [ ] Files upload to S3
- [ ] Updates reflect immediately

### Performance
- [ ] Pages load quickly
- [ ] API responses fast
- [ ] No memory leaks
- [ ] Smooth animations

### Security
- [ ] Authentication required
- [ ] Protected routes work
- [ ] File uploads secure
- [ ] SQL injection prevented
- [ ] XSS prevented

## Reporting Issues

If you find issues during testing:

1. **Document the Issue**
   - What happened?
   - What should have happened?
   - Steps to reproduce
   - Screenshots/videos
   - Browser/device info

2. **Check Console**
   - Open browser dev tools
   - Check for JavaScript errors
   - Check network requests
   - Check API responses

3. **Check Logs**
   ```bash
   # Lambda logs
   aws logs tail /aws/lambda/quickcorpid-document-service-dev \
     --region ap-southeast-1 \
     --follow
   ```

4. **Create GitHub Issue**
   - Title: Clear description
   - Labels: bug, priority
   - Assignee: Developer
   - Project: QuickCorpID

## Success Criteria

All tests must pass for production deployment:
- ✅ All user flows work end-to-end
- ✅ No critical bugs
- ✅ Performance acceptable
- ✅ Security verified
- ✅ Browser compatibility confirmed
- ✅ Responsive design verified
- ✅ API integration complete
- ✅ Data persistence working

## Deployment Readiness

After successful testing:
1. Run `npm run build`
2. Verify build completes without errors
3. Test production build locally
4. Deploy to staging environment
5. Repeat critical tests on staging
6. Deploy to production
7. Monitor for issues
8. Verify production deployment

---

**Test Lead:** ________________  
**Date:** ________________  
**Status:** Ready for Testing  
**Version:** Sprint 4 Complete
