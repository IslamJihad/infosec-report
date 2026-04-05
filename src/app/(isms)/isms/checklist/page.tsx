'use client';

import { useEffect } from 'react';
import { DAILY_CHECKLIST } from '@/lib/isms/constants';
import { useIsmsStore } from '@/store/ismsStore';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function dailyStampKey(date: string): string {
  return `__stamp__${date}`;
}

function dailyCheckKey(date: string, itemId: string): string {
  return `${date}:${itemId}`;
}

export default function ChecklistPage() {
  const workspace = useIsmsStore((state) => state.workspace);
  const loadAll = useIsmsStore((state) => state.loadAll);
  const updateWorkspace = useIsmsStore((state) => state.updateWorkspace);

  useEffect(() => {
    if (!workspace) {
      void loadAll();
      return;
    }

    const key = todayKey();
    const stampKey = dailyStampKey(key);
    if (!workspace.dailyChecks?.[stampKey]) {
      void updateWorkspace({
        dailyChecks: {
          ...(workspace.dailyChecks ?? {}),
          [stampKey]: true,
        },
      });
    }
  }, [workspace, loadAll, updateWorkspace]);

  const checks = workspace?.dailyChecks ?? {};
  const notes = workspace?.dailyNotes ?? {};
  const date = todayKey();

  function setCheck(itemId: string, checked: boolean) {
    const key = dailyCheckKey(date, itemId);

    void updateWorkspace({
      dailyChecks: {
        ...checks,
        [key]: checked,
      },
    });
  }

  function setNotes(value: string) {
    void updateWorkspace({
      dailyNotes: {
        ...notes,
        [date]: value,
      },
    });
  }

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      <div
        style={{
          border: '1px solid var(--isms-border)',
          borderRadius: '12px',
          background: 'var(--isms-surf)',
          padding: '16px',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Daily Checklist</h2>
        <p style={{ margin: '8px 0 0', color: 'var(--isms-txt2)', fontSize: '13px' }}>
          Checklist resets daily and records notes in a date-indexed CISO log.
        </p>
      </div>

      {DAILY_CHECKLIST.map((group) => (
        <div
          key={group.category}
          style={{
            border: '1px solid var(--isms-border)',
            borderRadius: '12px',
            background: 'var(--isms-surf)',
            padding: '14px',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{group.category}</h3>

          <div style={{ marginTop: '10px', display: 'grid', gap: '8px' }}>
            {group.items.map((item) => (
              <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <input
                  type="checkbox"
                  checked={Boolean(checks[dailyCheckKey(date, item.id)])}
                  onChange={(event) => setCheck(item.id, event.target.checked)}
                />
                {item.label}
              </label>
            ))}
          </div>
        </div>
      ))}

      <div
        style={{
          border: '1px solid var(--isms-border)',
          borderRadius: '12px',
          background: 'var(--isms-surf)',
          padding: '14px',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>CISO Daily Log</h3>
        <textarea
          value={notes[date] ?? ''}
          onChange={(event) => setNotes(event.target.value)}
          rows={6}
          placeholder="Capture key decisions, blockers, and management updates for today..."
          style={{
            marginTop: '10px',
            width: '100%',
            border: '1px solid var(--isms-border)',
            borderRadius: '8px',
            background: 'var(--isms-bg3)',
            color: 'var(--isms-txt)',
            padding: '10px',
            resize: 'vertical',
          }}
        />
      </div>
    </div>
  );
}
