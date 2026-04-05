import { NextResponse } from "next/server";
import db from "@/lib/db";
import { ISMS_WORKSPACE_ID, parseJsonMap } from "@/lib/isms/server";

function parseWorkspace(workspace: {
  clauseStatus: string;
  controlStatus: string;
  soaData: string;
  docStatus: string;
  dailyChecks: string;
  dailyNotes: string;
  [key: string]: unknown;
}) {
  return {
    ...workspace,
    clauseStatus: parseJsonMap(workspace.clauseStatus, {}),
    controlStatus: parseJsonMap(workspace.controlStatus, {}),
    soaData: parseJsonMap(workspace.soaData, {}),
    docStatus: parseJsonMap(workspace.docStatus, {}),
    dailyChecks: parseJsonMap(workspace.dailyChecks, {}),
    dailyNotes: parseJsonMap(workspace.dailyNotes, {}),
  };
}

export async function GET() {
  try {
    const [
      workspace,
      risks,
      assets,
      incidents,
      tasks,
      team,
      kpis,
      suppliers,
      awareness,
      audits,
      ncas,
    ] = await Promise.all([
      db.ismsWorkspace.upsert({
        where: { id: ISMS_WORKSPACE_ID },
        update: {},
        create: { id: ISMS_WORKSPACE_ID },
      }),
      db.ismsRisk.findMany({ where: { workspaceId: ISMS_WORKSPACE_ID }, orderBy: { sortOrder: "asc" } }),
      db.ismsAsset.findMany({ where: { workspaceId: ISMS_WORKSPACE_ID }, orderBy: { sortOrder: "asc" } }),
      db.ismsIncident.findMany({ where: { workspaceId: ISMS_WORKSPACE_ID }, orderBy: { sortOrder: "asc" } }),
      db.ismsTask.findMany({ where: { workspaceId: ISMS_WORKSPACE_ID }, orderBy: { sortOrder: "asc" } }),
      db.ismsTeamMember.findMany({ where: { workspaceId: ISMS_WORKSPACE_ID }, orderBy: { name: "asc" } }),
      db.ismsKpi.findMany({ where: { workspaceId: ISMS_WORKSPACE_ID }, orderBy: { sortOrder: "asc" } }),
      db.ismsSupplier.findMany({ where: { workspaceId: ISMS_WORKSPACE_ID }, orderBy: { sortOrder: "asc" } }),
      db.ismsAwareness.findMany({ where: { workspaceId: ISMS_WORKSPACE_ID }, orderBy: { sortOrder: "asc" } }),
      db.ismsAudit.findMany({ where: { workspaceId: ISMS_WORKSPACE_ID }, orderBy: { sortOrder: "asc" } }),
      db.ismsNca.findMany({ where: { workspaceId: ISMS_WORKSPACE_ID }, orderBy: { sortOrder: "asc" } }),
    ]);

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      workspace: parseWorkspace(workspace),
      risks,
      assets,
      incidents,
      tasks,
      team,
      kpis,
      suppliers,
      awareness,
      audits,
      ncas,
    });
  } catch (error) {
    console.error("Error exporting ISMS data:", error);
    return NextResponse.json({ error: "Failed to export ISMS data" }, { status: 500 });
  }
}
