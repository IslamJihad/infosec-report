# AI Review Interface Enhancement Plan
## (المراجعة الذكية – AI)

> This document is a spec for implementing enhancements to the AI review chat interface.
> All file paths are relative to the project root.

---

## Context

The application is a Next.js 14 Arabic-RTL infosec report tool. The AI review modal (`src/components/ai/AIReviewModal.tsx`) provides a chat interface for reviewing security reports using 5 review types (comprehensive, executive, board, risk, gaps). The backend uses Google Gemini or NVIDIA NIM, stores conversations in SQLite via Prisma, and exposes 3 API routes: `/api/ai/review`, `/api/ai/history`, and `/api/ai/analytics-summary`.

The goal is to meaningfully enhance the AI chat experience with practical, high-value features without changing the core architecture.

---

## Enhancement 1: Streaming Responses (Real-time Typing Effect)

**Problem:** Users wait silently until the full AI response arrives (~5-10s). This feels slow.

**Solution:** Stream the AI response token-by-token so the interface updates in real time.

**Files to change:**
- `src/app/api/ai/review/route.ts` — Add streaming support using `ReadableStream` and `TransformStream`. Return `new StreamingTextResponse(stream)` or use `Response` with `Transfer-Encoding: chunked`. For Gemini, use `generateContentStream()`. For NVIDIA NIM, set `stream: true` in the request body and parse SSE chunks.
- `src/lib/api.ts` — Add `aiReviewStream()` and `aiFollowUpStream()` functions that use `fetch` with `reader = response.body.getReader()` and return an `AsyncGenerator<string>`.
- `src/components/ai/AIReviewModal.tsx` — Replace the single `setContent(response)` call with a streaming state update:
  ```tsx
  setStreamingContent('');
  for await (const chunk of aiReviewStream(...)) {
    setStreamingContent(prev => prev + chunk);
  }
  ```
  Add `streamingContent` state. Render it alongside `history`. Show a blinking cursor `▍` at the end while streaming.

**Notes:**
- The existing 30s timeout in providers.ts may need to increase for streaming.
- The `AIConversation` database record should be saved **after** streaming completes with the full assembled content.
- Keep the spinning ⚙️ icon only for the initial 1-2 seconds before first token arrives.

---

## Enhancement 2: Contextual Follow-up Suggestions

**Problem:** Users don't always know what to ask after an AI review. The 3 hardcoded quick prompts are generic.

**Solution:** After each AI response, dynamically suggest 3 contextual follow-up questions based on the content of the AI's answer.

**Files to change:**
- `src/app/api/ai/review/route.ts` — After generating the main response, make a second lightweight AI call (max 200 tokens, temperature 0.5) with this prompt:
  ```
  بناءً على هذا الرد، اقترح 3 أسئلة متابعة قصيرة ومفيدة. أعطني فقط الأسئلة الثلاثة مفصولة بـ|||
  ```
  Return the suggestions as `suggestions: string[]` in the API response alongside `content`.
- `src/types/report.ts` — Add `suggestions?: string[]` to `AIReviewResponse`.
- `src/components/ai/AIReviewModal.tsx` — After the AI responds, replace the 3 hardcoded quick prompts with the dynamic suggestions. Store suggestions in state: `const [suggestions, setSuggestions] = useState<string[]>(defaultSuggestions)`. On new AI response, call `setSuggestions(response.suggestions ?? defaultSuggestions)`.

**Default fallback** (when no suggestions returned): Keep the existing 3 hardcoded Arabic prompts.

---

## Enhancement 3: Message Timestamps & Copy Per Message

**Problem:** No way to know when each message was sent. Copy only works on the last message.

**Solution:** Add timestamps to each message bubble and a copy icon on every assistant message.

**Files to change:**
- `src/types/report.ts` — Add `timestamp?: string` (ISO string) to `AIMessage`.
- `src/app/api/ai/review/route.ts` — When building messages to save, add `timestamp: new Date().toISOString()` to each message.
- `src/components/ai/AIReviewModal.tsx`:
  - In the message render loop, below each message bubble show the timestamp formatted in Arabic locale:
    ```tsx
    {msg.timestamp && (
      <div className="text-xs text-gray-400 mt-1 text-left dir-ltr">
        {new Date(msg.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
      </div>
    )}
    ```
  - For each `assistant` message, show a small 📋 copy icon button in the top-right corner. On click, copy that specific message's content. Show "تم النسخ!" tooltip for 2 seconds.
  - Remove the existing single "Copy last response" button at the bottom (it becomes redundant).

---

## Enhancement 4: Conversation Management (Rename & Delete)

**Problem:** Conversations are auto-named by review type + date. Users can't delete old conversations or rename them.

**Solution:** Add rename and delete actions to the conversation history sidebar.

**Files to change:**
- `prisma/schema.prisma` — Add `title String?` field to `AIConversation` model. Run `npx prisma db push`.
- `src/app/api/ai/history/route.ts` — Add `PATCH /api/ai/history` for renaming (body: `{ id, title }`) and `DELETE /api/ai/history?id=xxx` for deletion.
- `src/lib/api.ts` — Add `renameAIConversation(id, title)` and `deleteAIConversation(id)`.
- `src/components/ai/AIReviewModal.tsx`:
  - In the sidebar conversation list, on hover show three-dots `⋮` button.
  - On click, show a small dropdown with: "إعادة تسمية" and "حذف".
  - For rename: show an inline input field replacing the title. On blur/Enter, call the API.
  - For delete: show a confirmation inline "هل أنت متأكد؟ [حذف] [إلغاء]". On confirm, call delete API and remove from list.
  - In the history sidebar, display `conversation.title` if set, otherwise fall back to `reviewTypeLabel + ' - ' + date`.

---

## Enhancement 5: Search & Filter Conversations

**Problem:** With up to 50 conversations, finding a specific one is difficult.

**Solution:** Add a search input above the conversation history sidebar.

**Files to change:**
- `src/components/ai/AIReviewModal.tsx`:
  - Above the conversation list, add a small search input:
    ```tsx
    <input
      placeholder="ابحث في المحادثات..."
      value={searchQuery}
      onChange={e => setSearchQuery(e.target.value)}
      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg mb-2 text-right"
    />
    ```
  - Add `const [searchQuery, setSearchQuery] = useState('')` state.
  - Filter `conversations` before rendering:
    ```tsx
    const filtered = conversations.filter(c =>
      c.lastUserMessage.includes(searchQuery) ||
      c.reviewType.includes(searchQuery) ||
      (c.title ?? '').includes(searchQuery)
    );
    ```
  - Also add filter chips for review type: small pill buttons "الكل | شامل | تنفيذي | مجلس | مخاطر | ثغرات" above the search. Clicking filters to that type only.

---

## Enhancement 6: Character Count & Keyboard Shortcut

**Problem:** Users can't see how close they are to the 1200-char limit. No keyboard shortcut to send.

**Solution:** Show remaining character count. Submit on Ctrl+Enter.

**Files to change:**
- `src/components/ai/AIReviewModal.tsx`:
  - Add character count display below the input:
    ```tsx
    <div className={`text-xs text-left ${followUpQ.length > 1100 ? 'text-red-500' : 'text-gray-400'}`}>
      {followUpQ.length} / 1200
    </div>
    ```
  - On the textarea, add `onKeyDown` handler:
    ```tsx
    onKeyDown={(e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleFollowUp();
      }
    }}
    ```
  - Show a small hint label: "Ctrl+Enter للإرسال" in the bottom-right corner of the input area.

---

## Enhancement 7: Export Conversation to PDF

**Problem:** Users can't share or archive AI conversations outside the app.

**Solution:** Add an "Export" button that prints the conversation as a PDF.

**Recommended approach:** Use `window.print()` (zero dependencies):
- `src/components/ai/AIReviewModal.tsx`:
  - Add an export button in the modal header (next to "محادثة جديدة"): `📄 تصدير`
  - Wrap the conversation messages in `<div id="print-conversation">`.
  - Add a `<style media="print">` block that:
    - Hides sidebar, header buttons, input area, quick prompts.
    - Shows only the conversation messages with full width.
    - Adds `@page { size: A4; margin: 2cm; }` and `direction: rtl`.
  - On click, call `window.print()`.
  - Disable the button when there is no conversation history.

**Alternative (if richer PDF needed):** Install `jspdf` + `html2canvas`. Capture the conversation div as canvas and save. Requires embedding an Arabic font (Cairo/Amiri as base64) for correct RTL text rendering.

---

## Enhancement 8: Response Length Control

**Problem:** The AI always generates the same length response. Sometimes users want brief summaries, sometimes detailed analysis.

**Solution:** Add a toggle: مختصر / عادي / مفصّل (Brief / Standard / Detailed).

**Files to change:**
- `src/types/report.ts` — Add `export type ResponseLength = 'brief' | 'standard' | 'detailed'`.
- `src/app/api/ai/review/route.ts` — Accept `responseLength?: ResponseLength` in the request body. Append to the system prompt:
  - `brief`: "اجعل ردك مختصراً في 3-5 نقاط فقط."
  - `standard`: (default, no change)
  - `detailed`: "اجعل ردك مفصلاً وشاملاً مع أمثلة وتوضيحات."
  Adjust `maxOutputTokens`: brief=600, standard=2000, detailed=4000.
- `src/lib/api.ts` — Add `responseLength` parameter to `aiReview()` and `aiFollowUp()`.
- `src/components/ai/AIReviewModal.tsx`:
  - Add `const [responseLength, setResponseLength] = useState<ResponseLength>('standard')`.
  - Render a toggle group above the send button: `[مختصر] [عادي✓] [مفصّل]`
  - Pass `responseLength` when calling `aiReview()` and `aiFollowUp()`.

---

## Enhancement 9: Pin / Favorite Conversations

**Problem:** Important conversations get buried as new ones are added.

**Solution:** Allow users to pin/star important conversations so they appear at the top.

**Files to change:**
- `prisma/schema.prisma` — Add `pinned Boolean @default(false)` to `AIConversation`. Run `npx prisma db push`.
- `src/app/api/ai/history/route.ts` — Add `PATCH` endpoint to toggle `pinned`. Include `pinned` field in GET response.
- `src/lib/api.ts` — Add `togglePinAIConversation(id: string)`.
- `src/types/report.ts` — Add `pinned: boolean` to `AIConversationHistoryItem`.
- `src/components/ai/AIReviewModal.tsx`:
  - Show a ⭐ icon on each conversation item (filled gold if pinned, gray if not).
  - On click, call toggle API and update local state.
  - Sort: pinned conversations first with a "مثبتة" separator label, then the rest sorted by date.

---

## Enhancement 10: Smart Review Type Recommendation

**Problem:** Users may not know which review type is most relevant for their report.

**Solution:** When the modal opens, analyze the report and recommend the best review type with a brief reason.

**Files to change:**
- `src/app/api/ai/review/route.ts` — Add `action: 'recommend'` mode. Takes report data, returns:
  ```json
  { "recommended": "risk", "reason": "التقرير يحتوي على ثغرات حرجة متعددة" }
  ```
  Use max 100 tokens, temperature 0 for fast/cheap inference.
- `src/lib/api.ts` — Add `getReviewRecommendation(reportId, reportData)`.
- `src/components/ai/AIReviewModal.tsx`:
  - On modal open (`useEffect` with `isOpen` dependency), call `getReviewRecommendation()` in the background (non-blocking).
  - When result arrives, show a dismissible banner above the review type buttons:
    ```
    💡 نوصي بـ "تحليل المخاطر" — التقرير يحتوي على ثغرات حرجة متعددة  [بدء ▶] [✕]
    ```
  - Clicking "بدء ▶" selects that review type and triggers `handleReview()`.

---

## Summary Table

| # | Feature | Complexity | Impact | Files Changed |
|---|---------|------------|--------|---------------|
| 1 | Streaming responses | High | ⭐⭐⭐⭐⭐ | route.ts, api.ts, AIReviewModal.tsx |
| 2 | Contextual follow-up suggestions | Medium | ⭐⭐⭐⭐ | route.ts, report.ts, AIReviewModal.tsx |
| 3 | Timestamps + copy per message | Low | ⭐⭐⭐ | report.ts, route.ts, AIReviewModal.tsx |
| 4 | Rename & delete conversations | Medium | ⭐⭐⭐⭐ | schema.prisma, history/route.ts, api.ts, AIReviewModal.tsx |
| 5 | Search & filter conversations | Low | ⭐⭐⭐ | AIReviewModal.tsx only |
| 6 | Character count + Ctrl+Enter | Low | ⭐⭐ | AIReviewModal.tsx only |
| 7 | Export conversation to PDF | Medium | ⭐⭐⭐ | AIReviewModal.tsx only |
| 8 | Response length control | Medium | ⭐⭐⭐⭐ | route.ts, api.ts, report.ts, AIReviewModal.tsx |
| 9 | Pin/favorite conversations | Medium | ⭐⭐⭐ | schema.prisma, history/route.ts, api.ts, AIReviewModal.tsx |
| 10 | Smart review type recommendation | High | ⭐⭐⭐⭐ | route.ts, api.ts, AIReviewModal.tsx |

---

## Implementation Order (Recommended)

1. **Enhancements 3, 5, 6** — Pure frontend, zero risk, immediate quick wins.
2. **Enhancement 4** — DB migration + isolated to history sidebar.
3. **Enhancements 2 and 8** — Moderate API changes, high user value.
4. **Enhancement 7** — Standalone, no side effects.
5. **Enhancement 9** — DB migration, medium complexity.
6. **Enhancement 1** — Architecturally significant; do after other features are stable.
7. **Enhancement 10** — Optional polish; only if AI API cost budget allows extra calls.

---

## Key Technical Notes

- All UI text must be **Arabic RTL**. Use `dir="rtl"` and `text-right` Tailwind classes.
- The app uses **Tailwind CSS** with a custom `navy-*` color palette (see `tailwind.config.ts`).
- State management is **React useState/useEffect only** — no Redux or Zustand.
- Database is **SQLite** via Prisma. After any `schema.prisma` change, run `npx prisma db push`.
- All API fetching is done manually with `fetch` in `src/lib/api.ts` — no React Query or SWR.
- API routes follow Next.js App Router convention: `src/app/api/*/route.ts`.
- Keep new UI labels in Arabic. Only use English for technical terms (e.g., "PDF").
- The modal is `max-w-[1050px]` and `max-h-[90vh]`. Be careful not to overflow with new UI elements.
- The conversation sidebar is `w-[300px]`. The main response area takes the remaining `flex-1` width.
- `prisma/dev.db` is the SQLite file committed to the repo (development environment only).

## Key Existing Files

```
src/
├── components/ai/AIReviewModal.tsx       ← Main UI component (~405 lines)
├── app/api/ai/
│   ├── review/route.ts                   ← Main AI endpoint
│   └── history/route.ts                  ← Conversation history CRUD
├── lib/
│   ├── api.ts                            ← Client-side fetch helpers
│   └── ai/
│       ├── providers.ts                  ← Gemini + NVIDIA NIM integration
│       └── models.ts                     ← Model configuration
├── types/report.ts                       ← AIMessage, AIReviewResponse, etc.
└── app/report/[id]/page.tsx              ← Where AIReviewModal is mounted

prisma/schema.prisma                      ← AIConversation model definition
```
