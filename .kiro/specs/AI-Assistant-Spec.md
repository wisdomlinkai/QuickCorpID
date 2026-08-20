# AI Assistant Specification

**Feature:** AI-Powered Business Assistant
**Priority:** P1 (Medium-High)
**Version:** 1.0
**Last Updated:** August 7, 2026
**Target:** Phase 2-3 - Week 7-9

---

## 1. Overview

### 1.1 Purpose

Provide AI-powered assistance to help users understand forms, prioritize deadlines, identify risks, and get bilingual support throughout their QuickCorpID journey.

### 1.2 Value Proposition

- **Instant Answers:** Get explanations without searching through documentation
- **Bilingual Support:** Seamless English and Chinese assistance
- **Risk Awareness:** Proactive identification of potential issues
- **Time Saving:** Quick form filling and deadline management
- **24/7 Availability:** AI assistant always ready to help

### 1.3 Use Cases

1. **Form Explanations** - "What is NAR1?"
2. **Deadline Prioritization** - "Which deadlines are most urgent?"
3. **Risk Flags** - "Are there any issues with my application?"
4. **Document Assistance** - "What documents do I need for CorpID?"
5. **Translation Help** - Convert between English and Chinese business terms

---

## 2. Functional Requirements

### 2.1 Core Features

#### 2.1.1 Chat Interface

**Components:**
- Floating chat button (bottom-right corner)
- Expandable chat window
- Message input with send button
- Message history
- Typing indicator
- Quick action buttons

**Features:**
- Persistent conversation history (per session)
- Copy message content
- Clear conversation
- Minimize/maximize window
- Full-screen mode (optional)

---

#### 2.1.2 Form Explanations

**Trigger:**
- User clicks help icon next to form field
- User asks question in chat
- User hovers over field with tooltip enabled

**Examples:**

```
User: "What is Business Registration Number?"
AI: "Business Registration Number (BR Number) is an 8-digit unique identifier 
assigned to every registered business in Hong Kong by the Inland Revenue 
Department. You can find it on your Business Registration Certificate.

Chinese: 商業登記號碼

Format: 12345678 (8 digits)
Location: Top-right corner of your BR Certificate

[Learn More] [See Example]"
```

```
User: "What's the difference between owner and authorized representative?"
AI: "**Owner/Director:**
- Legal owner of the company
- Has ultimate decision-making authority
- Listed in the company's Articles of Association

**Authorized Representative:**
- Employee or agent authorized by the company
- Can act on behalf of the company
- Requires authorization letter

For CorpID registration, you should select the role that matches your 
actual position in the company.

[View Role Requirements]"
```

---

#### 2.1.3 Deadline Prioritization

**Trigger:**
- User has multiple compliance items
- User asks about deadlines
- Dashboard displays priority items

**AI Analysis:**
```typescript
interface DeadlinePrioritization {
  urgent: ComplianceItem[]; // Due within 7 days
  important: ComplianceItem[]; // Due within 30 days, high penalty
  moderate: ComplianceItem[]; // Due within 60 days
  low: ComplianceItem[]; // Due after 60 days
}

function prioritizeDeadlines(
  items: ComplianceItem[]
): DeadlinePrioritization {
  return {
    urgent: items.filter(i => 
      daysUntilDue(i.due_date) <= 7 && i.status === 'pending'
    ),
    important: items.filter(i => 
      daysUntilDue(i.due_date) <= 30 && 
      daysUntilDue(i.due_date) > 7 &&
      (i.penalty_amount > 1000 || i.type === 'annual_return')
    ),
    moderate: items.filter(i =>
      daysUntilDue(i.due_date) <= 60 &&
      daysUntilDue(i.due_date) > 30
    ),
    low: items.filter(i =>
      daysUntilDue(i.due_date) > 60
    )
  };
}
```

**Response Example:**

```
User: "What should I focus on this week?"
AI: "**🚨 URGENT - Action Required This Week:**

1. **Annual Return (NAR1)** - Due Aug 15 (8 days)
   ⚠️ Late penalty: HK$870-3,480
   [Mark Complete] [View Details]

2. **Business Registration Renewal** - Due Aug 20 (13 days)
   Penalty: HK$300
   [Start Renewal]

**📋 Coming Up This Month:**

3. Profits Tax Return - Due Aug 31
4. Restaurant License Renewal - Due Sep 15

Would you like me to help you with the Annual Return filing?"
```

---

#### 2.1.4 Risk Flags & Warnings

**Detection:**
- Missing required information
- Inconsistent data
- Approaching deadlines
- Regulatory changes
- Document issues

**Risk Categories:**

**High Risk (Red):**
- Overdue compliance items
- Missing critical documents
- Invalid data formats
- Expired licenses

**Medium Risk (Yellow):**
- Incomplete profile
- Upcoming deadlines (14-30 days)
- Unusual patterns (e.g., frequent address changes)

**Low Risk (Blue):**
- Suggestions for improvement
- Optimization opportunities
- Best practice recommendations

**Response Example:**

```
AI: "⚠️ **Risk Alert: 2 Issues Detected**

**HIGH RISK:**
1. Annual Return overdue by 5 days
   - Late penalty: HK$1,200
   - Company may face strike-off if not filed
   - [File Now] [Get Help]

**MEDIUM RISK:**
2. Business Registration expires in 25 days
   - Don't forget to renew
   - [Add to Calendar]

Would you like help filing the Annual Return immediately?"
```

---

#### 2.1.5 Document Assistance

**Features:**

**Document Checklist:**
```
User: "What documents do I need for CorpID registration?"
AI: "**Required Documents for CorpID Registration:**

✅ **Identity Document:**
   - HKID Card (both sides), or
   - Passport (photo page)

✅ **Business Registration Certificate:**
   - Valid and current
   - Clear copy showing BR Number

✅ **Proof of Address:**
   - Utility bill (last 3 months), or
   - Bank statement (last 3 months)

**Optional:**
- Company chop (if applicable)
- Authorization letter (if you're an authorized representative)

[Start Upload] [View Document Requirements]"
```

**Document Analysis:**
```
User uploads document

AI: "**Document Analysis:**

📄 **File:** business_registration.pdf
✅ **Type:** Business Registration Certificate
✅ **Quality:** Good (readable)
✅ **Extracted Info:**
   - BR Number: 12345678
   - Company Name: ABC Trading Limited
   - Expiry Date: March 15, 2027
   - Status: Valid

⚠️ **Note:** Certificate expires in 7 months. Consider renewal.

[Use This Document] [Re-upload]"
```

---

#### 2.1.6 Bilingual Translation

**Features:**
- Translate business terms
- Switch between EN/ZH
- Context-aware translations
- Glossary of common terms

**Translation Examples:**

```
User: "How do you say 'Annual Return' in Chinese?"
AI: "**Annual Return** translates to:

Chinese: 年度申報表 (nin4 dou6 san1 bou2 biu2)
Also known as: NAR1表格

The Annual Return (NAR1) is a form that must be filed with the Companies 
Registry every year, within 42 days after the company's incorporation date.

Related terms:
- Companies Registry: 公司註冊處
- Incorporation: 成立
- Filing: 提交

[View Full Glossary]"
```

**Auto-Translation:**
```typescript
interface TranslationContext {
  field: string;
  sourceText: string;
  targetLanguage: 'en' | 'zh';
  businessContext: 'registration' | 'compliance' | 'tax' | 'general';
}

function translateBusinessTerm(
  context: TranslationContext
): TranslatedText {
  // Use specialized business terminology database
  // Consider Hong Kong-specific usage
  // Provide context and examples
}
```

---

#### 2.1.7 Smart Suggestions

**Context-Aware Suggestions:**

Based on user's current page and actions:
```
On Registration Page:
"You're on step 2 of 4. Need help with ID verification?"

On Dashboard:
"Your CorpID application is pending. Expected approval: 2-3 days."

On Documents Page:
"Tip: You can upload documents in bulk by dragging multiple files."

On Compliance Page:
"You have 2 deadlines this month. Would you like to see the priority?"
```

**Proactive Assistance:**
```typescript
interface ProactiveSuggestion {
  trigger: 'page_load' | 'inactivity' | 'error' | 'milestone';
  condition: (context: UserContext) => boolean;
  message: string;
  actions: Action[];
}

const suggestions: ProactiveSuggestion[] = [
  {
    trigger: 'page_load',
    condition: (ctx) => ctx.page === 'register' && ctx.step === 1,
    message: "Welcome! I can help you fill out the registration form. What would you like to know?",
    actions: [
      { label: 'Form Guide', action: 'show_guide' },
      { label: 'Requirements', action: 'show_requirements' }
    ]
  },
  {
    trigger: 'inactivity',
    condition: (ctx) => ctx.idleTime > 120000, // 2 minutes
    message: "Looks like you're taking a break. Need any help or have questions?",
    actions: [
      { label: 'Continue', action: 'dismiss' },
      { label: 'Ask Question', action: 'focus_chat' }
    ]
  }
];
```

---

## 3. AI Implementation

### 3.1 Model Selection

**Recommended:** AWS Bedrock - Claude 3 Sonnet

**Why:**
- Strong reasoning and explanation capabilities
- Good at structured outputs
- Multilingual support (EN/ZH)
- Available in Hong Kong region
- Cost-effective for chat use case

**Alternative:** Amazon Bedrock - Titan Text Premier
- Lower cost
- Faster responses
- Good for simple queries

---

### 3.2 Architecture

```
┌─────────────────────────────────────┐
│         Frontend (React)            │
│  Chat UI + Message History          │
└─────────────────────────────────────┘
              │ HTTP/WebSocket
              ▼
┌─────────────────────────────────────┐
│      API Gateway + Lambda           │
│  - Rate limiting                    │
│  - Authentication                   │
│  - Request validation               │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│      AI Service (Lambda)            │
│  - Context building                 │
│  - Prompt engineering               │
│  - Response formatting              │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│      AWS Bedrock                    │
│  Claude 3 Sonnet / Titan            │
└─────────────────────────────────────┘
```

---

### 3.3 Prompt Engineering

**System Prompt:**

```
You are QuickCorpID Assistant, an AI-powered helper for Hong Kong business 
owners using the QuickCorpID platform. Your role is to assist with:

1. **Form Explanations:** Help users understand business registration, 
   CorpID, and compliance forms in simple terms.

2. **Deadline Management:** Prioritize compliance deadlines and provide 
   actionable advice.

3. **Risk Identification:** Alert users to potential issues with their 
   applications or compliance status.

4. **Document Assistance:** Guide users on document requirements and 
   help analyze uploaded documents.

5. **Bilingual Support:** Provide seamless English and Chinese assistance 
   for Hong Kong users.

**Guidelines:**
- Be concise and actionable
- Use bullet points and formatting for clarity
- Provide both English and Chinese terms when relevant
- Include relevant links and action buttons when possible
- If unsure, direct users to official sources or support
- Never provide legal or financial advice - suggest consulting professionals
- Always prioritize user privacy and data security

**Response Format:**
- Use markdown for formatting
- Include action buttons: [Action Name]
- Provide structured data when helpful
- Keep responses under 200 words unless detailed explanation needed

**Context:** You have access to:
- User's organisation information
- Current page and actions
- Compliance calendar data
- Document status
- Recent activity

Always be helpful, accurate, and friendly. Represent QuickCorpID's 
commitment to making business identity simple.
```

**Context Building:**

```typescript
interface AIContext {
  // User context
  userId: string;
  orgId?: string;
  currentRole?: string;
  language: 'en' | 'zh';
  
  // Page context
  currentPage: string;
  currentStep?: number;
  formData?: object;
  
  // Business context
  organisations?: Organisation[];
  complianceItems?: ComplianceItem[];
  documents?: Document[];
  corpIdStatus?: string;
  
  // Conversation context
  conversationHistory?: Message[];
  
  // Timestamps
  timestamp: Date;
}

function buildSystemPrompt(context: AIContext): string {
  return `
${BASE_SYSTEM_PROMPT}

**Current Context:**
- User Language: ${context.language === 'en' ? 'English' : 'Chinese'}
- Current Page: ${context.currentPage}
${context.orgId ? `- Organisation: ${context.organisations?.find(o => o.id === context.orgId)?.name}` : ''}
${context.complianceItems && context.complianceItems.length > 0 ? 
  `- Pending Compliance Items: ${context.complianceItems.length}` : ''}

Tailor your responses to this user's current situation and needs.
`;
}
```

**Example Prompts:**

```typescript
// Form explanation
const explainFieldPrompt = {
  system: buildSystemPrompt(context),
  user: `Explain the form field "${fieldName}" in simple terms. 
         Include: what it is, why it's needed, how to fill it, 
         and common mistakes to avoid. 
         Provide both English and Chinese explanations.`
};

// Deadline prioritization
const prioritizePrompt = {
  system: buildSystemPrompt(context),
  user: `I have ${items.length} compliance items. 
         Prioritize them by urgency and importance.
         Consider: due dates, penalty amounts, and business impact.
         Format as a prioritized list with action items.`
};

// Risk assessment
const riskAssessmentPrompt = {
  system: buildSystemPrompt(context),
  user: `Analyze my current business status for potential risks.
         Check: compliance items, documents, CorpID status.
         Identify any issues that need immediate attention.
         Provide severity level and recommended actions.`
};
```

---

### 3.4 Response Formatting

**Structured Response:**

```typescript
interface AIResponse {
  message: string; // Markdown formatted text
  actions?: AIAction[];
  data?: object;
  followUp?: string[];
  relatedLinks?: RelatedLink[];
}

interface AIAction {
  type: 'button' | 'link' | 'api_call';
  label: string;
  action: string;
  params?: object;
}

// Example response
{
  message: `**Annual Return (NAR1)** is overdue by 5 days.
            
            ⚠️ **Risk:** Late penalty of HK$1,200
            
            **What to do:**
            1. File immediately through e-Registry
            2. Pay the penalty fee
            3. Keep receipt for records`,
  actions: [
    {
      type: 'link',
      label: 'File Now',
      action: '/register?step=4'
    },
    {
      type: 'button',
      label: 'Get Help',
      action: 'contact_support'
    }
  ],
  followUp: [
    "What's the filing fee?",
    "How to avoid penalties next time?",
    "Need help with e-Registry?"
  ]
}
```

---

## 4. Cost Control

### 4.1 Token Limits

```typescript
const TOKEN_LIMITS = {
  max_input_tokens: 2000,   // Context + question
  max_output_tokens: 500,   // Response
  max_conversation_history: 10, // Last 10 messages
  
  // Cost estimation (Claude 3 Sonnet)
  // Input: $0.003 per 1K tokens
  // Output: $0.015 per 1K tokens
  // Average conversation: ~$0.02
};
```

### 4.2 Caching

```typescript
// Cache common questions
const FAQ_CACHE = new Map<string, AIResponse>();

// Cache key based on question embedding
function getCachedResponse(question: string): AIResponse | null {
  const key = generateQuestionKey(question);
  return FAQ_CACHE.get(key);
}

// Pre-populate cache with common questions
const COMMON_QUESTIONS = [
  "What is CorpID?",
  "How to register for CorpID?",
  "What is Business Registration Number?",
  "What documents do I need?",
  // ... 50+ common questions
];
```

### 4.3 Usage Limits

```typescript
interface UsageLimits {
  free: {
    messages_per_day: 10;
    max_tokens_per_message: 500;
  };
  professional: {
    messages_per_day: 50;
    max_tokens_per_message: 1000;
  };
  business: {
    messages_per_day: 200;
    max_tokens_per_message: 2000;
  };
}

async function checkUsageLimit(
  userId: string,
  tier: string
): Promise<boolean> {
  const today = new Date().toDateString();
  const usage = await getDailyUsage(userId, today);
  const limit = USAGE_LIMITS[tier];
  
  return usage.messageCount < limit.messages_per_day;
}
```

---

## 5. API Specifications

### 5.1 Chat Endpoint

```http
POST /ai/chat
Authorization: Bearer {token}
Content-Type: application/json

{
  "message": "What documents do I need for CorpID registration?",
  "context": {
    "page": "register",
    "step": 2,
    "orgId": "org-123"
  },
  "conversationId": "conv-abc123" // Optional, for continuing conversation
}

Response 200:
{
  "conversationId": "conv-abc123",
  "message": {
    "id": "msg-456",
    "role": "assistant",
    "content": "**Required Documents for CorpID Registration:**\n\n✅ **Identity Document:**\n   - HKID Card (both sides), or\n   - Passport (photo page)\n\n✅ **Business Registration Certificate:**\n   - Valid and current\n   - Clear copy showing BR Number\n\n[View Document Requirements] [Start Upload]",
    "actions": [
      {
        "type": "link",
        "label": "View Document Requirements",
        "action": "/help/documents"
      },
      {
        "type": "link",
        "label": "Start Upload",
        "action": "/register?step=2&action=upload"
      }
    ],
    "timestamp": "2026-08-07T12:00:00Z"
  },
  "usage": {
    "inputTokens": 150,
    "outputTokens": 200,
    "totalTokens": 350
  }
}
```

### 5.2 Contextual Help Endpoint

```http
GET /ai/help/{field}
Authorization: Bearer {token}
Query Parameters:
  - page: register
  - step: 2
  - lang: en|zh

Response 200:
{
  "field": "br_number",
  "explanation": {
    "title": "Business Registration Number",
    "titleZh": "商業登記號碼",
    "description": "An 8-digit unique identifier assigned to every registered business...",
    "format": "12345678",
    "location": "Top-right corner of your BR Certificate",
    "commonMistakes": [
      "Using CR number instead of BR number",
      "Entering 7 digits instead of 8"
    ],
    "helpLink": "/help/br-number-guide"
  }
}
```

---

## 6. Frontend Components

### 6.1 Chat Component

```typescript
// src/components/ai/ChatWidget.tsx
interface ChatWidgetProps {
  position?: 'bottom-right' | 'bottom-left';
  initiallyOpen?: boolean;
  context?: AIContext;
}

// Features:
// - Floating button with unread badge
// - Expandable chat window
// - Message input with auto-resize
// - Markdown rendering
// - Action buttons
// - Typing indicator
// - Minimize/maximize
// - Clear conversation
```

### 6.2 Contextual Help Component

```typescript
// src/components/ai/ContextualHelp.tsx
interface ContextualHelpProps {
  field: string;
  page: string;
  position?: 'tooltip' | 'modal' | 'inline';
}

// Features:
// - Help icon next to form fields
// - Tooltip on hover
// - Detailed modal on click
// - Bilingual explanations
// - Example images
```

---

## 7. Testing Requirements

### 7.1 Unit Tests

- Response formatting
- Context building
- Token counting
- Caching logic
- Usage tracking

### 7.2 Integration Tests

- Bedrock API integration
- Chat endpoint
- Contextual help endpoint
- Rate limiting
- Error handling

### 7.3 E2E Tests

- Complete chat conversation
- Multi-turn dialogue
- Action button clicks
- Language switching
- Context preservation

### 7.4 Quality Assurance

- Response accuracy (manual review)
- Bilingual quality
- Tone and style consistency
- Safety and appropriateness

---

## 8. Implementation Plan

### Week 1: Backend & AI Integration

**Day 1-2: Infrastructure**
- Set up Bedrock access
- Create AI service Lambda
- Implement context building
- Basic prompt engineering

**Day 3-4: Core Features**
- Chat endpoint
- Contextual help endpoint
- Response formatting
- Caching layer

**Day 5: Testing & Polish**
- Unit tests
- Integration tests
- Prompt tuning
- Performance optimization

### Week 2: Frontend & Features

**Day 1-2: Chat UI**
- ChatWidget component
- Message rendering
- Action buttons
- Styling

**Day 3-4: Advanced Features**
- Contextual help
- Smart suggestions
- Bilingual support
- Error handling

**Day 5: Testing & Launch**
- E2E tests
- QA testing
- Documentation
- Monitoring setup

---

## 9. Success Criteria

- ✅ Chat widget responsive and helpful
- ✅ Accurate form explanations in both languages
- ✅ Deadline prioritization working correctly
- ✅ Risk flags identify real issues
- ✅ Response time < 3 seconds
- ✅ Cost under budget (< $0.05 per conversation)
- ✅ User satisfaction > 80%
- ✅ 24/7 availability

---

**Status:** ⏳ Specification Complete, Ready for Implementation
