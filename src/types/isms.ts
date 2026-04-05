import type {
  IsmsWorkspaceModel,
  IsmsRiskModel,
  IsmsAssetModel,
  IsmsIncidentModel,
  IsmsTaskModel,
  IsmsTeamMemberModel,
  IsmsKpiModel,
  IsmsSupplierModel,
  IsmsAwarenessModel,
  IsmsAuditModel,
  IsmsNcaModel,
} from "@/generated/prisma/models";

export type IsmsWorkspace = IsmsWorkspaceModel;
export type IsmsRisk = IsmsRiskModel;
export type IsmsAsset = IsmsAssetModel;
export type IsmsIncident = IsmsIncidentModel;
export type IsmsTask = IsmsTaskModel;
export type IsmsTeamMember = IsmsTeamMemberModel;
export type IsmsKpi = IsmsKpiModel;
export type IsmsSupplier = IsmsSupplierModel;
export type IsmsAwareness = IsmsAwarenessModel;
export type IsmsAudit = IsmsAuditModel;
export type IsmsNca = IsmsNcaModel;

export type ControlStatus = "not-started" | "in-progress" | "implemented";
export type RiskStatus = "Open" | "In Treatment" | "Accepted" | "Closed";
export type IncidentSeverity = "Low" | "Medium" | "High" | "Critical";
export type IncidentStatus = "Open" | "Under Investigation" | "Resolved" | "Closed";
export type TaskStatus = "todo" | "inprogress" | "review" | "done";
export type TaskPriority = "Low" | "Medium" | "High" | "Critical";

export interface ClauseData {
  id: string;
  title: string;
  requirements: RequirementData[];
}

export interface RequirementData {
  id: string;
  title: string;
  description: string;
  guidance: string;
}

export interface ControlData {
  id: string;
  theme: "5" | "6" | "7" | "8";
  title: string;
  description: string;
  type: string;
}

export interface ComplianceStats {
  overallPct: number;
  clausePct: Record<string, number>;
  annexPct: Record<"5" | "6" | "7" | "8", number>;
  implementedClauses: number;
  implementedControls: number;
  totalClauses: number;
  totalControls: number;
}

export interface RiskScore {
  score: number;
  level: "Low" | "Medium" | "High" | "Critical";
  color: string;
}

export interface SoaEntry {
  applicable: boolean;
  justification: string;
}

export interface IsmsWorkspaceView extends Omit<IsmsWorkspace, "clauseStatus" | "controlStatus" | "soaData" | "docStatus" | "dailyChecks" | "dailyNotes"> {
  clauseStatus: Record<string, ControlStatus>;
  controlStatus: Record<string, ControlStatus>;
  soaData: Record<string, SoaEntry>;
  docStatus: Record<string, "not-started" | "in-progress" | "implemented">;
  dailyChecks: Record<string, boolean>;
  dailyNotes: Record<string, string>;
}
