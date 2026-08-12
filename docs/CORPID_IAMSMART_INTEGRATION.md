# CorpID + iAM Smart Integration Guide

**For e-Service / App Development (Sandbox + Production)**

Last updated: August 2026

Target environment: CorpID Sandbox → Production (end-2026)

---

## 1. Overview

**CorpID** (Digital Corporate Identity) is a Hong Kong Government platform (Digital Policy Office) that provides a common digital identity for corporations.

It integrates tightly with **iAM Smart** for user authentication and enables:

- Corporate Identity Verification (Login)
- Form Pre-filling
- Digital Signing (text + PDF)
- Document Wallet (DID / Verifiable Credentials)

e-Services call RESTful APIs and must expose **callback endpoints**.

---

## 2. Official Documents Reference

| Document | Version | Purpose |
|----------|---------|---------|
| Developer Guide for CorpID enabled e-Services | v1.0 (June 2026) | Full workflows, sequence diagrams, encryption details |
| CorpID API Specifications for e-services | v1.0.4 (June 2026) | Complete production API reference |
| iAM Smart API Specification for CorpID Integration | v0.1.1 (May 2026) | iAM Smart authentication details |
| CorpID Sandbox Programme Developer Guide | v1.0 (Dec 2025) | Sandbox setup & simplified flows |
| CorpID Sandbox Programme Simulated API Specifications | v1.0 (Dec 2025) | Simulated API request/response samples |

**Sandbox API Reference (Swagger UI)**

Interactive documentation available in the CorpID Sandbox Developer Portal covering the four main categories below.

---

## 3. Core API Categories

| Category | Description | Common Use Cases |
|----------|-------------|------------------|
| **Corporate Identity Verification** | Verify personal + corporate identity | Login, membership, booking, account opening |
| **Digital Signing** | Online digital signing with legal backing | Application forms, contracts, agreements |
| **Form Pre-filling** | Retrieve corporate profile data | Account opening, form auto-fill |
| **Document Wallet** | Access & verify government-issued digital certificates (DID/VC) | Supporting documents |

---

## 4. Authentication Scopes

Apply the required scopes in advance via the Self-Service Portal (ESP).

| Scope | Description |
|-------|-------------|
| `eidapi_auth` | Authentication |

Additional scopes may be required depending on the features you enable.

---

## 5. High-Level Authentication Flows

There are multiple scenarios:

- Different device (Web on desktop + iAM Smart app on phone) → QR / Broker page
- Same device (Web or native App)
- Direct Login v2
- Anonymous flows (no prior service login)

### Typical Different-Device Web Flow

1. e-Service requests QR / App Broker page
2. User scans QR with iAM Smart app and authenticates
3. Callback with `cAuthCode` (and sometimes `code_verifier`)
4. Exchange code for:
   - iAM Smart `accessToken` + Tokenised ID
   - CorpID `cAccessToken`
5. (Optional) Get Corporation List → user selects company → Token Exchange
6. Use CorpID access token for subsequent APIs

---

## 6. Security & Encryption (Critical)

### 6.1 Key Concepts

| Term | Full Name | Algorithm | Purpose |
|------|-----------|-----------|---------|
| **KEK** | Key Encryption Key | RSA | Encrypts / decrypts the CEK |
| **CEK** | Content Encryption Key | AES-256-GCM | Encrypts / decrypts business data |

### 6.2 Encryption Workflow

1. Download / upload your **KEK certificate** (public key).
2. Call **Request Symmetric Content Encryption Key** API.
3. CorpID generates a CEK, encrypts it with your KEK (RSA), and returns it.
4. You decrypt the CEK using your **private key**.
5. Use the CEK + random IV to encrypt/decrypt all subsequent request/response/callback bodies.
6. Callbacks also return an encrypted CEK in the `secretKey` field.

### 6.3 Content Field Format

Algorithm: `AES/GCM/NoPadding`

### 6.4 Sandbox KEK Certificate

- Location: **Account Centre** → **Download KEK**
- Trial certificate file: `account-centre-kek.p12`
- PIN: `8568185550716550`

> In production you must use a certificate issued by a Hong Kong Recognised Certification Authority.

### 6.5 Important Rules

- Store the CEK and its expiry time `issueAt` + `expiresIn`).
- Request a new CEK when it expires or on encryption errors.
- Callbacks may return a **new** CEK — always decrypt the one in the callback body.
- Never put the private key in the frontend.

### 6.6 Common Encryption Error Codes

| Code | Meaning |
|------|---------|
| M30001 | Key Encryption Key not exist or expired |
| M30002 | Content Encryption Key not exist or expired |
| M30003 | Encryption exception |

---

## 7. Recommended Implementation Order

---

## 8. Sandbox Setup Checklist

- [ ] Register in CorpID Sandbox Developer Portal
- [ ] Obtain Client ID + Client Secret
- [ ] Download KEK certificate `.p12`)
- [ ] Set up callback / redirect URLs (whitelist)
- [ ] Set up iAM Smart ITE testing account (if not reusing existing)
- [ ] Install iAM Smart Testing Mobile App
- [ ] Test Get CEK API successfully
- [ ] Test basic Authentication flow

---

## 9. Key Technical Notes for Development

- All APIs (except Get CEK) require encrypted `content`.
- HTTPS is mandatory.
- Callbacks are POST requests from CorpID to your server.
- Support both Web and native App deep-link flows.
- Handle multiple corporations per user (Token Exchange).
- Prepare fallback when CorpID is temporarily unavailable.
- Avoid excessive Get CEK calls (store the key).

---

## 10. Next Actions

1. Download the KEK `.p12` from Account Centre.
2. Load the private key in your backend.
3. Call the Get CEK API and verify you can decrypt the returned CEK.
4. Proceed to the Authentication flow.

---

**Document maintained for Kiro IDE development reference.**

Feel free to expand individual sections with exact endpoint parameters when needed.
