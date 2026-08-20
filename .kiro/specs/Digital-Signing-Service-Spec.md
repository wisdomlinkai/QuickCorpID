# Digital Signing Service Specification

**Feature:** Digital Signing Service
**Priority:** P0 (Highest)
**Version:** 1.0
**Last Updated:** August 7, 2026
**Target:** Phase 2 - Week 1-2

---

## 1. Overview

### 1.1 Purpose

Enable businesses to digitally sign documents using CorpID, replacing traditional company chops and wet signatures with legally recognized digital signatures.

### 1.2 Value Proposition

- **Legally Recognized:** CorpID signatures are legally binding under Hong Kong law
- **Multi-Signer Support:** Multiple parties can sign the same document
- **Audit Trail:** Complete record of who signed what and when
- **Convenience:** Sign from anywhere using CorpID mobile app
- **Efficiency:** No more printing, signing, scanning, and emailing

### 1.3 Target Users

- Company directors signing resolutions
- Authorized representatives signing contracts
- Multiple parties signing agreements
- Company secretaries managing signature workflows

---

## 2. Functional Requirements

### 2.1 Core Features

#### 2.1.1 Create Signing Request

**Actors:** Organisation admin, authorised representative

**Preconditions:**
- User is authenticated
- User has appropriate permissions
- Document exists in the system
- Document status is 'uploaded'

**Main Flow:**
1. User navigates to Documents page
2. User selects a document to sign
3. User clicks "Request Signature" button
4. System opens Signing Request Modal
5. User enters signing details:
   - Document purpose (optional)
   - Message to signers (optional)
   - Expiration date (default 7 days)
   - Reminder frequency (optional)
6. User adds signers:
   - Name (required)
   - Email (required)
   - Role (required): director, authorised_rep, witness, other
   - Signing order (optional)
   - Custom message (optional)
7. User reviews signing request
8. User clicks "Send Request"
9. System creates signing request
10. System generates unique QR code for each signer
11. System sends email notification to signers
12. System displays confirmation with QR codes

**Postconditions:**
- Signing request created with status 'pending'
- QR codes generated for each signer
- Email notifications sent
- Document status changed to 'pending_signature'

**Alternative Flows:**
- **Invalid email:** System shows error, user must correct
- **Document already signed:** System shows error message
- **No permission:** System shows access denied

---

#### 2.1.2 Sign Document via CorpID

**Actors:** Signer (document recipient)

**Preconditions:**
- Signing request exists
- Signing request status is 'pending'
- Signer has CorpID mobile app
- Signer's CorpID is active

**Main Flow:**
1. Signer receives email notification
2. Signer clicks "Sign Document" link or scans QR code
3. System redirects to signing page
4. System displays:
   - Document preview
   - Document details (name, purpose, requested by)
   - Signer role
   - Signing deadline
   - Terms and conditions
5. Signer reviews document
6. Signer clicks "Sign with CorpID"
7. System redirects to CorpID authentication
8. Signer authenticates with CorpID app (biometric/PIN)
9. CorpID returns authentication token
10. System verifies signer identity
11. System records signature:
    - Timestamp
    - Signer identity
    - IP address
    - Device information
    - CorpID reference
12. System updates signing status
13. System sends confirmation email to signer
14. System notifies organisation admin
15. If all signers completed:
    - System marks document as 'signed'
    - System generates signed PDF with signature page
    - System stores signed document
    - System sends notification to all parties

**Postconditions:**
- Signature recorded with audit trail
- Document status updated
- Notifications sent

**Alternative Flows:**
- **Signer declines:** Signer can decline to sign, status updated to 'declined'
- **CorpID not active:** System shows error, redirects to CorpID setup
- **Authentication failed:** System shows error, allows retry
- **Request expired:** System shows expiration message

---

#### 2.1.3 Track Signing Status

**Actors:** Organisation admin, authorised representative

**Main Flow:**
1. User navigates to Documents page
2. User clicks on document with pending signature
3. System displays signing status panel:
   - Overall status (pending, in_progress, completed)
   - Individual signer status:
     - Pending (waiting)
     - Sent (email delivered)
     - Viewed (opened link)
     - In Progress (started signing)
     - Completed (signed)
     - Declined
     - Expired
   - Timestamps for each status change
   - QR code (still valid if pending)
   - Actions (send reminder, cancel, view audit trail)

**Status Definitions:**
- **pending:** Request created, email not yet sent
- **sent:** Email delivered to signer
- **viewed:** Signer opened signing page
- **in_progress:** Signer started signing process
- **completed:** Signer successfully signed
- **declined:** Signer declined to sign
- **expired:** Request expired before completion
- **cancelled:** Request cancelled by admin

---

#### 2.1.4 Manage Signing Requests

**Actors:** Organisation admin

**Actions:**

**Send Reminder:**
- Sends reminder email to pending signers
- Can set custom reminder message
- Maximum 3 reminders per signer

**Cancel Request:**
- Cancels pending signing request
- Notifies all signers
- Document status reverts to 'uploaded'
- Cannot cancel if any signer completed

**Extend Expiration:**
- Extends deadline by specified days
- Notifies pending signers
- Updates QR codes

**Reassign Signer:**
- Replaces one signer with another
- Generates new QR code
- Notifies new signer
- Preserves existing signatures

**View Audit Trail:**
- Displays complete history of signing request
- All status changes with timestamps
- All email notifications sent
- All actions taken
- Downloadable as PDF

---

#### 2.1.5 View Signed Documents

**Actors:** All authenticated users with permission

**Main Flow:**
1. User navigates to Documents page
2. User filters by status 'signed'
3. System displays signed documents
4. User clicks on signed document
5. System displays:
   - Original document
   - Signed document (with signature page)
   - Signature details:
     - Who signed
     - When signed
     - CorpID reference
     - Certificate of completion
   - Download options

**Signature Page:**
- Document name
- All signers with:
  - Name
  - Role
  - Timestamp
  - CorpID reference number
- Certificate unique ID
- Verification QR code

---

### 2.2 Signing Request Data Model

```typescript
interface SigningRequest {
  id: string; // UUID
  document_id: string; // FK to documents
  org_id: string; // FK to organisations
  created_by: string; // FK to users
  purpose?: string;
  message?: string;
  status: SigningRequestStatus;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
  cancelled_at?: Date;
  cancelled_by?: string;
  cancellation_reason?: string;
}

interface Signer {
  id: string; // UUID
  signing_request_id: string; // FK to signing_requests
  name: string;
  email: string;
  role: SignerRole;
  order?: number; // Signing order (optional)
  message?: string;
  status: SignerStatus;
  corp_id_reference?: string; // CorpID transaction ID
  qr_code?: string; // Unique QR code URL
  qr_code_expires_at?: Date;
  viewed_at?: Date;
  signed_at?: Date;
  declined_at?: Date;
  declined_reason?: string;
  ip_address?: string;
  device_info?: string;
  created_at: Date;
  updated_at: Date;
}

interface SignatureAuditLog {
  id: string;
  signing_request_id: string;
  signer_id?: string;
  action: string;
  details: JSON;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

type SigningRequestStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'partially_completed'
  | 'declined'
  | 'expired'
  | 'cancelled';

type SignerRole = 
  | 'director'
  | 'authorised_rep'
  | 'witness'
  | 'other';

type SignerStatus = 
  | 'pending'
  | 'sent'
  | 'viewed'
  | 'in_progress'
  | 'completed'
  | 'declined'
  | 'expired';
```

---

### 2.3 Database Schema

```sql
-- Signing Requests
CREATE TABLE signing_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  purpose TEXT,
  message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancelled_by UUID REFERENCES users(id),
  cancellation_reason TEXT,
  
  INDEX idx_signing_requests_document (document_id),
  INDEX idx_signing_requests_org (org_id),
  INDEX idx_signing_requests_status (status)
);

-- Signers
CREATE TABLE signers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signing_request_id UUID REFERENCES signing_requests(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  order INTEGER,
  message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  corp_id_reference VARCHAR(255),
  qr_code TEXT,
  qr_code_expires_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  signed_at TIMESTAMP WITH TIME ZONE,
  declined_at TIMESTAMP WITH TIME ZONE,
  declined_reason TEXT,
  ip_address VARCHAR(45),
  device_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_signers_request (signing_request_id),
  INDEX idx_signers_email (email),
  INDEX idx_signers_status (status)
);

-- Signature Audit Log
CREATE TABLE signature_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signing_request_id UUID REFERENCES signing_requests(id) ON DELETE CASCADE,
  signer_id UUID REFERENCES signers(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_audit_signing_request (signing_request_id),
  INDEX idx_audit_created_at (created_at)
);
```

---

## 3. API Specifications

### 3.1 REST Endpoints

#### Create Signing Request

```http
POST /organisations/{orgId}/documents/{documentId}/signing-requests
Authorization: Bearer {token}
Content-Type: application/json

{
  "purpose": "Board resolution for annual audit appointment",
  "message": "Please sign this resolution for our upcoming audit",
  "expiresInDays": 7,
  "signers": [
    {
      "name": "John Doe",
      "email": "john@company.com",
      "role": "director",
      "order": 1,
      "message": "As managing director, your signature is required"
    },
    {
      "name": "Jane Smith",
      "email": "jane@company.com",
      "role": "witness",
      "order": 2
    }
  ]
}

Response 201:
{
  "id": "sr-abc123",
  "documentId": "doc-456",
  "status": "pending",
  "expiresAt": "2026-08-14T12:00:00Z",
  "signers": [
    {
      "id": "signer-1",
      "name": "John Doe",
      "email": "john@company.com",
      "role": "director",
      "status": "pending",
      "qrCode": "https://corpid.gov.hk/sign/xyz789",
      "qrCodeExpiresAt": "2026-08-14T12:00:00Z"
    }
  ],
  "createdAt": "2026-08-07T12:00:00Z"
}
```

#### Get Signing Request Status

```http
GET /organisations/{orgId}/signing-requests/{requestId}
Authorization: Bearer {token}

Response 200:
{
  "id": "sr-abc123",
  "document": {
    "id": "doc-456",
    "title": "Board Resolution 2026-001",
    "type": "resolution"
  },
  "status": "in_progress",
  "expiresAt": "2026-08-14T12:00:00Z",
  "signers": [
    {
      "id": "signer-1",
      "name": "John Doe",
      "email": "john@company.com",
      "role": "director",
      "status": "completed",
      "signedAt": "2026-08-08T09:30:00Z",
      "corpIdReference": "CORPID-12345"
    },
    {
      "id": "signer-2",
      "name": "Jane Smith",
      "email": "jane@company.com",
      "role": "witness",
      "status": "pending"
    }
  ],
  "auditTrail": [
    {
      "action": "created",
      "timestamp": "2026-08-07T12:00:00Z",
      "details": {"createdBy": "user-123"}
    },
    {
      "action": "signer_completed",
      "timestamp": "2026-08-08T09:30:00Z",
      "details": {"signerId": "signer-1"}
    }
  ]
}
```

#### Cancel Signing Request

```http
POST /organisations/{orgId}/signing-requests/{requestId}/cancel
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Document updated, new version requires signing"
}

Response 200:
{
  "id": "sr-abc123",
  "status": "cancelled",
  "cancelledAt": "2026-08-08T10:00:00Z"
}
```

#### Sign Document (Public Endpoint - No Auth)

```http
POST /sign/{signingToken}
Content-Type: application/json

{
  "action": "sign",
  "corpIdToken": "eyJhbGciOiJSUzI1NiIs..."
}

Response 200:
{
  "status": "success",
  "signedAt": "2026-08-08T09:30:00Z",
  "corpIdReference": "CORPID-12345",
  "documentId": "doc-456"
}
```

#### Download Signed Document

```http
GET /organisations/{orgId}/documents/{documentId}/signed
Authorization: Bearer {token}

Response 200:
{
  "downloadUrl": "https://s3.amazonaws.com/...",
  "expiresAt": "2026-08-08T11:00:00Z"
}
```

---

### 3.2 CorpID Integration

#### CorpID OAuth Flow

```
1. User clicks "Sign with CorpID"
2. System redirects to CorpID authorize endpoint:
   GET https://api.corpid.gov.hk/oauth/authorize
   ?client_id={CLIENT_ID}
   &redirect_uri={CALLBACK_URL}
   &response_type=code
   &scope=sign
   &state={SIGNING_REQUEST_ID}
   &nonce={NONCE}

3. User authenticates with CorpID app
4. CorpID redirects back with code:
   GET {CALLBACK_URL}?code={CODE}&state={SIGNING_REQUEST_ID}

5. System exchanges code for token:
   POST https://api.corpid.gov.hk/oauth/token
   {
     "grant_type": "authorization_code",
     "code": "{CODE}",
     "redirect_uri": "{CALLBACK_URL}",
     "client_id": "{CLIENT_ID}",
     "client_secret": "{CLIENT_SECRET}"
   }

6. CorpID returns tokens:
   {
     "access_token": "...",
     "id_token": "...",
     "expires_in": 3600
   }

7. System verifies id_token and extracts:
   - User identity
   - CorpID reference
   - Signature timestamp
```

#### CorpID Sign API

```typescript
// Verify signature with CorpID
POST https://api.corpid.gov.hk/api/v1/signatures/verify
Headers:
  Authorization: Bearer {ACCESS_TOKEN}
Body:
{
  "signingRequestId": "sr-abc123",
  "documentHash": "sha256-abc123...",
  "signerId": "signer-1"
}

Response:
{
  "verified": true,
  "corpIdReference": "CORPID-12345",
  "timestamp": "2026-08-08T09:30:00Z",
  "certificate": "-----BEGIN CERTIFICATE-----\n..."
}
```

---

## 4. Frontend Components

### 4.1 Component Structure

```
src/components/signing/
├── SigningRequestModal.tsx
├── AddSignerForm.tsx
├── SignerList.tsx
├── SigningStatusBadge.tsx
├── SigningStatusPanel.tsx
├── SigningQRDisplay.tsx
├── AuditTrailTimeline.tsx
├── SignedDocumentViewer.tsx
└── SignaturePagePreview.tsx

src/pages/
├── SigningPage.tsx (public page for signers)
└── SigningCallbackPage.tsx (OAuth callback)
```

### 4.2 Key Components

#### SigningRequestModal.tsx

```typescript
interface Props {
  document: Document;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CreateSigningRequest) => void;
}

// Features:
// - Multi-step form (Details → Signers → Review)
// - Add multiple signers
// - Set expiration date
// - Preview before sending
// - Validation
// - Loading states
```

#### SigningStatusPanel.tsx

```typescript
interface Props {
  signingRequest: SigningRequest;
  onSendReminder: (signerId: string) => void;
  onCancel: () => void;
  onExtend: (days: number) => void;
}

// Features:
// - Display all signers with status
// - Visual progress indicator
// - Action buttons
// - QR code display
// - Timestamps
// - Real-time updates (WebSocket polling)
```

#### SigningQRDisplay.tsx

```typescript
interface Props {
  qrCode: string;
  signerName: string;
  expiresAt: Date;
}

// Features:
// - QR code image
// - Countdown timer
// - Direct link fallback
// - Copy link button
// - Mobile-responsive
```

---

## 5. Security Requirements

### 5.1 Authentication & Authorization

- **Request Creation:** Requires org admin or authorised_rep role
- **Signing:** Public endpoint, requires valid signing token
- **Viewing:** Requires org membership and document permission
- **Audit Logs:** Immutable, append-only

### 5.2 Data Protection

- All documents encrypted at rest (S3 SSE-KMS)
- All documents encrypted in transit (TLS 1.3)
- Signing tokens are single-use, time-limited
- QR codes expire with signing request
- Audit logs retained for 7 years

### 5.3 CorpID Integration Security

- OAuth 2.0 with PKCE
- JWT verification with CorpID public keys
- State parameter to prevent CSRF
- Nonce to prevent replay attacks
- Token introspection for validation

### 5.4 Rate Limiting

- Create signing request: 10 per hour per org
- Send reminder: 3 per signer per request
- Sign document: 5 attempts per token

---

## 6. Non-Functional Requirements

### 6.1 Performance

- Create signing request: < 2 seconds
- Load signing status: < 500ms
- Sign document: < 3 seconds (including CorpID auth)
- QR code generation: < 500ms
- Support 100 concurrent signing requests

### 6.2 Reliability

- 99.9% uptime
- Automatic retry for email delivery
- Fallback to email link if QR fails
- Graceful degradation if CorpID unavailable

### 6.3 Scalability

- Handle 10,000 signing requests per day
- Support 100 signers per document
- Store 1 million audit log entries

---

## 7. Testing Strategy

### 7.1 Unit Tests

- Signing request creation logic
- Status transitions
- Expiration handling
- QR code generation
- Email template rendering

### 7.2 Integration Tests

- CorpID OAuth flow (using sandbox)
- Email delivery
- S3 upload/download
- Database transactions
- API endpoints

### 7.3 E2E Tests

- Complete signing workflow
- Multi-signer scenario
- Expiration scenario
- Cancellation scenario
- Error scenarios

### 7.4 Security Tests

- Token validation
- Permission checks
- SQL injection prevention
- XSS prevention
- CSRF protection

---

## 8. Implementation Plan

### Week 1: Backend

**Day 1-2: Database & API**
- Create database schema
- Implement API endpoints
- Add CorpID integration
- Write unit tests

**Day 3-4: Email & QR**
- Implement email service
- Generate QR codes
- Create email templates
- Test email delivery

**Day 5: Integration**
- Connect to CorpID sandbox
- Test OAuth flow
- Test signing flow
- Security review

### Week 2: Frontend

**Day 1-2: Core Components**
- SigningRequestModal
- AddSignerForm
- SigningStatusPanel

**Day 3-4: Additional Components**
- SigningQRDisplay
- AuditTrailTimeline
- SignedDocumentViewer
- SigningPage (public)

**Day 5: Testing & Polish**
- E2E testing
- Bug fixes
- UX improvements
- Documentation

---

## 9. Success Criteria

### 9.1 Functional

- ✅ User can create signing request with multiple signers
- ✅ Signers can sign using CorpID mobile app
- ✅ System tracks signing status in real-time
- ✅ System sends email notifications
- ✅ System generates QR codes
- ✅ System handles expiration
- ✅ System provides audit trail
- ✅ System generates signed PDF with signature page

### 9.2 Non-Functional

- ✅ < 2 second response time for most operations
- ✅ 99.9% uptime
- ✅ All security requirements met
- ✅ All tests passing
- ✅ CorpID sandbox integration working

### 9.3 User Acceptance

- ✅ Legal team approves signature process
- ✅ CorpID integration verified
- ✅ User testing complete with 5+ users
- ✅ No critical bugs
- ✅ Documentation complete

---

## 10. Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| CorpID API changes | Medium | High | Use stable API version, monitor changelog, maintain sandbox integration |
| Email deliverability issues | Medium | Medium | Use SES with proper SPF/DKIM, monitor bounce rate, provide backup link |
| User adoption of CorpID | Medium | High | Provide clear instructions, video tutorial, support hotline |
| Legal recognition issues | Low | High | Legal review before launch, work with Digital Policy Office |
| Performance under load | Low | Medium | Load testing, auto-scaling, caching |

---

## 11. Dependencies

### Internal
- Document management system ✅
- Organisation management ✅
- User authentication ✅
- Email service ⏳ (needs setup)
- S3 storage ✅

### External
- CorpID Sandbox API access ⏳ (need to apply)
- CorpID Production API access ⏳ (Phase 3)
- AWS SES configured ⏳
- Domain for email sending ⏳

---

## 12. Documentation Requirements

### User Documentation
- How to request signatures
- How to sign documents
- Understanding signing status
- Troubleshooting guide
- FAQ

### Developer Documentation
- API reference
- CorpID integration guide
- Database schema
- Deployment guide

### Legal Documentation
- Terms of use for digital signatures
- Privacy policy
- Data retention policy
- Compliance statement

---

**Status:** ⏳ Specification Complete, Ready for Implementation
**Next:** Create backend services and database schema
