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
    const payload = (await req.json()) as Record<string, unknown>;
    const data: Record<string, unknown> = {};

    for (const field of SCALAR_FIELDS) {
      if (field in payload) {
        data[field] = payload[field];
      }
    }

    for (const field of JSON_FIELDS) {
      if (field in payload) {
        data[field] = stringifyJsonMap(payload[field], {});
      }
    }

    const workspace = await db.ismsWorkspace.upsert({
      where: { id: ISMS_WORKSPACE_ID },
      update: data,
      create: {
        id: ISMS_WORKSPACE_ID,
        ...data,
      } as any,
    });

    return NextResponse.json(parseWorkspace(workspace));
  } catch (error) {
    console.error("Error updating ISMS workspace:", error);
    return NextResponse.json({ error: "Failed to update workspace" }, { status: 500 });
  }
}
