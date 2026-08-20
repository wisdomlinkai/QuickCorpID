# Compliance Calendar Specification

**Feature:** Compliance Calendar & Deadline Tracking
**Priority:** P0 (High)
**Version:** 1.0
**Last Updated:** August 7, 2026
**Target:** Phase 2 - Week 5-6

---

## 1. Overview

### 1.1 Purpose

Automate statutory compliance tracking for Hong Kong businesses, ensuring they never miss critical deadlines for annual returns, business registration, tax filings, and licenses.

### 1.2 Value Proposition

- **Never Miss a Deadline:** Automated reminders for all statutory requirements
- **Reduce Penalties:** Avoid late filing fees and legal issues
- **Save Time:** Auto-populate deadlines based on company information
- **Stay Organized:** Visual calendar view with all compliance items
- **Peace of Mind:** Know your compliance status at a glance

### 1.3 Target Users

- SME owners managing their own compliance
- Company secretaries tracking multiple clients
- Finance teams handling tax filings
- Business managers overseeing licenses

---

## 2. Compliance Items

### 2.1 Statutory Deadlines (Hong Kong)

#### Annual Return (NAR1)

**Frequency:** Annual
**Deadline:** Within 42 days after company's anniversary of incorporation
**Penalty:** 
- Late filing: $870 - $3,480 depending on delay
- Risk of company strike-off

**Data Needed:**
- Company incorporation date
- Company registration number
- Last filing date

**Reminder Schedule:**
- 90 days before
- 60 days before
- 30 days before
- 14 days before
- 7 days before
- On due date
- 7 days overdue (if not completed)

---

#### Business Registration Certificate (BRC) Renewal

**Frequency:** Annual or 3-year (based on BR certificate)
**Deadline:** 1 month before expiry
**Penalty:**
- Late fee: $300
- Potential legal issues

**Data Needed:**
- BR number
- Issue date
- Expiry date

**Reminder Schedule:**
- 90 days before expiry
- 60 days before expiry
- 30 days before expiry
- 14 days before expiry
- 7 days before expiry

---

#### Profits Tax Return

**Frequency:** Annual
**Deadline:**
- New companies: 3 months from issue date
- Others: Depends on accounting year-end (usually April-November)
**Penalty:**
- Late filing penalty: $1,000 - $10,000
- Estimated assessment
- Potential prosecution

**Data Needed:**
- Accounting year-end date
- Last filing date
- IRD file number

**Reminder Schedule:**
- 90 days before deadline
- 60 days before
- 30 days before
- 14 days before
- 7 days before
- On due date

---

#### Employer's Return (IR56B)

**Frequency:** Annual
**Deadline:** By May 1 each year
**Penalty:** Late filing penalty, prosecution

**Data Needed:**
- Number of employees
- Last filing date

**Reminder Schedule:**
- March 1 (2 months before)
- April 1 (1 month before)
- April 15 (2 weeks before)
- April 25 (1 week before)

---

#### Licenses & Permits (Variable)

**Common Types:**
- Restaurant license
- Liquor license
- Money service operator license
- Travel agent license
- Employment agency license

**Deadline:** Per license type
**Data Needed:**
- License type
- Issue date
- Expiry date
- Issuing authority

---

## 3. Functional Requirements

### 3.1 Core Features

#### 3.1.1 Create Compliance Item

**Actors:** Organisation admin

**Preconditions:**
- User is authenticated
- Organisation exists

**Main Flow:**
1. User navigates to Compliance Calendar
2. User clicks "Add Compliance Item"
3. System displays compliance item form
4. User selects type:
   - Annual Return (NAR1)
   - Business Registration
   - Profits Tax
   - Employer's Return
   - Custom License/Permit
5. System auto-fills based on type:
   - For NAR1: calculates deadline from incorporation date
   - For BR: prompts for expiry date
   - For Tax: prompts for year-end date
6. User enters required details
7. User sets reminder preferences:
   - Use default reminders
   - Custom reminder schedule
   - Reminder method (email, in-app, SMS)
8. User adds notes (optional)
9. User saves compliance item
10. System creates calendar entries
11. System schedules reminders

**Postconditions:**
- Compliance item created
- Calendar entries generated
- Reminders scheduled

---

#### 3.1.2 View Compliance Calendar

**Actors:** All authenticated users

**Views:**

**Calendar View:**
- Month view with compliance items marked
- Week view with deadlines
- Day view with detailed list
- Color coding by type and status
- Filter by type/status

**List View:**
- Sortable table of all items
- Columns: Type, Name, Due Date, Status, Actions
- Filter by date range, type, status
- Export to CSV/PDF

**Status Indicators:**
- 🟢 Completed (green)
- 🟡 Upcoming (yellow) - due in > 14 days
- 🟠 Due Soon (orange) - due in ≤ 14 days
- 🔴 Overdue (red)
- ⚪ Cancelled/Not Applicable (gray)

---

#### 3.1.3 Track Compliance Status

**Actors:** All authenticated users

**Main Flow:**
1. User views compliance item
2. System displays:
   - Item details
   - Status timeline
   - Associated documents
   - Notes history
   - Reminder history
3. User can update status:
   - Mark as completed
   - Mark as in progress
   - Mark as not applicable
   - Add completion details
   - Upload proof of completion
4. System records:
   - Status change timestamp
   - User who made change
   - Documents uploaded
   - Notes added

---

#### 3.1.4 Automated Reminders

**Reminder Types:**

**Email Reminders:**
- Subject line with item type and due date
- Summary of compliance item
- Direct link to item
- Quick action buttons (Mark Complete, Snooze)

**In-App Notifications:**
- Notification center
- Badge count on menu
- Pop-up for urgent items

**SMS Reminders (Premium):**
- Short text message
- Item type and due date
- Link to app

**Reminder Preferences:**
- Global settings per organisation
- Per-item override
- Quiet hours
- Vacation mode

---

#### 3.1.5 Generate Compliance Reports

**Report Types:**

**Compliance Status Report:**
- All items with current status
- Upcoming deadlines (30/60/90 days)
- Overdue items
- Completion rate
- Export: PDF, Excel

**Compliance History:**
- Items completed in date range
- Items missed
- Items upcoming
- Export: PDF, Excel

**Compliance Calendar:**
- Monthly calendar view
- All items for selected month
- Print-friendly format

---

#### 3.1.6 Compliance Templates

**Pre-built Templates:**

**Limited Company (Annual):**
- Annual Return (NAR1) - anniversary date
- Business Registration - 1-month before expiry
- Profits Tax Return - per year-end
- Employer's Return - April 30

**Sole Proprietorship (Annual):**
- Business Registration - 1-month before expiry
- Profits Tax Return - per year-end
- MPF Contributions - monthly

**Partnership (Annual):**
- Business Registration - 1-month before expiry
- Partnership Tax Return - per year-end
- Profits Tax Return - per year-end

**Restaurant:**
- All Limited Company items
- Restaurant License renewal
- Liquor License renewal (if applicable)
- Fire Safety Certificate

**Employment Agency:**
- All Limited Company items
- Employment Agency License renewal

**User can:**
- Apply template to organisation
- Customize template
- Save as custom template
- Share template (Business tier)

---

### 3.2 Data Model

```typescript
interface ComplianceItem {
  id: string;
  org_id: string;
  type: ComplianceType;
  name: string;
  description?: string;
  
  // Dates
  due_date: Date;
  issue_date?: Date;
  expiry_date?: Date;
  period_start?: Date;
  period_end?: Date;
  
  // Status
  status: ComplianceStatus;
  completed_at?: Date;
  completed_by?: string;
  completion_notes?: string;
  completion_documents?: string[]; // Document IDs
  
  // Configuration
  is_recurring: boolean;
  recurrence_pattern?: RecurrencePattern;
  next_occurrence_id?: string; // Link to next occurrence
  
  // Reminders
  reminder_schedule: ReminderSchedule[];
  reminders_enabled: boolean;
  last_reminder_sent_at?: Date;
  
  // Metadata
  reference_number?: string; // e.g., IRD file number, BR number
  issuing_authority?: string;
  penalty_amount?: number;
  notes?: string;
  
  // Audit
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
}

interface ComplianceItemHistory {
  id: string;
  compliance_item_id: string;
  action: string;
  old_status?: ComplianceStatus;
  new_status?: ComplianceStatus;
  notes?: string;
  documents?: string[];
  changed_by: string;
  changed_at: Date;
}

interface ReminderSchedule {
  days_before: number; // Days before due date
  type: 'email' | 'sms' | 'in_app';
  is_sent: boolean;
  sent_at?: Date;
}

interface ComplianceTemplate {
  id: string;
  name: string;
  description: string;
  business_type: string;
  items: ComplianceTemplateItem[];
  is_public: boolean;
  created_by?: string;
  org_id?: string;
}

type ComplianceType = 
  | 'annual_return'
  | 'business_registration'
  | 'profits_tax'
  | 'employer_return'
  | 'license'
  | 'permit'
  | 'custom';

type ComplianceStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'overdue'
  | 'cancelled'
  | 'not_applicable';

type RecurrencePattern = 
  | 'annual'
  | 'biennial'
  | 'quarterly'
  | 'monthly'
  | 'custom';
```

---

### 3.3 Database Schema

```sql
-- Compliance Items
CREATE TABLE compliance_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Dates
  due_date DATE NOT NULL,
  issue_date DATE,
  expiry_date DATE,
  period_start DATE,
  period_end DATE,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES users(id),
  completion_notes TEXT,
  
  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern VARCHAR(20),
  next_occurrence_id UUID REFERENCES compliance_items(id),
  
  -- Reminders
  reminder_schedule JSONB,
  reminders_enabled BOOLEAN DEFAULT true,
  last_reminder_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  reference_number VARCHAR(255),
  issuing_authority VARCHAR(255),
  penalty_amount DECIMAL(10, 2),
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES users(id),
  
  INDEX idx_compliance_org (org_id),
  INDEX idx_compliance_due_date (due_date),
  INDEX idx_compliance_status (status),
  INDEX idx_compliance_type (type)
);

-- Compliance Item History
CREATE TABLE compliance_item_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compliance_item_id UUID REFERENCES compliance_items(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  old_status VARCHAR(20),
  new_status VARCHAR(20),
  notes TEXT,
  documents TEXT[],
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_history_item (compliance_item_id),
  INDEX idx_history_changed_at (changed_at)
);

-- Compliance Templates
CREATE TABLE compliance_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  business_type VARCHAR(50),
  items JSONB NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  org_id UUID REFERENCES organisations(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Completion Documents (junction table)
CREATE TABLE compliance_completion_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compliance_item_id UUID REFERENCES compliance_items(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  uploaded_by UUID REFERENCES users(id),
  
  UNIQUE (compliance_item_id, document_id)
);
```

---

## 4. API Specifications

### 4.1 REST Endpoints

#### List Compliance Items

```http
GET /organisations/{orgId}/compliance-items
Authorization: Bearer {token}
Query Parameters:
  - startDate: 2026-01-01
  - endDate: 2026-12-31
  - type: annual_return,profits_tax
  - status: pending,in_progress

Response 200:
{
  "items": [
    {
      "id": "ci-abc123",
      "type": "annual_return",
      "name": "Annual Return (NAR1)",
      "dueDate": "2026-08-15",
      "status": "pending",
      "isRecurring": true,
      "daysUntilDue": 8,
      "penaltyAmount": 870.00
    }
  ],
  "summary": {
    "total": 12,
    "pending": 4,
    "completed": 6,
    "overdue": 2
  }
}
```

#### Create Compliance Item

```http
POST /organisations/{orgId}/compliance-items
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "annual_return",
  "name": "Annual Return (NAR1)",
  "dueDate": "2026-08-15",
  "isRecurring": true,
  "recurrencePattern": "annual",
  "reminderSchedule": [
    {"daysBefore": 30, "type": "email"},
    {"daysBefore": 14, "type": "email"},
    {"daysBefore": 7, "type": "email"},
    {"daysBefore": 1, "type": "in_app"}
  ],
  "referenceNumber": "CR12345678",
  "notes": "Company incorporation anniversary"
}

Response 201:
{
  "id": "ci-abc123",
  "type": "annual_return",
  "name": "Annual Return (NAR1)",
  "dueDate": "2026-08-15",
  "status": "pending",
  "reminderSchedule": [...],
  "createdAt": "2026-08-07T12:00:00Z"
}
```

#### Update Compliance Item Status

```http
PATCH /organisations/{orgId}/compliance-items/{itemId}/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "completed",
  "completionNotes": "Filed electronically via e-Registry",
  "completionDocuments": ["doc-123", "doc-456"]
}

Response 200:
{
  "id": "ci-abc123",
  "status": "completed",
  "completedAt": "2026-08-10T09:30:00Z",
  "completedBy": "user-123"
}
```

#### Get Compliance Calendar

```http
GET /organisations/{orgId}/compliance-calendar
Authorization: Bearer {token}
Query Parameters:
  - year: 2026
  - month: 8

Response 200:
{
  "year": 2026,
  "month": 8,
  "items": [
    {
      "id": "ci-abc123",
      "type": "annual_return",
      "name": "Annual Return",
      "dueDate": "2026-08-15",
      "status": "pending"
    },
    {
      "id": "ci-def456",
      "type": "profits_tax",
      "name": "Profits Tax Return",
      "dueDate": "2026-08-31",
      "status": "in_progress"
    }
  ]
}
```

#### Apply Compliance Template

```http
POST /organisations/{orgId}/compliance-templates/{templateId}/apply
Authorization: Bearer {token}
Content-Type: application/json

{
  "customizations": {
    "incorporationDate": "2020-08-15",
    "brExpiryDate": "2026-09-30",
    "accountingYearEnd": "2026-03-31"
  }
}

Response 201:
{
  "appliedItems": [
    {
      "id": "ci-abc123",
      "type": "annual_return",
      "dueDate": "2026-08-15"
    },
    {
      "id": "ci-def456",
      "type": "business_registration",
      "dueDate": "2026-08-30"
    }
  ],
  "totalCount": 4
}
```

#### Get Compliance Report

```http
GET /organisations/{orgId}/compliance-report
Authorization: Bearer {token}
Query Parameters:
  - reportType: status|history|calendar
  - startDate: 2026-01-01
  - endDate: 2026-12-31
  - format: json|pdf|excel

Response 200 (JSON):
{
  "reportType": "status",
  "generatedAt": "2026-08-07T12:00:00Z",
  "period": {
    "startDate": "2026-01-01",
    "endDate": "2026-12-31"
  },
  "summary": {
    "totalItems": 12,
    "completed": 6,
    "pending": 4,
    "overdue": 2,
    "completionRate": 50.0
  },
  "items": [...]
}

Response 200 (PDF):
Binary PDF file download
```

---

## 5. Frontend Components

### 5.1 Component Structure

```
src/components/compliance/
├── ComplianceCalendar.tsx
├── CalendarMonthView.tsx
├── CalendarWeekView.tsx
├── ComplianceList.tsx
├── ComplianceItemCard.tsx
├── ComplianceItemForm.tsx
├── ComplianceStatusBadge.tsx
├── ComplianceTimeline.tsx
├── ReminderSettings.tsx
├── ComplianceReportGenerator.tsx
└── TemplateSelector.tsx

src/pages/
└── CompliancePage.tsx
```

### 5.2 Key Components

#### ComplianceCalendar.tsx

```typescript
interface Props {
  orgId: string;
  view: 'month' | 'week' | 'list';
  onDateSelect: (date: Date) => void;
  onItemSelect: (item: ComplianceItem) => void;
}

// Features:
// - Switch between month/week/list views
// - Navigate to previous/next periods
// - Color-coded items by type/status
// - Click to view item details
// - Today button
// - Filter by type/status
```

#### ComplianceItemForm.tsx

```typescript
interface Props {
  orgId: string;
  item?: ComplianceItem; // For editing
  onSave: (item: ComplianceItem) => void;
  onCancel: () => void;
}

// Features:
// - Multi-step form
// - Auto-calculate deadline based on type
// - Set recurrence
// - Configure reminders
// - Upload supporting documents
// - Preview before saving
```

#### ComplianceStatusBadge.tsx

```typescript
interface Props {
  status: ComplianceStatus;
  dueDate?: Date;
}

// Color coding:
// pending (yellow), in_progress (blue), completed (green)
// overdue (red), cancelled (gray), not_applicable (gray)
```

---

## 6. Business Logic

### 6.1 Deadline Calculation

```typescript
function calculateDeadline(
  type: ComplianceType,
  referenceData: {
    incorporationDate?: Date;
    brExpiryDate?: Date;
    accountingYearEnd?: Date;
    issueDate?: Date;
  }
): Date {
  switch (type) {
    case 'annual_return':
      // Anniversary of incorporation
      const incorporationAnniversary = new Date(referenceData.incorporationDate);
      incorporationAnniversary.setFullYear(incorporationAnniversary.getFullYear() + 1);
      // Deadline is 42 days after anniversary
      return addDays(incorporationAnniversary, 42);
      
    case 'business_registration':
      // 1 month before expiry
      return subtractMonths(referenceData.brExpiryDate, 1);
      
    case 'profits_tax':
      // Based on accounting year-end
      // Usually April-November depending on year-end
      return calculateTaxDeadline(referenceData.accountingYearEnd);
      
    case 'employer_return':
      // Always April 30
      return new Date(new Date().getFullYear(), 3, 30); // April 30
      
    default:
      throw new Error('Unknown compliance type');
  }
}
```

### 6.2 Reminder Scheduler

```typescript
interface ReminderJob {
  complianceItemId: string;
  orgId: string;
  userId: string;
  reminderType: 'email' | 'sms' | 'in_app';
  scheduledAt: Date;
  message: string;
}

async function scheduleReminders(item: ComplianceItem): Promise<void> {
  for (const reminder of item.reminder_schedule) {
    const scheduledAt = subtractDays(item.due_date, reminder.days_before);
    
    // Skip if in the past
    if (scheduledAt < new Date()) continue;
    
    // Create reminder job
    await createReminderJob({
      complianceItemId: item.id,
      orgId: item.org_id,
      reminderType: reminder.type,
      scheduledAt,
      message: generateReminderMessage(item, reminder.days_before)
    });
  }
}

function generateReminderMessage(
  item: ComplianceItem,
  daysBefore: number
): string {
  const urgency = daysBefore <= 7 ? 'URGENT: ' : '';
  const timing = daysBefore === 0 ? 'TODAY' : 
                 daysBefore === 1 ? 'tomorrow' :
                 `in ${daysBefore} days`;
  
  return `${urgency}Compliance item "${item.name}" is due ${timing} (${formatDate(item.due_date)}). ` +
         `Type: ${item.type}. ` +
         `Log in to QuickCorpID to take action.`;
}
```

### 6.3 Recurring Items

```typescript
async function createNextOccurrence(
  item: ComplianceItem
): Promise<ComplianceItem> {
  if (!item.is_recurring) {
    throw new Error('Item is not recurring');
  }
  
  const nextDueDate = calculateNextDueDate(
    item.due_date,
    item.recurrence_pattern
  );
  
  const nextItem = {
    ...item,
    id: generateUUID(),
    due_date: nextDueDate,
    status: 'pending',
    completed_at: null,
    completed_by: null,
    created_at: new Date(),
    updated_at: new Date()
  };
  
  // Link to previous occurrence
  item.next_occurrence_id = nextItem.id;
  
  return await createComplianceItem(nextItem);
}

function calculateNextDueDate(
  currentDueDate: Date,
  pattern: RecurrencePattern
): Date {
  const next = new Date(currentDueDate);
  
  switch (pattern) {
    case 'annual':
      next.setFullYear(next.getFullYear() + 1);
      break;
    case 'biennial':
      next.setFullYear(next.getFullYear() + 2);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
  }
  
  return next;
}
```

---

## 7. Integration Points

### 7.1 Email Service (AWS SES)

```typescript
interface EmailService {
  sendReminder(
    to: string[],
    subject: string,
    body: string,
    options?: {
      templateId?: string;
      templateData?: object;
    }
  ): Promise<void>;
}

// Email templates
const templates = {
  compliance_reminder: {
    subject: '{{urgency}}Compliance Reminder: {{itemName}}',
    body: `
      Dear {{userName}},
      
      This is a reminder that your compliance item "{{itemName}}" 
      is due {{timing}} on {{dueDate}}.
      
      Type: {{itemType}}
      {{#if penaltyAmount}}
      Late Penalty: HK${{penaltyAmount}}
      {{/if}}
      
      Please log in to QuickCorpID to take action:
      {{actionUrl}}
      
      Best regards,
      QuickCorpID Team
    `
  }
};
```

### 7.2 Notification Service

```typescript
interface NotificationService {
  sendInAppNotification(
    userId: string,
    title: string,
    message: string,
    data?: object
  ): Promise<void>;
  
  sendSMS(
    phoneNumber: string,
    message: string
  ): Promise<void>; // Premium feature
}
```

### 7.3 Document Service Integration

```typescript
// Link compliance items to documents
interface ComplianceDocumentLink {
  complianceItemId: string;
  documentId: string;
  type: 'completion_proof' | 'reference' | 'supporting';
}

// Example: Upload proof of annual return filing
async function uploadCompletionProof(
  itemId: string,
  file: File
): Promise<Document> {
  // 1. Upload document to S3
  const document = await documentApi.upload(file, {
    type: 'compliance_proof',
    complianceItemId: itemId
  });
  
  // 2. Link to compliance item
  await linkDocumentToComplianceItem(itemId, document.id);
  
  // 3. Update compliance item status
  await updateComplianceItemStatus(itemId, {
    status: 'completed',
    completionDocuments: [document.id]
  });
  
  return document;
}
```

---

## 8. Testing Requirements

### 8.1 Unit Tests

- Deadline calculation logic
- Recurrence pattern generation
- Reminder scheduling
- Status transitions
- Template application

### 8.2 Integration Tests

- Create compliance item with reminders
- Update status with documents
- Apply template
- Generate report
- Email delivery

### 8.3 E2E Tests

- Complete compliance workflow
- Calendar navigation
- Reminder delivery
- Report generation

---

## 9. Implementation Plan

### Week 1: Backend

**Day 1-2: Database & Core API**
- Database schema
- Basic CRUD endpoints
- Business logic

**Day 3: Calendar & Reporting**
- Calendar endpoints
- Report generation
- Export functionality

**Day 4-5: Reminders & Templates**
- Reminder scheduler
- Email integration
- Template system
- Testing

### Week 2: Frontend

**Day 1-2: Calendar UI**
- Calendar component
- Month/week views
- Item display

**Day 3-4: Forms & Actions**
- Create/edit forms
- Status updates
- Document upload

**Day 5: Testing & Polish**
- E2E tests
- UX improvements
- Documentation

---

## 10. Success Criteria

- ✅ User can create compliance items with auto-calculated deadlines
- ✅ Calendar displays all items with proper color coding
- ✅ Reminders sent on schedule
- ✅ User can track completion status
- ✅ Reports can be generated and exported
- ✅ Templates can be applied and customized
- ✅ Recurring items create next occurrence automatically
- ✅ Mobile-responsive UI

---

**Status:** ⏳ Specification Complete, Ready for Implementation
