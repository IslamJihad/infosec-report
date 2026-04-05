import type { ControlStatus, ComplianceStats, IsmsKpi } from "@/types/isms";
import { ANNEX_A_CONTROLS, ISO_CLAUSES } from "@/lib/isms/constants";

function pct(implemented: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((implemented / total) * 100);
}

export function getRiskScore(likelihood: number, impact: number): number {
  return likelihood * impact;
}

export function getRiskLevel(score: number): "Low" | "Medium" | "High" | "Critical" {
  if (score >= 20) return "Critical";
  if (score >= 10) return "High";
  if (score >= 5) return "Medium";
  return "Low";
}

export function getRiskColor(level: string): string {
  const colors = {
    Critical: "bg-red-500/20 text-red-400 border-red-500/30",
    High: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    Medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    Low: "bg-green-500/20 text-green-400 border-green-500/30",
  };

  return colors[level as keyof typeof colors] ?? colors.Medium;
}

export function getClauseCompliancePct(
  clauseId: string,
  clauseStatus: Record<string, ControlStatus>,
): number {
  const requirementIds = ISO_CLAUSES
    .find((clause) => clause.id === clauseId)
    ?.requirements.map((req) => req.id) ?? [];

  const implemented = requirementIds.filter((reqId) => clauseStatus[reqId] === "implemented").length;
  return pct(implemented, requirementIds.length);
}

export function getAnnexThemePct(
  theme: "5" | "6" | "7" | "8",
  controlStatus: Record<string, ControlStatus>,
): number {
  const themeControlIds = ANNEX_A_CONTROLS
    .filter((control) => control.theme === theme)
    .map((control) => control.id);

  const implemented = themeControlIds.filter((controlId) => controlStatus[controlId] === "implemented").length;
  return pct(implemented, themeControlIds.length);
}

export function computeComplianceStats(
  clauseStatus: Record<string, ControlStatus>,
  controlStatus: Record<string, ControlStatus>,
): ComplianceStats {
  const clausePct = Object.fromEntries(
    ISO_CLAUSES.map((clause) => [clause.id, getClauseCompliancePct(clause.id, clauseStatus)]),
  );

  const annexPct = {
    "5": getAnnexThemePct("5", controlStatus),
    "6": getAnnexThemePct("6", controlStatus),
    "7": getAnnexThemePct("7", controlStatus),
    "8": getAnnexThemePct("8", controlStatus),
  };

  const totalClauses = ISO_CLAUSES.reduce((sum, clause) => sum + clause.requirements.length, 0);
  const totalControls = ANNEX_A_CONTROLS.length;

  const implementedClauses = Object.values(clauseStatus).filter((status) => status === "implemented").length;
  const implementedControls = Object.values(controlStatus).filter((status) => status === "implemented").length;

  return {
    overallPct: pct(implementedClauses + implementedControls, totalClauses + totalControls),
    clausePct,
    annexPct,
    implementedClauses,
    implementedControls,
    totalClauses,
    totalControls,
  };
}

export function getKpiStatus(kpi: IsmsKpi): "on-target" | "below-target" | "critical" {
  if (kpi.target <= 0) return "critical";

  const ratio = kpi.current / kpi.target;
  if (ratio >= 1) return "on-target";
  if (ratio >= 0.8) return "below-target";
  return "critical";
}

export function getTaskDueStatus(dueDate: string): "overdue" | "due-soon" | "ok" | "none" {
  if (!dueDate) return "none";

  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return "none";

  const now = new Date();
  const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

  if (diff < 0) return "overdue";
  if (diff <= 3) return "due-soon";
  return "ok";
}
