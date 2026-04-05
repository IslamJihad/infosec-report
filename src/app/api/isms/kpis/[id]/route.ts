import { NextResponse } from "next/server";
import db from "@/lib/db";
import { sanitizeEntityPayload } from "@/lib/isms/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const payload = sanitizeEntityPayload(await req.json());

    const item = await db.ismsKpi.update({
      where: { id },
      data: payload as any,
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error updating kpis:", error);
    return NextResponse.json({ error: "Failed to update kpi" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await db.ismsKpi.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting kpis:", error);
    return NextResponse.json({ error: "Failed to delete kpi" }, { status: 500 });
  }
}
