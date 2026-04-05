import { NextResponse } from "next/server";
import db from "@/lib/db";
import { sanitizeEntityPayload } from "@/lib/isms/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const payload = sanitizeEntityPayload(await req.json());

    const item = await db.ismsIncident.update({
      where: { id },
      data: payload as any,
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error updating incidents:", error);
    return NextResponse.json({ error: "Failed to update incident" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await db.ismsIncident.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting incidents:", error);
    return NextResponse.json({ error: "Failed to delete incident" }, { status: 500 });
  }
}
