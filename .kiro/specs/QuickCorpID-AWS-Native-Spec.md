# QuickCorpID - AWS-Native Development Specification

**Version:** 2.0  
**Last Updated:** August 7, 2026  
**Architecture:** AWS-Native Serverless  
**Target Launch:** End 2026 (aligned with CorpID production)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Phase 1: MVP Foundation (Weeks 1-8)](#3-phase-1-mvp-foundation-weeks-1-8)
4. [Phase 2: Feature Enhancement (Weeks 9-16)](#4-phase-2-feature-enhancement-weeks-9-16)
5. [Phase 3: Scale & Advanced Features (Weeks 17+)](#5-phase-3-scale--advanced-features-weeks-17)
6. [Database Schema](#6-database-schema)
7. [API Specifications](#7-api-specifications)
8. [Security & Compliance](#8-security--compliance)
9. [Infrastructure as Code](#9-infrastructure-as-code)
10. [Testing Strategy](#10-testing-strategy)
11. [Deployment Pipeline](#11-deployment-pipeline)
12. [Monitoring & Observability](#12-monitoring--observability)
13. [Risk Mitigation](#13-risk-mitigation)
14. [Success Criteria](#14-success-criteria)

---

## 1. Project Overview

### Product Vision

**QuickCorpID** is a one-stop business identity and compliance hub for Hong Kong companies, providing seamless integration with CorpID (Hong Kong's Digital Corporate Identity Platform), digital signing, document management, Trade Single Window workflows, and compliance calendar management.

### Core Value Proposition

- **Single CorpID Connection** → Manage all business identity needs from one dashboard
- **Digital-First** → Replace paper processes and company chops with legally recognized digital flows
- **Pre-Built Workflows** → Templates for TSW submissions, annual returns, trade finance
- **Bilingual** → Full English and Traditional Chinese support
- **AI-Assisted** → Form explanations, deadline prioritization, risk flags

### Target Users

| User Segment | Description | Primary Use Case |
|--------------|-------------|------------------|
| SME Owners | Small business owners, directors | CorpID registration, document signing |
| Company Secretaries | TCSP firms | Multi-client management, compliance tracking |
| Trading Companies | Import/export businesses | TSW submissions, trade finance |
| Mid-size Firms | Companies with multiple entities | Multi-entity management |

### Business Model

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | CorpID registration, basic dashboard, 1 entity, 3 signatures/month |
| Professional | HK$199/month | Unlimited signatures, 5 entities, 1GB storage, API access |
| Business | HK$499/month | Unlimited entities, team management, SSO, priority support |
| Enterprise | Custom | White-label, custom integrations, SLA, dedicated support |

### Success Metrics

| Metric | Target (Year 1) |
|--------|-----------------|
| Registered Users | 2,000+ |
| Paid Subscribers | 200+ |
| CorpID Connections | 1,500+ |
| Digital Signatures | 10,000+ |
| MRR | HK$40,000+ |

---

## 2. Architecture Overview

### Architecture Principles

- **Serverless-First** → Lambda + API Gateway for APIs, Aurora Serverless v2 for database
- **Event-Driven** → EventBridge for async workflows, SQS for queuing
- **Security-First** → Encryption at rest and in transit, least-privilege IAM
- **Multi-Tenant** → Organization-based data isolation with RBAC
- **API-Centric** → All features exposed via REST APIs

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  React + Vite + TypeScript + Tailwind + shadcn/ui              │
│  Deployed: S3 + CloudFront                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API GATEWAY (HTTP APIs)                       │
│  REST endpoints • JWT authorizer • Rate limiting • WAF         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND SERVICES (Lambda)                       │
│  Auth • Organisation • Document • Signing • CorpID             │
│  Compliance • Billing • Notification • Workflow                 │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
       ┌────────────┐  ┌────────────┐  ┌────────────┐
       │   Aurora   │  │  DynamoDB  │  │     S3     │
       │ PostgreSQL │  │  (cache)   │  │ (documents)│
       └────────────┘  └────────────┘  └────────────┘
```

### AWS Services Stack

| Category | Service | Purpose |
|----------|---------|---------|
| **Compute** | AWS Lambda | Backend services |
| | API Gateway | REST API endpoints |
| **Auth** | Amazon Cognito | User authentication |
| **Database** | Aurora PostgreSQL Serverless v2 | Primary database |
| | DynamoDB | Session cache, hot data |
| **Storage** | Amazon S3 | Document storage |
| | CloudFront | CDN |
| **Messaging** | EventBridge | Event routing |
| | SQS | Message queuing |
| | SNS | Notifications |
| **Secrets** | Secrets Manager | Credentials |
| | KMS | Encryption keys |
| **Monitoring** | CloudWatch | Logs, metrics |
| | X-Ray | Tracing |
| **Security** | WAF | Web firewall |
| | GuardDuty | Threat detection |
| **CI/CD** | CodePipeline | Deployment |

### Region Configuration

| Environment | Region | Purpose |
|-------------|--------|---------|
| Production | ap-east-1 (Hong Kong) | Primary deployment |
| DR (Phase 2) | ap-southeast-1 (Singapore) | Disaster recovery |

---

## 3. Phase 1: MVP Foundation (Weeks 1-8)

### Sprint 1: Infrastructure & Auth (Weeks 1-2)

#### Task 1.1: AWS Infrastructure Setup

**Priority:** P0 | **Effort:** 3 days

**Requirements:**
- Create AWS CDK project in monorepo
- Deploy VPC with private subnets
- Configure NAT Gateway and VPC endpoints
- Create IAM roles with least privilege
- Set up S3 buckets with KMS encryption

**Deliverables:**
```typescript
// infrastructure/lib/quickcorpid-stack.ts
export class QuickCorpIDStack extends cdk.Stack {
  // VPC, security groups, IAM roles, S3 buckets
}
```

**Acceptance Criteria:**
- [ ] VPC with 2 private + 2 public subnets
- [ ] NAT Gateway configured
- [ ] VPC endpoints for S3, Secrets Manager
- [ ] IAM roles follow least privilege
- [ ] S3 blocks public access, KMS encrypted

---

#### Task 1.2: Aurora PostgreSQL Setup

**Priority:** P0 | **Effort:** 2 days

**Requirements:**
- Deploy Aurora Serverless v2 cluster
- Configure scaling (0.5-4 ACU)
- Store credentials in Secrets Manager
- Create initial schema with Prisma
- Configure 7-day backup retention

**Acceptance Criteria:**
- [ ] Cluster in private subnets
- [ ] Credentials in Secrets Manager
- [ ] Schema migrated
- [ ] Backups configured

---

#### Task 1.3: Cognito User Pool

**Priority:** P0 | **Effort:** 2 days

**Requirements:**
- Create User Pool with email sign-in
- Configure password policy
- Set up email verification
- Create App Client for frontend
- Add Lambda triggers for user creation

**Acceptance Criteria:**
- [ ] Email-based sign-in works
- [ ] App Client configured
- [ ] Lambda creates user record
- [ ] JWT tokens validated

---

#### Task 1.4: CorpID Encryption Module

**Priority:** P0 | **Effort:** 3 days

**Requirements:**
- Download CorpID Sandbox KEK certificate
- Store KEK private key in Secrets Manager
- Implement CEK management
- Build encryption/decryption functions
- Add CEK caching with TTL

**Deliverables:**
```typescript
// services/corpid-service/src/encryption.ts
export class CorpIDEncryption {
  async getContentEncryptionKey(): Promise<CEK>;
  async encryptContent(data: unknown, cek: CEK): Promise<string>;
  async decryptContent(encrypted: string, cek: CEK): Promise<unknown>;
}
```

**Acceptance Criteria:**
- [ ] KEK stored in Secrets Manager
- [ ] Get CEK API works
- [ ] Encryption/decryption tested
- [ ] CEK caching implemented

### Sprint 2: Core Services (Weeks 3-4)

#### Task 2.1: Auth Service Lambda

**Priority:** P0 | **Effort:** 2 days

**API Endpoints:**
```
POST   /auth/signup           - Create account
POST   /auth/signin           - Sign in
POST   /auth/refresh          - Refresh token
POST   /auth/logout           - Sign out
GET    /auth/me               - Get profile
PUT    /auth/me               - Update profile
POST   /auth/forgot-password  - Password reset
```

**Acceptance Criteria:**
- [ ] Sign-up creates Cognito user + database record
- [ ] Sign-in returns JWT tokens
- [ ] Token refresh works
- [ ] Proper error responses

---

#### Task 2.2: Organisation Service Lambda

**Priority:** P0 | **Effort:** 3 days

**API Endpoints:**
```
POST   /organisations                    - Create organisation
GET    /organisations                    - List user's organisations
GET    /organisations/{orgId}            - Get details
PUT    /organisations/{orgId}            - Update
DELETE /organisations/{orgId}            - Delete

POST   /organisations/{orgId}/members    - Invite member
GET    /organisations/{orgId}/members    - List members
PUT    /organisations/{orgId}/members/{userId} - Update role
DELETE /organisations/{orgId}/members/{userId} - Remove

POST   /organisations/{orgId}/switch     - Set active
```

**Acceptance Criteria:**
- [ ] CRUD operations work
- [ ] Email invitations sent
- [ ] Role-based permissions enforced
- [ ] Data isolation between orgs
- [ ] Audit logs created

---

#### Task 2.3: CorpID Integration Service

**Priority:** P0 | **Effort:** 4 days

**API Endpoints:**
```
GET    /corpid/auth-url          - OAuth authorization URL
GET    /corpid/callback          - OAuth callback
POST   /corpid/verify-br         - Verify BR number
POST   /corpid/submit            - Submit application
GET    /corpid/status/{ref}      - Check status
POST   /corpid/sync-wallet       - Sync Document Wallet
POST   /webhooks/corpid          - Webhooks
```

**Acceptance Criteria:**
- [ ] OAuth flow works with Sandbox
- [ ] BR verification returns company details
- [ ] Application submission works
- [ ] Status checking works
- [ ] Webhooks processed
- [ ] All calls encrypted with CEK
- [ ] Retry logic handles failures

---

### Sprint 3: Documents & Signing (Weeks 5-6)

#### Task 3.1: Document Service Lambda

**Priority:** P0 | **Effort:** 3 days

**API Endpoints:**
```
POST   /organisations/{orgId}/documents          - Create metadata
GET    /organisations/{orgId}/documents          - List
GET    /organisations/{orgId}/documents/{docId}  - Get details
PUT    /organisations/{orgId}/documents/{docId}  - Update
DELETE /organisations/{orgId}/documents/{docId}  - Delete

POST   /organisations/{orgId}/documents/{docId}/upload-url - Upload URL
POST   /organisations/{orgId}/documents/{docId}/confirm    - Confirm

POST   /organisations/{orgId}/documents/{docId}/share      - Share link
DELETE /organisations/{orgId}/documents/{docId}/share/{id} - Revoke
```

**S3 Structure:**
```
quickcorpid-documents-{env}/
└── {orgId}/{docId}/v{N}/document.pdf
```

**Acceptance Criteria:**
- [ ] Pre-signed URLs work
- [ ] KMS encryption
- [ ] Versioning works
- [ ] SHA-256 hash calculated
- [ ] Share links expire
- [ ] Lifecycle to Glacier

---

#### Task 3.2: Signing Service Lambda

**Priority:** P0 | **Effort:** 3 days

**API Endpoints:**
```
POST   /organisations/{orgId}/signing-requests         - Create
GET    /organisations/{orgId}/signing-requests         - List
GET    /organisations/{orgId}/signing-requests/{id}    - Get
POST   /organisations/{orgId}/signing-requests/{id}/qr - QR code
POST   /webhooks/corpid/signing                        - Webhook
```

**Acceptance Criteria:**
- [ ] QR code generated
- [ ] Status polling works
- [ ] Webhook processed
- [ ] Signed document stored
- [ ] Audit trail complete

---

#### Task 3.3: Notification Service Lambda

**Priority:** P1 | **Effort:** 2 days

**API Endpoints:**
```
GET    /notifications              - List
PUT    /notifications/{id}/read    - Mark read
PUT    /notifications/read-all     - Mark all read
GET    /notifications/preferences  - Get preferences
PUT    /notifications/preferences  - Update
```

**Notification Types:**
- `application.submitted/approved/rejected`
- `document.shared/signed`
- `compliance.reminder`
- `member.invited`

**Acceptance Criteria:**
- [ ] Notifications created for events
- [ ] Email sent for critical items
- [ ] In-app center works
- [ ] Preferences respected

### Sprint 4: Frontend Integration (Weeks 7-8)

#### Task 4.1: Frontend Authentication

**Priority:** P0 | **Effort:** 2 days

**Components:**
```typescript
// src/components/auth/SignInForm.tsx
// src/components/auth/SignUpForm.tsx
// src/components/auth/ProtectedRoute.tsx
// src/hooks/useAuth.ts
// src/stores/authStore.ts
```

**Acceptance Criteria:**
- [ ] Sign-up creates user
- [ ] Sign-in returns tokens
- [ ] Token refresh auto
- [ ] Protected routes work
- [ ] Sign-out clears state

---

#### Task 4.2: Organisation UI

**Priority:** P0 | **Effort:** 2 days

**Pages:**
```
/onboarding/create-organisation
/dashboard/settings/team
/dashboard/settings/organisation
```

**Components:**
```typescript
// src/components/organisation/CreateOrganisationForm.tsx
// src/components/organisation/InviteMemberModal.tsx
// src/components/organisation/OrgSwitcher.tsx
```

**Acceptance Criteria:**
- [ ] Create organisation works
- [ ] Invite sends email
- [ ] Org switcher works
- [ ] Role-based UI

---

#### Task 4.3: Document UI

**Priority:** P0 | **Effort:** 2 days

**Pages:**
```
/dashboard/documents
/dashboard/documents/upload
/dashboard/documents/{id}
```

**Components:**
```typescript
// src/components/documents/DocumentList.tsx
// src/components/documents/UploadDocumentModal.tsx
// src/components/documents/DocumentPreview.tsx
// src/components/documents/ShareDocumentModal.tsx
```

**Acceptance Criteria:**
- [ ] Upload works
- [ ] List shows documents
- [ ] PDF preview renders
- [ ] Sharing works

---

#### Task 4.4: CorpID Flow

**Priority:** P0 | **Effort:** 3 days

**Pages:**
```
/dashboard/corpid/connect
/dashboard/corpid/callback
/dashboard/corpid/status
/dashboard/corpid/wallet
```

**Components:**
```typescript
// src/components/corpid/ConnectCorpID.tsx
// src/components/corpid/BRVerificationForm.tsx
// src/components/corpid/ApplicationStatus.tsx
```

**Acceptance Criteria:**
- [ ] OAuth flow works
- [ ] BR verification shows details
- [ ] Application submission works
- [ ] Status displayed
- [ ] Wallet shows documents

---

#### Task 4.5: Billing (Stripe)

**Priority:** P1 | **Effort:** 2 days

**API Endpoints:**
```
POST   /billing/checkout         - Checkout session
POST   /billing/portal           - Customer portal
GET    /billing/subscription     - Subscription status
POST   /webhooks/stripe          - Webhooks
```

**Acceptance Criteria:**
- [ ] Checkout creates session
- [ ] Webhook updates status
- [ ] Portal accessible
- [ ] Status displayed

---

#### Task 4.6: Dashboard & Calendar

**Priority:** P1 | **Effort:** 2 days

**Pages:**
```
/dashboard
/dashboard/compliance
/dashboard/compliance/{id}
```

**Components:**
```typescript
// src/components/dashboard/DashboardOverview.tsx
// src/components/compliance/ComplianceCalendar.tsx
// src/components/compliance/UpcomingDeadlines.tsx
```

**Acceptance Criteria:**
- [ ] Dashboard shows metrics
- [ ] Calendar displays items
- [ ] Deadlines sorted

---

## 4. Phase 2: Feature Enhancement (Weeks 9-16)

### Sprint 5: TSW Integration (Weeks 9-11)

#### Task 5.1: TSW Form Templates

**Priority:** P1 | **Effort:** 1 week

**Pages:**
```
/dashboard/workflows/tsw
/dashboard/workflows/tsw/new
/dashboard/workflows/tsw/{id}
```

**Acceptance Criteria:**
- [ ] Form templates available
- [ ] Company data pre-fills
- [ ] Validation works
- [ ] PDF generated

---

#### Task 5.2: TSW Submission Assistance

**Priority:** P2 | **Effort:** 1 week

**Acceptance Criteria:**
- [ ] Step-by-step guidance
- [ ] Links to TSW portal
- [ ] Completion tracked

---

### Sprint 6: Compliance Enhancement (Weeks 12-13)

#### Task 6.1: Automated Compliance Detection

**Priority:** P1 | **Effort:** 1 week

**Acceptance Criteria:**
- [ ] Items auto-created
- [ ] Deadlines calculated
- [ ] Updates from CorpID

---

#### Task 6.2: Compliance Notifications

**Priority:** P1 | **Effort:** 0.5 week

**Acceptance Criteria:**
- [ ] Email reminders (30, 14, 7 days)
- [ ] In-app notifications
- [ ] SMS (premium)

---

#### Task 6.3: Document Generation

**Priority:** P2 | **Effort:** 0.5 week

**Acceptance Criteria:**
- [ ] NAR1 template
- [ ] BR renewal form
- [ ] Digital signing

---

### Sprint 7: Multi-Entity & Teams (Weeks 14-15)

#### Task 7.1: Multi-Entity Management

**Priority:** P1 | **Effort:** 1 week

**Acceptance Criteria:**
- [ ] Multiple entities per user
- [ ] Entity grouping
- [ ] Cross-entity reports

---

#### Task 7.2: Team Management

**Priority:** P1 | **Effort:** 1 week

**Acceptance Criteria:**
- [ ] Custom roles
- [ ] Permission matrix
- [ ] Activity logs

---

### Sprint 8: AI Assistant (Week 16)

#### Task 8.1: AI Integration

**Priority:** P2 | **Effort:** 1 week

**Acceptance Criteria:**
- [ ] Form explanations
- [ ] Deadline prioritization
- [ ] Risk flags
- [ ] Bilingual responses

---

## 5. Phase 3: Scale & Advanced Features (Weeks 17+)

### White-Label Platform (Weeks 17-20)
- Custom branding
- Custom domains
- Partner dashboard
- Partner API

### Advanced Integrations (Weeks 21-24)
- TSW API integration
- CDI/CargoX integration
- Bank integrations
- Accounting connectors

### Mobile App (Weeks 25+)
- React Native app
- Push notifications
- Offline viewing
- Mobile signing

---

## 6. Database Schema

### Aurora PostgreSQL Tables

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cognito_sub VARCHAR(128) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  preferred_language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organisations
CREATE TABLE organisations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  br_number VARCHAR(8) UNIQUE NOT NULL,
  cr_number VARCHAR(8),
  corpid_identifier VARCHAR(128),
  business_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organisation Members
CREATE TABLE organisation_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'viewer',
  status VARCHAR(50) DEFAULT 'pending',
  invited_by UUID REFERENCES users(id),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, org_id)
);

-- CorpID Connections
CREATE TABLE corpid_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
  corp_id_token_ref VARCHAR(255),
  connection_status VARCHAR(50),
  last_synced_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES users(id),
  type VARCHAR(50),
  title VARCHAR(255),
  s3_key VARCHAR(512) NOT NULL,
  hash VARCHAR(128),
  version INTEGER DEFAULT 1,
  status VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Signing Requests
CREATE TABLE signing_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id),
  status VARCHAR(50),
  signers JSONB,
  corpid_reference VARCHAR(128),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compliance Items
CREATE TABLE compliance_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
  type VARCHAR(50),
  title VARCHAR(255),
  due_date DATE NOT NULL,
  status VARCHAR(50),
  metadata JSONB,
  reminder_sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organisations(id),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organisations(id),
  plan VARCHAR(50),
  status VARCHAR(50),
  stripe_subscription_id VARCHAR(255),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50),
  title VARCHAR(255),
  message TEXT,
  read_at TIMESTAMPTZ,
  action_url VARCHAR(512),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_org_members_user ON organisation_members(user_id);
CREATE INDEX idx_org_members_org ON organisation_members(org_id);
CREATE INDEX idx_documents_org ON documents(org_id);
CREATE INDEX idx_signing_requests_org ON signing_requests(org_id);
CREATE INDEX idx_compliance_org ON compliance_items(org_id);
CREATE INDEX idx_compliance_due_date ON compliance_items(due_date);
CREATE INDEX idx_audit_logs_org ON audit_logs(org_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
```

### DynamoDB Tables

```json
{
  "TableName": "session-cache-{env}",
  "KeySchema": [{"AttributeName": "session_id", "KeyType": "HASH"}],
  "AttributeDefinitions": [{"AttributeName": "session_id", "AttributeType": "S"}],
  "BillingMode": "PAY_PER_REQUEST"
}

{
  "TableName": "signing-status-{env}",
  "KeySchema": [{"AttributeName": "request_id", "KeyType": "HASH"}],
  "AttributeDefinitions": [{"AttributeName": "request_id", "AttributeType": "S"}],
  "BillingMode": "PAY_PER_REQUEST",
  "TTL": {"AttributeName": "expires_at", "Enabled": true}
}

{
  "TableName": "audit-hot-{env}",
  "KeySchema": [{"AttributeName": "pk", "KeyType": "HASH"}, {"AttributeName": "sk", "KeyType": "RANGE"}],
  "AttributeDefinitions": [{"AttributeName": "pk", "AttributeType": "S"}, {"AttributeName": "sk", "AttributeType": "S"}],
  "BillingMode": "PAY_PER_REQUEST",
  "TTL": {"AttributeName": "expires_at", "Enabled": true}
}
```

---

## 7. API Specifications

### Authentication APIs

```yaml
POST /auth/signup
Request:
  email: string
  password: string
  name: string
Response:
  user:
    id: string
    email: string
    name: string
  requiresConfirmation: boolean

POST /auth/signin
Request:
  email: string
  password: string
Response:
  accessToken: string
  refreshToken: string
  expiresIn: number
  user:
    id: string
    email: string
    name: string

GET /auth/me
Headers:
  Authorization: Bearer {accessToken}
Response:
  id: string
  email: string
  name: string
  preferred_language: string
  organisations:
    - id: string
      name: string
      role: string
```

### Organisation APIs

```yaml
POST /organisations
Headers:
  Authorization: Bearer {accessToken}
Request:
  name: string
  br_number: string
  business_type: string
Response:
  id: string
  name: string
  br_number: string
  business_type: string
  status: string

GET /organisations/{orgId}
Headers:
  Authorization: Bearer {accessToken}
Response:
  id: string
  name: string
  br_number: string
  business_type: string
  status: string
  corpid_connected: boolean
  member_count: number

POST /organisations/{orgId}/members
Request:
  email: string
  role: string
Response:
  id: string
  email: string
  role: string
  status: string
```

### CorpID APIs

```yaml
GET /corpid/auth-url
Headers:
  Authorization: Bearer {accessToken}
Query:
  redirect_uri: string
Response:
  auth_url: string
  state: string

POST /corpid/verify-br
Request:
  br_number: string
Response:
  valid: boolean
  company_name_en: string
  company_name_zh: string
  business_type: string
  status: string

POST /corpid/submit
Request:
  org_id: string
  identity:
    id_type: string
    id_number: string
  applicant:
    role: string
    email: string
    phone: string
  declarations:
    agree_terms: boolean
    auth_declaration: boolean
Response:
  success: boolean
  reference_number: string
  status: string
```

### Document APIs

```yaml
POST /organisations/{orgId}/documents
Request:
  title: string
  type: string
Response:
  id: string
  upload_url: string
  s3_key: string
  expires_at: string

GET /organisations/{orgId}/documents
Query:
  type: string (optional)
  status: string (optional)
Response:
  documents:
    - id: string
      title: string
      type: string
      status: string
      created_at: string
      uploaded_by:
        id: string
        name: string
```

### Signing APIs

```yaml
POST /organisations/{orgId}/signing-requests
Request:
  document_id: string
  signers:
    - name: string
      email: string
      role: string
Response:
  id: string
  status: string
  qr_url: string
  deep_link: string

GET /organisations/{orgId}/signing-requests/{id}
Response:
  id: string
  status: string
  signers:
    - name: string
      email: string
      status: string
      signed_at: string
  document:
    id: string
    title: string
```

---

## 8. Security & Compliance

### Encryption Requirements

| Data Type | At Rest | In Transit | Key Management |
|-----------|---------|------------|----------------|
| Database | AES-256 | TLS 1.3 | AWS KMS |
| Documents | SSE-KMS | HTTPS | AWS KMS |
| CorpID API | AES-256-GCM | HTTPS | KEK/CEK |
| Secrets | AES-256 | - | Secrets Manager |

### Authentication & Authorization

**Cognito Configuration:**
- Password: min 8 chars, uppercase, lowercase, number, symbol
- MFA: Optional (recommended for admins)
- Session: 1 hour access, 7 days refresh
- Brute force protection: 5 failed attempts = 15 min lock

**Role-Based Access Control:**

| Role | Permissions |
|------|-------------|
| owner | Full access, billing, delete org |
| admin | Manage members, all features |
| authorised_rep | Sign documents, submit applications |
| viewer | View only, no signing |

### Security Checklist

- [ ] All S3 buckets block public access
- [ ] KMS keys for all encrypted resources
- [ ] VPC endpoints for private AWS access
- [ ] WAF rules configured
- [ ] GuardDuty enabled
- [ ] CloudTrail logging
- [ ] Security groups: least privilege
- [ ] No secrets in code
- [ ] Dependency scanning in CI/CD
- [ ] Annual penetration testing

### PDPO Compliance

**Requirements:**
- Data access requests within 40 days
- Consent management for data collection
- Data retention policies (7 years for compliance)
- Cross-border transfer restrictions

**Implementation:**
```typescript
// Consent tracking
interface Consent {
  user_id: string;
  consent_type: string;
  granted_at: Date;
  ip_address: string;
  version: string;
}

// Data access request
POST /privacy/access-request
Response:
  personal_data: {...}
  consents: [...]
  documents: [...]
```

---

## 9. Infrastructure as Code

### AWS CDK Project Structure

```
infrastructure/
├── lib/
│   ├── quickcorpid-stack.ts
│   ├── database-stack.ts
│   ├── auth-stack.ts
│   ├── api-stack.ts
│   ├── storage-stack.ts
│   ├── monitoring-stack.ts
│   └── constructs/
│       ├── lambda-function.ts
│       ├── api-gateway.ts
│       └── aurora-cluster.ts
├── bin/
│   └── quickcorpid.ts
├── config/
│   ├── dev.ts
│   ├── staging.ts
│   └── prod.ts
├── cdk.json
└── package.json
```

### Core Stack Example

```typescript
// lib/quickcorpid-stack.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DatabaseStack } from './database-stack';
import { AuthStack } from './auth-stack';
import { ApiStack } from './api-stack';
import { StorageStack } from './storage-stack';

export class QuickCorpIDStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, 'VPC', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        { name: 'Public', subnetType: ec2.SubnetType.PUBLIC },
        { name: 'Private', subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      ],
    });

    // Database
    const database = new DatabaseStack(this, 'Database', { vpc });

    // Auth
    const auth = new AuthStack(this, 'Auth');

    // Storage
    const storage = new StorageStack(this, 'Storage');

    // API
    const api = new ApiStack(this, 'Api', {
      vpc,
      userPool: auth.userPool,
      database: database.cluster,
      documentsBucket: storage.documentsBucket,
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', { value: api.api.url });
    new cdk.CfnOutput(this, 'UserPoolId', { value: auth.userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: auth.userPoolClient.userPoolClientId });
  }
}
```

### Lambda Function Construct

```typescript
// lib/constructs/lambda-function.ts
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export class ServiceLambda extends Construct {
  public readonly function: lambda.NodejsFunction;

  constructor(scope: Construct, id: string, props: {
    entry: string;
    environment: Record<string, string>;
    vpc: ec2.IVpc;
    databaseSecret: secretsmanager.ISecret;
  }) {
    super(scope, id);

    this.function = new lambda.NodejsFunction(this, 'Function', {
      entry: props.entry,
      runtime: lambda.Runtime.NODEJS_22_X,
      environment: props.environment,
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      bundling: {
        externalModules: ['aws-sdk'],
      },
      insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0,
    });

    // Grant database access
    props.databaseSecret.grantRead(this.function);
  }
}
```

---

## 10. Testing Strategy

### Unit Tests

**Coverage Target:** 80%

**Tools:** Vitest + Jest

**Focus Areas:**
- Business logic in Lambda handlers
- CorpID encryption/decryption
- Permission checks
- Data validation

```typescript
// services/corpid-service/src/__tests__/encryption.test.ts
describe('CorpIDEncryption', () => {
  it('should encrypt and decrypt content', async () => {
    const encryption = new CorpIDEncryption();
    const cek = await encryption.getContentEncryptionKey();
    const data = { br_number: '12345678' };
    
    const encrypted = await encryption.encryptContent(data, cek);
    const decrypted = await encryption.decryptContent(encrypted, cek);
    
    expect(decrypted).toEqual(data);
  });
});
```

### Integration Tests

**Tools:** AWS SDK + LocalStack or real AWS (dev)

**Focus Areas:**
- API endpoints (end-to-end)
- Database operations
- S3 uploads
- Cognito flows

```typescript
// tests/integration/auth.test.ts
describe('Auth API', () => {
  it('should sign up and sign in user', async () => {
    const signupResponse = await api.post('/auth/signup', {
      email: 'test@example.com',
      password: 'Test123!@#',
      name: 'Test User',
    });
    
    expect(signupResponse.status).toBe(201);
    
    const signinResponse = await api.post('/auth/signin', {
      email: 'test@example.com',
      password: 'Test123!@#',
    });
    
    expect(signinResponse.status).toBe(200);
    expect(signinResponse.data.accessToken).toBeDefined();
  });
});
```

### E2E Tests

**Tools:** Playwright

**Focus Areas:**
- Critical user journeys
- Sign-up to CorpID connection flow
- Document upload and signing
- Billing flow

```typescript
// tests/e2e/corpid-flow.spec.ts
test('CorpID registration flow', async ({ page }) => {
  await page.goto('/signup');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'Test123!@#');
  await page.click('button[type="submit"]');
  
  await page.waitForURL('/dashboard');
  
  await page.click('text=Connect CorpID');
  await page.fill('[name="br_number"]', '12345678');
  await page.click('text=Verify');
  
  await expect(page.locator('.company-name')).toBeVisible();
});
```

---

## 11. Deployment Pipeline

### CI/CD Stages

```
GitHub Push → CodeBuild (Test) → CodeBuild (Build) → 
  Deploy to Dev → Integration Tests → 
  Deploy to Staging → UAT → 
  Deploy to Production
```

### CodePipeline Configuration

```yaml
# infrastructure/lib/pipeline-stack.ts
const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
  stages: [
    {
      stageName: 'Source',
      actions: [
        new codepipeline_actions.CodeCommitSourceAction({
          repository: codeRepo,
          actionName: 'Source',
        }),
      ],
    },
    {
      stageName: 'Test',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'UnitTest',
          project: testProject,
        }),
      ],
    },
    {
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Build',
          project: buildProject,
        }),
      ],
    },
    {
      stageName: 'DeployDev',
      actions: [
        new codepipeline_actions.CloudFormationCreateUpdateStackAction({
          actionName: 'DeployDev',
          stackName: 'QuickCorpID-Dev',
          templatePath: cdkArtifact.atPath('QuickCorpID-Dev.template.yaml'),
        }),
      ],
    },
  ],
});
```

### Environment Promotion

| Stage | Trigger | Manual Approval |
|-------|---------|-----------------|
| Dev | Push to `develop` | No |
| Staging | Merge to `main` | Yes |
| Production | Manual promotion | Yes |

### Rollback Strategy

```bash
# Rollback to previous version
aws lambda update-function-code \
  --function-name quickcorpid-auth-service \
  --code S3Bucket=quickcorpid-deployments,S3Key=v1.2.3/auth-service.zip
```

---

## 12. Monitoring & Observability

### CloudWatch Dashboards

**Key Metrics:**

| Service | Metrics |
|---------|---------|
| API Gateway | Request count, latency, 4xx/5xx errors |
| Lambda | Invocations, errors, duration, throttles |
| Aurora | Connections, CPU, memory, query latency |
| Cognito | Sign-ups, sign-ins, token refreshes |
| CorpID | API calls, success rate, latency |

**Dashboard Widgets:**
```typescript
// infrastructure/lib/monitoring-stack.ts
const dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
  widgets: [
    [
      new cloudwatch.GraphWidget({
        title: 'API Latency',
        left: [apiLatencyMetric],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Errors',
        left: [lambdaErrorMetric],
      }),
    ],
    [
      new cloudwatch.GraphWidget({
        title: 'CorpID Integration',
        left: [corpidSuccessMetric, corpidLatencyMetric],
      }),
    ],
  ],
});
```

### Alarms

| Alarm | Threshold | Action |
|-------|-----------|--------|
| API 5xx Errors | > 5 in 5 min | SNS notification |
| Lambda Errors | > 10 in 5 min | SNS notification |
| Aurora CPU | > 80% for 5 min | Scale up |
| CorpID API Failures | > 3 in 5 min | SNS notification |

```typescript
const apiErrorAlarm = new cloudwatch.Alarm(this, 'Api5xxAlarm', {
  metric: apiGateway.metric('5XXError'),
  threshold: 5,
  evaluationPeriods: 1,
  datapointsToAlarm: 1,
});

apiErrorAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(snsTopic));
```

### Logging Strategy

**Log Structure:**
```json
{
  "timestamp": "2026-08-07T10:00:00Z",
  "level": "INFO",
  "service": "auth-service",
  "traceId": "abc-123",
  "userId": "user-456",
  "orgId": "org-789",
  "action": "user.signin",
  "details": {
    "email": "user@example.com",
    "ip": "1.2.3.4"
  }
}
```

**Log Retention:**
- API Gateway logs: 30 days
- Lambda logs: 90 days
- Audit logs: 7 years (in S3 Glacier)

### Distributed Tracing (X-Ray)

```typescript
// Enable X-Ray in Lambda
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer';

export const handler = captureLambdaHandler(async (event) => {
  // Handler code
});
```

---

## 13. Risk Mitigation

### High Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| CorpID launch delayed | High | Medium | Maintain sandbox, flexible timeline |
| Encryption errors | High | Medium | Build module early, thorough tests |
| API changes | Medium | Medium | Version client, mock layer, monitor changelog |
| Sandbox instability | Medium | Low | Retry logic, mock fallback |

**Mitigation Actions:**
1. Register for CorpID sandbox immediately (Week 1)
2. Build encryption module with comprehensive tests (Week 1-2)
3. Maintain mock layer for all external APIs
4. Monitor CorpID changelog weekly
5. Implement circuit breaker pattern for CorpID calls

### Medium Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| CDI access restricted | Medium | Medium | Focus on CorpID first |
| TSW API unavailable | Medium | Medium | Start with pre-fill only |
| Encryption performance | Medium | Low | Load test, optimize caching |
| Stripe HK issues | Low | Low | Stripe supports HKD |

### Contingency Plans

**CorpID Delay:**
- Continue with sandbox testing
- Launch with mock CorpID flow
- Enable integration when production ready

**Encryption Issues:**
- Dedicated sprint for encryption module
- Engage AWS support if needed
- Consider CorpID support channel

**API Changes:**
- Version all API clients
- Automated tests catch breaking changes
- Maintain backward compatibility layer

---

## 14. Success Criteria

### Phase 1 Completion (Week 8)

| Criteria | Measurement |
|----------|-------------|
| CorpID Sandbox Integration | ✅ Full OAuth flow works |
| Document Management | ✅ Upload, list, share documents |
| Digital Signing | ✅ QR code generates, status tracked |
| User Registration | ✅ Sign-up to sign-in flow complete |
| Organisation Management | ✅ Create org, invite members |
| Billing | ✅ Stripe checkout works |
| Test Coverage | ✅ > 80% unit test coverage |
| Security | ✅ All secrets in Secrets Manager |
| Documentation | ✅ API docs complete |

### Phase 2 Completion (Week 16)

| Criteria | Measurement |
|----------|-------------|
| TSW Integration | ✅ Form templates, pre-fill |
| Compliance Calendar | ✅ Auto-detect, reminders |
| Multi-Entity | ✅ Manage multiple companies |
| Team Management | ✅ Custom roles, permissions |
| AI Assistant | ✅ Form explanations work |
| Performance | ✅ API p95 < 500ms |
| Uptime | ✅ 99.5% in staging |

### Production Readiness

| Checklist Item | Status |
|----------------|--------|
| Security audit | [ ] |
| Load testing | [ ] |
| Penetration testing | [ ] |
| DR testing | [ ] |
| Runbook documentation | [ ] |
| On-call rotation | [ ] |
| Monitoring dashboards | [ ] |
| Alert configuration | [ ] |
| Backup verification | [ ] |
| Compliance review | [ ] |

### Launch Criteria

| Metric | Target |
|--------|--------|
| Test Coverage | > 80% |
| API p95 Latency | < 500ms |
| CorpID Integration Success | > 95% |
| Security Issues (Critical/High) | 0 |
| Uptime (Staging) | 99.5% |
| User Acceptance Testing | Pass |

---

## 15. Dependencies & Prerequisites

### Before Development (Week 0)

- [ ] Register for CorpID Sandbox (https://sb.corpid.gov.hk/)
- [ ] Obtain sandbox KEK certificate (.p12)
- [ ] Create AWS account with billing alerts
- [ ] Set up AWS CLI and CDK
- [ ] Register domain name
- [ ] Create Stripe account (HK)
- [ ] Set up GitHub repository
- [ ] Configure secrets in AWS Secrets Manager (placeholders)

### During Development

- [ ] Monitor CorpID documentation for updates
- [ ] Weekly sync with CorpID sandbox status
- [ ] Track TSW Phase 3 progress
- [ ] Monitor CargoX pilot programme updates

### Before Production Launch

- [ ] CorpID production credentials
- [ ] Production KEK certificate from HK CA
- [ ] SSL certificate for custom domain
- [ ] Security audit complete
- [ ] Legal review of terms of service
- [ ] Privacy policy finalized
- [ ] Support processes established

---

## 16. Timeline Summary

### Visual Timeline

```
Week 1-2:  [████████] Infrastructure & Auth
Week 3-4:  [████████] Core Services
Week 5-6:  [████████] Documents & Signing
Week 7-8:  [████████] Frontend Integration → MVP COMPLETE

Week 9-11: [████████████] TSW Integration
Week 12-13:[████████] Compliance Enhancement
Week 14-15:[████████] Multi-Entity & Teams
Week 16:   [████████] AI Assistant → PHASE 2 COMPLETE

Week 17+:  [████████████████] Scale & Advanced Features
```

### Milestones

| Milestone | Week | Deliverables |
|-----------|------|--------------|
| Infrastructure Ready | 2 | VPC, Aurora, Cognito, S3 |
| Backend Services Ready | 4 | Auth, Org, CorpID APIs |
| Document Flow Ready | 6 | Upload, signing |
| MVP Ready | 8 | Full working MVP |
| TSW Ready | 11 | TSW templates |
| Enhanced Compliance | 13 | Auto-detect, reminders |
| Enterprise Features | 15 | Multi-entity, custom roles |
| AI Ready | 16 | AI assistant |
| Production Launch | End 2026 | Aligned with CorpID |

---

## 17. Next Actions

### Immediate (This Week)

1. [ ] Register for CorpID Sandbox account
2. [ ] Download KEK certificate (.p12)
3. [ ] Create AWS account
4. [ ] Initialize CDK project
5. [ ] Set up development environment

### Week 1

1. [ ] Deploy VPC and networking
2. [ ] Deploy Aurora cluster
3. [ ] Create Cognito User Pool
4. [ ] Store KEK in Secrets Manager
5. [ ] Build encryption module

### Week 2

1. [ ] Build Auth Service Lambda
2. [ ] Build Organisation Service Lambda
3. [ ] Test Cognito integration
4. [ ] Test CorpID Get CEK API
5. [ ] Write encryption unit tests

---

**Document Version:** 2.0  
**Last Updated:** August 7, 2026  
**Maintained By:** QuickCorpID Development Team

This specification provides a complete blueprint for building QuickCorpID as an AWS-native SaaS platform. Follow the phases sequentially, and ensure all acceptance criteria are met before progressing to the next sprint.


---

## Task List

### Sprint 1: Infrastructure & Auth (Weeks 1-2)

| Task ID | Task | Priority | Effort | Dependencies | Status |
|---------|------|----------|--------|--------------|--------|
| 1.1 | Set up AWS CDK project in monorepo | P0 | 0.5 day | None | ⬜ |
| 1.2 | Create VPC with private subnets (2 AZs) | P0 | 1 day | 1.1 | ⬜ |
| 1.3 | Configure NAT Gateway and VPC endpoints | P0 | 0.5 day | 1.2 | ⬜ |
| 1.4 | Create IAM roles (least privilege) | P0 | 0.5 day | 1.2 | ⬜ |
| 1.5 | Create S3 buckets (documents, uploads) | P0 | 0.5 day | 1.4 | ⬜ |
| 1.6 | Deploy Aurora Serverless v2 cluster | P0 | 1 day | 1.2 | ⬜ |
| 1.7 | Store DB credentials in Secrets Manager | P0 | 0.5 day | 1.6 | ⬜ |
| 1.8 | Create initial database schema (Prisma) | P0 | 0.5 day | 1.6 | ⬜ |
| 1.9 | Create Cognito User Pool | P0 | 0.5 day | None | ⬜ |
| 1.10 | Configure Cognito App Client | P0 | 0.5 day | 1.9 | ⬜ |
| 1.11 | Add Lambda trigger for user creation | P0 | 0.5 day | 1.9 | ⬜ |
| 1.12 | Register for CorpID Sandbox account | P0 | 0.5 day | None | ⬜ |
| 1.13 | Download KEK certificate (.p12) | P0 | 0.5 day | 1.12 | ⬜ |
| 1.14 | Store KEK private key in Secrets Manager | P0 | 0.5 day | 1.13 | ⬜ |
| 1.15 | Build CEK management module | P0 | 1 day | 1.14 | ⬜ |
| 1.16 | Implement encryption/decryption functions | P0 | 1 day | 1.15 | ⬜ |
| 1.17 | Add CEK caching with TTL | P1 | 0.5 day | 1.16 | ⬜ |
| 1.18 | Write encryption unit tests | P0 | 0.5 day | 1.16 | ⬜ |

**Sprint 1 Total:** 10 days

---

### Sprint 2: Core Services (Weeks 3-4)

| Task ID | Task | Priority | Effort | Dependencies | Status |
|---------|------|----------|--------|--------------|--------|
| 2.1 | Create API Gateway with JWT authorizer | P0 | 1 day | 1.9 | ⬜ |
| 2.2 | Build Auth Service Lambda | P0 | 1.5 days | 2.1, 1.11 | ⬜ |
| 2.3 | Implement POST /auth/signup | P0 | 0.5 day | 2.2 | ⬜ |
| 2.4 | Implement POST /auth/signin | P0 | 0.5 day | 2.2 | ⬜ |
| 2.5 | Implement POST /auth/refresh | P0 | 0.5 day | 2.2 | ⬜ |
| 2.6 | Implement GET /auth/me | P0 | 0.5 day | 2.2 | ⬜ |
| 2.7 | Build Organisation Service Lambda | P0 | 1.5 days | 2.2, 1.8 | ⬜ |
| 2.8 | Implement POST /organisations | P0 | 0.5 day | 2.7 | ⬜ |
| 2.9 | Implement GET /organisations | P0 | 0.5 day | 2.7 | ⬜ |
| 2.10 | Implement GET /organisations/{orgId} | P0 | 0.5 day | 2.7 | ⬜ |
| 2.11 | Implement POST /organisations/{orgId}/members | P0 | 0.5 day | 2.7 | ⬜ |
| 2.12 | Implement DELETE /organisations/{orgId}/members/{userId} | P0 | 0.5 day | 2.7 | ⬜ |
| 2.13 | Build CorpID Integration Service Lambda | P0 | 2 days | 1.16, 2.2 | ⬜ |
| 2.14 | Implement GET /corpid/auth-url | P0 | 0.5 day | 2.13 | ⬜ |
| 2.15 | Implement GET /corpid/callback | P0 | 0.5 day | 2.13 | ⬜ |
| 2.16 | Implement POST /corpid/verify-br | P0 | 0.5 day | 2.13 | ⬜ |
| 2.17 | Implement POST /corpid/submit | P0 | 0.5 day | 2.13 | ⬜ |
| 2.18 | Implement GET /corpid/status/{ref} | P0 | 0.5 day | 2.13 | ⬜ |
| 2.19 | Implement POST /webhooks/corpid | P0 | 0.5 day | 2.13 | ⬜ |
| 2.20 | Add retry logic and error handling | P0 | 0.5 day | 2.13 | ⬜ |
| 2.21 | Write unit tests for Auth Service | P0 | 0.5 day | 2.6 | ⬜ |
| 2.22 | Write unit tests for Org Service | P0 | 0.5 day | 2.12 | ⬜ |
| 2.23 | Write unit tests for CorpID Service | P0 | 0.5 day | 2.20 | ⬜ |

**Sprint 2 Total:** 15 days

---

### Sprint 3: Documents & Signing (Weeks 5-6)

| Task ID | Task | Priority | Effort | Dependencies | Status |
|---------|------|----------|--------|--------------|--------|
| 3.1 | Configure S3 bucket for documents | P0 | 0.5 day | 1.5 | ⬜ |
| 3.2 | Set up CloudFront for document delivery | P1 | 0.5 day | 3.1 | ⬜ |
| 3.3 | Build Document Service Lambda | P0 | 1.5 days | 2.7 | ⬜ |
| 3.4 | Implement POST /organisations/{orgId}/documents | P0 | 0.5 day | 3.3 | ⬜ |
| 3.5 | Implement GET /organisations/{orgId}/documents | P0 | 0.5 day | 3.3 | ⬜ |
| 3.6 | Implement pre-signed URL generation | P0 | 0.5 day | 3.3 | ⬜ |
| 3.7 | Implement document versioning | P1 | 0.5 day | 3.3 | ⬜ |
| 3.8 | Implement document sharing (time-limited) | P1 | 0.5 day | 3.3 | ⬜ |
| 3.9 | Build Signing Service Lambda | P0 | 1.5 days | 2.13, 3.3 | ⬜ |
| 3.10 | Implement POST /organisations/{orgId}/signing-requests | P0 | 0.5 day | 3.9 | ⬜ |
| 3.11 | Implement QR code generation | P0 | 0.5 day | 3.9 | ⬜ |
| 3.12 | Implement signing status polling | P0 | 0.5 day | 3.9 | ⬜ |
| 3.13 | Implement POST /webhooks/corpid/signing | P0 | 0.5 day | 3.9 | ⬜ |
| 3.14 | Store signed documents with evidence | P0 | 0.5 day | 3.13 | ⬜ |
| 3.15 | Build Notification Service Lambda | P1 | 1 day | 2.2 | ⬜ |
| 3.16 | Implement GET /notifications | P1 | 0.5 day | 3.15 | ⬜ |
| 3.17 | Implement notification creation on events | P1 | 0.5 day | 3.15 | ⬜ |
| 3.18 | Set up EventBridge for async events | P1 | 0.5 day | 3.15 | ⬜ |
| 3.19 | Write unit tests for Document Service | P0 | 0.5 day | 3.8 | ⬜ |
| 3.20 | Write unit tests for Signing Service | P0 | 0.5 day | 3.14 | ⬜ |

**Sprint 3 Total:** 12.5 days

---

### Sprint 4: Frontend Integration (Weeks 7-8)

| Task ID | Task | Priority | Effort | Dependencies | Status |
|---------|------|----------|--------|--------------|--------|
| 4.1 | Set up React Query for API calls | P0 | 0.5 day | None | ⬜ |
| 4.2 | Create auth store (Zustand) | P0 | 0.5 day | None | ⬜ |
| 4.3 | Build sign-in form component | P0 | 0.5 day | 4.1, 4.2 | ⬜ |
| 4.4 | Build sign-up form component | P0 | 0.5 day | 4.1, 4.2 | ⬜ |
| 4.5 | Implement token refresh logic | P0 | 0.5 day | 4.2 | ⬜ |
| 4.6 | Build protected route wrapper | P0 | 0.5 day | 4.2 | ⬜ |
| 4.7 | Build organisation creation form | P0 | 1 day | 4.2 | ⬜ |
| 4.8 | Build org switcher component | P0 | 0.5 day | 4.7 | ⬜ |
| 4.9 | Build invite member modal | P0 | 0.5 day | 4.7 | ⬜ |
| 4.10 | Build document list component | P0 | 1 day | 4.2 | ⬜ |
| 4.11 | Build document upload modal | P0 | 1 day | 4.10 | ⬜ |
| 4.12 | Build document preview component | P0 | 0.5 day | 4.10 | ⬜ |
| 4.13 | Build CorpID connect page | P0 | 1 day | 4.2 | ⬜ |
| 4.14 | Build BR verification form | P0 | 0.5 day | 4.13 | ⬜ |
| 4.15 | Build application status page | P0 | 0.5 day | 4.13 | ⬜ |
| 4.16 | Build signing QR modal | P0 | 0.5 day | 4.10 | ⬜ |
| 4.17 | Build dashboard overview page | P0 | 1 day | 4.2, 4.7, 4.10 | ⬜ |
| 4.18 | Build compliance calendar page | P1 | 1 day | 4.2 | ⬜ |
| 4.19 | Build settings pages (org, team) | P1 | 1 day | 4.7 | ⬜ |
| 4.20 | Set up Stripe account | P0 | 0.5 day | None | ⬜ |
| 4.21 | Build Billing Service Lambda | P0 | 1 day | 2.7 | ⬜ |
| 4.22 | Implement POST /billing/checkout | P0 | 0.5 day | 4.21 | ⬜ |
| 4.23 | Implement POST /webhooks/stripe | P0 | 0.5 day | 4.21 | ⬜ |
| 4.24 | Build pricing page with checkout | P0 | 0.5 day | 4.22 | ⬜ |

**Sprint 4 Total:** 15.5 days

---

### Phase 2: Feature Enhancement (Weeks 9-16)

| Task ID | Task | Priority | Effort | Dependencies | Status |
|---------|------|----------|--------|--------------|--------|
| 5.1 | Research TSW API availability | P1 | 0.5 day | None | ⬜ |
| 5.2 | Design TSW form templates | P1 | 1 day | 5.1 | ⬜ |
| 5.3 | Build TSW workflow wizard | P1 | 2 days | 5.2, 4.2 | ⬜ |
| 5.4 | Implement form pre-fill from CorpID | P1 | 1 day | 2.13, 5.3 | ⬜ |
| 5.5 | Build TSW submission guidance | P2 | 1 day | 5.3 | ⬜ |
| 6.1 | Build Compliance Service Lambda | P1 | 1 day | 2.7 | ⬜ |
| 6.2 | Implement auto-detection of compliance items | P1 | 1.5 days | 6.1, 2.13 | ⬜ |
| 6.3 | Implement compliance reminders | P1 | 1 day | 6.1, 3.15 | ⬜ |
| 6.4 | Build NAR1 form template | P2 | 0.5 day | 6.1 | ⬜ |
| 6.5 | Build BR renewal form template | P2 | 0.5 day | 6.1 | ⬜ |
| 7.1 | Implement multi-entity support | P1 | 2 days | 2.7 | ⬜ |
| 7.2 | Build entity grouping UI | P1 | 1 day | 7.1, 4.8 | ⬜ |
| 7.3 | Implement custom roles system | P1 | 1.5 days | 2.7 | ⬜ |
| 7.4 | Build permission matrix UI | P1 | 1 day | 7.3 | ⬜ |
| 7.5 | Implement activity logs | P1 | 1 day | 7.3 | ⬜ |
| 8.1 | Set up AWS Bedrock access | P2 | 0.5 day | None | ⬜ |
| 8.2 | Build AI Service Lambda | P2 | 1 day | 8.1 | ⬜ |
| 8.3 | Implement form explanation feature | P2 | 1 day | 8.2 | ⬜ |
| 8.4 | Implement deadline prioritization | P2 | 0.5 day | 8.2 | ⬜ |
| 8.5 | Implement risk analysis | P2 | 1 day | 8.2 | ⬜ |
| 8.6 | Build AI chat panel component | P2 | 1 day | 8.2, 4.2 | ⬜ |

**Phase 2 Total:** 21 days

---

### Phase 3: Scale & Advanced Features (Weeks 17+)

| Task ID | Task | Priority | Effort | Dependencies | Status |
|---------|------|----------|--------|--------------|--------|
| 9.1 | Design white-label system | P2 | 1 day | None | ⬜ |
| 9.2 | Implement custom branding API | P2 | 2 days | 9.1 | ⬜ |
| 9.3 | Build partner dashboard | P2 | 2 days | 9.2 | ⬜ |
| 9.4 | Implement custom domain support | P2 | 2 days | 9.2 | ⬜ |
| 10.1 | Research TSW API integration | P2 | 0.5 day | 5.1 | ⬜ |
| 10.2 | Build TSW direct submission | P2 | 2 days | 10.1, 2.13 | ⬜ |
| 10.3 | Research CDI API access | P2 | 0.5 day | None | ⬜ |
| 10.4 | Build CDI integration (if available) | P2 | 2 days | 10.3, 2.13 | ⬜ |
| 11.1 | Set up React Native project | P3 | 1 day | None | ⬜ |
| 11.2 | Implement mobile auth flow | P3 | 2 days | 11.1 | ⬜ |
| 11.3 | Build mobile document viewer | P3 | 2 days | 11.1 | ⬜ |
| 11.4 | Implement mobile signing | P3 | 2 days | 11.2, 11.3 | ⬜ |
| 11.5 | Add push notifications | P3 | 1 day | 11.2 | ⬜ |

**Phase 3 Total:** 18 days

---

## Task Summary

| Phase | Sprint | Duration | Total Tasks | P0 Tasks | P1 Tasks | P2 Tasks |
|-------|--------|----------|-------------|----------|----------|----------|
| **Phase 1** | Sprint 1 | Weeks 1-2 | 18 tasks | 15 | 3 | 0 |
| | Sprint 2 | Weeks 3-4 | 23 tasks | 21 | 2 | 0 |
| | Sprint 3 | Weeks 5-6 | 20 tasks | 11 | 9 | 0 |
| | Sprint 4 | Weeks 7-8 | 24 tasks | 16 | 8 | 0 |
| **Phase 2** | Sprint 5-8 | Weeks 9-16 | 21 tasks | 0 | 14 | 7 |
| **Phase 3** | Sprint 9+ | Weeks 17+ | 15 tasks | 0 | 5 | 10 |
| **TOTAL** | | | **121 tasks** | **63** | **41** | **17** |

---

## Critical Path

The following tasks are on the critical path and must be completed on schedule:

```
1.1 → 1.2 → 1.6 → 1.8 → 2.7 → 2.8 → 2.13 → 2.16 → 3.3 → 3.9 → 4.13 → MVP
```

**Critical Dependencies:**
- CorpID Sandbox registration (1.12) must be completed Week 1
- KEK certificate download (1.13) blocks all CorpID integration
- CEK module (1.16) blocks CorpID Service (2.13)
- CorpID Service (2.13) blocks Document Service (3.3) and Signing Service (3.9)

---

## Task Status Legend

| Icon | Status |
|------|--------|
| ⬜ | Not started |
| 🔄 | In progress |
| ✅ | Completed |
| ⏸️ | Blocked |
| ❌ | Cancelled |

