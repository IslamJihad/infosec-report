import { NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma/client';
import prisma from '@/lib/db';
import type { AIMessage } from '@/types/report';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_TITLE_CHARS = 120;

type RawConversation = {
  id: string;
  reportId: string;
  reviewType: string;
  title: string | null;
  pinned: boolean;
  createdAt: Date;
  messages: string;
};

function safeParseMessages(raw: string): AIMessage[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((message) => (
        message &&
        typeof message === 'object' &&
        (message.role === 'user' || message.role === 'assistant') &&
        typeof message.content === 'string' &&
        message.content.trim().length > 0
      ))
      .map((message) => ({
        role: message.role as 'user' | 'assistant',
        content: message.content,
        timestamp: typeof message.timestamp === 'string' ? message.timestamp : undefined,
      }));
  } catch {
    return [];
  }
}

function getLastMessage(messages: AIMessage[], role: 'user' | 'assistant'): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === role) return messages[i].content;
  }
  return '';
}

function isValidUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function toHistoryItem(conversation: RawConversation) {
  const messages = safeParseMessages(conversation.messages);

  return {
    id: conversation.id,
    reportId: conversation.reportId,
    reviewType: conversation.reviewType,
    title: conversation.title ?? undefined,
    pinned: conversation.pinned,
    createdAt: conversation.createdAt.toISOString(),
    messageCount: messages.length,
    lastUserMessage: getLastMessage(messages, 'user'),
    lastAssistantMessage: getLastMessage(messages, 'assistant'),
    messages,
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const reportId = searchParams.get('reportId')?.trim();

    if (!reportId) {
      return NextResponse.json({ error: 'معرّف التقرير مطلوب.' }, { status: 400 });
    }

    const conversations = await prisma.aIConversation.findMany({
      where: { reportId },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      take: 50,
    });

    const items = conversations.map((conversation) => toHistoryItem(conversation));

    return NextResponse.json({ conversations: items });
  } catch (error: unknown) {
    console.error('AI history GET failed:', error);
    return NextResponse.json(
      { error: 'فشل في جلب سجل المحادثات' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const rawBody = await req.json().catch(() => null);
    if (!rawBody || typeof rawBody !== 'object') {
      return NextResponse.json({ error: 'بيانات الطلب غير صالحة.' }, { status: 400 });
    }

    const body = rawBody as { id?: unknown; title?: unknown; pinned?: unknown };
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'معرّف المحادثة غير صالح.' }, { status: 400 });
    }

    const hasTitle = Object.prototype.hasOwnProperty.call(body, 'title');
    const hasPinned = Object.prototype.hasOwnProperty.call(body, 'pinned');

    if (!hasTitle && !hasPinned) {
      return NextResponse.json({ error: 'لا يوجد تحديث صالح للتنفيذ.' }, { status: 400 });
    }

    if (hasTitle && hasPinned) {
      return NextResponse.json({ error: 'حدّث عنواناً أو تثبيتاً في كل طلب على حدة.' }, { status: 400 });
    }

    const updates: { title?: string | null; pinned?: boolean } = {};

    if (hasTitle) {
      if (typeof body.title !== 'string') {
        return NextResponse.json({ error: 'العنوان غير صالح.' }, { status: 400 });
      }

      const title = body.title.trim();
      if (title.length > MAX_TITLE_CHARS) {
        return NextResponse.json(
          { error: `العنوان طويل جداً (الحد الأقصى ${MAX_TITLE_CHARS} حرف).` },
          { status: 400 }
        );
      }

      updates.title = title || null;
    }

    if (hasPinned) {
      if (typeof body.pinned !== 'boolean') {
        return NextResponse.json({ error: 'قيمة التثبيت غير صالحة.' }, { status: 400 });
      }
      updates.pinned = body.pinned;
    }

    const updated = await prisma.aIConversation.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ conversation: toHistoryItem(updated) });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'المحادثة غير موجودة.' }, { status: 404 });
    }

    console.error('AI history PATCH failed:', error);
    return NextResponse.json(
      { error: 'فشل في تحديث المحادثة' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id')?.trim() || '';

    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'معرّف المحادثة غير صالح.' }, { status: 400 });
    }

    await prisma.aIConversation.delete({ where: { id } });
    return NextResponse.json({ ok: true, id });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'المحادثة غير موجودة.' }, { status: 404 });
    }

    console.error('AI history DELETE failed:', error);
    return NextResponse.json(
      { error: 'فشل في حذف المحادثة' },
      { status: 500 }
    );
  }
}
