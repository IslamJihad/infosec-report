-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "value" TEXT NOT NULL DEFAULT '',
    "protectionLevel" INTEGER NOT NULL DEFAULT 50,
    "gaps" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Asset_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'budget',
    "rootCause" TEXT NOT NULL DEFAULT '',
    "requirement" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Challenge_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Report" (
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
    "vulnResolved" INTEGER NOT NULL DEFAULT 0,
    "vulnRecurring" INTEGER NOT NULL DEFAULT 0,
    "bmScore" INTEGER NOT NULL DEFAULT 0,
    "bmCompliance" INTEGER NOT NULL DEFAULT 0,
    "bmMTTD" REAL NOT NULL DEFAULT 0,
    "bmMTTR" REAL NOT NULL DEFAULT 0,
    "bmSector" TEXT NOT NULL DEFAULT '',
    "isoControls" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Report" ("author", "classification", "createdAt", "id", "incClosed", "incOpen", "incProgress", "incWatch", "issueDate", "kpiCompliance", "kpiCritical", "kpiTotal", "kpiVuln", "logoBase64", "orgName", "period", "prevCompliance", "prevCritical", "prevTotal", "prevVuln", "recipientName", "securityLevel", "securityScore", "showMaturity", "showSLA", "slaBreach", "slaMTTC", "slaMTTCTarget", "slaMTTD", "slaMTTDTarget", "slaMTTR", "slaMTTRTarget", "slaRate", "status", "summary", "title", "trend", "updatedAt", "version", "vulnCritical", "vulnHigh", "vulnLow", "vulnMedium") SELECT "author", "classification", "createdAt", "id", "incClosed", "incOpen", "incProgress", "incWatch", "issueDate", "kpiCompliance", "kpiCritical", "kpiTotal", "kpiVuln", "logoBase64", "orgName", "period", "prevCompliance", "prevCritical", "prevTotal", "prevVuln", "recipientName", "securityLevel", "securityScore", "showMaturity", "showSLA", "slaBreach", "slaMTTC", "slaMTTCTarget", "slaMTTD", "slaMTTDTarget", "slaMTTR", "slaMTTRTarget", "slaRate", "status", "summary", "title", "trend", "updatedAt", "version", "vulnCritical", "vulnHigh", "vulnLow", "vulnMedium" FROM "Report";
DROP TABLE "Report";
ALTER TABLE "new_Report" RENAME TO "Report";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
