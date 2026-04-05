import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const repoRoot = process.cwd();
const htmlPath = path.join(repoRoot, "ISO27001-CISO-Command-Suite .html");
const outPath = path.join(repoRoot, "src", "lib", "isms", "constants.ts");

const html = fs.readFileSync(htmlPath, "utf8");

function extract(regex, label) {
  const match = html.match(regex);
  if (!match?.[1]) {
    throw new Error(`Failed to extract ${label}`);
  }
  return match[1].trim();
}

function evaluateLiteral(source) {
  return vm.runInNewContext(`(${source})`);
}

const clauseData = evaluateLiteral(
  extract(/const CLAUSE_DATA = (\{[\s\S]*?\n\});\s*\n\s*\/\/ Annex A/, "CLAUSE_DATA"),
);

const annexData = evaluateLiteral(
  extract(/const ANNEX_A = (\{[\s\S]*?\n\});\s*\n\s*const MANDATORY_DOCS=/, "ANNEX_A"),
);

const mandatoryDocs = evaluateLiteral(
  extract(/const MANDATORY_DOCS=(\[[\s\S]*?\]);\s*\n\s*const SUPPORTING_DOCS=/, "MANDATORY_DOCS"),
);

const supportingDocs = evaluateLiteral(
  extract(/const SUPPORTING_DOCS=(\[[\s\S]*?\]);\s*\n\s*const POLICY_DOCS=/, "SUPPORTING_DOCS"),
);

const policyDocs = evaluateLiteral(
  extract(/const POLICY_DOCS=(\[[\s\S]*?\]);\s*\n\s*\/\/ Daily checklist items/, "POLICY_DOCS"),
);

const daily = evaluateLiteral(
  extract(/const DAILY=(\[[\s\S]*?\]);\s*\n\s*\/\/ Roadmap stages/, "DAILY"),
);

const roadmap = evaluateLiteral(
  extract(/const ROADMAP=(\[[\s\S]*?\]);\s*\n\s*\/\/ ═════════/, "ROADMAP"),
);

const typeLabel = {
  p: "Preventive",
  d: "Detective",
  c: "Corrective",
};

const isoClauses = Object.entries(clauseData).map(([id, clause]) => ({
  id,
  title: clause.title,
  requirements: clause.reqs.map((req) => ({
    id: req.id,
    title: req.title,
    description: req.desc,
    guidance: [req.guidance, req.ciso].filter(Boolean).join(" ").trim(),
  })),
}));

const annexControls = Object.entries(annexData).flatMap(([theme, data]) =>
  data.controls.map((control) => ({
    id: control.id,
    theme,
    title: control.n,
    description: control.n,
    type: typeLabel[control.t] ?? "Preventive",
  })),
);

const normalizeDocs = (list) =>
  list.map((doc) => ({
    ref: doc.ref,
    title: doc.n,
    clause: doc.cl,
  }));

const roadmapPhases = roadmap.map((phase, index) => ({
  id: index + 1,
  title: phase.title,
  weeks: phase.weeks,
  status: phase.st,
  items: phase.items,
}));

const dailyChecklist = daily.map((group) => ({
  category: String(group.title).replace(/^[^A-Za-z0-9]+\s*/g, ""),
  items: group.items.map((item) => ({
    id: item.id,
    label: item.t,
  })),
}));

const riskCategories = [
  "Cyber Threat",
  "Compliance",
  "Operational",
  "Physical",
  "Third Party",
  "Human Error",
  "Business Continuity",
  "Data Privacy",
  "Financial",
  "Reputational",
];

const incidentCategories = [
  "Data Breach",
  "Malware",
  "Phishing",
  "Ransomware",
  "Unauthorised Access",
  "Insider Threat",
  "System Failure",
  "Physical Security",
  "Other",
];

const content = `import type { ClauseData, ControlData } from \"@/types/isms\";

type DocumentRegisterItem = {
  ref: string;
  title: string;
  clause: string;
};

type RoadmapPhase = {
  id: number;
  title: string;
  weeks: string;
  status: \"done\" | \"active\" | \"pending\";
  items: string[];
};

type DailyChecklistGroup = {
  category: string;
  items: Array<{ id: string; label: string }>;
};

export const ISO_CLAUSES: ClauseData[] = ${JSON.stringify(isoClauses, null, 2)};

export const ANNEX_A_CONTROLS: ControlData[] = ${JSON.stringify(annexControls, null, 2)};

export const MANDATORY_DOCUMENTS: DocumentRegisterItem[] = ${JSON.stringify(normalizeDocs(mandatoryDocs), null, 2)};

export const SUPPORTING_DOCUMENTS: DocumentRegisterItem[] = ${JSON.stringify(normalizeDocs(supportingDocs), null, 2)};

export const POLICY_DOCUMENTS: DocumentRegisterItem[] = ${JSON.stringify(normalizeDocs(policyDocs), null, 2)};

export const ROADMAP_PHASES: RoadmapPhase[] = ${JSON.stringify(roadmapPhases, null, 2)};

export const DAILY_CHECKLIST: DailyChecklistGroup[] = ${JSON.stringify(dailyChecklist, null, 2)};

export const RISK_CATEGORIES = ${JSON.stringify(riskCategories, null, 2)};

export const INCIDENT_CATEGORIES = ${JSON.stringify(incidentCategories, null, 2)};
`;

fs.writeFileSync(outPath, content, "utf8");
console.log(`Generated ${path.relative(repoRoot, outPath)} with ${annexControls.length} Annex A controls.`);
