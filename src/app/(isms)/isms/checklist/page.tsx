'use client';

import { useEffect, useMemo } from 'react';
import type { IconType } from 'react-icons';
import {
  FiCheck,
  FiClipboard,
  FiRefreshCw,
  FiShield,
  FiTool,
} from 'react-icons/fi';
import { DAILY_CHECKLIST } from '@/lib/isms/constants';
import { useIsmsStore } from '@/store/ismsStore';
import KpiCard from '@/components/isms/shared/KpiCard';
import ProgressBar from '@/components/isms/shared/ProgressBar';
import StatusBadge from '@/components/isms/shared/StatusBadge';

const ITEM_GUIDANCE: Record<string, string> = {
  d1: 'Check SIEM/EDR for anomalies, critical events, or threshold breaches.',
  d2: 'Review incident log and confirm if any escalation is needed today.',
  d3: 'Validate new critical CVEs and identify gaps against patching policy.',
  d4: 'Confirm no unusual admin account activity or privileged access events.',
  d5: 'Verify backup status and any business continuity or DR exceptions.',
  d6: 'Move completed tasks, flag blockers, and update due dates as needed.',
  d7: 'Run a brief team sync on progress, blockers, and execution priorities.',
  d8: 'Capture evidence references and map them to clauses or controls.',
  d9: 'Confirm milestone movement on clause and control implementation.',
  d10: 'Track pending supplier reviews, questionnaires, and contract actions.',
  d11: 'Capture newly emerged risks or changed likelihood/impact values.',
  d12: 'Check upcoming audit preparation and evidence-readiness for this week.',
  d13: 'Verify training completion trends and chase upcoming deadlines.',
  d14: 'Identify approvals, briefings, or escalations required from management.',
  d15: 'Record key decisions, blockers, and progress notes in the daily log.',
};

const GROUP_META: Record<string, { icon: IconType; tint: string; border: string }> = {
  'Morning Security Operations': {
    icon: FiShield,
    tint: 'rgba(79,142,247,0.08)',
    border: 'rgba(79,142,247,0.28)',
  },
  'Implementation Progress': {
    icon: FiTool,
    tint: 'rgba(34,211,238,0.08)',
    border: 'rgba(34,211,238,0.26)',
  },
  'Governance & Reporting': {
    icon: FiClipboard,
    tint: 'rgba(167,139,250,0.09)',
    border: 'rgba(167,139,250,0.28)',
  },
};

function progressTone(value: number): 'red' | 'amber' | 'blue' | 'green' {
  if (value >= 85) return 'green';
  if (value >= 60) return 'blue';
  if (value >= 35) return 'amber';
  return 'red';
}

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

  const date = todayKey();
  const checks = workspace?.dailyChecks ?? {};
  const notes = workspace?.dailyNotes ?? {};

  const allItems = useMemo(() => DAILY_CHECKLIST.flatMap((group) => group.items), []);

  const completedCount = useMemo(
    () => allItems.filter((item) => Boolean(checks[dailyCheckKey(date, item.id)])).length,
    [allItems, checks, date],
  );

  const pendingCount = allItems.length - completedCount;
  const progressPct = Math.round((completedCount / Math.max(allItems.length, 1)) * 100);

  const groupStats = useMemo(
    () =>
      DAILY_CHECKLIST.map((group) => {
        const complete = group.items.filter((item) => Boolean(checks[dailyCheckKey(date, item.id)])).length;
        const total = group.items.length;
        const pct = Math.round((complete / Math.max(total, 1)) * 100);

        return {
          category: group.category,
          total,
          complete,
          pct,
        };
      }),
    [checks, date],
  );

  const groupsComplete = groupStats.filter((group) => group.pct === 100).length;

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

  function resetDay() {
    const approved = window.confirm('Reset all checklist items and the daily log for today?');
    if (!approved) {
      return;
    }

    const nextChecks = { ...checks };
    for (const item of allItems) {
      delete nextChecks[dailyCheckKey(date, item.id)];
    }
    nextChecks[dailyStampKey(date)] = true;

    const nextNotes = { ...notes };
    delete nextNotes[date];

    void updateWorkspace({
      dailyChecks: nextChecks,
      dailyNotes: nextNotes,
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
          Structured CISO morning routine to maintain security posture and implementation momentum.
        </p>

        <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11px', color: 'var(--isms-txt3)' }}>
              <span>Today: {date}</span>
              <span style={{ fontFamily: '"Fira Code", monospace' }}>{progressPct}%</span>
            </div>
            <ProgressBar value={progressPct} tone={progressTone(progressPct)} />
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <StatusBadge variant={progressPct === 100 ? 'success' : 'info'}>
              {completedCount} / {allItems.length}
            </StatusBadge>

            <button
              type='button'
              onClick={resetDay}
              style={{
                border: '1px solid var(--isms-border)',
                background: 'var(--isms-bg3)',
                color: 'var(--isms-txt2)',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 10px',
                cursor: 'pointer',
              }}
            >
              <FiRefreshCw size={13} /> Reset Day
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px' }}>
        <KpiCard label='Completed Items' value={completedCount} hint='Checklist actions completed today' />
        <KpiCard label='Pending Items' value={pendingCount} hint='Remaining actions to complete today' />
        <KpiCard label='Daily Progress' value={`${progressPct}%`} hint='Overall checklist completion' />
        <KpiCard label='Groups Complete' value={groupsComplete} hint={`Out of ${DAILY_CHECKLIST.length} operational groups`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '12px' }}>
        {DAILY_CHECKLIST.map((group) => {
          const groupMeta = GROUP_META[group.category] ?? {
            icon: FiClipboard,
            tint: 'rgba(59,130,246,0.08)',
            border: 'rgba(59,130,246,0.28)',
          };
          const Icon = groupMeta.icon;
          const stats = groupStats.find((item) => item.category === group.category);

          return (
            <div
              key={group.category}
              style={{
                border: '1px solid var(--isms-border)',
                borderRadius: '12px',
                background: 'var(--isms-surf)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  borderBottom: '1px solid var(--isms-border)',
                  background: groupMeta.tint,
                  padding: '12px 14px',
                  display: 'grid',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '7px',
                        border: `1px solid ${groupMeta.border}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--isms-blue)',
                        background: 'rgba(6, 10, 18, 0.25)',
                      }}
                    >
                      <Icon size={14} />
                    </span>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>{group.category}</h3>
                  </div>

                  <StatusBadge variant={stats?.pct === 100 ? 'success' : stats?.complete ? 'info' : 'neutral'}>
                    {stats?.complete ?? 0}/{stats?.total ?? group.items.length}
                  </StatusBadge>
                </div>

                <ProgressBar value={stats?.pct ?? 0} tone={progressTone(stats?.pct ?? 0)} />
              </div>

              <div style={{ padding: '12px', display: 'grid', gap: '8px' }}>
                {group.items.map((item) => {
                  const checked = Boolean(checks[dailyCheckKey(date, item.id)]);
                  const guidance = ITEM_GUIDANCE[item.id] ?? 'Confirm this action and log evidence where relevant.';

                  return (
                    <button
                      key={item.id}
                      type='button'
                      onClick={() => setCheck(item.id, !checked)}
                      style={{
                        border: '1px solid var(--isms-border)',
                        borderRadius: '10px',
                        background: checked ? 'rgba(34,197,94,0.1)' : 'var(--isms-bg2)',
                        color: 'inherit',
                        cursor: 'pointer',
                        textAlign: 'left',
                        padding: '10px 12px',
                        display: 'grid',
                        gridTemplateColumns: '24px 1fr',
                        gap: '10px',
                        alignItems: 'start',
                      }}
                    >
                      <span
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '6px',
                          border: checked ? '1px solid rgba(34,197,94,0.45)' : '1px solid var(--isms-border)',
                          background: checked ? 'rgba(34,197,94,0.2)' : 'var(--isms-bg3)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--isms-green)',
                          marginTop: '1px',
                        }}
                      >
                        {checked ? <FiCheck size={12} /> : null}
                      </span>

                      <span style={{ display: 'grid', gap: '3px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: checked ? 'var(--isms-txt)' : 'var(--isms-txt2)' }}>
                          {item.label}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--isms-txt3)', lineHeight: 1.45 }}>{guidance}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          border: '1px solid var(--isms-border)',
          borderRadius: '12px',
          background: 'var(--isms-surf)',
          padding: '14px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>CISO Daily Log</h3>
          <StatusBadge variant='info'>{date}</StatusBadge>
        </div>

        <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--isms-txt3)' }}>
          Capture decisions, blockers, escalation points, and evidence pointers for management reporting.
        </p>

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

        <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--isms-txt3)', textAlign: 'right', fontFamily: '"Fira Code", monospace' }}>
          {(notes[date] ?? '').length} chars
        </div>
      </div>
    </div>
  );
}
