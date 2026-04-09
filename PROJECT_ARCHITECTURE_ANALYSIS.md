# Infosec-Report Project Architecture Analysis

## 1. Report Page Structure & Data Display

### Main Report Page: [src/app/report/[id]/page.tsx](src/app/report/[id]/page.tsx)

The report page is a **multi-step form interface** with:
- **8 distinct sections** managed in `FORM_SECTIONS` array:
  1. GeneralInfoForm - Company info, classification, chairman note
  2. ExecutiveSummaryForm - Security score, trends, decisions
  3. RisksForm - Risk management data
  4. KPIForm - Key performance indicators
  5. EfficiencyForm - Operational efficiency metrics
  6. SLAForm - Response time metrics
  7. RecommendationsForm - Recommendations and actions
  8. MaturityForm - Security maturity domains

**Architecture:**
- Uses **Zustand store** (`useReportStore`) for global state management
- **Auto-save mechanism**: Triggers save 2 seconds after changes (debounced)
- **Current step tracking**: Sidebar navigation controls `currentStep` (0-7)
- **Dirty state tracking**: Tracks if data has been modified since last save

### Data Flow:
```
User Input → Form Component → updateField() → Zustand Store (isDirty: true)
→ Auto-save Timer (2s debounce) → updateReport() API call → Database
```

---

## 2. Editing Implementation Patterns

### FormField Component (Reusable Pattern)

Located in [src/components/forms/GeneralInfoForm.tsx](src/components/forms/GeneralInfoForm.tsx):

```typescript
function FormField({
  label,
  value,
  onChange,
  type = 'text',
  hint,
  readOnly,
  min,
  max,
})
```

- **Generic text input** for all simple text fields
- **onChange callback** calls store's `updateField(field, value)`
- **Immediate UI update** (optimistic)
- Supports types: `text`, `date`, `number`, etc.

### FormCard Component

Groups related fields with icon and title:
```typescript
<FormCard icon="🏢" title="معلومات الشركة والتقرير">
  {/* Fields */}
</FormCard>
```

### Update Pattern - All Fields

All editable fields follow this pattern:

```typescript
// For simple fields
<FormField 
  label="اسم الشركة / المنظمة" 
  value={report.orgName} 
  onChange={(v) => updateField('orgName', v)} 
/>

// For select dropdowns
<select
  value={report.classification}
  onChange={(e) => updateField('classification', e.target.value)}
>
  {/* options */}
</select>

// For textareas
<textarea
  value={report.summary}
  onChange={(e) => updateField('summary', e.target.value)}
/>

// For ranges/complex fields
<input
  type="range"
  value={report.securityScore}
  onChange={(e) => updateField('securityScore', parseInt(e.target.value))}
/>
```

### Collection/Item Update Pattern

For collections like Decisions, Risks:

```typescript
// Add new item
<button onClick={addDecision}>+ إضافة قرار</button>

// Update existing item
<FormField 
  value={dec.title} 
  onChange={(v) => updateDecision(i, { title: v })} 
/>

// Remove item
<button onClick={() => removeDecision(i)}>×</button>
```

---

## 3. Prisma Schema Structure

### Report Model

Complete scalar fields in [prisma/schema.prisma](prisma/schema.prisma):

```typescript
model Report {
  // Identity
  id             String   @id @default(uuid())
  
  // Document Metadata
  title          String   @default("تقرير أمن المعلومات")
  orgName        String   @default("شركة المستقبل للتقنية")
  recipientName  String   @default("")
  period         String   @default("")
  issueDate      String   @default("")
  version        String   @default("1.0")
  author         String   @default("إدارة أمن المعلومات")
  classification String   @default("سري")
  logoBase64     String   @default("")
  
  // Executive Summary Content
  summary        String   @default("")
  chairNote      String   @default("")
  
  // Security Metrics
  securityLevel  String   @default("متوسط")
  securityScore  Int      @default(0)
  trend          String   @default("مستقر →")
  status         String   @default("draft")
  
  // KPI Current Period
  kpiCritical    Int @default(0)
  kpiVuln        Int @default(0)
  kpiTotal       Int @default(0)
  kpiCompliance  Int @default(0)
  
  // KPI Previous Period
  prevCritical   Int @default(0)
  prevVuln       Int @default(0)
  prevTotal      Int @default(0)
  prevCompliance Int @default(0)
  
  // Vulnerability Distribution
  vulnCritical   Int @default(0)
  vulnHigh       Int @default(0)
  vulnMedium     Int @default(0)
  vulnLow        Int @default(0)
  
  // Incident Status
  incOpen        Int @default(0)
  incProgress    Int @default(0)
  incClosed      Int @default(0)
  incWatch       Int @default(0)
  
  // SLA Metrics
  slaMTTC        Float @default(0)
  slaMTTCTarget  Float @default(24)
  slaRate        Float @default(0)
  slaBreach      Int   @default(0)
  
  // Section Toggles
  showSLA        Boolean @default(true)
  showMaturity   Boolean @default(true)
  
  // ROI & Benchmark
  vulnResolved   Int    @default(0)
  vulnRecurring  Int    @default(0)
  bmScore        Int    @default(0)
  bmCompliance   Int    @default(0)
  bmSector       String @default("")
  
  // ISO Controls (JSON-serialized array)
  isoControls    String @default("[]")
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  // Relations (Cascade delete on report removal)
  decisions       Decision[]
  risks           Risk[]
  maturityDomains MaturityDomain[]
  recommendations Recommendation[]
  assets          Asset[]
  challenges      Challenge[]
  efficiencyKPIs  EfficiencyKPI[]
  aiConversations AIConversation[]
}
```

### Field Categories:

| Category | Fields | Type |
|----------|--------|------|
| Document Info | title, orgName, recipientName, period, issueDate, version, author, classification | String |
| Content | summary, chairNote | String (Long text) |
| Metrics | securityLevel, securityScore, trend, status | String/Int |
| KPI | kpi*, prev* | Int |
| Vulnerabilities | vuln* | Int |
| Incidents | inc* | Int |
| SLA | sla* | Float/Int |
| ROI | vuln*, bm*, isoControls | Mixed |
| Toggles | showSLA, showMaturity | Boolean |

### Nested Relations:

- **Decision**: Budget approvals needed
- **Risk**: Threats and vulnerabilities
- **MaturityDomain**: Security maturity scores (0-100)
- **Recommendation**: Actionable recommendations
- **Asset**: Critical assets and protection levels
- **Challenge**: Implementation challenges
- **EfficiencyKPI**: Operational efficiency metrics
- **AIConversation**: AI review chat history

All relations use `onDelete: Cascade` for data integrity.

---

## 4. Text Field Handling Pattern

All text fields follow the **same unified flow**:

### Step-by-Step: How "orgName" (Similar to "subject") is Handled

#### A. Database Layer (Prisma)
```typescript
orgName  String  @default("شركة المستقبل للتقنية")
```

#### B. Type Definition (types/report.ts)
```typescript
orgName: string;
```

#### C. API Fetch (lib/api.ts)
```typescript
export async function fetchReport(id: string): Promise<ReportData> {
  const res = await fetch(`/api/reports/${id}`, { cache: 'no-store' });
  return parseReport(await res.json());
}
```

#### D. Store Initialization (store/reportStore.ts)
```typescript
setReport: (report) => set({
  report: report,
  isDirty: false,
})
```

#### E. Form Binding (GeneralInfoForm.tsx)
```typescript
<FormField 
  label="اسم الشركة / المنظمة" 
  value={report.orgName}        // Read current value
  onChange={(v) => updateField('orgName', v)}  // Update on change
/>
```

#### F. Store Update (reportStore.ts)
```typescript
updateField: (key, value) => {
  const { report } = get();
  if (!report) return;
  set({ report: { ...report, [key]: value }, isDirty: true });
}
```

#### G. Auto-Save (page.tsx)
```typescript
// Triggers after 2 second debounce when isDirty = true
const doSave = useCallback(async () => {
  await updateReport(currentReport.id, currentReport);
  setLastSaved(new Date());
  setDirty(false);
}, []);
```

#### H. API Update Handler ([id]/route.ts)
```typescript
const { 
  decisions, risks, maturityDomains, 
  recommendations, assets, challenges, 
  efficiencyKPIs, 
  id: _id, createdAt: _c, updatedAt: _u, 
  ...scalarData 
} = data;

// Stringify JSON fields if needed
if (Array.isArray(scalarData.isoControls)) {
  scalarData.isoControls = JSON.stringify(scalarData.isoControls);
}

// Update scalar fields only
await prisma.report.update({
  where: { id },
  data: scalarData,  // orgName here
});
```

#### I. Database Persistence
```sql
UPDATE Report SET orgName = $1 WHERE id = $2
```

#### J. Verification (Preview)
```typescript
<div>{r.orgName}</div>  // Retrieved from DB and rendered
```

**Key: All text fields use the exact same pattern with input → store → auto-save → API → DB**

---

## 5. Preview Page Implementation

### File: [src/app/report/[id]/preview/page.tsx](src/app/report/[id]/preview/page.tsx)

The preview is **read-only** and fetches **fresh data from database**:

```typescript
export default function ReportPreviewPage() {
  const [report, setReport] = useState<ReportData | null>(null);

  useEffect(() => {
    const data = await fetchReport(id);  // Fetches latest from DB
    setReport(data);
  }, [id]);

  return <ReportPreview report={report} />;
}
```

### File: [src/components/report/ReportPreview.tsx](src/components/report/ReportPreview.tsx)

**Empty Field Conditions:**

The preview **respects empty field conditions**:

#### 1. Chairman Note (chairNote)
```typescript
{r.chairNote && (
  <div>
    <div>{r.chairNote}</div>    // Only renders if chairNote is truthy
  </div>
)}
```
✅ **Conditional rendering**: Empty note doesn't appear

#### 2. Efficiency KPIs (efficiencyKPIs)
```typescript
{effKPIs.length > 0 && (
  <div>
    {/* Efficiency section content */}
  </div>
)}
```
✅ **Length check**: Only shows if array has items

#### 3. Assets (assets)
```typescript
...(r.assets.length > 0 ? ['assets' as SecId] : []),
```
✅ **Array condition**: In Table of Contents, only shows if assets exist

#### 4. SLA & Maturity Toggles
```typescript
...(r.showSLA ? ['sla' as SecId] : []),
...(r.showMaturity && r.maturityDomains.length > 0 ? ['mat' as SecId] : []),
```
✅ **Boolean + length check**: Respects both settings and actual data

#### 5. Table of Contents (TOC) Numbering
```typescript
type SecId = 'exec' | 'risks' | 'assets' | 'ind' | 'eff' | 'sla' | 'act' | 'mat';
const shownSections: SecId[] = [
  'exec',
  ...(effKPIs.length > 0 ? ['eff' as SecId] : []),
  'risks',
  ...(r.assets.length > 0 ? ['assets' as SecId] : []),
  // ... more conditions
];
const secNum = (id: SecId) => shownSections.indexOf(id) + 1;
```
✅ **Dynamic TOC**: Section numbers adjust based on visible sections only

---

## 6. API Routes for Report Data Updates

### File: [src/app/api/reports/route.ts](src/app/api/reports/route.ts)

#### GET - List All Reports
```typescript
export async function GET() {
  const reports = await prisma.report.findMany({
    include: {
      decisions: { orderBy: { sortOrder: 'asc' } },
      risks: { orderBy: { sortOrder: 'asc' } },
      // ... all relations
    },
    orderBy: { updatedAt: 'desc' },
  });
  return NextResponse.json(reports);
}
```

#### POST - Create New Report
```typescript
export async function POST() {
  const settings = await prisma.appSettings.findUnique({ 
    where: { id: 'singleton' } 
  });
  
  const report = await prisma.report.create({
    data: {
      title: 'تقرير أمن المعلومات',
      orgName: settings?.defaultOrgName || 'شركة المستقبل للتقنية',
      // ... uses defaults and app settings
      decisions: { create: [ /* default items */ ] },
      risks: { create: [ /* default items */ ] },
      // ... creates nested items
    },
  });
}
```

### File: [src/app/api/reports/[id]/route.ts](src/app/api/reports/[id]/route.ts)

#### GET - Fetch Single Report
```typescript
export async function GET(_req, { params }) {
  const { id } = await params;
  const report = await prisma.report.findUnique({
    where: { id },
    include: {
      decisions: { orderBy: { sortOrder: 'asc' } },
      // ... all relations with sorting
    },
  });
}
```

#### PUT - Update Report

**Critical Update Logic:**

```typescript
export async function PUT(req, { params }) {
  const data = await req.json();

  // STEP 1: Separate nested relations from scalar data
  const { 
    decisions, risks, maturityDomains, recommendations, 
    assets, challenges, efficiencyKPIs, 
    id: _id, createdAt: _c, updatedAt: _u,  // Exclude these
    ...scalarData 
  } = data;

  // STEP 2: Stringify JSON fields before SQLite storage
  if (Array.isArray(scalarData.isoControls)) {
    scalarData.isoControls = JSON.stringify(scalarData.isoControls);
  }

  // STEP 3: Update main Report scalar fields
  await prisma.report.update({
    where: { id },
    data: scalarData,  // orgName, summary, etc. go here
  });

  // STEP 4: Handle each nested relation
  // DECISIONS: Delete all, recreate with new data
  if (decisions) {
    await prisma.decision.deleteMany({ where: { reportId: id } });
    if (decisions.length > 0) {
      await prisma.decision.createMany({
        data: decisions.map((d, i) => ({
          id: d.id?.startsWith?.('new-') ? undefined : d.id,  // New IDs generated
          reportId: id,
          title: d.title || '',
          // ... other fields
          sortOrder: i,
        })),
      });
    }
  }

  // RISKS: Same pattern - delete and recreate
  if (risks) {
    await prisma.risk.deleteMany({ where: { reportId: id } });
    if (risks.length > 0) {
      await prisma.risk.createMany({ /* ... */ });
    }
  }

  // MATURITY: Same pattern, with score normalization
  if (maturityDomains) {
    await prisma.maturityDomain.deleteMany({ where: { reportId: id } });
    if (maturityDomains.length > 0) {
      await prisma.maturityDomain.createMany({
        data: maturityDomains.map((m, i) => ({
          id: m.id?.startsWith?.('new-') ? undefined : m.id,
          reportId: id,
          name: (typeof m.name === 'string' && m.name.trim()) 
            ? m.name.trim() 
            : `بند ${i + 1}`,
          score: normalizeScore(m.score),  // 1-5 → 20-100, or validate 0-100
          sortOrder: i,
        })),
      });
    }
  }

  // RECOMMENDATIONS, ASSETS, CHALLENGES, EFFICIENCY: Same delete-and-recreate pattern

  // STEP 5: Return updated report with all relations
  const updated = await prisma.report.findUnique({
    where: { id },
    include: { /* all relations */ },
  });
  return NextResponse.json(updated);
}
```

**Update Strategy:**
- ✅ **Scalar fields** (text, numbers, booleans): Direct update
- ✅ **JSON fields** (isoControls): Stringify before storage
- 🔄 **Nested collections**: Delete all, rebuild from payload (preserves sortOrder)
- ✅ **ID handling**: Detects new items (id.startsWith('new-')) and generates new UUIDs

---

## 7. Complete Data Flow Diagram

```
┌─────────────────────────────────────────────┐
│   EDITOR UI (Report Page)                   │
│   - Form inputs (GeneralInfoForm, etc.)     │
│   - useReportStore() for state              │
│   - 9 sections with multi-step navigation   │
└────────────────┬────────────────────────────┘
                 │
                 │ onChange() → updateField()
                 ↓
┌─────────────────────────────────────────────┐
│   ZUSTAND STORE (reportStore.ts)            │
│   - Current report state                    │
│   - isDirty flag on any change              │
│   - updateField, updateRisk, etc. methods   │
└────────────────┬────────────────────────────┘
                 │
                 │ 2-second debounce timer
                 │ (isDirty check)
                 ↓
┌─────────────────────────────────────────────┐
│   AUTO-SAVE TRIGGER (page.tsx)              │
│   - doSave() called after 2s inactivity     │
│   - Calls updateReport(id, report)          │
└────────────────┬────────────────────────────┘
                 │
                 │ fetch PUT /api/reports/[id]
                 ↓
┌─────────────────────────────────────────────┐
│   API HANDLER ([id]/route.ts)               │
│   1. Split scalar vs nested data            │
│   2. Update Report scalar fields            │
│   3. Delete & recreate nested items         │
│   4. Return updated report                  │
└────────────────┬────────────────────────────┘
                 │
                 │ SQLite transaction
                 ↓
┌─────────────────────────────────────────────┐
│   DATABASE (Prisma ORM)                     │
│   - Report table: orgName, summary, etc.    │
│   - Decision/Risk/etc.: Nested collections  │
│   - All relations cascade on delete         │
└────────────────┬────────────────────────────┘
                 │
                 │ Return updated report
                 ↓
┌─────────────────────────────────────────────┐
│   STORE UPDATE (reportStore.ts)             │
│   - setReport(data)                         │
│   - isDirty: false                          │
│   - lastSaved: Date.now()                   │
└────────────────┬────────────────────────────┘
                 │
                 │ UI re-renders with fresh data
                 ↓
┌─────────────────────────────────────────────┐
│   UI REFRESH                                │
│   - Form fields show saved values           │
└─────────────────────────────────────────────┘


PREVIEW FLOW (Separate):
┌─────────────────────────────────────────────┐
│   Preview Page (Read-Only)                  │
│   1. Fetch fresh data: fetchReport(id)      │
│   2. Pass to ReportPreview component        │
│   3. Conditional rendering:                 │
│      - {chairNote && ...}                   │
│      - {effKPIs.length > 0 && ...}         │
│      - Dynamic TOC numbering                │
└────────────────┬────────────────────────────┘
                 │
                 │ fetch GET /api/reports/[id]
                 ↓
┌─────────────────────────────────────────────┐
│   API GET Handler (returns all relations)   │
│   - with decisions, risks, maturity, etc.   │
└────────────────┬────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────┐
│   ReportPreview Component Renders:          │
│   - Cover page (orgName, classification)    │
│   - Chairman note (if chairNote exists)     │
│   - TOC (with dynamic section numbering)    │
│   - Executive summary with metrics          │
│   - Risk section (calculated scores)        │
│   - Only included sections shown            │
└─────────────────────────────────────────────┘
```

---

## 8. Key Implementation Insights

### Store Methods (Zustand)

```typescript
// Scalar field updates
updateField: (key, value) → Set immutable copy + isDirty

// Collection management
addRisk/addDecision → Create new item with uuid()
updateRisk(index, data) → Update array element
removeRisk(index) → Filter out item

// Batch updates
updateFields(partial) → Update multiple fields at once

// ISO Controls (special case - JSON array)
updateISOControl(index, field, value) → Update JSON array item
```

### Auto-Save Mechanism

```typescript
// Triggered by isDirty
useEffect(() => {
  if (!isDirty) return;  // Exit if no changes
  
  if (saveTimerRef.current) 
    clearTimeout(saveTimerRef.current);
  
  saveTimerRef.current = setTimeout(doSave, 2000);  // 2s delay
  
  return () => { if (saveTimerRef.current) clearTimeout(...) };
}, [isDirty, report, doSave]);
```

### Nested Data Handling

**Collections are NOT deeply nested in store:**
- Store maintains flat Report object
- Collections (decisions, risks, etc.) are arrays in report
- On update: Send entire collections in PUT payload
- On API: Delete all → recreate (simpler than deep merge)

**Benefits:**
- ✅ Simple state model
- ✅ Easy serialization
- ✅ Clear update semantics
- ✅ No orphaned records

### Score Normalization

Maturity scores have backward compatibility:
```typescript
normalizeMaturityScore(score: number) {
  if (score > 0 && score <= 5)
    return Math.round(score * 20);  // Old 1-5 → New 20-100
  return Math.max(0, Math.min(100, Math.round(score)));
}
```

---

## 9. Field Mapping Quick Reference

| Database Field | Component | Form/Display | Type | Default |
|---|---|---|---|---|
| `title` | GeneralInfoForm | Text input | string | "تقرير أمن المعلومات" |
| `orgName` | GeneralInfoForm | Text input | string | "شركة المستقبل للتقنية" |
| `recipientName` | GeneralInfoForm | Text input | string | "" |
| `period` | GeneralInfoForm | Text input | string | "" |
| `issueDate` | GeneralInfoForm | Date picker | string | "" |
| `version` | GeneralInfoForm | Text input | string | "1.0" |
| `author` | GeneralInfoForm | Text input | string | "إدارة أمن المعلومات" |
| `classification` | GeneralInfoForm | Dropdown select | string | "سري" |
| `logoBase64` | GeneralInfoForm | File upload | string | "" |
| `chairNote` | GeneralInfoForm | Textarea | string | "" |
| `summary` | ExecutiveSummaryForm | Textarea | string | "" |
| `securityLevel` | ExecutiveSummaryForm | Dropdown | string | "متوسط" |
| `securityScore` | ExecutiveSummaryForm | Range slider | number | 0 |
| `trend` | ExecutiveSummaryForm | Dropdown | string | "مستقر →" |
| `kpiCritical` → `prevCompliance` | KPIForm | Number inputs | number | 0 |
| `vulnCritical` → `vulnLow` | Chart data | Canvas visualization | number | 0 |
| `incOpen` → `incWatch` | KPIForm | Number inputs | number | 0 |
| `slaMTTC`, `slaMTTCTarget`, `slaRate`, `slaBreach` | SLAForm | Number inputs | float/int | 0/24/0/0 |
| `showSLA`, `showMaturity` | Forms | Toggle checkbox | boolean | true |
| `vulnResolved`, `vulnRecurring`, `bmScore`, `bmCompliance`, `bmSector` | ROIForm | Inputs | number/string | 0/"" |
| `isoControls` | MaturityForm | JSON array | string (JSON) | "[]" |
| `decisions[]` | ExecutiveSummaryForm | Nested form | Decision[] | [] |
| `risks[]` | RisksForm | Nested form | Risk[] | [] |
| `challenges[]` | ChallengesForm | Nested form | Challenge[] | [] |
| `efficiencyKPIs[]` | EfficiencyForm | Nested form | EfficiencyKPI[] | [] |
| `maturityDomains[]` | MaturityForm | Nested form | MaturityDomain[] | [] |
| `recommendations[]` | RecommendationsForm | Nested form | Recommendation[] | [] |

---

## 10. How to Query/Update Similar Fields to "Subject"

If "subject" were added as a text field (similar to `orgName`, `summary`, `chairNote`):

### Add it to Schema:
```prisma
model Report {
  subject      String   @default("")
  // ... other fields
}
```

### Add it to Types:
```typescript
export interface ReportData {
  subject: string;
  // ... other fields
}
```

### Add to Form Component:
```typescript
<FormField 
  label="الموضوع الرئيسي" 
  value={report.subject}
  onChange={(v) => updateField('subject', v)}
/>
```

### It automatically:
- ✅ Updates in store via `updateField('subject', value)`
- ✅ Triggers auto-save
- ✅ Sends to API as part of `scalarData`
- ✅ Persists to database
- ✅ Renders in preview if non-empty

---

## 11. Important Notes

### Multi-Tenant Readiness
- No multi-tenant features currently
- All operations assume single user

### Data Safety
- ✅ Cascade deletes on report removal
- ✅ UUID generation for all new items
- ✅ SortOrder preserved for user ordering
- ❌ No undo/revision history
- ❌ No soft deletes

### Performance
- ✅ Auto-save with debounce (2s)
- ✅ React optimization via `useCallback`
- ✅ Canvas charts for efficient rendering
- ❌ No pagination on large collections
- ❌ No optimistic updates for nested items

### German/Arabic RTL
- ✅ Full RTL support (dir="rtl")
- ✅ Arabic UI text throughout
- ✅ Cairo font for Arabic typography
- ✅ All form labels, placeholders in Arabic

