<div align="center">

# 🛡️ نظام تقارير أمن المعلومات

### Information Security Report System

[![Build & Push Docker Image](https://github.com/IslamJihad/infosec-report/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/IslamJihad/infosec-report/actions/workflows/docker-publish.yml)
[![Docker Hub](https://img.shields.io/docker/v/islamjihad/infosec-report?label=Docker%20Hub&logo=docker)](https://hub.docker.com/r/islamjihad/infosec-report)
[![Docker Pulls](https://img.shields.io/docker/pulls/islamjihad/infosec-report?logo=docker)](https://hub.docker.com/r/islamjihad/infosec-report)

نظام احترافي لإنشاء وإدارة تقارير أمن المعلومات — مبني بأحدث التقنيات مع واجهة عربية كاملة

</div>

---

## 📑 جدول المحتويات

- [تشغيل النظام على سيرفر الإنتاج](#️-تشغيل-النظام-على-سيرفر-الإنتاج-خطوة-بخطوة)
- [المميزات](#-المميزات)
- [التشغيل السريع](#-التشغيل-السريع)
- [التشغيل بالتفصيل](#-التشغيل-بالتفصيل)
- [التطوير المحلي](#-التطوير-المحلي)
- [البنية التقنية](#-البنية-التقنية)
- [هيكل المشروع](#-هيكل-المشروع)
- [التكامل المستمر CI/CD](#-التكامل-المستمر-cicd)
- [متغيرات البيئة](#-متغيرات-البيئة)
- [الذكاء الاصطناعي](#-الذكاء-الاصطناعي)

---

## 🖥️ تشغيل النظام على سيرفر الإنتاج (خطوة بخطوة)

> **هذا الدليل مخصص للموظف غير التقني** — اتبع الخطوات بالترتيب وسيعمل النظام.

### المتطلبات

- ✅ سيرفر عليه **Docker Desktop** (أو Docker Engine) — فقط لا غير

> لا تحتاج Node.js ولا Git ولا أي برنامج آخر. Docker فقط.

### الخطوات

#### 1️⃣ أنشئ مجلد جديد

أنشئ مجلد فارغ في أي مكان على السيرفر، مثلاً:
```
C:\infosec-report
```

#### 2️⃣ أنشئ ملف `docker-compose.yml`

داخل المجلد، أنشئ ملف نصي جديد باسم **`docker-compose.yml`** (بدون أي امتداد آخر) والصق فيه هذا المحتوى بالضبط:

```yaml
services:
  app:
    image: islamjihad/infosec-report:latest
    ports:
      - "3000:3000"
    volumes:
      - infosec-data:/app/data
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:/app/data/infosec.db
    restart: unless-stopped

volumes:
  infosec-data:
```

> **تنبيه:** تأكد أن اسم الملف هو `docker-compose.yml` وليس `docker-compose.yml.txt`

#### 3️⃣ شغّل النظام

افتح **Terminal / PowerShell / CMD** داخل نفس المجلد، ثم اكتب:

```bash
docker compose up -d
```

> Docker سيقوم تلقائياً بـ:
> - تحميل صورة النظام من الإنترنت (أول مرة فقط)
> - إنشاء قاعدة البيانات
> - تشغيل النظام

#### 4️⃣ افتح النظام

افتح المتصفح واكتب:

```
http://localhost:3000
```

أو إذا كنت تفتح من جهاز آخر على نفس الشبكة:

```
http://<عنوان-IP-السيرفر>:3000
```

> **مثال:** `http://192.168.1.100:3000`

---

### 🔄 التحديث لآخر إصدار

عند وجود تحديث جديد، افتح Terminal في نفس المجلد واكتب:

```bash
docker compose pull
docker compose up -d
```

### ⏹️ إيقاف النظام

```bash
docker compose down
```

### 📋 عرض سجلات النظام (في حال وجود مشكلة)

```bash
docker compose logs -f
```

### 💾 نسخ احتياطي لقاعدة البيانات

```bash
docker cp infosec-report-app-1:/app/data/infosec.db ./backup-infosec.db
```

---

## ✨ المميزات

| الميزة | الوصف |
|--------|-------|
| 📊 **لوحة تحكم ذكية** | عرض جميع التقارير بإحصائيات مجمعة (عدد التقارير، متوسط الأمان، بيانات المخاطر) |
| 📝 **محرر تقارير متقدم** | 7 أقسام إدخال منظمة مع حفظ تلقائي كل ثانيتين |
| 🖨️ **تصدير احترافي** | معاينة كاملة بغلاف رسمي + تصدير PDF مباشرة من المتصفح |
| 🤖 **مراجعة AI** | 5 أنواع مراجعة ذكية مع اختيار المزود (Google Gemini أو NVIDIA NIM) |
| 💾 **حفظ تلقائي** | كل تغيير يُحفظ تلقائياً بدون تدخل المستخدم |
| 📋 **نسخ التقارير** | استنساخ أي تقرير بضغطة واحدة |
| 🗺️ **خريطة مخاطر حرارية** | Risk Heat Map مصفوفة 5×5 |
| 📐 **مقاييس النضج** | 8 مجالات أمنية قابلة للتعديل |
| ⏱️ **مقاييس SLA** | MTTD / MTTR / MTTC مع مقارنة بالأهداف |
| 🌐 **واجهة عربية كاملة** | RTL + خط Cairo الاحترافي |

---

## 🚀 التشغيل السريع

الطريقة الأسرع لتشغيل النظام — أمر واحد فقط:

```bash
docker run -d -p 3000:3000 -v infosec-data:/app/data islamjihad/infosec-report:latest
```

ثم افتح المتصفح على: **http://localhost:3000**

> ⚠️ **ملاحظة:** يجب أن يكون [Docker](https://www.docker.com/get-started/) مثبتاً على جهازك.

---

## 📦 التشغيل بالتفصيل

### الطريقة 1: Docker Run (البسيطة)

```bash
# تشغيل بدون AI
docker run -d \
  --name infosec-report \
  -p 3000:3000 \
  -v infosec-data:/app/data \
  islamjihad/infosec-report:latest

# تشغيل مع AI (المفاتيح من داخل صفحة الإعدادات)
docker run -d \
  --name infosec-report \
  -p 3000:3000 \
  -v infosec-data:/app/data \
  islamjihad/infosec-report:latest
```

### الطريقة 2: Docker Compose (المُوصى بها)

```bash
# نسخ المشروع
git clone https://github.com/IslamJihad/infosec-report.git
cd infosec-report

# تشغيل
docker compose up -d
```

أو أنشئ ملف `docker-compose.yml` خاص بك:

```yaml
services:
  app:
    image: islamjihad/infosec-report:latest
    ports:
      - "3000:3000"
    volumes:
      - infosec-data:/app/data
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:/app/data/infosec.db
    restart: unless-stopped

volumes:
  infosec-data:
```

### الأوامر الشائعة

```bash
# تشغيل النظام
docker compose up -d

# إيقاف النظام
docker compose down

# عرض السجلات
docker compose logs -f

# تحديث إلى آخر إصدار
docker compose pull && docker compose up -d

# نسخ احتياطي لقاعدة البيانات
docker cp infosec-report-app-1:/app/data/infosec.db ./backup-infosec.db
```

---

## 🔧 التطوير المحلي

### المتطلبات الأساسية

- **Node.js** 20 أو أحدث
- **npm** 10 أو أحدث

### خطوات التثبيت

```bash
# 1. نسخ المشروع
git clone https://github.com/IslamJihad/infosec-report.git
cd infosec-report

# 2. تثبيت الاعتمادات
npm install

# 3. إعداد قاعدة البيانات
npx prisma db push

# 4. تشغيل خادم التطوير
npm run dev
```

ثم افتح: **http://localhost:3000**

### أوامر التطوير

```bash
npm run dev       # تشغيل خادم التطوير (مع Hot Reload)
npm run build     # بناء نسخة الإنتاج
npm run start     # تشغيل نسخة الإنتاج
npm run lint      # فحص الكود
```

### بناء و تشغيل Docker محلياً

```bash
# بناء الصورة
docker build -t infosec-report .

# تشغيل
docker run -d -p 3000:3000 -v infosec-data:/app/data infosec-report
```

---

## 🏗️ البنية التقنية

| المكون | التقنية | الإصدار |
|--------|---------|---------|
| **Framework** | Next.js (App Router) | 16.x |
| **Language** | TypeScript | 5.x |
| **Styling** | Tailwind CSS | 4.x |
| **Database** | SQLite + Prisma ORM | Prisma 7.x |
| **State Management** | Zustand | 5.x |
| **AI Integration** | Google Gemini + NVIDIA NIM (قابل للتبديل من الإعدادات) | — |
| **Charts** | Recharts | 3.x |
| **Animations** | Framer Motion | 12.x |
| **Container** | Docker (Alpine) | — |
| **CI/CD** | GitHub Actions | — |

---

## 📂 هيكل المشروع

```
infosec-report/
├── .github/
│   └── workflows/
│       └── docker-publish.yml    # 🔄 CI/CD: Auto-build Docker on push
├── prisma/
│   └── schema.prisma             # 📐 Database schema
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── reports/          # 📡 Reports CRUD API
│   │   │   ├── settings/         # ⚙️ Settings API
│   │   │   └── ai/review/        # 🤖 AI Review API
│   │   ├── report/[id]/          # 📝 Report editor page
│   │   │   └── preview/          # 🖨️ Print preview page
│   │   ├── settings/             # ⚙️ Settings page
│   │   ├── layout.tsx            # 🎨 Root layout (RTL + Cairo font)
│   │   ├── page.tsx              # 📊 Dashboard
│   │   └── globals.css           # 🎨 Tailwind + custom theme
│   ├── components/
│   │   ├── forms/                # 📝 7 form sections
│   │   │   ├── GeneralInfoForm   #    معلومات عامة
│   │   │   ├── ExecutiveSummary  #    الملخص التنفيذي
│   │   │   ├── KPIForm           #    مؤشرات الأداء
│   │   │   ├── SLAForm           #    مقاييس SLA
│   │   │   ├── RisksForm         #    المخاطر
│   │   │   ├── MaturityForm      #    مقاييس النضج
│   │   │   └── Recommendations   #    التوصيات
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx       # 📑 Navigation sidebar
│   │   │   └── TopBar.tsx        # 🔝 Section header + actions
│   │   ├── report/
│   │   │   └── ReportPreview.tsx # 🖨️ Full professional report
│   │   └── ai/
│   │       └── AIReviewModal.tsx # 🤖 AI review dialog
│   ├── lib/
│   │   ├── db.ts                 # 🗄️ Prisma client singleton
│   │   ├── api.ts                # 📡 Client-side fetch helpers
│   │   └── constants.ts          # 📋 Maps, colors, utilities
│   ├── store/
│   │   └── reportStore.ts        # 🏪 Zustand state management
│   └── types/
│       └── report.ts             # 📐 TypeScript interfaces
├── Dockerfile                    # 🐳 Multi-stage Docker build
├── docker-compose.yml            # 🐳 Docker Compose config
├── docker-entrypoint.sh          # 🐳 Container startup script
└── package.json
```

---

## 🔄 التكامل المستمر (CI/CD)

هذا المشروع متصل تلقائياً بـ Docker Hub عبر **GitHub Actions**.

### كيف يعمل؟

```
Push to GitHub (master) → GitHub Actions → Build Docker Image → Push to Docker Hub
```

1. عند كل `git push` إلى فرع `master`، يتم تشغيل GitHub Actions تلقائياً
2. يبني الـ Workflow صورة Docker جديدة
3. يرفع الصورة إلى Docker Hub باسم `islamjihad/infosec-report:latest`
4. يمكنك أيضاً تشغيل البناء يدوياً من تبويب **Actions** في GitHub

### التحديث التلقائي

```bash
# على جهاز التطوير: عدّل الكود ثم ادفع
git add .
git commit -m "تحسين واجهة التقارير"
git push

# ⏳ انتظر دقيقة أو دقيقتين حتى ينتهي GitHub Actions

# على الخادم: سحب آخر إصدار
docker compose pull && docker compose up -d
```

### البناء اليدوي (اختياري)

يمكنك أيضاً تشغيل البناء يدوياً:
1. اذهب إلى https://github.com/IslamJihad/infosec-report/actions
2. اختر **Build & Push Docker Image**
3. اضغط **Run workflow**

---

## 🔐 متغيرات البيئة

| المتغير | الوصف | القيمة الافتراضية |
|---------|-------|-------------------|
| `DATABASE_URL` | مسار قاعدة بيانات SQLite | `file:/app/data/infosec.db` |
| `PERPLEXITY_API_KEY` | مفتاح Perplexity AI (اختياري) | — |
| `NODE_ENV` | بيئة التشغيل | `production` |
| `PORT` | منفذ الخادم | `3000` |

> **ملاحظة:** يمكن أيضاً إدخال مفتاح Perplexity AI من داخل النظام عبر صفحة **الإعدادات**.

---

## 🤖 الذكاء الاصطناعي

النظام يدعم مراجعة التقارير بالذكاء الاصطناعي عبر **Perplexity AI**:

| نوع المراجعة | الوصف |
|--------------|-------|
| 📋 **مراجعة شاملة** | تحليل كامل للتقرير من جميع الجوانب |
| 👔 **مراجعة إدارية** | ملاحظات مخصصة للإدارة العليا |
| ⚠️ **تحليل المخاطر** | تقييم عميق للمخاطر والتهديدات |
| 🔍 **كشف الثغرات** | اكتشاف النقاط المخفية والثغرات |

### الإعداد

1. احصل على مفتاح API من [Perplexity AI](https://docs.perplexity.ai/)
2. أدخله بإحدى الطريقتين:
   - **من واجهة النظام:** اذهب إلى **الإعدادات** ← أدخل مفتاح API
   - **كمتغير بيئة:** `PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxx`

---

## 📖 أقسام التقرير

يتكون كل تقرير من 7 أقسام رئيسية:

1. **المعلومات العامة** — المنظمة، المؤلف، الفترة، التصنيف الأمني
2. **الملخص التنفيذي** — نتيجة التقييم، القرارات، النقاط الرئيسية
3. **مؤشرات الأداء (KPIs)** — حوادث، ثغرات، نسب التغيير
4. **مقاييس SLA** — MTTD / MTTR / MTTC مع أهداف المقارنة
5. **المخاطر** — قائمة ديناميكية مع حساب تلقائي لدرجة الخطورة
6. **مقاييس النضج** — 8 مجالات أمنية بمعدل إجمالي
7. **التوصيات** — إجراءات مقترحة مع أولويات وحالة التنفيذ

---

## 📄 الترخيص

هذا المشروع للاستخدام الداخلي.

---

<div align="center">

**صُنع بـ ❤️ لقسم أمن المعلومات**

[🐳 Docker Hub](https://hub.docker.com/r/islamjihad/infosec-report) · [📦 GitHub](https://github.com/IslamJihad/infosec-report) · [🚀 تشغيل سريع](#-التشغيل-السريع)

</div>
