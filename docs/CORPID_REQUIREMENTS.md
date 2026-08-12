# CorpID Registration Requirements

## Overview

This document defines the minimal data requirements for CorpID registration, based on research of the Hong Kong CorpID Platform (https://sb.corpid.gov.hk/).

## Key Principles

1. **Streamlined**: Only collect what CorpID requires
2. **Progressive Disclosure**: Ask for data when needed, not all at once
3. **Verification First**: Verify business registration before asking for more details
4. **iAM Smart Integration**: Use iAM Smart for identity verification when possible

---

## Required Data for CorpID Registration

### 1. Business Information (Step 1)

| Field | Required | Source | Notes |
|-------|----------|--------|-------|
| BR Number | ✅ Yes | User input | 8-digit Business Registration Number |
| Company Name (EN) | ⚠️ Conditional | Auto-filled from BR verification | English company name |
| Company Name (ZH) | ⚠️ Conditional | Auto-filled from BR verification | Chinese company name |
| Business Type | ✅ Yes | User selection | Limited Company, Sole Proprietorship, Partnership, Branch |

**Why these fields?**
- BR Number is the primary identifier for Hong Kong businesses
- Company name auto-fills from BR verification (reduces errors)
- Business type determines which additional documents may be needed

### 2. Applicant Identity (Step 2)

| Field | Required | Source | Notes |
|-------|----------|--------|-------|
| ID Type | ✅ Yes | User selection | HKID or Passport |
| ID Number | ✅ Yes | User input | HKID: A123456(7) format |
| ID Document | ⚠️ Optional | User upload | For non-iAM Smart users |
| iAM Smart Verification | ⚠️ Optional | iAM Smart API | Preferred method for HKID holders |

**Why these fields?**
- CorpID requires verified identity of company representative
- iAM Smart provides instant verification for HKID holders
- Passport holders need to upload ID document for manual verification

### 3. Applicant Role & Contact (Step 3)

| Field | Required | Source | Notes |
|-------|----------|--------|-------|
| Role in Company | ✅ Yes | User selection | Director, Owner, Partner, Authorized Rep |
| Full Name | ✅ Yes | iAM Smart or user input | Must match ID document |
| Email | ✅ Yes | User input | For CorpID notifications |
| Phone | ⚠️ Recommended | User input | For urgent communications |

**Why these fields?**
- Role determines authorization level
- Email is required for all CorpID communications
- Phone is recommended but not mandatory

### 4. Declarations (Step 4)

| Declaration | Required | Notes |
|-------------|----------|-------|
| Authorization | ✅ Yes | Confirm authorized to act for company |
| Terms Agreement | ✅ Yes | Accept CorpID terms of service |
| Data Consent | ✅ Yes | Consent for data processing |

---

## Data NOT Required for CorpID

The following are **NOT required** by CorpID and should be removed or made optional:

| Field | Status | Reason |
|-------|--------|--------|
| Company Address | ❌ Not required | Auto-retrieved from BR record |
| Incorporation Date | ❌ Not required | Auto-retrieved from BR record |
| Company Secretary | ❌ Not required | Not part of CorpID registration |
| Shareholder Details | ❌ Not required | Not part of CorpID registration |
| Business Description | ❌ Not required | Not needed for identity verification |

---

## Registration Flow

### Recommended 3-Step Flow (Simplified from 4-Step)

```
Step 1: Business Verification
├── Enter BR Number
├── System verifies with IRD
├── Auto-fill company details
└── Confirm business type

Step 2: Identity Verification
├── Choose ID type (HKID/Passport)
├── Enter ID number
├── [Optional] Verify via iAM Smart
└── [Optional] Upload ID document

Step 3: Authorization & Submit
├── Confirm your role
├── Enter contact email
├── Accept declarations
└── Submit application
```

### Why This Flow?

1. **Step 1**: Verify business first - if BR is invalid, stop early
2. **Step 2**: Identity verification - required by CorpID for representatives
3. **Step 3**: Authorization - legal requirement for CorpID

---

## iAM Smart Integration

### What is iAM Smart?

iAM Smart is Hong Kong's digital identity platform for individuals. It provides:
- Identity verification
- Password-free login
- Digital signing with legal backing

### How CorpID Uses iAM Smart

For company representatives with HKID:
1. Click "Verify with iAM Smart" button
2. Redirect to iAM Smart app
3. Authenticate with biometrics
4. Return to CorpID with verified identity

### Benefits

- No manual document upload needed
- Instant identity verification
- Legally recognized digital signature
- Streamlined user experience

---

## Sandbox Testing

### Test BR Numbers

Use these BR numbers for testing in sandbox:

| BR Number | Result | Company Name |
|-----------|--------|--------------|
| 12345678 | ✅ Valid | Sample Trading Limited |
| 87654321 | ✅ Valid | 測試貿易有限公司 |
| 11111111 | ❌ Invalid | Not found |
| 00000000 | ❌ Invalid | Format error |

### Test HKID Numbers

| HKID | Valid | Notes |
|------|-------|-------|
| A123456(7) | ✅ Valid | Standard format |
| B234567(3) | ✅ Valid | Different check digit |
| Z999999(9) | ❌ Invalid | Checksum fails |

---

## Environment Variables

Add these to `.env` for CorpID integration:

```env
# CorpID Sandbox Configuration
VITE_CORPID_SANDBOX_URL=https://sb.corpid.gov.hk/api/v1
VITE_CORPID_CLIENT_ID=your_client_id
VITE_CORPID_CLIENT_SECRET=your_client_secret

# iAM Smart Integration (Optional)
VITE_IAMSMART_CLIENT_ID=your_iamsmart_client_id
VITE_IAMSMART_CLIENT_SECRET=your_iamsmart_client_secret
```

---

## API Endpoints (When Available)

### Sandbox Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/business/verify` | POST | Verify BR number |
| `/api/v1/applications` | POST | Submit application |
| `/api/v1/applications/{ref}` | GET | Check status |
| `/api/v1/documents/upload` | POST | Upload documents |

### Authentication

CorpID uses OAuth 2.0:
1. Register your application at https://sb.corpid.gov.hk/
2. Obtain client_id and client_secret
3. Implement OAuth flow for user authorization

---

## References

- CorpID Sandbox: https://sb.corpid.gov.hk/
- CorpID Documentation: https://www.digitalpolicy.gov.hk/en/our_work/success_stories/corpid_sandbox/
- iAM Smart: https://www.digitalpolicy.gov.hk/en/our_work/data_governance/common_data_platforms/iam_smart/
- Business Registration: https://www.ird.gov.hk/eng/tax/bre.htm
- Companies Registry: https://www.cr.gov.hk/

---

## Summary

### Minimum Required Fields for CorpID

1. **Business**: BR Number (8 digits) + Business Type
2. **Identity**: ID Type + ID Number
3. **Applicant**: Role + Email
4. **Declarations**: Authorization + Terms + Consent

### Total: 7 Required Fields

This is the absolute minimum needed for CorpID registration. Any additional fields should be optional or collected later in the process.
