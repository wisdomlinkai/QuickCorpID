# 📋 COPY THIS PROMPT TO BOLT.NEW

---

## Complete Prompt (Copy everything below)

```
I need you to redesign the frontend for a Hong Kong business identity SaaS platform called "iBiz Smart 智企通".

**Current State:**
Working React + TypeScript + Vite + Tailwind CSS app. Need modern minimalist redesign. Generate HTML + Tailwind CSS that I can convert to React components.

**Project Details:**
- Name: iBiz Smart (English) / 智企通 (Chinese)
- Purpose: Hong Kong business digital identity & CorpID registration
- Target: SMEs, self-employed, F&B outlets, transport operators
- Year: 2026

**Design Requirements:**
- Style: Modern minimalist - clean, lots of white space, subtle animations, professional
- Colors: Primary blue (#2563eb), Secondary teal (#14b8a6), gradients blue-to-teal
- Typography: Clean sans-serif, excellent hierarchy
- Layout: Generous padding, card-based sections, clear CTAs
- Mobile: Fully responsive, mobile-first
- Interactions: Subtle hover effects, smooth 300ms transitions

**Design Inspiration:**
- Stripe.com (clean gradients, professional)
- Vercel.com (minimal, modern typography)
- Linear.app (subtle animations, great spacing)

**Pages to Generate (10 pages):**

---

### 1. Home Page (/)

**Hero Section:**
- Title (EN): "Register CorpID in 5 Minutes"
- Title (ZH): "輕鬆註冊 CorpID，5 分鐘搞定"
- Subtitle (EN): "The easiest way for Hong Kong SMEs to get their Digital Corporate Identity"
- Subtitle (ZH): "香港中小企業取得數碼企業身份的最簡單方法"
- Primary CTA button: "Free Registration" / "免費註冊" (gradient blue background, white text)
- Secondary CTA: "Learn More" / "了解更多" (white background, border)
- Trust badges row: "Sandbox Tested" / "沙盒測試" | "256-bit SSL" | "Digital Policy Office" / "數碼政策辦公室"

**Benefits Section:**
- Title: "Why iBiz Smart?" / "為何選擇智企通？"
- 4 cards in grid layout:
  1. **Quick & Easy** / 快速簡易 - Icon: Zap ⚡ - "Complete your registration in just 5 minutes" / "只需5分鐘完成註冊"
  2. **Government Approved** / 政府認可 - Icon: Shield 🛡️ - "Integrated with CorpID Sandbox" / "與 CorpID 沙盒整合"
  3. **Secure & Trusted** / 安全可靠 - Icon: Lock 🔒 - "Bank-level security with encryption" / "銀行級加密技術"
  4. **Bilingual Support** / 雙語支援 - Icon: Globe 🌐 - "Full English and Chinese interface" / "完整中英文界面"

**Target Users Section:**
- Title: "Perfect For" / "適合對象"
- 4 cards in grid layout:
  1. **SMEs** / 中小企業 - Icon: Building2 - "Small and medium enterprises" / "小型及中型企業"
  2. **Self-Employed** / 自僱人士 - Icon: User - "Freelancers and sole proprietors" / "自由職業者"
  3. **F&B Outlets** / 餐飲業 - Icon: UtensilsCrossed - "Restaurants and food businesses" / "餐廳及食品業務"
  4. **Taxi Operators** / 的士營運商 - Icon: Car - "Transport service providers" / "運輸服務提供者"

**Bottom CTA:**
- Same as hero but simpler layout

---

### 2. Login Page (/login)

**Centered form on clean background:**
- Title: "Login" / "登入"
- Email input field with label
- Password input field with label
- "Sign In" / "登入" button (gradient blue, full width)
- "Forgot Password?" / "忘記密碼？" link
- Divider line with "or"
- "Login with iAM Smart" / "使用智方便登入" button (optional)
- Footer text: "Don't have an account?" "Register" / "沒有帳戶？註冊"

---

### 3. Register Page (/register)

**Multi-step form with progress indicator:**

**Step 1: Business Information**
- Title: "Business Information" / "企業資料"
- Fields: BR Number (8 digits), Company Name (EN), Company Name (ZH), Business Type dropdown, Email, Phone
- Navigation: "Back" / "上一步" | "Next" / "下一步"

**Step 2: Identity Verification**
- Title: "Identity Verification" / "身份驗證"
- Fields: ID Type (HKID/Passport), ID Number, Document Upload (drag & drop area)
- Navigation: "Back" | "Next"

**Step 3: Role & Authorization**
- Title: "Role & Authorization" / "角色及授權"
- Role selection (radio cards): Owner/Director, Authorized Employee, Agent
- Checkboxes: Authorization declaration, Terms agreement
- Navigation: "Back" | "Next"

**Step 4: Review & Submit**
- Title: "Review & Submit" / "審核及提交"
- Summary cards showing all entered information
- "Submit Registration" / "提交註冊" button

---

### 4. Dashboard Page (/dashboard)

**Protected dashboard layout:**
- Welcome message: "Welcome back" / "歡迎"
- Stats row (4 cards):
  - CorpID Status: Active/Pending
  - Documents: Count
  - Organisations: Count
  - Team Members: Count
- Quick Actions section (buttons/cards):
  - "Upload Document" / "上傳文件"
  - "Connect CorpID" / "連接 CorpID"
  - "Invite Team" / "邀請團隊"
- Recent Activity list

---

### 5. Organisations Page (/organisations)

**Organisation management:**
- Title: "Organisations" / "組織"
- Organisation list (cards with name, BR number, role)
- "Create Organisation" / "創建組織" button
- Create modal: Company name, BR number, business type
- Organisation switcher dropdown
- Invite member functionality

---

### 6. CorpID Page (/corpid)

**CorpID connection:**
- Title: "CorpID Connection" / "CorpID 連接"
- Current status card (Connected/Not Connected)
- QR code display area (placeholder)
- "Connect CorpID" / "連接 CorpID" button
- Connection instructions
- Status polling indicator

---

### 7. Documents Page (/documents)

**Document management:**
- Title: "Documents" / "文件"
- Upload area (drag & drop zone with icon)
- "Upload Document" / "上傳文件" button
- Documents table/list:
  - File name
  - Size
  - Upload date
  - Actions (Download, Share, Delete)
- Share modal with link generation

---

### 8. Settings Page (/settings)

**Settings with tabs:**
- Tab navigation: Profile | Organisation | Notifications | Security

**Profile Tab:**
- Name input
- Email input (read-only)
- Phone input
- Language toggle (EN/ZH)
- "Save Changes" / "保存更改" button

**Organisation Tab:**
- Current organisation info
- Leave organisation option

**Notifications Tab:**
- Toggle switches for email notifications, alerts

**Security Tab:**
- Change password form
- Active sessions list

---

### 9. Pricing Page (/pricing)

**Pricing tiers:**
- Title: "Simple Pricing" / "簡單透明的定價"
- 3 cards in grid:

**Free Tier:**
- Name: "Free" / "免費版"
- Price: "$0" / "永久"
- Features list
- CTA: "Get Started" / "免費開始"

**Premium Tier** (highlighted with border/shadow):
- Name: "Premium" / "高級版"
- Badge: "Most Popular" / "最受歡迎"
- Price: "$199" / "/月"
- Features list
- CTA: "Upgrade" / "升級"

**Enterprise Tier:**
- Name: "Enterprise" / "企業版"
- Price: "Custom" / "自訂"
- Features list
- CTA: "Contact Sales" / "聯絡銷售"

---

### 10. About Page (/about)

**About page:**
- Title: "About iBiz Smart 智企通"
- Mission section with text
- "What is CorpID?" section with explanation
- Benefits list
- Contact information: support@ibizsmart.hk

---

**Navigation:**

**Navbar (fixed):**
- Logo: "iBiz Smart" / "智企通"
- Links: Home | Login | Register | Dashboard | Pricing | About
- Language switcher: EN | 中文

**Footer:**
- 4 columns: Product, Support, Legal, Contact
- Copyright: "© 2026 iBiz Smart 智企通"
- Email: support@ibizsmart.hk

---

**Technical Requirements:**
- Use Tailwind CSS utility classes
- Semantic HTML5 (header, nav, main, section, footer)
- Mobile-responsive (sm:640px, md:768px, lg:1024px)
- Accessible (ARIA labels, proper headings)
- No JavaScript (just HTML structure)
- Use placeholder icons (I'll replace with Lucide React)
- Clean, well-commented code

**Output:**
Generate clean HTML + Tailwind CSS for all 10 pages. Each page should be a separate HTML file. Use modern, minimalist design with generous white space, subtle shadows, and smooth color transitions.
```

---

## 📎 Files to Attach

Attach these files from your project:

1. **HomePage.tsx** → `C:\QuickCorpID\src\pages\HomePage.tsx`
2. **Navbar.tsx** → `C:\QuickCorpID\src\components\Navbar.tsx`
3. **translations.ts** → `C:\QuickCorpID\src\i18n\translations.ts`
4. **tailwind.config.js** → `C:\QuickCorpID\tailwind.config.js`

---

## 🚀 Steps

1. Go to https://bolt.new
2. Copy the prompt above (everything in the code block)
3. Paste into bolt.new
4. Upload the 4 files listed above
5. Click "Generate" or "Create"
6. Wait for output
7. Share the generated HTML with me

---

## 💡 Tips

- If bolt.new asks questions, share the answers with me
- If you want to adjust colors/spacing, let me know
- The prompt is detailed so you should get good results
- All content matches your existing translations

---

**Ready to go!** Copy the prompt above and paste into bolt.new 🎨
