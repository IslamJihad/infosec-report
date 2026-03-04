-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL DEFAULT 'تقرير أمن المعلومات',
    "orgName" TEXT NOT NULL DEFAULT 'شركة المستقبل للتقنية',
    "recipientName" TEXT NOT NULL DEFAULT '',
    "period" TEXT NOT NULL DEFAULT '',
    "issueDate" TEXT NOT NULL DEFAULT '',
    "version" TEXT NOT NULL DEFAULT '1.0',
    "author" TEXT NOT NULL DEFAULT 'إدارة أمن المعلومات',
    "classification" TEXT NOT NULL DEFAULT 'سري',
    "logoBase64" TEXT NOT NULL DEFAULT '',
    "summary" TEXT NOT NULL DEFAULT '',
    "securityLevel" TEXT NOT NULL DEFAULT 'متوسط',
    "securityScore" INTEGER NOT NULL DEFAULT 0,
    "trend" TEXT NOT NULL DEFAULT 'مستقر →',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "kpiCritical" INTEGER NOT NULL DEFAULT 0,
    "kpiVuln" INTEGER NOT NULL DEFAULT 0,
    "kpiTotal" INTEGER NOT NULL DEFAULT 0,
    "kpiCompliance" INTEGER NOT NULL DEFAULT 0,
    "prevCritical" INTEGER NOT NULL DEFAULT 0,
    "prevVuln" INTEGER NOT NULL DEFAULT 0,
    "prevTotal" INTEGER NOT NULL DEFAULT 0,
    "prevCompliance" INTEGER NOT NULL DEFAULT 0,
    "vulnCritical" INTEGER NOT NULL DEFAULT 0,
    "vulnHigh" INTEGER NOT NULL DEFAULT 0,
    "vulnMedium" INTEGER NOT NULL DEFAULT 0,
    "vulnLow" INTEGER NOT NULL DEFAULT 0,
    "incOpen" INTEGER NOT NULL DEFAULT 0,
    "incProgress" INTEGER NOT NULL DEFAULT 0,
    "incClosed" INTEGER NOT NULL DEFAULT 0,
    "incWatch" INTEGER NOT NULL DEFAULT 0,
    "slaMTTD" REAL NOT NULL DEFAULT 0,
    "slaMTTR" REAL NOT NULL DEFAULT 0,
    "slaMTTC" REAL NOT NULL DEFAULT 0,
    "slaMTTDTarget" REAL NOT NULL DEFAULT 2,
    "slaMTTRTarget" REAL NOT NULL DEFAULT 8,
    "slaMTTCTarget" REAL NOT NULL DEFAULT 24,
    "slaRate" REAL NOT NULL DEFAULT 0,
    "slaBreach" INTEGER NOT NULL DEFAULT 0,
    "showSLA" BOOLEAN NOT NULL DEFAULT true,
    "showMaturity" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Decision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "budget" TEXT NOT NULL DEFAULT '',
    "department" TEXT NOT NULL DEFAULT '',
    "timeline" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Decision_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Risk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "system" TEXT NOT NULL DEFAULT '',
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'open',
    "probability" INTEGER NOT NULL DEFAULT 3,
    "impact" INTEGER NOT NULL DEFAULT 3,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Risk_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaturityDomain" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "score" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "MaturityDomain_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "department" TEXT NOT NULL DEFAULT '',
    "timeline" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Recommendation_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIConversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "reviewType" TEXT NOT NULL DEFAULT 'full',
    "messages" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIConversation_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "aiApiKey" TEXT NOT NULL DEFAULT '',
    "aiModel" TEXT NOT NULL DEFAULT 'sonar',
    "defaultOrgName" TEXT NOT NULL DEFAULT '',
    "defaultAuthor" TEXT NOT NULL DEFAULT ''
);
