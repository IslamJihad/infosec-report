import { NextResponse } from "next/server";
import db from "@/lib/db";
import {
  ISMS_WORKSPACE_ID,
  parseJsonMap,
  stringifyJsonMap,
} from "@/lib/isms/server";

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

type WorkspacePersistenceData = Partial<
  Record<(typeof SCALAR_FIELDS)[number] | (typeof JSON_FIELDS)[number], string>
>;

class WorkspaceValidationError extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseWorkspaceMap(value: string): Record<string, unknown> {
  const parsed = parseJsonMap<unknown>(value, {});
  return isRecord(parsed) ? parsed : {};
}

function normalizeScalarValue(field: (typeof SCALAR_FIELDS)[number], value: unknown): string {
  if (value == null) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  throw new WorkspaceValidationError(`${field} must be a string`);
}

function normalizeJsonValue(field: (typeof JSON_FIELDS)[number], value: unknown): string {
  if (value == null) {
    return stringifyJsonMap({}, {});
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (!isRecord(parsed)) {
        throw new WorkspaceValidationError(`${field} must be a JSON object`);
      }

      return stringifyJsonMap(parsed, {});
    } catch {
      throw new WorkspaceValidationError(`${field} must be a valid JSON object`);
    }
  }

  if (!isRecord(value)) {
    throw new WorkspaceValidationError(`${field} must be a JSON object`);
  }

  return stringifyJsonMap(value, {});
}

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
    clauseStatus: parseWorkspaceMap(workspace.clauseStatus),
    controlStatus: parseWorkspaceMap(workspace.controlStatus),
    soaData: parseWorkspaceMap(workspace.soaData),
    docStatus: parseWorkspaceMap(workspace.docStatus),
    dailyChecks: parseWorkspaceMap(workspace.dailyChecks),
    dailyNotes: parseWorkspaceMap(workspace.dailyNotes),
  };
}

export async function GET() {
  try {
    const workspace = await db.ismsWorkspace.upsert({
      where: { id: ISMS_WORKSPACE_ID },
      update: {},
      create: { id: ISMS_WORKSPACE_ID },
    });

    return NextResponse.json(parseWorkspace(workspace));
  } catch (error) {
    console.error("Error fetching ISMS workspace:", error);
    return NextResponse.json({ error: "Failed to fetch workspace" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const rawPayload = (await req.json()) as unknown;
    if (!isRecord(rawPayload)) {
      return NextResponse.json({ error: "Workspace payload must be an object" }, { status: 400 });
    }

    const payload = rawPayload;
    const data: WorkspacePersistenceData = {};

    for (const field of SCALAR_FIELDS) {
      if (field in payload) {
        data[field] = normalizeScalarValue(field, payload[field]);
      }
    }

    for (const field of JSON_FIELDS) {
      if (field in payload) {
        data[field] = normalizeJsonValue(field, payload[field]);
      }
    }

    const workspace = await db.ismsWorkspace.upsert({
      where: { id: ISMS_WORKSPACE_ID },
      update: data,
      create: {
        id: ISMS_WORKSPACE_ID,
        ...data,
      },
    });

    return NextResponse.json(parseWorkspace(workspace));
  } catch (error) {
    if (error instanceof WorkspaceValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Error updating ISMS workspace:", error);
    return NextResponse.json({ error: "Failed to update workspace" }, { status: 500 });
  }
}
