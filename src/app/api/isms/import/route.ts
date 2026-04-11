import { NextResponse } from "next/server";
import db from "@/lib/db";
import {
  ISMS_WORKSPACE_ID,
  sanitizeEntityPayload,
  stringifyJsonMap,
} from "@/lib/isms/server";

const MAX_IMPORT_BODY_BYTES = 2_000_000;
const MAX_COLLECTION_ITEMS = 5_000;

const JSON_FIELDS = [
  "clauseStatus",
  "controlStatus",
  "soaData",
  "docStatus",
  "dailyChecks",
  "dailyNotes",
] as const;

const SCALAR_FIELDS = [
  "orgName",
  "cisoName",
  "scope",
  "certBody",
  "targetDate",
  "industry",
  "employeeCount",
] as const;

type ImportPayload = {
  confirmReplace?: boolean;
  workspace?: Record<string, unknown>;
  risks?: Array<Record<string, unknown>>;
  assets?: Array<Record<string, unknown>>;
  incidents?: Array<Record<string, unknown>>;
  tasks?: Array<Record<string, unknown>>;
  team?: Array<Record<string, unknown>>;
  kpis?: Array<Record<string, unknown>>;
  suppliers?: Array<Record<string, unknown>>;
  awareness?: Array<Record<string, unknown>>;
  audits?: Array<Record<string, unknown>>;
  ncas?: Array<Record<string, unknown>>;
};

class ImportValidationError extends Error {}

function normalizeScalar(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  throw new ImportValidationError("Workspace scalar fields must be strings, numbers, or booleans.");
}

function ensureArray(value: unknown, fieldName: string): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) {
    return [];
  }

  if (value.length > MAX_COLLECTION_ITEMS) {
    throw new ImportValidationError(`Field ${fieldName} exceeds the allowed maximum of ${MAX_COLLECTION_ITEMS} items.`);
  }

  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new ImportValidationError(`Field ${fieldName} contains invalid records.`);
    }
  }

  return value as Array<Record<string, unknown>>;
}

function withSortOrder(item: Record<string, unknown>, idx: number): Record<string, unknown> {
  const payload = sanitizeEntityPayload(item);
  if (typeof payload.sortOrder !== "number") {
    payload.sortOrder = idx;
  }
  return payload;
}

function workspaceUpdateFromPayload(workspace: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!workspace) {
    return {};
  }

  const data: Record<string, unknown> = {};

  for (const field of SCALAR_FIELDS) {
    if (field in workspace) {
      data[field] = normalizeScalar(workspace[field]);
    }
  }

  for (const field of JSON_FIELDS) {
    if (field in workspace) {
      data[field] = stringifyJsonMap(workspace[field], {});
    }
  }

  return data;
}

export async function POST(req: Request) {
  try {
    const contentLengthHeader = req.headers.get("content-length");
    if (contentLengthHeader) {
      const contentLength = Number(contentLengthHeader);
      if (Number.isFinite(contentLength) && contentLength > MAX_IMPORT_BODY_BYTES) {
        return NextResponse.json({ error: "Import payload is too large" }, { status: 413 });
      }
    }

    const rawPayload = await req.json().catch(() => null);
    if (!rawPayload || typeof rawPayload !== "object" || Array.isArray(rawPayload)) {
      return NextResponse.json({ error: "Invalid import payload" }, { status: 400 });
    }

    const payload = rawPayload as ImportPayload;
    if (payload.confirmReplace === false) {
      return NextResponse.json({ error: "Import requires explicit replacement confirmation" }, { status: 400 });
    }

    const workspaceData = workspaceUpdateFromPayload(payload.workspace);

    const risks = ensureArray(payload.risks, "risks");
    const assets = ensureArray(payload.assets, "assets");
    const incidents = ensureArray(payload.incidents, "incidents");
    const tasks = ensureArray(payload.tasks, "tasks");
    const team = ensureArray(payload.team, "team");
    const kpis = ensureArray(payload.kpis, "kpis");
    const suppliers = ensureArray(payload.suppliers, "suppliers");
    const awareness = ensureArray(payload.awareness, "awareness");
    const audits = ensureArray(payload.audits, "audits");
    const ncas = ensureArray(payload.ncas, "ncas");

    await db.$transaction(async (tx) => {
      await tx.ismsWorkspace.upsert({
        where: { id: ISMS_WORKSPACE_ID },
        update: workspaceData,
        create: {
          id: ISMS_WORKSPACE_ID,
          ...workspaceData,
        } as any,
      });

      await tx.ismsRisk.deleteMany({ where: { workspaceId: ISMS_WORKSPACE_ID } });
      await tx.ismsAsset.deleteMany({ where: { workspaceId: ISMS_WORKSPACE_ID } });
      await tx.ismsIncident.deleteMany({ where: { workspaceId: ISMS_WORKSPACE_ID } });
      await tx.ismsTask.deleteMany({ where: { workspaceId: ISMS_WORKSPACE_ID } });
      await tx.ismsTeamMember.deleteMany({ where: { workspaceId: ISMS_WORKSPACE_ID } });
      await tx.ismsKpi.deleteMany({ where: { workspaceId: ISMS_WORKSPACE_ID } });
      await tx.ismsSupplier.deleteMany({ where: { workspaceId: ISMS_WORKSPACE_ID } });
      await tx.ismsAwareness.deleteMany({ where: { workspaceId: ISMS_WORKSPACE_ID } });
      await tx.ismsAudit.deleteMany({ where: { workspaceId: ISMS_WORKSPACE_ID } });
      await tx.ismsNca.deleteMany({ where: { workspaceId: ISMS_WORKSPACE_ID } });

      if (risks.length > 0) {
        await tx.ismsRisk.createMany({
          data: risks.map((item, idx) => ({
            workspaceId: ISMS_WORKSPACE_ID,
            ...withSortOrder(item, idx),
          })) as any,
        });
      }

      if (assets.length > 0) {
        await tx.ismsAsset.createMany({
          data: assets.map((item, idx) => ({
            workspaceId: ISMS_WORKSPACE_ID,
            ...withSortOrder(item, idx),
          })) as any,
        });
      }

      if (incidents.length > 0) {
        await tx.ismsIncident.createMany({
          data: incidents.map((item, idx) => ({
            workspaceId: ISMS_WORKSPACE_ID,
            ...withSortOrder(item, idx),
          })) as any,
        });
      }

      if (tasks.length > 0) {
        await tx.ismsTask.createMany({
          data: tasks.map((item, idx) => ({
            workspaceId: ISMS_WORKSPACE_ID,
            ...withSortOrder(item, idx),
          })) as any,
        });
      }

      if (team.length > 0) {
        await tx.ismsTeamMember.createMany({
          data: team.map((item) => ({
            workspaceId: ISMS_WORKSPACE_ID,
            ...sanitizeEntityPayload(item),
          })) as any,
        });
      }

      if (kpis.length > 0) {
        await tx.ismsKpi.createMany({
          data: kpis.map((item, idx) => ({
            workspaceId: ISMS_WORKSPACE_ID,
            ...withSortOrder(item, idx),
          })) as any,
        });
      }

      if (suppliers.length > 0) {
        await tx.ismsSupplier.createMany({
          data: suppliers.map((item, idx) => ({
            workspaceId: ISMS_WORKSPACE_ID,
            ...withSortOrder(item, idx),
          })) as any,
        });
      }

      if (awareness.length > 0) {
        await tx.ismsAwareness.createMany({
          data: awareness.map((item, idx) => ({
            workspaceId: ISMS_WORKSPACE_ID,
            ...withSortOrder(item, idx),
          })) as any,
        });
      }

      if (audits.length > 0) {
        await tx.ismsAudit.createMany({
          data: audits.map((item, idx) => ({
            workspaceId: ISMS_WORKSPACE_ID,
            ...withSortOrder(item, idx),
          })) as any,
        });
      }

      if (ncas.length > 0) {
        await tx.ismsNca.createMany({
          data: ncas.map((item, idx) => ({
            workspaceId: ISMS_WORKSPACE_ID,
            ...withSortOrder(item, idx),
          })) as any,
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ImportValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Error importing ISMS data:", error);
    return NextResponse.json({ error: "Failed to import ISMS data" }, { status: 500 });
  }
}
