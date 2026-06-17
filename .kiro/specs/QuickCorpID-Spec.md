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

## CorpID Sandbox Integration Notes

### Registration URL
- Sandbox: https://sb.corpid.gov.hk/

### Key Integration Points
1. **Business Registration Verification**
   - Verify BR number with Inland Revenue Department
   - Retrieve company information automatically

2. **Identity Verification**
   - HKID verification with Immigration Department
   - Support for passport verification

3. **Application Submission**
   - Submit CorpID application
   - Receive reference number
   - Track application status

4. **Callback Handling**
   - Handle approval/rejection callbacks
   - Update application status in real-time

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
