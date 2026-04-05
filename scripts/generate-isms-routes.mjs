import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const apiRoot = path.join(repoRoot, "src", "app", "api", "isms");

const entities = [
  { route: "risks", delegate: "ismsRisk", orderBy: "sortOrder" },
  { route: "assets", delegate: "ismsAsset", orderBy: "sortOrder" },
  { route: "incidents", delegate: "ismsIncident", orderBy: "sortOrder" },
  { route: "tasks", delegate: "ismsTask", orderBy: "sortOrder" },
  { route: "team", delegate: "ismsTeamMember", orderBy: "name" },
  { route: "kpis", delegate: "ismsKpi", orderBy: "sortOrder" },
  { route: "suppliers", delegate: "ismsSupplier", orderBy: "sortOrder" },
  { route: "awareness", delegate: "ismsAwareness", orderBy: "sortOrder" },
  { route: "audits", delegate: "ismsAudit", orderBy: "sortOrder" },
  { route: "ncas", delegate: "ismsNca", orderBy: "sortOrder" },
];

function createCollectionRoute(delegate, route, orderBy) {
  return `import { NextResponse } from "next/server";
import db from "@/lib/db";
import { ISMS_WORKSPACE_ID, sanitizeEntityPayload } from "@/lib/isms/server";

export async function GET() {
  try {
    const items = await db.${delegate}.findMany({
      where: { workspaceId: ISMS_WORKSPACE_ID },
      orderBy: { ${orderBy}: "asc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching ${route}:", error);
    return NextResponse.json({ error: "Failed to fetch ${route}" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = sanitizeEntityPayload(await req.json());

    const item = await db.${delegate}.create({
      data: { workspaceId: ISMS_WORKSPACE_ID, ...payload } as any,
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error creating ${route}:", error);
    return NextResponse.json({ error: "Failed to create ${route.slice(0, -1)}" }, { status: 500 });
  }
}
`;
}

function createIdRoute(delegate, route) {
  return `import { NextResponse } from "next/server";
import db from "@/lib/db";
import { sanitizeEntityPayload } from "@/lib/isms/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const payload = sanitizeEntityPayload(await req.json());

    const item = await db.${delegate}.update({
      where: { id },
      data: payload as any,
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error updating ${route}:", error);
    return NextResponse.json({ error: "Failed to update ${route.slice(0, -1)}" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await db.${delegate}.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting ${route}:", error);
    return NextResponse.json({ error: "Failed to delete ${route.slice(0, -1)}" }, { status: 500 });
  }
}
`;
}

for (const entity of entities) {
  const collectionDir = path.join(apiRoot, entity.route);
  const idDir = path.join(collectionDir, "[id]");

  fs.mkdirSync(collectionDir, { recursive: true });
  fs.mkdirSync(idDir, { recursive: true });

  fs.writeFileSync(
    path.join(collectionDir, "route.ts"),
    createCollectionRoute(entity.delegate, entity.route, entity.orderBy),
    "utf8",
  );

  fs.writeFileSync(
    path.join(idDir, "route.ts"),
    createIdRoute(entity.delegate, entity.route),
    "utf8",
  );
}

console.log(`Generated ${entities.length} ISMS entity route sets.`);
