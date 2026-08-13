# QuickCorpID - Development Specification

## Project Overview

**Project Name**: CorpID QuickStart HK  
**Type**: Bilingual Freemium SaaS for CorpID onboarding  
**Target Users**: Hong Kong SMEs, self-employed individuals, F&B outlets, taxi operators

---

## Current State Analysis

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM v7
- **Icons**: Lucide React
- **Backend**: Supabase (configured but not yet integrated)
- **i18n**: Custom LanguageContext with EN/ZH (Traditional Chinese) translations

### Implemented Features
| Feature | Status | Quality |
|---------|--------|---------|
| Home Page | ✅ Complete | Good - Hero, benefits, target users, CTA |
| Registration Wizard (4-step) | ✅ Complete | Good - Business info, ID verification, role, review |
| Dashboard | ✅ Complete | Basic - Status display, quick actions, reminders |
| Pricing Page | ✅ Complete | Good - Free/Premium/Enterprise tiers with modal |
| About Page | ✅ Complete | Basic - Mission, CorpID explanation, contact |
| Bilingual Support (EN/ZH) | ✅ Complete | Good - Full translations in translations.ts |
| Navigation | ✅ Complete | Good - Responsive navbar with mobile menu |
| Footer | ✅ Complete | Basic - Links and copyright |

### Key Files Structure
```
src/
├── components/
│   ├── Footer.tsx
│   ├── LanguageSwitcher.tsx
│   ├── Logo.tsx
│   └── Navbar.tsx
├── i18n/
│   ├── LanguageContext.tsx
│   └── translations.ts
├── pages/
│   ├── AboutPage.tsx
│   ├── DashboardPage.tsx
│   ├── HomePage.tsx
│   ├── PricingPage.tsx
│   └── RegisterPage.tsx
├── App.tsx
├── main.tsx
└── index.css
```

---

## Phase 1: Foundation Polish (Week 1-2)

### Task 1.1: Enhance Bilingual System
**Priority**: High | **Complexity**: Low

**Requirements**:
- Add language persistence to URL params (`?lang=en` or `?lang=zh`)
- Add HTML `lang` attribute dynamic update
- Add font optimization for Chinese characters (Noto Sans TC)
- Add translation keys for validation error messages (currently hardcoded in English)

**Acceptance Criteria**:
- [ ] URL reflects current language (`/register?lang=zh`)
- [ ] HTML `<html lang="...">` updates on language change
- [ ] Chinese font loads and displays correctly
- [ ] All error messages display in selected language

---

### Task 1.2: Polish Registration Wizard
**Priority**: High | **Complexity**: Medium

**Requirements**:
- Add form data persistence to localStorage (survive page refresh)
- Add email field in Step 1 (for confirmation email)
- Add phone field in Step 1 (HK format: +852 XXXX XXXX)
- Improve file upload in Step 2 (actual drag-drop, preview, validation)
- Add loading states during field validation
- Add field-level validation feedback (real-time)
- Add keyboard navigation support (Enter to proceed)

**Acceptance Criteria**:
- [ ] Form data persists after page refresh
- [ ] Email and phone fields work with proper validation
- [ ] File upload shows preview and validates format/size
- [ ] Real-time validation feedback on all fields
- [ ] Enter key advances to next step when valid

---

### Task 1.3: Enhance Dashboard
**Priority**: High | **Complexity**: Medium

**Requirements**:
- Display actual registration data from localStorage/session
- Add status timeline visualization (submitted → processing → approved)
- Make quick actions functional with placeholder modals:
  - Digital Sign → Modal: "Coming Soon - Digital signing feature"
  - View Documents → Modal: List uploaded documents
  - Renew Authorization → Modal: "Coming Soon"
- Add profile completion percentage indicator
- Add recent activity log section (mock data)

**Acceptance Criteria**:
- [ ] Dashboard shows user's actual registration data
- [ ] Status timeline visualizes application progress
- [ ] All quick actions open functional modals
- [ ] Profile completion indicator works
- [ ] Activity log displays mock recent actions

---

### Task 1.4: Mobile Responsiveness Audit
**Priority**: Medium | **Complexity**: Low

**Requirements**:
- Test all pages on mobile viewports (320px, 375px, 414px)
- Fix any layout issues found
- Ensure touch targets are 44px minimum
- Verify font sizes are readable on mobile
- Test form interactions on mobile

**Acceptance Criteria**:
- [ ] All pages render correctly on mobile viewports
- [ ] All interactive elements meet touch target size
- [ ] Forms are usable on mobile devices
- [ ] No horizontal scrolling on any page

---

### Task 1.5: CorpID Sandbox API Placeholder
**Priority**: High | **Complexity**: Medium

**Requirements**:
- Create `src/services/corpidApi.ts` with mock API layer
- Define TypeScript interfaces for:
  - `CorpIDApplication`
  - `CorpIDStatus`
  - `CorpIDVerificationResult`
- Implement mock functions:
  - `submitApplication(data: Application): Promise<SubmitResult>`
  - `checkStatus(refNumber: string): Promise<StatusResult>`
  - `verifyBRNumber(brNumber: string): Promise<VerificationResult>`
- Add simulated network delays (1-2 seconds)
- Add mock success/failure scenarios

**Acceptance Criteria**:
- [ ] API service module created with proper TypeScript types
- [ ] All mock functions return realistic responses
- [ ] Network delays simulate real API behavior
- [ ] Error scenarios are handled

---

## Phase 2: Feature Enhancement (Week 3-4)

### Task 2.1: Co-Branding System
**Priority**: Medium | **Complexity**: Medium

**Requirements**:
- Create `src/config/branding.ts` for white-label configuration
- Support customizable:
  - Logo
  - Primary/secondary colors
  - Company name
  - Contact information
  - Footer text
- Add branding context provider
- Create example config for "Tai HK" branding

**Acceptance Criteria**:
- [ ] Branding can be changed via config file
- [ ] Logo, colors, and text update dynamically
- [ ] Default CorpID QuickStart branding preserved
- [ ] Example Tai HK branding works

---

### Task 2.2: Success Screen Enhancement
**Priority**: Medium | **Complexity**: Low

**Requirements**:
- Add printable confirmation page (CSS print styles)
- Add "Share" functionality (copy link, email)
- Add QR code generation for reference number
- Add estimated timeline visualization
- Add "What's Next" checklist with checkboxes

**Acceptance Criteria**:
- [ ] Confirmation page prints cleanly
- [ ] Share button copies reference link
- [ ] QR code displays reference number
- [ ] Timeline shows expected approval dates
- [ ] Checklist helps users track next steps

---

### Task 2.3: Pricing Page Enhancement
**Priority**: Medium | **Complexity**: Low

**Requirements**:
- Add feature comparison table
- Add FAQ section with expandable items
- Add "Upgrade" modal with:
  - Plan comparison
  - Payment placeholder (coming soon message)
  - Contact form for enterprise
- Add annual discount option (2 months free)

**Acceptance Criteria**:
- [ ] Feature comparison table is clear
- [ ] FAQ answers common questions
- [ ] Upgrade modal provides clear upgrade path
- [ ] Annual pricing option available

---

### Task 2.4: Form Validation Enhancement
**Priority**: Medium | **Complexity**: Low

**Requirements**:
- Add HKID format validation (A123456(7))
- Add Business Registration Number checksum validation
- Add async BR verification (mock)
- Add debounced validation for all fields
- Add accessible error announcements (aria-live)

**Acceptance Criteria**:
- [ ] HKID validates format and checksum
- [ ] BR number validates format
- [ ] Async verification shows loading state
- [ ] Validation errors are announced to screen readers

---

## Phase 3: Integration & Deployment (Week 5-6)

### Task 3.1: Supabase Integration
**Priority**: High | **Complexity**: High

**Requirements**:
- Set up Supabase tables:
  - `applications` (id, user_id, br_number, company_name, status, created_at, updated_at)
  - `users` (id, email, phone, created_at)
- Implement authentication flow (email/password)
- Connect registration form to Supabase
- Store application data in database
- Retrieve dashboard data from database

**Acceptance Criteria**:
- [ ] User can sign up with email/password
- [ ] Registration data saves to Supabase
- [ ] Dashboard shows real database data
- [ ] Session persistence works across refresh

---

### Task 3.2: CorpID Sandbox Integration
**Priority**: High | **Complexity**: High

**Requirements**:
- Replace mock API with real CorpID Sandbox API
- Implement OAuth flow for CorpID
- Handle API errors gracefully
- Add retry logic for failed requests
- Log all API interactions for debugging

**Acceptance Criteria**:
- [ ] Registration submits to CorpID Sandbox
- [ ] Status checks return real data
- [ ] Errors are handled with user-friendly messages
- [ ] Retry logic handles temporary failures

---

### Task 3.3: Deployment Preparation
**Priority**: High | **Complexity**: Medium

**Requirements**:
- Configure environment variables for API endpoints
- Add production build optimization
- Set up CI/CD pipeline (GitHub Actions)
- Configure AWS Amplify or Netlify deployment
- Add error monitoring (Sentry or similar)
- Add analytics tracking (privacy-focused)

**Acceptance Criteria**:
- [ ] Environment variables configured securely
- [ ] Build is optimized for production
- [ ] CI/CD runs tests and linting
- [ ] Deployment is automated
- [ ] Error monitoring is active
- [ ] Analytics track key events

---

### Task 3.4: Documentation
**Priority**: Medium | **Complexity**: Low

**Requirements**:
- Update README.md with:
  - Setup instructions
  - Environment variables
  - Development workflow
  - Deployment guide
- Add JSDoc comments to key functions
- Create API documentation
- Create user guide for CorpID integration

**Acceptance Criteria**:
- [ ] README is comprehensive and accurate
- [ ] Key functions are documented
- [ ] API endpoints are documented
- [ ] User guide helps new developers

---

## Non-Functional Requirements

### Performance
- First Contentful Paint < 1.5s
- Largest Contentful Paint < 2.5s
- Time to Interactive < 3s
- Cumulative Layout Shift < 0.1

### Accessibility
- WCAG 2.1 Level AA compliance
- All forms have proper labels
- Focus management for modals
- Keyboard navigation throughout
- Screen reader compatible

### Security
- HTTPS only
- Input sanitization
- CSRF protection
- Rate limiting on forms
- Secure session management

### SEO
- Meta tags for all pages
- Open Graph tags for social sharing
- Structured data for business info
- Sitemap.xml
- Robots.txt

---

## CorpID Integration Specification

### Overview

CorpID is Hong Kong's Digital Corporate Identity Platform, launching end of 2026. It provides:
- Digital corporate identity authentication
- Digital signing with legal recognition
- Form pre-filling with verified company data
- Storage of digital licences and permits

### Resources

| Resource | URL |
|----------|-----|
| Sandbox Portal | https://sb.corpid.gov.hk/ |
| Documentation | https://www.digitalpolicy.gov.hk/en/our_work/success_stories/corpid_sandbox/ |
| iAM Smart Integration | https://www.digitalpolicy.gov.hk/en/our_work/data_governance/common_data_platforms/iam_smart/ |

### Minimum Required Fields for CorpID

Based on CorpID documentation, only **7 fields** are strictly required:

| Category | Field | Required | Notes |
|----------|-------|----------|-------|
| Business | BR Number | ✅ | 8-digit Business Registration Number |
| Business | Business Type | ✅ | Limited Company, Sole Proprietorship, Partnership, Branch |
| Identity | ID Type | ✅ | HKID or Passport |
| Identity | ID Number | ✅ | HKID: A123456(7) format |
| Applicant | Role | ✅ | Director, Owner, Partner, Authorized Rep |
| Applicant | Email | ✅ | For CorpID notifications |
| Declaration | Authorization | ✅ | Legal authorization to act for company |

### Optional but Recommended

| Field | When Required |
|-------|---------------|
| Company Name | Auto-fills from BR verification |
| Phone | Recommended for urgent communications |
| ID Document | Required for passport holders without iAM Smart |
| iAM Smart Verification | Recommended for HKID holders |

### NOT Required

The following are **NOT required** for CorpID and should not be collected:
- Company Address (auto-retrieved from BR)
- Incorporation Date (auto-retrieved from BR)
- Company Secretary details
- Shareholder details
- Business description

### Integration Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   QuickCorpID   │────▶│   CorpID API    │────▶│   Government    │
│   Frontend      │     │   Sandbox       │     │   Databases     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│   AWS Backend   │     │   iAM Smart     │
│   (Cognito/S3)  │     │   (Optional)    │
└─────────────────┘     └─────────────────┘
```

### API Endpoints (Sandbox)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/business/verify` | POST | Verify BR number with IRD |
| `/api/v1/applications` | POST | Submit CorpID application |
| `/api/v1/applications/{ref}` | GET | Check application status |
| `/api/v1/documents/upload` | POST | Upload identity documents |
| `/oauth/authorize` | GET | OAuth authorization |
| `/oauth/token` | POST | Exchange code for token |

### Authentication Flow

CorpID uses OAuth 2.0:

1. User initiates registration on QuickCorpID
2. Redirect to CorpID OAuth authorization
3. User authenticates (with iAM Smart optional)
4. Redirect back with authorization code
5. Exchange code for access token
6. Use token to submit application

### iAM Smart Integration

For users with Hong Kong ID Cards, iAM Smart provides:
- Instant identity verification
- No document upload needed
- Legally recognized digital signature

**Implementation:**
```typescript
// Redirect to iAM Smart
const iAMSmartUrl = getIAMSmartAuthUrl(redirectUri);
window.location.href = iAMSmartUrl;

// Handle callback
const result = await handleIAMSmartCallback(authCode);
```

### Test Data

**Sandbox BR Numbers:**
- `12345678` → Valid, "Sample Trading Limited"
- `87654321` → Valid, "測試貿易有限公司"
- `11111111` → Invalid, not found

**HKID Validation:**
- Format: `[A-Z]{1,2}\d{6}(\d)`
- Example: `A123456(7)`
- Uses checksum validation algorithm

---

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Phase 1 | Week 1-2 | Polish existing features, API mock layer |
| Phase 2 | Week 3-4 | Co-branding, enhanced UX, form validation |
| Phase 3 | Week 5-6 | Supabase, CorpID integration, deployment |

---

## Dependencies & Risks

### Dependencies
- [ ] CorpID Sandbox account registration (do immediately)
- [ ] Supabase project setup
- [ ] Domain name acquisition
- [ ] SSL certificate

### Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| CorpID API changes | High | Maintain mock layer as fallback |
| Sandbox instability | Medium | Add retry logic and fallbacks |
| Translation quality | Medium | Have native speakers review |
| Mobile browser quirks | Low | Test on multiple devices |

---

## Success Metrics

### Phase 1 Success
- All pages mobile-responsive
- Form persists across refresh
- Error messages bilingual

### Phase 2 Success
- Co-branding configurable
- Success screen shareable

### Phase 3 Success
- Real CorpID Sandbox integration
- Production deployment live
- User can complete full registration flow
