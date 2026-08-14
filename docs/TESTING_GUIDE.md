# 🧪 iBiz Smart 智企通 - Step-by-Step Testing Guide

**Application URL:** https://main.dchg28wapo7wi.amplifyapp.com  
**Test Credentials:**  
- Email: `testuser@example.com`  
- Password: `TestPass123!`

---

## 📋 Table of Contents

1. [Authentication](#1-authentication)
2. [Organisation Management](#2-organisation-management)
3. [CorpID Integration](#3-corpid-integration)
4. [Document Management](#4-document-management)
5. [Settings](#5-settings)

---

## 1. Authentication

### 1.1 Login with Test Credentials

**Steps:**

1. Open browser and navigate to: https://main.dchg28wapo7wi.amplifyapp.com

2. **Verify the homepage loads correctly:**
   - ✅ Navbar shows: Home, Login, Register, Dashboard, Pricing, About
   - ✅ Language switcher (EN / 中文) is visible
   - ✅ Footer shows: "© 2026 iBiz Smart 智企通"

3. **Click "Login" in the navbar**
   - ✅ URL changes to: `/login`
   - ✅ Login form appears with email and password fields

4. **Enter test credentials:**
   - Email: `testuser@example.com`
   - Password: `TestPass123!`

5. **Click "Sign In" button**
   - ✅ Loading spinner appears
   - ✅ Redirects to Dashboard page (URL: `/dashboard`)
   - ✅ Navbar updates to show user information (if implemented)

**Expected Result:**
- User successfully authenticated
- Redirected to dashboard
- Session token stored in browser

**If Failed:**
- Check browser console for errors (F12 → Console)
- Verify API endpoints are accessible
- Confirm Cognito User Pool is active

---

### 1.2 Session Management

**Steps:**

1. **After successful login, refresh the page (F5)**
   - ✅ User remains logged in
   - ✅ Dashboard still accessible
   - ✅ No redirect to login page

2. **Open a new browser tab and visit the app URL**
   - ✅ User is still logged in the new tab
   - ✅ Session persists across tabs

3. **Close browser and reopen, then visit the app**
   - ✅ User may need to login again (depends on session duration)
   - ✅ If session expired, redirects to login page

4. **Check browser storage:**
   - Open DevTools (F12)
   - Go to Application tab → Local Storage
   - ✅ Look for Cognito tokens: `CognitoIdentityServiceProvider.*.accessToken`
   - ✅ Token should be present

**Expected Result:**
- Session persists across page refreshes and tabs
- Session expires after timeout period (60 minutes for access token, 7 days for refresh token)

---

### 1.3 Protected Routes

**Steps:**

1. **Logout (if logged in)**
   - Look for logout button in navbar or settings
   - Click logout
   - ✅ Redirects to homepage

2. **Try to access protected routes without login:**
   - Visit: `/dashboard`
   - Visit: `/organisations`
   - Visit: `/corpid`
   - Visit: `/documents`
   - Visit: `/settings`

3. **Verify redirect behavior:**
   - ✅ Each protected route redirects to `/login`
   - ✅ URL shows: `/login`
   - ✅ Login form is displayed

4. **Login and try accessing protected routes again:**
   - Login with test credentials
   - Visit each protected route directly by URL
   - ✅ All routes are now accessible

**Expected Result:**
- Unauthenticated users cannot access protected routes
- Users are redirected to login when not authenticated
- After login, all protected routes are accessible

---

## 2. Organisation Management

### 2.1 Create New Organisation

**Steps:**

1. **Login with test credentials** (if not already logged in)

2. **Navigate to Organisations page:**
   - Click "Organisations" in navbar OR
   - Visit: `/organisations`

3. **Verify organisations page loads:**
   - ✅ Page title: "Organisations"
   - ✅ "Create Organisation" button is visible
   - ✅ List of existing organisations (if any)

4. **Click "Create Organisation" button**
   - ✅ Modal or form appears
   - ✅ Form fields:
     - Organisation Name (English)
     - Organisation Name (Chinese) - optional
     - Business Registration Number (BR Number)
     - Business Type

5. **Fill in organisation details:**
   - Organisation Name: `Test Company Ltd`
   - Organisation Name (Chinese): `測試公司有限公司`
   - BR Number: `12345678`
   - Business Type: `Limited Company`

6. **Click "Create" button**
   - ✅ Loading state appears
   - ✅ Success message: "Organisation created successfully"
   - ✅ New organisation appears in the list

7. **Verify organisation is created:**
   - ✅ Organisation shows in the list
   - ✅ Organisation name displays correctly
   - ✅ BR number shows

**Expected Result:**
- Organisation created successfully
- Appears in organisations list
- Database record created

**If Failed:**
- Check Organisation API: https://2cbejgemyi.execute-api.ap-southeast-1.amazonaws.com/v1/
- Check browser console for errors
- Verify Lambda function is running

---

### 2.2 Invite Team Members

**Steps:**

1. **Navigate to Organisations page**
   - Visit: `/organisations`

2. **Select an organisation from the list**
   - Click on organisation name or "Manage" button
   - ✅ Organisation details page opens

3. **Find "Team Members" section**
   - ✅ Current members list appears
   - ✅ "Invite Member" button is visible

4. **Click "Invite Member" button**
   - ✅ Invite form/modal appears
   - ✅ Fields:
     - Email Address
     - Role (Owner/Admin/Member/Viewer)

5. **Enter team member details:**
   - Email: `testmember@example.com`
   - Role: `Admin`

6. **Click "Send Invite" button**
   - ✅ Loading state appears
   - ✅ Success message: "Invitation sent successfully"
   - ✅ Invitation appears in pending invitations list

7. **Verify invitation:**
   - ✅ Pending invitation shows in member list
   - ✅ Email is listed with "Pending" status

**Expected Result:**
- Invitation sent successfully
- Appears in pending invitations
- Email would be sent to invitee (if email service configured)

**If Failed:**
- Check Organisation API
- Verify Lambda function has email sending permissions
- Check SES configuration (if used)

---

### 2.3 Switch Between Organisations

**Steps:**

1. **Create at least 2 organisations** (if not already created)
   - Create first organisation: "Company A"
   - Create second organisation: "Company B"

2. **Navigate to Dashboard**
   - Visit: `/dashboard`

3. **Find organisation switcher:**
   - Look for dropdown in navbar or dashboard
   - ✅ Current organisation name displays
   - ✅ Dropdown arrow/icon visible

4. **Click on organisation switcher**
   - ✅ List of organisations appears
   - ✅ Shows all organisations user belongs to

5. **Select different organisation:**
   - Click on "Company B"
   - ✅ Active organisation changes
   - ✅ Dashboard updates with Company B data
   - ✅ Organisation name in switcher shows "Company B"

6. **Switch back:**
   - Click switcher again
   - Select "Company A"
   - ✅ Switches back to Company A
   - ✅ Dashboard updates accordingly

7. **Verify data isolation:**
   - Check documents belong to active organisation
   - Check CorpID connection is per organisation
   - ✅ Data is isolated between organisations

**Expected Result:**
- Organisation switcher works smoothly
- Active organisation changes
- Data is properly scoped to active organisation

---

## 3. CorpID Integration

### 3.1 View QR Code for CorpID Connection

**Steps:**

1. **Login with test credentials**

2. **Navigate to CorpID page:**
   - Click "CorpID" in navbar OR
   - Visit: `/corpid`

3. **Verify CorpID page loads:**
   - ✅ Page title: "CorpID Connection"
   - ✅ Current connection status shows
   - ✅ QR code section visible

4. **Initiate CorpID connection:**
   - Click "Connect CorpID" button
   - ✅ QR code appears
   - ✅ QR code is scannable
   - ✅ Timer/expiry notice shows

5. **Verify QR code details:**
   - ✅ QR code image renders
   - ✅ Deep link URL visible (if shown)
   - ✅ Instructions for scanning provided

**Expected Result:**
- QR code generated successfully
- QR code is scannable with mobile device
- Connection process initiates

**Note:** CorpID Sandbox connection requires:
- CorpID Sandbox app installed on mobile
- Valid Hong Kong business registration
- Sandbox environment credentials

---

### 3.2 Check Connection Status

**Steps:**

1. **On CorpID page** (`/corpid`)

2. **View connection status section:**
   - ✅ Status shows: "Not Connected" or "Connected"
   - ✅ Last checked timestamp visible
   - ✅ Refresh/status button available

3. **Check status after QR code scan:**
   - If QR code scanned with CorpID app:
     - ✅ Status updates to "Connected"
     - ✅ CorpID identifier shows
     - ✅ Business information populates

4. **Test auto-refresh:**
   - Wait on the page after scanning QR
   - ✅ Status automatically updates
   - ✅ Polling happens every 5-10 seconds
   - ✅ No manual refresh needed

5. **View connection details (if connected):**
   - ✅ CorpID ID displayed
   - ✅ Business name shows
   - ✅ BR number confirmed
   - ✅ Connection date/time visible

**Expected Result:**
- Connection status accurately reflects state
- Auto-updates after QR code scan
- Shows complete connection details

**Testing Without Mobile App:**
- Connection status will remain "Not Connected"
- Polling will continue until timeout
- Can test status refresh manually

---

## 4. Document Management

### 4.1 Upload Documents

**Steps:**

1. **Login with test credentials**

2. **Navigate to Documents page:**
   - Click "Documents" in navbar OR
   - Visit: `/documents`

3. **Verify documents page loads:**
   - ✅ Page title: "Documents"
   - ✅ Upload button/area visible
   - ✅ Documents list (empty or with existing documents)

4. **Click "Upload" button**
   - ✅ File picker opens
   - OR drag-and-drop area activates

5. **Select a file to upload:**
   - Choose a test file (PDF, JPG, PNG, DOCX)
   - File size: < 10MB for testing

6. **Monitor upload progress:**
   - ✅ Upload progress indicator shows
   - ✅ File name displays
   - ✅ Percentage or spinner visible

7. **Verify upload completion:**
   - ✅ Success message: "Document uploaded successfully"
   - ✅ Document appears in the list
   - ✅ File name, size, and upload date show

8. **Check document details:**
   - Click on uploaded document
   - ✅ Document metadata shows:
     - File name
     - File size
     - Upload date
     - Document type (if classified)

**Expected Result:**
- Document uploads successfully
- Appears in documents list
- Stored in S3 bucket

**If Failed:**
- Check Document API: https://i7i8airnmk.execute-api.ap-southeast-1.amazonaws.com/v1/
- Verify S3 bucket permissions
- Check file size limits
- Verify pre-signed URL generation

---

### 4.2 Download Documents

**Steps:**

1. **Navigate to Documents page** (`/documents`)

2. **Locate uploaded document in list**
   - ✅ Document from previous upload shows
   - ✅ Download icon/button visible

3. **Click download button:**
   - Click download icon or "Download" action
   - ✅ Download initiates
   - ✅ Browser shows download progress

4. **Verify download:**
   - ✅ File downloads to computer
   - ✅ File name matches original
   - ✅ File opens correctly (not corrupted)

5. **Test with different file types:**
   - Upload and download PDF file
   - Upload and download image file (JPG/PNG)
   - Upload and download DOCX file
   - ✅ All file types download correctly

**Expected Result:**
- Documents download successfully
- Files are not corrupted
- Original file names preserved

---

### 4.3 Share Documents

**Steps:**

1. **Navigate to Documents page** (`/documents`)

2. **Locate document to share**
   - Click on document or "Share" action
   - ✅ Share modal/panel opens

3. **Configure sharing options:**
   - ✅ Share link generation option
   - ✅ Expiry time selection (1 hour, 24 hours, 7 days)
   - ✅ Optional: Email recipients

4. **Generate share link:**
   - Click "Generate Link" button
   - ✅ Shareable link created
   - ✅ Link shows in text field
   - ✅ Copy button available

5. **Copy and test link:**
   - Click "Copy" button
   - ✅ Link copied to clipboard
   - ✅ Success message: "Link copied"

6. **Open link in new incognito/private window:**
   - Paste link in browser
   - ✅ Document preview or download initiates
   - ✅ No login required (public access)

7. **Test link expiry:**
   - Create link with 1 hour expiry
   - Wait for expiry (or test with 1 minute if supported)
   - ✅ Expired link shows: "Link has expired"

**Expected Result:**
- Share links generate successfully
- Links provide access to documents
- Links expire as configured

**If Failed:**
- Check S3 bucket policy
- Verify pre-signed URL generation
- Check expiry configuration

---

## 5. Settings

### 5.1 Update Profile

**Steps:**

1. **Login with test credentials**

2. **Navigate to Settings page:**
   - Click "Settings" in navbar OR
   - Visit: `/settings`

3. **Verify settings page loads:**
   - ✅ Page title: "Settings"
   - ✅ Multiple tabs visible:
     - Profile
     - Organisation
     - Notifications
     - Security

4. **Click "Profile" tab** (if not already active)
   - ✅ Profile form shows
   - ✅ Current user information displays:
     - Name
     - Email
     - Phone
     - Language preference

5. **Update profile information:**
   - Change Name: `Test User Updated`
   - Change Phone: `+852 9876 5432`
   - Change Language: `中文`

6. **Click "Save Changes" button**
   - ✅ Loading state appears
   - ✅ Success message: "Profile updated successfully"

7. **Verify updates:**
   - Refresh page
   - ✅ Updated name shows
   - ✅ Updated phone shows
   - ✅ Language preference saved

8. **Test language switch:**
   - If language changed to Chinese
   - ✅ UI elements switch to Chinese
   - ✅ Navbar shows Chinese text
   - ✅ Page content in Chinese

**Expected Result:**
- Profile updates successfully
- Changes persist across sessions
- Language switch works immediately

---

### 5.2 Manage Preferences

**Steps:**

1. **Navigate to Settings page** (`/settings`)

2. **Click "Notifications" tab**
   - ✅ Notification preferences form shows
   - ✅ Toggle switches for:
     - Email notifications
     - Document upload alerts
     - CorpID status alerts
     - Organisation updates

3. **Toggle notification preferences:**
   - Enable/disable "Email Notifications"
   - Enable/disable "Document Upload Alerts"
   - Enable/disable "CorpID Status Alerts"

4. **Click "Save Preferences" button**
   - ✅ Success message: "Preferences saved"

5. **Click "Security" tab**
   - ✅ Security options show:
     - Change password
     - Two-factor authentication (if available)
     - Active sessions
     - Login history

6. **Test password change (optional):**
   - Enter current password: `TestPass123!`
   - Enter new password: `NewTestPass123!`
   - Confirm new password: `NewTestPass123!`
   - Click "Change Password"
   - ✅ Password updated
   - ⚠️ **Important:** Change back to `TestPass123!` for future testing

7. **Verify active sessions:**
   - ✅ Current session shows
   - ✅ Login time visible
   - ✅ Device/browser information shows

**Expected Result:**
- All preferences save correctly
- Security settings update
- Changes persist

---

## 🧪 Comprehensive End-to-End Test

**Complete User Journey:**

1. **Open app as anonymous user**
   - ✅ Homepage loads
   - ✅ Login button visible

2. **Login with test credentials**
   - ✅ Successful login
   - ✅ Redirect to dashboard

3. **Create a new organisation**
   - ✅ Organisation created
   - ✅ Appears in list

4. **Upload a document**
   - ✅ Document uploaded
   - ✅ Shows in documents list

5. **Share the document**
   - ✅ Share link generated
   - ✅ Link works in incognito window

6. **Initiate CorpID connection**
   - ✅ QR code generates
   - ✅ Status shows "Not Connected"

7. **Update profile settings**
   - ✅ Profile updated
   - ✅ Language changed

8. **Logout**
   - ✅ Logged out successfully
   - ✅ Redirect to homepage

9. **Try accessing protected route**
   - ✅ Redirects to login
   - ✅ Cannot access without authentication

10. **Login again**
    - ✅ Session restored
    - ✅ All data persists

---

## ✅ Testing Checklist

### Authentication
- [ ] Login with test credentials
- [ ] Session persists on refresh
- [ ] Session persists across tabs
- [ ] Protected routes redirect when not logged in
- [ ] Protected routes accessible when logged in
- [ ] Logout works correctly

### Organisation Management
- [ ] Create new organisation
- [ ] Organisation appears in list
- [ ] Invite team member
- [ ] Invitation sent successfully
- [ ] Switch between organisations
- [ ] Active organisation changes

### CorpID Integration
- [ ] CorpID page loads
- [ ] QR code generates
- [ ] QR code is scannable
- [ ] Connection status displays
- [ ] Status updates on connection

### Document Management
- [ ] Upload document
- [ ] Document appears in list
- [ ] Download document
- [ ] File downloads correctly
- [ ] Share document
- [ ] Share link works
- [ ] Share link expires correctly

### Settings
- [ ] Profile tab loads
- [ ] Update profile information
- [ ] Changes persist
- [ ] Language switch works
- [ ] Notifications preferences save
- [ ] Security settings accessible

---

## 🐛 Bug Reporting

**If you find any issues, report with:**

1. **Test Case:** Which test failed
2. **Steps to Reproduce:** Exact steps taken
3. **Expected Result:** What should happen
4. **Actual Result:** What actually happened
5. **Screenshots:** If applicable
6. **Browser Console:** Any error messages (F12 → Console)
7. **Network Tab:** Failed API calls (F12 → Network)

---

## 📞 Support

**For issues or questions:**
- Email: support@ibizsmart.hk
- GitHub Issues: https://github.com/wisdomlinkai/QuickCorpID/issues

---

**Testing Guide Version:** 1.0  
**Last Updated:** August 13, 2026  
**Application Version:** 1.0.0
