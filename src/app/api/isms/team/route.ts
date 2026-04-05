import { NextResponse } from "next/server";
import db from "@/lib/db";
import { ISMS_WORKSPACE_ID, sanitizeEntityPayload } from "@/lib/isms/server";

export async function GET() {
  try {
    const items = await db.ismsTeamMember.findMany({
      where: { workspaceId: ISMS_WORKSPACE_ID },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = sanitizeEntityPayload(await req.json());

    const item = await db.ismsTeamMember.create({
      data: { workspaceId: ISMS_WORKSPACE_ID, ...payload } as any,
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json({ error: "Failed to create team member" }, { status: 500 });
  }
}
