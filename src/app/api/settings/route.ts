import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

const GEMINI_MODELS = ['gemini-2.5-flash-preview-05-20', 'gemini-2.5-flash-lite-preview-06-17'];

export async function GET() {
  try {
    let settings = await prisma.appSettings.findUnique({ where: { id: 'singleton' } });
    if (!settings) {
      settings = await prisma.appSettings.create({
        data: { id: 'singleton' },
      });
    }
    // Migrate old Perplexity model values to Gemini default
    const response = { ...settings } as Record<string, unknown>;
    if (settings.aiModel && !GEMINI_MODELS.includes(settings.aiModel)) {
      response.aiModel = 'gemini-2.5-flash-preview-05-20';
    }
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'خطأ' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const settings = await prisma.appSettings.upsert({
      where: { id: 'singleton' },
      update: data,
      create: { id: 'singleton', ...data },
    });
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'خطأ' }, { status: 500 });
  }
}
