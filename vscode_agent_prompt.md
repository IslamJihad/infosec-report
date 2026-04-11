# 🎯 Full Prompt: Recreate `risk_management_final.html` — Exact Design Clone

You are tasked with building a **complete, pixel-perfect clone** of an Arabic RTL Risk Management Plan HTML application. Follow every detail below precisely. The output must be a single self-contained HTML file named `risk_management_final.html`.

---

## 🌐 Language & Direction
- Full Arabic (RTL) interface: `<html lang="ar" dir="rtl">`
- All text, labels, tables, and layout must be right-to-left
- Font families: **Tajawal** (headings/display) + **Cairo** (body/UI) — both from Google Fonts
  ```html
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&family=Cairo:wght@300;400;600;700;900&display=swap" rel="stylesheet">
  ```

---

## 🎨 Design Tokens (CSS Variables)

```css
:root {
  --navy: #0d1b2a;
  --navy-light: #1b2e45;
  --gold: #c8a84b;
  --gold-light: #e8c97a;
  --cream: #f8f5ef;
  --white: #fff;
  --gray-100: #f1f0ee;
  --gray-200: #e0ddd7;
  --gray-400: #9a9690;
  --gray-600: #5c5955;
  --red: #c0392b;
  --teal: #16a085;
  --green: #27ae60;
  --shadow-lg: 0 8px 40px rgba(13,27,42,.18);
  --radius: 12px;
  --radius-sm: 8px;
}
```

**Body background**: `linear-gradient(135deg, #0d1b2a 0%, #1b3a5c 50%, #0d2137 100%)`
`min-height: 100vh`, color: `var(--navy)`, font-family: `'Cairo', sans-serif`

---

## 🏗️ Overall Layout

- One `.container` centered, `max-width: 980px`, `margin: 32px auto`, `padding: 0 20px 60px`
- All sections are **collapsible cards** with dark navy headers and white bodies
- Card structure:
  - `.card` — white bg, `border-radius: 12px`, `box-shadow: var(--shadow-lg)`, `border: 1px solid rgba(200,168,75,.15)`, hover lifts with `translateY(-1px)`
  - `.card-header` — `background: linear-gradient(135deg, var(--navy), var(--navy-light))`, `padding: 15px 24px`, flex row, has: icon circle (gold border), title h2 (gold, Tajawal), subtitle span (muted), and a toggle arrow `▼`/`▲`
  - `.card-body` — `padding: 24px`, collapses with `display:none` when toggled
  - Icon circle: `width:38px; height:38px; background:rgba(200,168,75,.18); border:1.5px solid var(--gold); border-radius:50%`
  - Card h2: `font-family:'Tajawal'; font-size:1.05rem; font-weight:700; color:var(--gold)`

---

## 🖥️ App Header (Fixed Top)

```
┌─────────────────────────────────────────────────────┐
│  [Logo area]  📋 نموذج خطة إدارة المخاطر             │
│               وفقاً لمعايير ISO 31000:2018 و PMI PMBOK│
│               ● لم يتم الحفظ بعد    [💾 حفظ البيانات]│
└─────────────────────────────────────────────────────┘
```

- `.app-header`: dark navy gradient bg, `padding: 24px 40px`, `border-bottom: 3px solid var(--gold)`, flex row space-between
- Has a radial gold glow `::before` pseudo-element
- Left side: company logo upload area (see Card 1 below) + header text
- Right side: save indicator dot (pulses green when saved, gold when unsaved) + green save button `💾 حفظ البيانات`
- Title in **Tajawal 900** gold, subtitle in muted white

---

## 📦 All Cards (Sections)

### Card 1 — Cover / Company Info
**Header**: 🏢 icon, title "نموذج خطة إدارة المخاطر الشاملة", sub "النسخة المتكاملة"

**Body**:
- Logo upload area: dashed gold border, `background: var(--cream)`, `padding: 24px`, centered text, hidden `<input type="file" accept="image/*">` overlaid with opacity:0. Shows upload icon + text "انقر لرفع الشعار (PNG, JPG, SVG)". On file select, show preview image (`max-width:140px; max-height:70px`)
- Company name input field: `id="companyName"`, default value "مشروع إنشائي - مدينة الرياض"
- Project name input field: `id="projectName"`, default "مشروع إنشائي متعدد الاستخدامات - الرياض"

---

### Card 2 — §0 بيانات المشروع
**Header**: 📋 icon, title "§0 — بيانات المشروع", sub "معلومات عامة — قابل للتعديل"

**Body**: 2-column grid (`grid-template-columns: 1fr 1fr; gap:16px`) containing:
- `id="companyName"` — اسم الشركة / الجهة — "مشروع إنشائي - مدينة الرياض"
- `id="projectName"` — اسم المشروع — "مشروع إنشائي متعدد الاستخدامات - الرياض"
- `id="projectType"` — نوع المشروع — `<select>` with options: إنشائي, تطوير, صناعي, بنية تحتية, خدمي, أخرى
- `id="location"` — الموقع — "مدينة الرياض - المملكة العربية السعودية"
- `id="budget"` — الميزانية التقديرية — "غير محدد"
- `id="duration"` — المدة الزمنية — "متعدد المراحل"
- `id="startDate"` — تاريخ البدء — `type="date"` value="2024-01-01"
- `id="endDate"` — تاريخ الانتهاء — `type="date"` value="2026-12-31"
- Full-width: `id="projectScope"` — وصف نطاق المشروع — `textarea` rows=3
- `id="pm"` — مدير المشروع — "مدير المشروع"

**Form field styling**:
- Label: `.form-group label` — `font-size:.84rem; font-weight:600; color:var(--navy)`, has a **3px gold left bar** `::before` pseudo `(width:3px; height:12px; background:var(--gold))`
- Input/select/textarea: light gray bg `var(--gray-100)`, `border:1.5px solid var(--gray-200)`, `border-radius:8px`, focus → gold border + white bg + `box-shadow: 0 0 0 3px rgba(200,168,75,.12)`

---

### Card 3 — §1 مقدمة وإطار العمل
**Header**: 📖 icon, "§1 — مقدمة وإطار العمل", sub "تعريف إدارة المخاطر وأهداف الخطة — قابل للتعديل"

**Body**: Contains a container `id="intro-sections"` with **static editable sections**. Each section is a `.static-section` div with:
- An `✏️ تعديل` edit button (top-right corner, small gold-bordered button)
- An `<h4>` title
- A `.s-display` div showing content as HTML (visible by default)
- A `.s-edit` textarea (hidden by default, shows when edit button clicked)
- Clicking the edit button toggles between display and textarea mode; button label changes to `✅ حفظ`

**Default sections in order**:
1. **تعريف إدارة المخاطر** — paragraph text about coordinated risk activities
2. **🌐 معيار ISO 31000:2018** — 4 checkmark bullet points
3. **📘 إطار PMI PMBOK** — 4 checkmark bullet points
4. **أهداف الخطة** — 4 diamond bullet points

Bottom: `+ إضافة فقرة` button (gold outline, small)

**Static Section Styling** (`.static-section`):
```css
.static-section {
  background: var(--gray-100);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 10px;
  border-right: 3px solid var(--gold);
  position: relative;
}
.static-section h4 { font-size:.88rem; font-weight:700; color:var(--navy); margin-bottom:6px; }
.static-section p { font-size:.85rem; color:var(--gray-600); line-height:1.7; }
.edit-btn-inline {
  position: absolute; top:8px; left:10px;
  padding: 3px 10px; font-size:.72rem; font-weight:600;
  border: 1.5px solid var(--gold); color:var(--gold);
  background: transparent; border-radius:6px; cursor:pointer;
}
.edit-btn-inline:hover { background:var(--gold); color:var(--navy); }
```

---

### Card 4 — §2 هيكل الحوكمة
**Header**: 🏛️ icon, "§2 — هيكل الحوكمة وسياسات المخاطر"

**Body**:
1. **Governance Hierarchy Editor** (`id="govEditor"`):
   - Vertical list of draggable rows, each row = `.gov-row` with: drag handle (⠿), text input (centered), up/down buttons (▲▼), delete button (×)
   - Between rows: gold arrow indicator `↓`
   - Default levels: مجلس الإدارة → لجنة المخاطر الاستراتيجية → مدير المشروع → مدير المخاطر → فريق المشروع
   - "إضافة مستوى" button (gold outline, centered)
   - **Drag behavior**: drag-over shows gold dashed border, dragging item becomes semi-transparent

2. **HR divider**

3. **Risk Policy** (editable section):
   - Title "سياسة إدارة المخاطر:"
   - One `.static-section` with policy text and edit button

---

### Card 5 — §3 الأدوار والمسؤوليات (RACI)
**Header**: 👥 icon, "§3 — الأدوار والمسؤوليات (RACI)"

**Body**:
1. **Role descriptions** (`id="roles-sections"`) — static editable sections with emoji icons:
   - 👤 مدير المخاطر — 5 bullet responsibilities
   - 🏛️ لجنة إدارة المخاطر — 5 bullet responsibilities
   - "+ إضافة دور" button

2. **RACI Matrix**:
   - Role name inputs grid (4 columns, editable): مدير المشروع, مدير المخاطر, لجنة المخاطر, مالك المخاطرة
   - Role name inputs sync to table header columns live
   - Table `.raci-table`: navy thead with gold text, alternating row colors
   - Columns: المهمة | [Role1] | [Role2] | [Role3] | [Role4] | إجراءات
   - Each role cell is a `<select>` with options: R, A, C, I, — (dash)
   - Delete row button `🗑`
   - "+ إضافة مهمة" button

3. **RACI Legend** badges (navy bg, gold text):
   - A = Accountable (محاسب)
   - R = Responsible (مسؤول)
   - C = Consulted (مستشار)
   - I = Informed (مطّلع)

---

### Card 6 — §4 آليات وإجراءات إدارة المخاطر
**Header**: ⚙️ icon, "§4 — آليات وإجراءات إدارة المخاطر"

**Body**: Container `id="mech-sections"` with editable static sections:
1. **🔍 إجراءات التحديد** — 6 bullet items (brainstorming workshops, document review, expert interviews, SWOT, checklists, Delphi technique)
2. **📊 إجراءات التقييم** — 6 bullet items (qualitative, quantitative, probability matrix, sensitivity, Monte Carlo, decision tree)
3. **🚨 بروتوكول التصعيد** — 3-level escalation text (low/medium/high with timeframes)
4. **📡 قنوات التواصل** — SMS, email, dashboard items

"+ إضافة آلية" button

---

### Card 7 — §5 تصنيف المخاطر وسجل المخاطر
**Header**: ⚠️ icon, "§5 — تصنيف المخاطر وسجل المخاطر"

**Body** has two parts:

**Part A — Risk Categories** (`id="cat-sections"`): Static editable sections with teal right border for distinguishing:
1. **⚙️ مخاطر تقنية** — 5 bullet items (engineering complexity, specs shortage, advanced tech, equipment availability, systems integration)
2. **💰 مخاطر مالية** — 5 bullet items (material price fluctuations, funding delays, exchange rates, labor costs, claims)
3. **🌿 مخاطر بيئية** — 5 bullet items (extreme weather, pollution, archaeological protection, sustainability, waste management)
4. **⚖️ مخاطر قانونية وتنظيمية** — 5 bullet items (permit delays, regulatory changes, Saudi building code, SCEA standards, municipality requirements)

**Part B — Risk Tolerance Table**:
- Table with columns: المجال | الحد المقبول | مستوى الخطورة | إجراءات
- Default 4 rows: الميزانية (low), الجدول الزمني (medium), الجودة (medium), السلامة (high)
- Each row: text input for domain, text input for limit, `<select>` for level (منخفض/متوسط/عالي), delete button
- "+ إضافة حد" button

**Part C — Risk Register Table** (`.risk-table` inside `.risk-table-wrapper` with overflow-x:auto):
- thead: navy bg, gold text
- Columns: ↕ (drag) | الرمز | وصف المخاطرة | الفئة | الاحتمالية | التأثير | الدرجة | الاستجابة | المالك | الحالة | (actions)
- احتمالية: `<input type="number" min=1 max=5 class="prob-input">`, التأثير: `<input type="number" min=1 max=5 class="impact-input">`
- الدرجة: auto-calculated (prob × impact), shown as colored badge:
  - 1–6: green bg `#d5f4e2`, color `#1a7a42` → class `risk-low`
  - 7–12: yellow bg `#fff3cd`, color `#856404` → class `risk-medium`
  - 13–25: red bg `#fde8e7`, color `#a93226` → class `risk-high`
- الفئة select: تقنية, مالية, بيئية, قانونية, أخرى
- الاستجابة select: تجنب, نقل, تخفيف, قبول
- الحالة select: نشط, تحت المراقبة, مغلق
- Each row has drag handle, up/down arrows, and 🗑 delete button
- "+ إضافة مخاطرة" button

---

### Card 8 — §6 استراتيجيات الاستجابة
**Header**: 🎯 icon, "§6 — استراتيجيات الاستجابة للمخاطر"

**Body** two sections:

**Threat Strategies** (`id="threat-sections"`): Static editable sections with gold right border:
1. 🚫 التجنب (Avoid) — 4 bullets
2. 🔄 النقل (Transfer) — 4 bullets
3. ⬇️ التخفيف (Mitigate) — 4 bullets
4. ✅ القبول (Accept) — 4 bullets

**Opportunity Strategies** (`id="opp-sections"`): Static editable sections with **teal** right border (`var(--teal)`):
1. 🎯 الاستغلال (Exploit) — 4 bullets
2. 📈 التعزيز (Enhance) — 4 bullets
3. 🤝 المشاركة (Share) — 4 bullets
4. ⏳ القبول (Accept) — 4 bullets

---

### Card 9 — §7 قالب خطة الاستجابة
**Header**: 📝 icon, "§7 — قالب خطة الاستجابة"

**Body**: Sortable table (`id="respPlanRows"`) with columns:
↕ | المعرّف | الإجراء المطلوب | المسؤول | الموعد | الموارد | مؤشرات النجاح | (delete)

All cells are editable inputs. Drag handle + up/down move buttons on each row. "+ إضافة إجراء" button.

---

### Card 10 — §8 الاحتياطيات والطوارئ
**Header**: 💰 icon, "§8 — الاحتياطيات والطوارئ"

**Body**: 2-column grid of number inputs:
- `id="res-emergency"` — احتياطي الطوارئ المالي (%) — default 10
- `id="res-mgmt"` — احتياطي الإدارة (%) — default 5
- `id="res-inflation"` — احتياطي التضخم (%) — default 3
- `id="res-time-critical"` — أنشطة حرجة — احتياطي زمني (%) — default 15
- `id="res-time-normal"` — أنشطة عادية — احتياطي زمني (%) — default 10
- `id="res-time-test"` — مراجعات واختبارات — احتياطي زمني (%) — default 20

---

### Card 11 — §9 مؤشرات الأداء الرئيسية (KPIs)
**Header**: 📊 icon, "§9 — مؤشرات الأداء الرئيسية (KPIs)"

**Body**: `.kpi-grid` — 2-column grid with `.kpi-item` cards:
- `.kpi-item` style: `background:var(--gray-100); border-radius:8px; padding:12px 14px; border-right:3px solid var(--gold)`
- 6 KPI inputs:
  - `id="kpi1"` — نسبة المخاطر المُحددة (هدف %) — 100
  - `id="kpi2"` — نسبة المخاطر المُقيَّمة (هدف %) — 95
  - `id="kpi3"` — متوسط وقت الاستجابة (ساعة) — 24
  - `id="kpi4"` — نسبة إغلاق المخاطر (هدف %) — 80
  - `id="kpi5"` — تجنب خسائر مالية (بالملايين) — 2
  - `id="kpi6"` — رضا أصحاب المصلحة (هدف / 5) — 4

---

### Card 12 — §9 المراقبة والتحسين المستمر
**Header**: 🔄 icon, "§9 — المراقبة والتحسين المستمر"

**Body**: Container `id="monitor-sections"` with editable static sections:
1. **📚 الدروس المستفادة** — 5 bullets (document successful experiences, analyze failures, develop best practices, share knowledge, update databases)
2. **🔧 التحسين المستمر** — 5 bullets (Kaizen methodology, PDCA cycle, modern tech, continuous training, benchmarking)
3. **📋 جدول التقارير** — text section listing reporting types (weekly/monthly/quarterly, emergency reports, presentations)

---

### Card 13 — Save & Export Actions
**Not a regular card** — a section at the bottom:
```
[💾 حفظ كل البيانات]   ← Big teal gradient pill button, centered

[🖨️ تصدير PDF]  [📄 تصدير Word]  [📊 إنشاء التقرير]
```
- Save button: `background:linear-gradient(135deg, var(--teal), #1abc9c)`, `border-radius:50px`, large with shadow
- Export buttons: smaller, side by side. PDF = gold bg, Word = `#2b579a` blue bg
- "إنشاء التقرير" = teal bg

---

### Card 14 — Footer
Simple footer text centered:
```
تم إعداد هذه الخطة الشاملة لإدارة المخاطر وفقاً لأحدث المعايير العالمية لضمان نجاح المشروع الإنشائي في مدينة الرياض.
نوصي بالالتزام الكامل بتطبيق هذه الخطة ومراجعتها بشكل دوري للتأكد من فعاليتها.
```

---

## ⚙️ JavaScript Functions

### 1. Save / Load — `localStorage`
```javascript
const STORAGE_KEY = 'riskPlan_v2';
let unsaved = false;

function markUnsaved() {
  unsaved = true;
  // set save dot to gold (unsaved class), text "تغييرات غير محفوظة"
}

function markSaved() {
  unsaved = false;
  // set save dot to green (saved class), text "تم الحفظ تلقائياً"
}

function saveAll() {
  // Collect all form data into a JSON object:
  // - All named inputs (companyName, projectName, projectType, location, budget, duration, startDate, endDate, projectScope, pm)
  // - All static section contents (key → {title, text})
  // - Governance levels array (getGovLevels())
  // - RACI data (roles + tasks)
  // - Risk register rows
  // - Response plan rows
  // - Tolerance table rows
  // - KPI inputs (kpi1-6)
  // - Reserve inputs
  // - Monitor sections
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  markSaved();
  showToast('✅ تم حفظ البيانات بنجاح');
}

function loadAll() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  const data = JSON.parse(raw);
  // Restore all fields from data
  // Re-build dynamic tables (RACI, risk register, response plan, tolerance)
  // Re-build governance editor
  // Re-build static sections
  markSaved();
}

// Auto-save every 60 seconds
setInterval(() => { if (unsaved) saveAll(); }, 60000);
```

### 2. Toggle Card Collapse
```javascript
function toggleCard(id) {
  const body = document.getElementById('body-' + id);
  const header = body.previousElementSibling;
  const icon = header.querySelector('.toggle-icon');
  const isCollapsed = body.classList.contains('collapsed');
  body.classList.toggle('collapsed');
  icon.style.transform = isCollapsed ? '' : 'rotate(-90deg)';
}
```

### 3. Inline Text Edit Toggle
```javascript
function toggleEdit(btn) {
  const section = btn.closest('.static-section');
  const display = section.querySelector('.s-display');
  const edit = section.querySelector('.s-edit');
  const isEditing = edit.style.display !== 'none';
  if (isEditing) {
    // Save: copy textarea value (with \n → <br>) to display, hide textarea
    display.innerHTML = '<p>' + edit.value.replace(/\n/g, '<br>') + '</p>';
    display.style.display = '';
    edit.style.display = 'none';
    btn.textContent = '✏️ تعديل';
    markUnsaved();
  } else {
    display.style.display = 'none';
    edit.style.display = '';
    btn.textContent = '✅ حفظ';
  }
}
```

### 4. Add Static Section
```javascript
function addStaticSection(containerId) {
  const container = document.getElementById(containerId);
  const div = document.createElement('div');
  div.className = 'static-section';
  div.dataset.key = 'custom-' + Date.now();
  div.innerHTML = `
    <button class="edit-btn-inline" onclick="toggleEdit(this)">✏️ تعديل</button>
    <h4 contenteditable="true">عنوان جديد</h4>
    <div class="s-display"><p>أضف المحتوى هنا...</p></div>
    <textarea class="s-edit" style="display:none" oninput="markUnsaved()">أضف المحتوى هنا...</textarea>
    <button onclick="this.closest('.static-section').remove();markUnsaved()" style="position:absolute;top:8px;left:80px;border:1.5px solid var(--red);color:var(--red);background:transparent;border-radius:6px;padding:3px 8px;font-size:.72rem;cursor:pointer">🗑 حذف</button>
  `;
  container.appendChild(div);
  markUnsaved();
}
```

### 5. Governance Drag-and-Drop Hierarchy
```javascript
function buildGovEditor(levels) {
  const editor = document.getElementById('govEditor');
  editor.innerHTML = '';
  levels.forEach((level, i) => {
    // Create row: drag-handle + input + ▲▼ buttons + × delete
    const row = document.createElement('div');
    row.className = 'gov-row';
    row.draggable = true;
    row.innerHTML = `
      <span class="drag-handle">⠿</span>
      <input type="text" value="${level}" oninput="markUnsaved()">
      <button class="btn-small" onclick="moveGovUp(this)">▲</button>
      <button class="btn-small" onclick="moveGovDown(this)">▼</button>
      <button class="btn-small btn-del-gov" onclick="removeGovLevel(this)">×</button>
    `;
    editor.appendChild(row);
    // Add arrow between rows (not after last)
    if (i < levels.length - 1) {
      const arrow = document.createElement('div');
      arrow.className = 'gov-arrow-indicator';
      arrow.textContent = '↓';
      editor.appendChild(arrow);
    }
    setupGovDrag(row);
  });
}

// Default levels on init:
buildGovEditor([
  'مجلس الإدارة',
  'لجنة المخاطر الاستراتيجية',
  'مدير المشروع',
  'مدير المخاطر',
  'فريق المشروع'
]);
```

### 6. Risk Score Auto-Calculation
```javascript
function calcScore(el) {
  const row = el.closest('tr');
  const p = parseInt(row.querySelector('.prob-input').value) || 1;
  const i = parseInt(row.querySelector('.impact-input').value) || 1;
  const s = p * i;
  const cls = s <= 6 ? 'risk-low' : s <= 12 ? 'risk-medium' : 'risk-high';
  row.querySelector('.score-cell').innerHTML = `<span class="risk-score ${cls}">${s}</span>`;
  markUnsaved();
}
```

### 7. RACI Role Name Sync
```javascript
function syncRaciHeader() {
  const names = Array.from(document.querySelectorAll('.role-name')).map(i => i.value);
  document.querySelectorAll('.raci-table thead th.rh').forEach((th, i) => {
    if (names[i]) th.textContent = names[i];
  });
}
```

### 8. Row Drag (Tables)
For `.risk-table` and `.respPlanRows` tables, each row has a `⠿` drag handle with HTML5 drag-and-drop:
- `dragstart` → add `.dragging` class (opacity 0.4)
- `dragover` → add `.drag-over` class (gold dashed border)
- `drop` → reorder rows in DOM
- Also support up/down arrow buttons (▲▼) to move rows

### 9. Toast Notifications
```javascript
function showToast(msg, duration = 2800) {
  // Create/reuse a fixed-position toast element
  // position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%)
  // background: var(--navy); color: white; padding: 12px 28px; border-radius: 50px
  // border: 1px solid var(--gold); font-family: Cairo; z-index: 9999
  // Fade in → show → fade out after `duration`ms
}
```

### 10. Export PDF
```javascript
function exportPDF() {
  // Open a new window with a complete print-styled HTML report
  // The report contains all data rendered as static HTML (no inputs)
  // Report structure:
  //   - Cover page with company name, project name, logo, date, "صفحة 1"
  //   - Each section rendered with navy headers and white content
  //   - Risk register as a full styled table with colored score badges
  //   - RACI matrix table
  //   - All strategies listed
  // On load: window.print() after 900ms delay; window.close() after print
  // CSS: @media print { page-break-after: always on cover; avoid breaks inside sections }
}
```

### 11. Export Word
```javascript
function exportWord() {
  // Build an HTML string styled for Word (.doc export)
  // Use blob: URL with MIME type 'application/msword'
  // Download via <a> click
  // Include: title, project info table, all sections as styled paragraphs, risk table, RACI
  const blob = new Blob([wordContent], { type: 'application/msword' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `خطة_إدارة_المخاطر_${document.getElementById('projectName').value || 'المشروع'}.doc`;
  a.click();
}
```

### 12. Generate Report (Overlay)
```javascript
function generateReport() {
  // Show a full-screen overlay (#reportOverlay) with a complete formatted report
  // The overlay is a dark semi-transparent backdrop
  // Inside: white report container with print/close buttons
  // Report contains all sections beautifully formatted
}
```

### 13. Init on Page Load
```javascript
window.addEventListener('DOMContentLoaded', () => {
  buildGovEditor([/* default levels */]);
  // Add 2 default RACI rows
  addRaciRow('تحديد المخاطر', ['م', 'م', 'م', 'م']);
  addRaciRow('تقييم المخاطر', ['م', 'A', 'م', 'م']);
  // Add 3 default risk rows
  addRiskRow('R-001', 'تأخير في التصاريح الحكومية', 'قانونية', 4, 4, 'تخفيف', 'مدير المشروع', 'نشط');
  addRiskRow('R-002', 'ارتفاع أسعار مواد البناء', 'مالية', 3, 4, 'نقل', 'المدير المالي', 'نشط');
  addRiskRow('R-003', 'نقص الكوادر المتخصصة', 'تقنية', 3, 3, 'تخفيف', 'مدير الموارد', 'تحت المراقبة');
  // Add 2 default response plan rows
  addRespPlanRow('R-001', 'التواصل المبكر مع الجهات الحكومية', 'مدير المشروع', '2024-02-01', 'فريق قانوني', 'الحصول على جميع التصاريح خلال 30 يوم');
  // Load saved data if exists
  loadAll();
  markSaved();
});
```

---

## 🎨 Additional CSS Details

### Button Styles
```css
/* Add row buttons */
.btn-add-row {
  margin-top: 10px; padding: 8px 18px;
  border: 1.5px solid var(--gold); color: var(--gold);
  background: transparent; border-radius: 8px;
  font-family: 'Cairo'; font-size: .82rem; font-weight: 600; cursor: pointer;
}
.btn-add-row:hover { background: var(--gold); color: var(--navy); }

/* Delete buttons */
.btn-del {
  background: transparent; border: 1px solid var(--red);
  color: var(--red); border-radius: 6px; padding: 3px 8px; cursor: pointer; font-size: .78rem;
}
.btn-del:hover { background: var(--red); color: #fff; }
```

### Risk Score Badges
```css
.risk-score {
  display: inline-block; padding: 3px 9px;
  border-radius: 20px; font-weight: 700; font-size: .82rem;
  min-width: 32px; text-align: center;
}
.risk-low { background: #d5f4e2; color: #1a7a42; }
.risk-medium { background: #fff3cd; color: #856404; }
.risk-high { background: #fde8e7; color: #a93226; }
```

### Responsive
```css
@media (max-width: 640px) {
  .grid-2 { grid-template-columns: 1fr; }
  .kpi-grid { grid-template-columns: 1fr; }
  .role-inputs-grid { grid-template-columns: repeat(2, 1fr); }
  .app-header { padding: 16px 20px; flex-direction: column; }
  .container { padding: 0 10px 40px; }
}
```

---

## 📋 File Requirements

1. **Single HTML file** — all CSS and JS inline in `<style>` and `<script>` tags
2. **No external libraries** except Google Fonts CDN
3. **Works offline** except for fonts
4. **RTL layout throughout** — `direction: rtl` on body, inputs, selects, textareas
5. **localStorage persistence** — all data saved/loaded with key `riskPlan_v2`
6. **Fully functional** — all add/delete/edit/drag/save/export features working
7. **Print-ready** — PDF export opens a clean print window with proper page breaks
8. **Mobile responsive** — works on screens 375px and up

---

## 🔎 Design Inspection Summary

| Element | Style |
|---|---|
| Page background | `linear-gradient(135deg, #0d1b2a, #1b3a5c, #0d2137)` |
| Card background | `#ffffff` |
| Card header | `linear-gradient(135deg, #0d1b2a, #1b2e45)` |
| Accent color | `#c8a84b` (gold) |
| Heading font | Tajawal 700–900 |
| Body font | Cairo 400–700 |
| Input bg | `#f1f0ee` (gray-100) |
| Input focus | Gold border + 3px gold glow |
| Score low | Green badge `#d5f4e2 / #1a7a42` |
| Score medium | Yellow badge `#fff3cd / #856404` |
| Score high | Red badge `#fde8e7 / #a93226` |
| Save button | `#27ae60` green |
| PDF button | Gold `#c8a84b` |
| Word button | Blue `#2b579a` |
| Toast | Navy bg, gold border, fixed bottom-center |

---

Build this file completely. Do not leave any section, function, or feature unimplemented. Every card must be collapsible, every table must support add/delete rows, every static section must support inline editing, governance hierarchy must be drag-sortable, risk scores must auto-calculate, and save/load must work via localStorage.

