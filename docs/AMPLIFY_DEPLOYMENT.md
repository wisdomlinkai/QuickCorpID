# QuickCorpID - AWS Amplify Deployment Guide

## Amplify App Details

**App ID:** `dchg28wapo7wi`  
**App Name:** QuickCorpID  
**Region:** `ap-southeast-1` (Singapore)  
**Default Domain:** `https://main.dchg28wapo7wi.amplifyapp.com`

---

## Option 1: Manual Deployment via AWS Console (Recommended for Quick Setup)

### Step 1: Open Amplify Console
1. Navigate to: https://ap-southeast-1.console.aws.amazon.com/amplify/apps/dchg28wapo7wi
2. Click on "main" branch

### Step 2: Manual Deployment
1. Click "Deploy updates" button
2. Drag and drop the `dist` folder or upload files manually
3. Alternatively, use the AWS CLI with the deployment package

### Step 3: Set Environment Variables
Add these environment variables in Amplify Console:

```
VITE_AWS_REGION=ap-southeast-1
VITE_COGNITO_USER_POOL_ID=ap-southeast-1_JLjSrO6V8
VITE_COGNITO_CLIENT_ID=2kd1s766htbltrgbqn3q9ujkpe
VITE_S3_BUCKET=quickcorpid-documents-240966654973-ap-southeast-1
VITE_AUTH_API_URL=https://v3sz1loura.execute-api.ap-southeast-1.amazonaws.com/v1
VITE_ORG_API_URL=https://2cbejgemyi.execute-api.ap-southeast-1.amazonaws.com/v1
VITE_CORPID_API_URL=https://y4zdzgdoff.execute-api.ap-southeast-1.amazonaws.com/v1
VITE_DOCUMENT_API_URL=https://i7i8airnmk.execute-api.ap-southeast-1.amazonaws.com/v1
```

---

## Option 2: Connect GitHub Repository (Recommended for CI/CD)

### Step 1: Connect Repository via Console
1. Open: https://ap-southeast-1.console.aws.amazon.com/amplify/apps/dchg28wapo7wi
2. Click "App settings" → "Repository"
3. Click "Connect repository"
4. Select "GitHub"
5. Authorize AWS Amplify to access GitHub
6. Select repository: `wisdomlinkai/QuickCorpID`
7. Select branch: `main`

### Step 2: Configure Build Settings
Amplify will auto-detect Vite. Use these settings:

**Build command:** `npm run build`  
**Output directory:** `dist`

**Build spec (amplify.yml):**
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

### Step 3: Set Environment Variables
In Amplify Console → App settings → Environment variables:
- Add all VITE_* variables listed above

### Step 4: Deploy
1. Click "Save"
2. Amplify will automatically start the first build
3. Monitor build logs in real-time

---

## Option 3: AWS CLI Deployment

### Method A: Create Deployment Package

```bash
# Create a zip file of the dist folder
cd dist
zip -r ../deployment.zip .
cd ..

# Create S3 bucket for deployment artifacts (one-time)
aws s3 mb s3://quickcorpid-deployments-240966654973 --region ap-southeast-1

# Upload deployment package
aws s3 cp deployment.zip s3://quickcorpid-deployments-240966654973/quickcorpid-v1.zip

# Start deployment
aws amplify start-deployment \
  --app-id dchg28wapo7wi \
  --branch-name main \
  --source-url-type S3 \
  --source-url "s3://quickcorpid-deployments-240966654973/quickcorpid-v1.zip" \
  --region ap-southeast-1
```

### Method B: Manual File Upload

```bash
# Use the Amplify Console to upload files manually
# Open: https://ap-southeast-1.console.aws.amazon.com/amplify/apps/dchg28wapo7wi
# Click "main" branch → "Deploy updates"
```

---

## Post-Deployment Configuration

### 1. Custom Domain (Optional)
```bash
# Add custom domain
aws amplify create-domain-association \
  --app-id dchg28wapo7wi \
  --domain-name quickcorpid.com \
  --region ap-southeast-1
```

### 2. Update CORS Settings
If you encounter CORS issues, update API Gateway CORS settings:

**Auth API:**
```bash
aws apigatewayv2 update-api \
  --api-id v3sz1loura \
  --cors-configuration AllowOrigins='["https://main.dchg28wapo7wi.amplifyapp.com"]' \
  --region ap-southeast-1
```

**Org API:**
```bash
aws apigatewayv2 update-api \
  --api-id 2cbejgemyi \
  --cors-configuration AllowOrigins='["https://main.dchg28wapo7wi.amplifyapp.com"]' \
  --region ap-southeast-1
```

**CorpID API:**
```bash
aws apigatewayv2 update-api \
  --api-id y4zdzgdoff \
  --cors-configuration AllowOrigins='["https://main.dchg28wapo7wi.amplifyapp.com"]' \
  --region ap-southeast-1
```

**Document API:**
```bash
aws apigatewayv2 update-api \
  --api-id i7i8airnmk \
  --cors-configuration AllowOrigins='["https://main.dchg28wapo7wi.amplifyapp.com"]' \
  --region ap-southeast-1
```

### 3. Update Cognito Callback URLs
Add Amplify URL to Cognito allowed callbacks:

```bash
aws cognito-idp update-user-pool-client \
  --user-pool-id ap-southeast-1_JLjSrO6V8 \
  --client-id 2kd1s766htbltrgbqn3q9ujkpe \
  --callback-urls '["http://localhost:5173","https://main.dchg28wapo7wi.amplifyapp.com"]' \
  --logout-urls '["http://localhost:5173","https://main.dchg28wapo7wi.amplifyapp.com"]' \
  --allowed-o-auth-flows-user-pool-client \
  --allowed-o-auth-flows '["code"]' \
  --allowed-o-auth-scopes '["email","openid","profile"]' \
  --region ap-southeast-1
```

---

## Testing the Deployed Application

### 1. Access the Application
Open: `https://main.dchg28wapo7wi.amplifyapp.com`

### 2. Test User Flow
1. Click "Login" in navbar
2. Enter credentials:
   - Email: `testuser@example.com`
   - Password: `TestPass123!`
3. Verify login successful
4. Navigate through all pages:
   - Dashboard (`/dashboard`)
   - Organisations (`/organisations`)
   - CorpID (`/corpid`)
   - Documents (`/documents`)
   - Settings (`/settings`)

### 3. Test API Integration
- Create organisation
- Upload document
- Test CorpID connection (will show QR code)
- Update settings

### 4. Check Browser Console
Open browser DevTools (F12) and check:
- No JavaScript errors
- API calls successful
- Environment variables loaded
- Cognito working

---

## Monitoring

### View Build Logs
```bash
# List all jobs
aws amplify list-jobs \
  --app-id dchg28wapo7wi \
  --branch-name main \
  --region ap-southeast-1

# Get specific job details
aws amplify get-job \
  --app-id dchg28wapo7wi \
  --branch-name main \
  --job-id <job-id> \
  --region ap-southeast-1
```

### View App Metrics
Open: https://ap-southeast-1.console.aws.amazon.com/amplify/apps/dchg28wapo7wi/main

- Build success rate
- Deployment status
- Access logs
- Performance metrics

---

## Troubleshooting

### Build Fails
1. Check build logs in Amplify Console
2. Verify `npm run build` works locally
3. Check environment variables are set
4. Verify Node.js version (18+)

### CORS Errors
1. Update API Gateway CORS (see above)
2. Check browser console for specific error
3. Verify API URLs in .env

### Authentication Issues
1. Check Cognito callback URLs include Amplify URL
2. Verify Cognito User Pool ID and Client ID
3. Check browser console for auth errors
4. Test login with demo credentials

### API Connection Issues
1. Verify API Gateway endpoints are correct
2. Check API Gateway logs in CloudWatch
3. Test APIs directly with curl/Postman
4. Verify Lambda functions are running

### Environment Variables Not Loading
1. Rebuild app after adding env vars
2. Clear browser cache
3. Check env var names start with VITE_
4. Restart dev server locally

---

## Deployment Checklist

- [ ] Amplify app created (App ID: dchg28wapo7wi)
- [ ] Repository connected (GitHub: wisdomlinkai/QuickCorpID)
- [ ] Branch created (main)
- [ ] Build spec configured
- [ ] Environment variables added (8 vars)
- [ ] First deployment successful
- [ ] Custom domain configured (optional)
- [ ] CORS updated for all APIs
- [ ] Cognito callbacks updated
- [ ] SSL certificate valid
- [ ] Application accessible at Amplify URL
- [ ] Login works
- [ ] All pages load
- [ ] API integration working
- [ ] Document upload/download working
- [ ] CorpID connection working

---

## Production URL

**Amplify URL:** https://main.dchg28wapo7wi.amplifyapp.com  
**Custom Domain:** (To be configured)

---

## Next Steps

1. **Connect Repository** - Link GitHub repo for automatic deployments
2. **Configure Domain** - Add custom domain (quickcorpid.com)
3. **Set Up SSL** - Amplify provides automatic SSL
4. **Monitor Performance** - Use Amplify analytics
5. **Set Up Alerts** - Configure CloudWatch alarms
6. **Enable CI/CD** - Auto-deploy on Git push

---

**App ID:** `dchg28wapo7wi`  
**Region:** `ap-southeast-1`  
**Status:** Ready for Deployment  
**Created:** August 13, 2026
