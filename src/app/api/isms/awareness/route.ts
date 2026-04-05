import { NextResponse } from "next/server";
import db from "@/lib/db";
import { ISMS_WORKSPACE_ID, sanitizeEntityPayload } from "@/lib/isms/server";

export async function GET() {
  try {
    const items = await db.ismsAwareness.findMany({
      where: { workspaceId: ISMS_WORKSPACE_ID },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching awareness:", error);
    return NextResponse.json({ error: "Failed to fetch awareness" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = sanitizeEntityPayload(await req.json());

    const item = await db.ismsAwareness.create({
      data: { workspaceId: ISMS_WORKSPACE_ID, ...payload } as any,
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error creating awareness:", error);
    return NextResponse.json({ error: "Failed to create awareness" }, { status: 500 });
  }
}
