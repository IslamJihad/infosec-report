import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import type { AIMessage } from '@/types/report';

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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const reportId = searchParams.get('reportId')?.trim();

    if (!reportId) {
      return NextResponse.json({ error: 'معرّف التقرير مطلوب.' }, { status: 400 });
    }

    const conversations = await prisma.aIConversation.findMany({
      where: { reportId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const items = conversations.map((conversation) => {
      const messages = safeParseMessages(conversation.messages);

      return {
        id: conversation.id,
        reportId: conversation.reportId,
        reviewType: conversation.reviewType,
        createdAt: conversation.createdAt.toISOString(),
        messageCount: messages.length,
        lastUserMessage: getLastMessage(messages, 'user'),
        lastAssistantMessage: getLastMessage(messages, 'assistant'),
        messages,
      };
    });

    return NextResponse.json({ conversations: items });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'فشل في جلب سجل المحادثات', details: errMsg },
      { status: 500 }
    );
  }
}
