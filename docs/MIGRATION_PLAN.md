# 🚀 Migration Plan: Bolt.new Design to iBiz Smart

## ✅ Pre-Migration Verification Complete

**All Files Present:**
- ✅ 10 Page Components
- ✅ 5 Shared Components
- ✅ Auth & Supabase Libs
- ✅ Branding Config
- ✅ Language & Translations

---

## 📋 Migration Steps

### Step 1: Backup Current Code
- Create backup of current `src` folder
- Preserve existing AWS API integration

### Step 2: Copy New Design Files
- Copy all pages from `project/src/pages/`
- Copy all components from `project/src/components/`
- Copy updated config and i18n files

### Step 3: Update Authentication
- Replace Supabase auth with AWS Cognito
- Use our existing `lib/AuthContext.tsx`
- Update all auth calls

### Step 4: Update API Integration
- Replace Supabase client with our API client
- Use our existing `lib/api.ts`
- Connect to our AWS API Gateway endpoints

### Step 5: Update Import Paths
- Fix any broken imports
- Ensure all components use correct paths

### Step 6: Test Everything
- Test all pages
- Test authentication flow
- Test API integration
- Test all features

### Step 7: Deploy
- Build the project
- Deploy to AWS Amplify
- Test production URL

---

## 🔄 Files to Replace

### Pages (Replace All)
1. HomePage.tsx
2. LoginPage.tsx
3. RegisterPage.tsx
4. DashboardPage.tsx
5. OrganisationsPage.tsx
6. CorpIDPage.tsx
7. DocumentsPage.tsx
8. SettingsPage.tsx
9. PricingPage.tsx
10. AboutPage.tsx

### Components (Replace All)
1. Footer.tsx
2. LanguageSwitcher.tsx
3. Logo.tsx
4. Navbar.tsx
5. ProtectedRoute.tsx

### Config (Replace)
1. branding.tsx

### i18n (Merge/Keep Ours)
- LanguageContext.tsx - Keep ours
- translations.ts - Keep ours (has all content)

### Lib (Keep Ours)
- AuthContext.tsx - Keep ours (AWS Cognito)
- api.ts - Keep ours (AWS APIs)
- aws.ts - Keep ours

---

## ⚠️ Critical Updates Needed

### 1. Authentication Replacement
**From:** Supabase Auth
```typescript
import { useAuth } from '../lib/auth';
const { user, signIn } = useAuth();
```

**To:** AWS Cognito
```typescript
import { useAuth } from '../lib/AuthContext';
const { user, signIn } = useAuth();
```

### 2. API Client Replacement
**From:** Supabase Client
```typescript
import { supabase } from '../lib/supabase';
const { data } = await supabase.from('table').select();
```

**To:** Our API Client
```typescript
import { api } from '../lib/api';
const data = await api.organisations.list();
```

### 3. Protected Route
**From:** Uses Supabase session
**To:** Use our AuthContext

---

## 🎯 Expected Changes

### Minimal Changes:
- Auth imports (find & replace)
- API calls (update to our endpoints)
- Some type definitions

### No Changes:
- UI components
- Styling
- Layout
- Content (EN/ZH)
- Routing structure

---

## ⏱️ Estimated Time

- Backup: 5 minutes
- Copy files: 10 minutes
- Update auth: 20 minutes
- Update APIs: 30 minutes
- Fix imports: 15 minutes
- Testing: 30 minutes
- Deploy: 10 minutes

**Total: ~2 hours**

---

## 🚀 Starting Migration Now

All systems ready. Proceeding with migration...
