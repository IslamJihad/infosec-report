-- CreateTable
CREATE TABLE "EfficiencyKPI" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "val" REAL NOT NULL DEFAULT 0,
    "target" REAL NOT NULL DEFAULT 100,
    "unit" TEXT NOT NULL DEFAULT '%',
    "description" TEXT NOT NULL DEFAULT '',
    "lowerBetter" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "EfficiencyKPI_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Decision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "budget" TEXT NOT NULL DEFAULT '',
    "department" TEXT NOT NULL DEFAULT '',
    "timeline" TEXT NOT NULL DEFAULT '',
    "owner" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Decision_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Decision" ("budget", "department", "description", "id", "reportId", "sortOrder", "timeline", "title") SELECT "budget", "department", "description", "id", "reportId", "sortOrder", "timeline", "title" FROM "Decision";
DROP TABLE "Decision";
ALTER TABLE "new_Decision" RENAME TO "Decision";
CREATE TABLE "new_Recommendation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "department" TEXT NOT NULL DEFAULT '',
    "timeline" TEXT NOT NULL DEFAULT '',
    "owner" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Recommendation_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Recommendation" ("department", "description", "id", "priority", "reportId", "sortOrder", "timeline", "title") SELECT "department", "description", "id", "priority", "reportId", "sortOrder", "timeline", "title" FROM "Recommendation";
DROP TABLE "Recommendation";
ALTER TABLE "new_Recommendation" RENAME TO "Recommendation";
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
    "chairNote" TEXT NOT NULL DEFAULT '',
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
INSERT INTO "new_Report" ("author", "bmCompliance", "bmMTTD", "bmMTTR", "bmScore", "bmSector", "classification", "createdAt", "id", "incClosed", "incOpen", "incProgress", "incWatch", "isoControls", "issueDate", "kpiCompliance", "kpiCritical", "kpiTotal", "kpiVuln", "logoBase64", "orgName", "period", "prevCompliance", "prevCritical", "prevTotal", "prevVuln", "recipientName", "securityLevel", "securityScore", "showMaturity", "showSLA", "slaBreach", "slaMTTC", "slaMTTCTarget", "slaMTTD", "slaMTTDTarget", "slaMTTR", "slaMTTRTarget", "slaRate", "status", "summary", "title", "trend", "updatedAt", "version", "vulnCritical", "vulnHigh", "vulnLow", "vulnMedium", "vulnRecurring", "vulnResolved") SELECT "author", "bmCompliance", "bmMTTD", "bmMTTR", "bmScore", "bmSector", "classification", "createdAt", "id", "incClosed", "incOpen", "incProgress", "incWatch", "isoControls", "issueDate", "kpiCompliance", "kpiCritical", "kpiTotal", "kpiVuln", "logoBase64", "orgName", "period", "prevCompliance", "prevCritical", "prevTotal", "prevVuln", "recipientName", "securityLevel", "securityScore", "showMaturity", "showSLA", "slaBreach", "slaMTTC", "slaMTTCTarget", "slaMTTD", "slaMTTDTarget", "slaMTTR", "slaMTTRTarget", "slaRate", "status", "summary", "title", "trend", "updatedAt", "version", "vulnCritical", "vulnHigh", "vulnLow", "vulnMedium", "vulnRecurring", "vulnResolved" FROM "Report";
DROP TABLE "Report";
ALTER TABLE "new_Report" RENAME TO "Report";
CREATE TABLE "new_Risk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "system" TEXT NOT NULL DEFAULT '',
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'open',
    "probability" INTEGER NOT NULL DEFAULT 3,
    "impact" INTEGER NOT NULL DEFAULT 3,
    "worstCase" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Risk_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Risk" ("description", "id", "impact", "probability", "reportId", "severity", "sortOrder", "status", "system") SELECT "description", "id", "impact", "probability", "reportId", "severity", "sortOrder", "status", "system" FROM "Risk";
DROP TABLE "Risk";
ALTER TABLE "new_Risk" RENAME TO "Risk";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
