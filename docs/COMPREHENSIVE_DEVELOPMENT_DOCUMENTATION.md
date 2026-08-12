# QuickCorpID – Comprehensive Development Documentation
**Version:** 1.0  
**Last Updated:** August 7, 2026  
**Target:** Production-ready SaaS dashboard + backend for Hong Kong CorpID ecosystem

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [High-Level Architecture (AWS-Native)](#2-high-level-architecture-aws-native)
3. [Recommended Tech Stack](#3-recommended-tech-stack)
4. [Core Domain Models](#4-core-domain-models-database-schema-outline)
5. [Key Backend Services](#5-key-backend-services-detailed)
6. [Frontend Structure](#6-frontend-structure-nextjs-app-router)
7. [Security Requirements](#7-security-requirements-critical)
8. [Environment & Configuration](#8-environment--configuration)
9. [MVP Feature Priority](#9-mvp-feature-priority-for-first-production-release)
10. [Development Guidelines](#10-development-guidelines-for-kiro-ide)
11. [Naming Conventions](#11-suggested-file--module-naming-conventions)
12. [Implementation Roadmap](#12-next-steps-for-implementation-in-kiro)

---

## 1. Project Overview

### Product Identity

**Product Name:** QuickCorpID  
**Purpose:** One-stop business identity & compliance hub for Hong Kong companies. Enables seamless CorpID authentication, digital signing, Document Wallet management, Trade Single Window (TSW) workflows, CargoX/CDI trade finance assistance, compliance calendar, multi-entity management, and AI-assisted features.

### Primary Users

- **SME owners / directors / authorised representatives** - Primary market segment
- **Company secretarial (TCSP) firms** - White-label/partnership opportunities
- **Mid-size firms and MNCs with HK entities** - Enterprise tier
- **Trading / logistics companies** - Heavy users of TSW and trade finance features

### Core Value Proposition

- **Connect CorpID once** → manage everything from one dashboard
- **Replace paper + company chops** with legally recognised digital flows
- **Pre-built workflows** for TSW, tax, annual returns, trade finance
- **Low technical barrier** (AI explanations + bilingual EN/ZH support)

### Monetisation Model

- **Freemium** → Professional → Business (multi-entity) → Enterprise
- Usage-based add-ons (signing volume, storage, AI credits)
- Partner / SDK licensing for secretarial platforms

### Current Project Status

**Existing Codebase:**
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS
- Features implemented: Home, Registration Wizard (4-step), Dashboard, Pricing, About pages
- Bilingual support: Full EN/ZH translations
- CorpID API: Mock implementation with comprehensive type definitions
- Authentication: AWS Cognito integration (configured)

**Technology Readiness:**
- MVP frontend: 70% complete
- Backend infrastructure: Not yet implemented
- CorpID integration: Mock layer ready, sandbox credentials pending
- Database: Not yet set up

---

## 2. High-Level Architecture (AWS-Native)

### Architecture Principles

**Architecture Style:** Serverless-first + containers where needed  
**Primary Region:** ap-east-1 (Hong Kong)  
**DR Region:** ap-southeast-1 (Singapore)

### Core AWS Services

| Category | Service | Purpose |
|----------|---------|---------|
| **Compute** | AWS Lambda + API Gateway (HTTP APIs) | REST API endpoints, microservices |
| | ECS Fargate | Long-running/heavier jobs (document processing, batch operations) |
| **Auth** | Amazon Cognito | User pool, authentication |
| | Custom Authorizer | Validates CorpID tokens |
| **Database** | Amazon Aurora PostgreSQL Serverless v2 | Primary relational database |
| | DynamoDB | Session cache, hot-path audit logs, real-time data |
| **Storage** | Amazon S3 | Encrypted documents, static assets |
| | CloudFront | CDN for assets and document delivery |
| **Messaging** | Amazon SNS + SQS + EventBridge | Event-driven architecture, async processing |
| **Secrets** | AWS Secrets Manager + Parameter Store | Secure credential storage |
| **Monitoring** | CloudWatch + X-Ray + AWS OpenSearch | Observability, logging, tracing |
| **CI/CD** | CodePipeline + CodeBuild + ECR | Automated deployment pipeline |
| **Networking** | VPC with private subnets | Network isolation |
| | NAT Gateway | Outbound internet access |
| | VPC Endpoints | Private access to S3, Secrets Manager |
| **Security** | WAF, Shield, GuardDuty | Application and infrastructure security |
| | IAM roles | Least-privilege access control |

### Frontend Architecture

- **Framework:** Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui
- **Hosting:** AWS Amplify Hosting or S3 + CloudFront
- **Features:** Mobile-responsive + PWA-ready

### Backend Structure (Monorepo)

```
quickcorpid/
├── apps/
│   ├── web/                 # Next.js frontend
│   └── admin/               # Internal admin dashboard
├── packages/
│   ├── api/                 # Shared API types & clients
│   ├── ui/                  # Shared components
│   └── config/
├── services/
│   ├── auth-service/
│   ├── org-service/
│   ├── document-service/
│   ├── signing-service/
│   ├── compliance-service/
│   ├── integration-service/ # CorpID, TSW, CDI connectors
│   ├── notification-service/
│   └── ai-service/
├── infrastructure/          # CDK or Terraform
└── docs/
```

---

## 3. Recommended Tech Stack

### Frontend

| Technology | Purpose | Rationale |
|------------|---------|-----------|
| Next.js 15 (App Router) | Framework | SSR, API routes, excellent DX |
| TypeScript | Language | Type safety, better tooling |
| Tailwind CSS + shadcn/ui + Radix | Styling | Rapid UI development, accessible |
| TanStack Query (React Query) | Data fetching | Caching, optimistic updates |
| Zustand or Jotai | Client state | Lightweight, simple API |
| React Hook Form + Zod | Forms | Validation, type inference |
| next-intl | i18n | Bilingual EN/ZH support |

### Backend

| Technology | Purpose | Rationale |
|------------|---------|-----------|
| Node.js 22 + TypeScript | Runtime | Consistency with frontend, good AWS SDK support |
| Fastify or Hono | Web framework | Lightweight, high performance |
| Prisma or Drizzle ORM | Database | Type-safe queries, migrations |
| AWS SDK v3 | AWS integration | Native support for all AWS services |
| Zod | Validation | Shared types with frontend |

### Infrastructure as Code

- **AWS CDK (TypeScript)** - Preferred for Kiro IDE integration, type safety

### Testing

- **Vitest + Playwright** - Frontend testing
- **Jest** - Backend unit tests
- **AWS CDK assertions** - Infrastructure tests

### Observability

- **OpenTelemetry** - Tracing standard
- **CloudWatch / X-Ray** - AWS-native observability

---

## 4. Core Domain Models (Database Schema Outline)

### Primary Database: Aurora PostgreSQL Serverless v2

#### Users & Organizations

```sql
-- Users (linked to Cognito)
users (
  id UUID PRIMARY KEY,
  cognito_sub VARCHAR(128) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  preferred_language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- Organizations (companies)
organisations (
  id UUID PRIMARY KEY,
  company_name_en VARCHAR(255),
  company_name_zh VARCHAR(255),
  br_number VARCHAR(8) UNIQUE NOT NULL,
  cr_number VARCHAR(8),  -- Company Registry number (for limited companies)
  corpid_identifier VARCHAR(128),  -- CorpID system identifier
  business_type VARCHAR(50),  -- limited_company, sole_proprietorship, partnership, branch_company
  status VARCHAR(50) DEFAULT 'pending',  -- pending, active, suspended
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- Organization membership
organisation_members (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  org_id UUID REFERENCES organisations(id),
  role VARCHAR(50) NOT NULL,  -- owner, admin, authorised_rep, viewer
  status VARCHAR(50) DEFAULT 'pending',  -- pending, active, suspended
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, org_id)
)
```

#### CorpID Integration

```sql
-- CorpID connections
corpid_connections (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organisations(id),
  corp_id_token_ref VARCHAR(255),
  connection_status VARCHAR(50),  -- connected, expired, revoked
  last_synced_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
)

-- Authorizations (who can sign what)
authorisations (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organisations(id),
  user_id UUID REFERENCES users(id),
  auth_type VARCHAR(50),  -- digital_sign, document_access, tsw_submit
  scope JSONB,
  granted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  revoked_at TIMESTAMP
)
```

#### Documents & Signing

```sql
-- Documents
documents (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organisations(id),
  uploaded_by UUID REFERENCES users(id),
  type VARCHAR(50),  -- contract, resolution, tsw_form, etc.
  title VARCHAR(255),
  s3_key VARCHAR(512) NOT NULL,
  hash VARCHAR(128),
  version INTEGER DEFAULT 1,
  status VARCHAR(50),  -- draft, pending_signature, signed, archived
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- Document sharing
document_shares (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id),
  shared_with_email VARCHAR(255),
  permission VARCHAR(50),  -- view, sign, download
  expiry TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
)

-- Signing requests
signing_requests (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id),
  status VARCHAR(50),  -- pending, completed, expired, cancelled
  signers JSONB,  -- [{user_id, name, email, status, signed_at}]
  corpid_reference VARCHAR(128),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
)
```

#### Compliance & Workflows

```sql
-- Compliance items
compliance_items (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organisations(id),
  type VARCHAR(50),  -- annual_return, brc, tax, licence
  due_date DATE NOT NULL,
  status VARCHAR(50),  -- upcoming, due_soon, overdue, completed
  metadata JSONB,
  reminder_sent_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
)

-- Workflows (TSW, CargoX, etc.)
workflows (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organisations(id),
  type VARCHAR(50),  -- tsw_submission, cargo_x_assist, bank_account_opening
  status VARCHAR(50),
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

#### Audit & Billing

```sql
-- Audit logs (immutable)
audit_logs (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organisations(id),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
)

-- Subscriptions
subscriptions (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organisations(id),
  plan VARCHAR(50),  -- free, professional, business, enterprise
  status VARCHAR(50),
  stripe_subscription_id VARCHAR(255),
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
)

-- Usage metrics
usage_metrics (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organisations(id),
  metric_type VARCHAR(50),  -- signatures, storage_gb, ai_tokens
  quantity DECIMAL(10,2),
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMP DEFAULT NOW()
)

-- Notifications
notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type VARCHAR(50),
  title VARCHAR(255),
  message TEXT,
  read_at TIMESTAMP,
  action_url VARCHAR(512),
  created_at TIMESTAMP DEFAULT NOW()
)
```

### DynamoDB (Hot Path)

| Table | Purpose |
|-------|---------|
| `session-cache` | Active session data, temp tokens |
| `signing-status` | Real-time signing status tracking |
| `audit-hot` | High-volume audit events (mirrored to S3) |

---

## 5. Key Backend Services (Detailed)

### 5.1 Auth & Identity Service

**Responsibilities:**
- Cognito User Pool management for dashboard login
- Custom Authorizer for CorpID JWT validation
- Link Cognito user ↔ Organisation ↔ CorpID identity
- Role-based access control (RBAC) enforcement

**Key Functions:**
```typescript
// OAuth flow with CorpID
initiateCorpIDAuth(): Promise<{ authUrl: string, state: string }>
handleCorpIDCallback(code: string): Promise<{ accessToken: string, user: CorpIDUser }>

// User management
createUser(cognitoSub: string, email: string): Promise<User>
getUserOrgs(userId: string): Promise<Organisation[]>

// Authorization
checkPermission(userId: string, orgId: string, action: string): Promise<boolean>
```

### 5.2 Organisation & Multi-Entity Service

**Responsibilities:**
- Organisation creation and management
- Member invitation and role management
- Multi-company support under one user
- Organisation switching

**Key Functions:**
```typescript
createOrganisation(data: CreateOrgInput): Promise<Organisation>
inviteMember(orgId: string, email: string, role: Role): Promise<void>
acceptInvitation(token: string): Promise<OrganisationMember>
switchActiveOrg(userId: string, orgId: string): Promise<void>
```

### 5.3 CorpID Integration Service

**Responsibilities:**
- OAuth / token exchange with CorpID Sandbox & Production
- QR code generation for login / signing
- Callback / webhook handling
- Document Wallet sync
- Form pre-fill data extraction
- Error handling & retry logic

**Key Functions:**
```typescript
// OAuth
getCorpIDAuthUrl(redirectUri: string): Promise<string>
exchangeCorpIDToken(code: string): Promise<CorpIDTokens>

// Business verification
verifyBRNumber(brNumber: string): Promise<BRVerificationResult>
prefillFromCorpID(orgId: string): Promise<CorpIDProfile>

// Document Wallet
syncDocumentWallet(orgId: string): Promise<StoredDocument[]>
getDigitalCredentials(orgId: string): Promise<VerifiableCredential[]>
```

**CorpID API Endpoints (Sandbox):**
- `/api/v1/business/verify` - Verify BR number with IRD
- `/api/v1/applications` - Submit CorpID application
- `/api/v1/applications/{ref}` - Check application status
- `/api/v1/documents/upload` - Upload identity documents

### 5.4 Document Service

**Responsibilities:**
- Secure upload to S3 (pre-signed URLs)
- Encryption at rest (SSE-KMS)
- Versioning + hashing
- Document classification
- Share with external parties (time-limited links)

**Key Functions:**
```typescript
// Upload
getUploadUrl(orgId: string, fileName: string): Promise<{ uploadUrl: string, key: string }>
confirmUpload(key: string, metadata: DocumentMetadata): Promise<Document>

// Management
listDocuments(orgId: string, filters: DocumentFilters): Promise<Document[]>
getDocument(docId: string): Promise<DocumentWithUrl>
deleteDocument(docId: string): Promise<void>

// Sharing
createShareLink(docId: string, permission: string, expiresAt: Date): Promise<string>
revokeShareLink(shareId: string): Promise<void>
```

### 5.5 Signing Service

**Responsibilities:**
- Initiate signing request → generate CorpID QR / deep link
- Poll / webhook for completion status
- Store signed document + evidence
- Multi-signer support
- Audit trail

**Key Functions:**
```typescript
initiateSigningRequest(docId: string, signers: SignerInput[]): Promise<SigningRequest>
getSigningStatus(requestId: string): Promise<SigningStatus>
getSigningQR(requestId: string): Promise<{ qrUrl: string, deepLink: string }>
handleSigningWebhook(event: SigningWebhookEvent): Promise<void>
```

### 5.6 Compliance Service

**Responsibilities:**
- Calendar of statutory deadlines (NAR1, BRC, profits tax, licences)
- Auto-reminders (email + in-app)
- Status tracking
- Template generation for common filings

**Key Functions:**
```typescript
// Compliance calendar
getComplianceCalendar(orgId: string, year: number): Promise<ComplianceItem[]>
upsertComplianceItem(orgId: string, item: ComplianceInput): Promise<ComplianceItem>

// Reminders
scheduleReminders(orgId: string): Promise<void>
sendReminder(itemId: string): Promise<void>

// Templates
generateNAR1Form(orgId: string): Promise<Blob>
generateBRCRenewal(orgId: string): Promise<Blob>
```

### 5.7 Workflow / Integration Service

**Responsibilities:**
- Trade Single Window submission templates
- CargoX / CDI consent & data sharing flows
- Future GBA connectors
- Bank / partner connectors

**Key Functions:**
```typescript
// TSW
initiateTswSubmission(orgId: string, type: string): Promise<Workflow>
submitToTsw(workflowId: string, data: any): Promise<TswResult>

// CargoX / CDI
initiateCargoXFlow(orgId: string, bankId: string): Promise<Workflow>
authorizeDataSharing(orgId: string, dataTypes: string[]): Promise<void>
```

### 5.8 Notification Service

**Responsibilities:**
- Event-driven notifications via EventBridge
- Multi-channel delivery (SNS, SES, optional WhatsApp Business API)
- In-app notification center

**Key Functions:**
```typescript
// Event handling
handleNotificationEvent(event: NotificationEvent): Promise<void>

// Delivery
sendEmail(to: string, template: string, data: any): Promise<void>
sendSMS(phone: string, message: string): Promise<void>
sendInAppNotification(userId: string, notification: NotificationInput): Promise<void>

// Management
listNotifications(userId: string, filters: NotificationFilters): Promise<Notification[]>
markAsRead(notificationIds: string[]): Promise<void>
```

### 5.9 AI Service

**Responsibilities:**
- Lightweight LLM calls (Bedrock or external) for:
  - Form explanations
  - Deadline prioritization
  - Simple risk flags
  - Bilingual assistance
- Strict prompt isolation + cost controls

**Key Functions:**
```typescript
explainForm(formType: string, field: string, lang: string): Promise<string>
prioritizeDeadlines(items: ComplianceItem[]): Promise<PrioritizedItems[]>
riskAnalysis(orgId: string): Promise<RiskFlags>
bilingualAssist(query: string, context: string): Promise<string>
```

### 5.10 Billing & Usage Service

**Responsibilities:**
- Stripe integration
- Usage metering (signatures, storage, AI tokens)
- Subscription management
- Invoice generation

**Key Functions:**
```typescript
// Subscription management
createSubscription(orgId: string, plan: string): Promise<Subscription>
updateSubscription(orgId: string, newPlan: string): Promise<void>
cancelSubscription(orgId: string): Promise<void>

// Usage tracking
recordUsage(orgId: string, type: string, quantity: number): Promise<void>
getUsageReport(orgId: string, period: DateRange): Promise<UsageReport>

// Billing
getInvoice(invoiceId: string): Promise<Invoice>
getPaymentMethods(orgId: string): Promise<PaymentMethod[]>
```

---

## 6. Frontend Structure (Next.js App Router)

### Directory Structure

```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   ├── onboarding/
│   │   └── page.tsx
│   └── layout.tsx
├── (dashboard)/
│   ├── layout.tsx                 # Sidebar + org switcher
│   ├── page.tsx                   # Overview dashboard
│   ├── documents/
│   │   ├── page.tsx               # Document list
│   │   └── [id]/
│   │       └── page.tsx           # Document detail
│   ├── signing/
│   │   ├── page.tsx               # Signing requests
│   │   └── [id]/
│   │       └── page.tsx           # Signing flow
│   ├── compliance/
│   │   ├── page.tsx               # Compliance calendar
│   │   └── [id]/
│   │       └── page.tsx           # Item detail
│   ├── workflows/
│   │   ├── page.tsx               # Workflow list
│   │   ├── tsw/
│   │   │   └── page.tsx           # TSW workflows
│   │   └── trade-finance/
│   │       └── page.tsx           # CargoX/CDI workflows
│   ├── settings/
│   │   ├── page.tsx               # General settings
│   │   ├── team/
│   │   │   └── page.tsx           # Team management
│   │   ├── corpid/
│   │   │   └── page.tsx           # CorpID connection
│   │   └── billing/
│   │       └── page.tsx           # Billing & subscription
│   └── admin/                     # Only for internal use
│       └── page.tsx
├── api/                           # Route handlers
│   ├── auth/
│   │   └── corpid/
│   │       ├── callback/
│   │       │   └── route.ts
│   │       └── [...nextauth]/
│   │           └── route.ts
│   ├── webhooks/
│   │   ├── stripe/
│   │   │   └── route.ts
│   │   └── corpid/
│   │       └── route.ts
│   └── upload/
│       └── route.ts
├── globals.css
├── layout.tsx
└── page.tsx                       # Landing page
```

### Key UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| OrgSwitcher | Switch between organisations | `components/dashboard/OrgSwitcher.tsx` |
| DocumentList | List documents with filters | `components/documents/DocumentList.tsx` |
| DocumentPreview | Preview PDFs, images | `components/documents/DocumentPreview.tsx` |
| SigningQRModal | Display signing QR code | `components/signing/SigningQRModal.tsx` |
| ComplianceCalendar | Month/week view | `components/compliance/ComplianceCalendar.tsx` |
| WorkflowWizard | Stepper for workflows | `components/workflows/WorkflowWizard.tsx` |
| NotificationBell | Notifications center | `components/layout/NotificationBell.tsx` |
| AIChatPanel | AI assistant side panel | `components/ai/AIChatPanel.tsx` |

---

## 7. Security Requirements (Critical)

### Data Protection

| Requirement | Implementation |
|-------------|----------------|
| CorpID tokens storage | Encrypted in Secrets Manager or KMS |
| Documents at rest | S3 SSE-KMS encryption |
| Documents in transit | HTTPS only, CloudFront signed URLs |
| Database encryption | Aurora encryption at rest |
| Secrets management | Secrets Manager with rotation |

### Application Security

| Requirement | Implementation |
|-------------|----------------|
| CORS | Strict origin whitelist |
| CSP | Content Security Policy headers |
| WAF | Rate limiting, geo-blocking if needed |
| IAM | Least-privilege roles per service |
| Audit logs | Immutable, retained 7+ years |
| PDPO compliance | Consent management, data access requests |

### Compliance

- **PDPO (Personal Data Privacy Ordinance):** Data access requests, consent management
- **Audit requirements:** Minimum 7-year retention for compliance records
- **Dependency scanning:** Regular SAST/SCA scans
- **Penetration testing:** Annual third-party assessment

### Security Checklist

- [ ] All S3 buckets block public access
- [ ] KMS keys configured for all encrypted resources
- [ ] VPC endpoints for S3, Secrets Manager, DynamoDB
- [ ] WAF rules configured
- [ ] GuardDuty enabled
- [ ] CloudTrail logging enabled
- [ ] Regular dependency scanning in CI/CD
- [ ] Security groups follow least privilege
- [ ] No secrets in code or environment variables (use Secrets Manager)

---

## 8. Environment & Configuration

### Environments

| Environment | Purpose | CorpID | Database |
|-------------|---------|--------|----------|
| `dev` | Development | Sandbox | Aurora dev cluster |
| `staging` | Pre-production testing | Sandbox | Aurora staging cluster |
| `production` | Live system | Production | Aurora production cluster |

### Secrets (Secrets Manager)

| Secret Name | Purpose |
|-------------|---------|
| `corpid/client-credentials` | CorpID client ID and secret |
| `corpid/kek-private-key` | KEK private key for encryption |
| `database/credentials` | Aurora PostgreSQL credentials |
| `stripe/api-keys` | Stripe secret key |
| `ai/provider-keys` | Bedrock or external AI provider keys |
| `jwt/signing-secret` | JWT signing secret |

### Feature Flags

**Implementation:** AWS AppConfig or DynamoDB flags

| Flag | Purpose | Default |
|------|---------|---------|
| `enable_tsw_workflows` | Enable TSW submission features | `false` |
| `enable_cargox_integration` | Enable CargoX/CDI flows | `false` |
| `enable_ai_assistant` | Enable AI chat panel | `false` |
| `maintenance_mode` | Show maintenance page | `false` |

### Environment Variables (Frontend)

```env
# AWS
VITE_AWS_REGION=ap-east-1
VITE_COGNITO_USER_POOL_ID=ap-east-1_XXXXX
VITE_COGNITO_CLIENT_ID=xxxxx

# API
VITE_API_BASE_URL=https://api.quickcorpid.com

# CorpID
VITE_CORPID_SANDBOX_URL=https://sb.corpid.gov.hk
VITE_CORPID_CLIENT_ID=xxxxx

# Feature flags
VITE_ENABLE_TSW=false
VITE_ENABLE_CARGOX=false
VITE_ENABLE_AI=false
```

---

## 9. MVP Feature Priority (for first production release)

### Must-have (MVP - 8-10 weeks)

| Feature | Priority | Effort | Dependencies |
|---------|----------|--------|--------------|
| User registration + Cognito auth | P0 | 1 week | Cognito setup |
| Organisation creation + member invite | P0 | 1.5 weeks | Database schema |
| CorpID connection flow (Sandbox) | P0 | 2 weeks | CorpID sandbox account |
| Document upload + Document Wallet view | P0 | 1.5 weeks | S3 setup |
| Basic digital signing flow (QR) | P0 | 2 weeks | CorpID integration |
| Simple compliance calendar (manual + reminders) | P1 | 1 week | Notification service |
| Dashboard overview | P1 | 0.5 week | - |
| Billing (Stripe) - one paid plan | P1 | 1 week | Stripe account |

### Phase 2 (Post-MVP - 12-16 weeks)

| Feature | Priority | Effort |
|---------|----------|--------|
| TSW workflow templates | P1 | 3 weeks |
| CargoX / CDI assist | P1 | 3 weeks |
| Multi-entity full support | P1 | 2 weeks |
| AI assistant | P2 | 2 weeks |
| Advanced audit exports | P2 | 1 week |
| Partner marketplace | P2 | 2 weeks |

### Phase 3 (Future - 6+ months)

- White-label platform for partners
- Advanced AI features (document analysis, compliance prediction)
- GBA (Greater Bay Area) integrations
- Mobile app (React Native)

---

## 10. Development Guidelines for Kiro IDE

### Code Standards

- **Prefer TypeScript everywhere** - Type safety, better tooling
- **Use Zod for all input validation** - Shared types with frontend
- **Clear OpenAPI / typed contracts** - Document all APIs
- **Retry + circuit breaker for external calls** - Resilience
- **Unit tests for business logic** - Integration tests for AWS

### AWS Best Practices

- **Infrastructure as Code (CDK)** - Same monorepo
- **Least privilege IAM roles** - Every Lambda / ECS task
- **All S3 buckets block public access** - Use CloudFront signed URLs
- **KMS encryption** - For all sensitive data
- **Structured logging (JSON)** - CloudWatch Logs

### Code Style

```typescript
// Prefer functional, immutable patterns
const documents = await getDocuments(orgId);
const signedDocs = documents.filter(d => d.status === 'signed');

// Use Zod for validation
const DocumentInput = z.object({
  title: z.string().min(1),
  type: z.enum(['contract', 'resolution', 'tsw_form']),
});

// Type-safe API responses
type ApiResponse<T> = {
  data: T | null;
  error: ApiError | null;
};
```

### Testing Requirements

- Unit tests for business logic (>80% coverage)
- Integration tests for critical paths
- E2E tests for key user journeys
- Load testing before production launch

---

## 11. Suggested File / Module Naming Conventions

### Services

- **Naming:** kebab-case (e.g., `signing-service`)
- **Location:** `services/` directory

### Types

- **Naming:** PascalCase (e.g., `DocumentSigningRequest`)
- **Location:** `packages/api/src/types/`

### API Routes

- **Naming:** RESTful (e.g., `/organisations/{orgId}/documents`)
- **Location:** `apps/web/app/api/` or Lambda handlers

### Events

- **Naming:** domain.action (e.g., `document.signed`, `org.created`)
- **Location:** EventBridge custom events

### Database Tables

- **Naming:** snake_case (e.g., `signing_requests`)
- **Location:** Aurora PostgreSQL

### DynamoDB Tables

- **Naming:** kebab-case with environment suffix (e.g., `signing-status-dev`)
- **Location:** DynamoDB

---

## 12. Next Steps for Implementation in Kiro

### Week 1-2: Infrastructure Setup

1. Initialise monorepo (Turborepo or Nx)
2. Set up AWS CDK stack (VPC, Aurora, Cognito, S3, API Gateway)
3. Configure CI/CD pipeline (CodePipeline + CodeBuild)
4. Set up Secrets Manager secrets

### Week 3-4: Core Services

1. Implement Auth service (Cognito + CorpID OAuth)
2. Implement Organisation service
3. Build CorpID integration layer against Sandbox
4. Create shared API types package

### Week 5-6: Documents & Signing

1. Implement Document service
2. Implement Signing service
3. Build file upload flow (pre-signed URLs)
4. Test signing flow end-to-end

### Week 7-8: Frontend Shell

1. Convert React app to Next.js 15 (or enhance current Vite setup)
2. Implement authentication flow
3. Build dashboard shell + navigation
4. Implement document management UI

### Week 9-10: Compliance & Billing

1. Implement Compliance calendar service
2. Build compliance UI
3. Implement Billing service (Stripe)
4. Test subscription flows

### Week 11-12: Polish & Launch Prep

1. Security audit
2. Performance optimization
3. Documentation
4. Production deployment
5. UAT testing

---

## Summary

This comprehensive documentation provides a complete blueprint for building QuickCorpID as an AWS-native SaaS platform for Hong Kong's CorpID ecosystem. The architecture is designed to:

- Scale from hundreds to thousands of users
- Integrate seamlessly with CorpID, TSW, and CargoX
- Provide a secure, compliant platform for business identity management
- Support bilingual (EN/ZH) users with AI-assisted features
- Enable white-label partnerships with company secretaries and banks

The modular monorepo structure allows for independent development of services while maintaining type safety and code reuse across the platform.
