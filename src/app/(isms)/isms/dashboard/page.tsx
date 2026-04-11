'use client';

import { useEffect, useMemo } from 'react';
import {
  FiAlertTriangle,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiShield,
  FiTarget,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';
import { useIsmsStore } from '@/store/ismsStore';
import {
  computeComplianceStats,
  getKpiStatus,
  getRiskLevel,
  getRiskScore,
  getTaskDueStatus,
} from '@/lib/isms/calculations';
import {
  ANNEX_A_CONTROLS,
  ANNEX_THEME_METADATA,
  ANNEX_THEME_ORDER,
  ISO_CLAUSES,
  MANDATORY_DOCUMENTS,
  POLICY_DOCUMENTS,
  SUPPORTING_DOCUMENTS,
} from '@/lib/isms/constants';
import KpiCard from '@/components/isms/shared/KpiCard';
import ProgressBar from '@/components/isms/shared/ProgressBar';
import StatusBadge from '@/components/isms/shared/StatusBadge';

type Tone = 'red' | 'amber' | 'blue' | 'green';

type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

type UpcomingItem = {
  id: string;
  source: string;
  title: string;
  status: string;
  date: string;
  days: number;
  variant: BadgeVariant;
};

function pct(implemented: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((implemented / total) * 100);
}

function progressTone(value: number): Tone {
  if (value >= 85) return 'green';
  if (value >= 65) return 'blue';
  if (value >= 35) return 'amber';
  return 'red';
}

function daysTo(dateText?: string): number | null {
  if (!dateText) return null;
  const target = new Date(dateText);
  if (Number.isNaN(target.getTime())) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function asDate(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function formatDate(value?: string | null): string {
  const parsed = asDate(value);
  if (!parsed) return '-';

  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(value?: Date | string | null): string {
  if (!value) return '-';
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';

  return parsed.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function riskVariant(level: ReturnType<typeof getRiskLevel>): BadgeVariant {
  if (level === 'Critical') return 'danger';
  if (level === 'High') return 'warning';
  if (level === 'Medium') return 'info';
  return 'success';
}

function dueVariant(days: number): BadgeVariant {
  if (days < 0) return 'danger';
  if (days <= 3) return 'warning';
  return 'info';
}

function dueLabel(days: number): string {
  if (days === 0) return 'Today';
  if (days > 0) return `D-${days}`;
  return `D+${Math.abs(days)}`;
}

export default function IsmsDashboardPage() {
  const workspace = useIsmsStore((state) => state.workspace);
  const risks = useIsmsStore((state) => state.risks);
  const incidents = useIsmsStore((state) => state.incidents);
  const tasks = useIsmsStore((state) => state.tasks);
  const kpis = useIsmsStore((state) => state.kpis);
  const suppliers = useIsmsStore((state) => state.suppliers);
  const awareness = useIsmsStore((state) => state.awareness);
  const audits = useIsmsStore((state) => state.audits);
  const ncas = useIsmsStore((state) => state.ncas);
  const loadAll = useIsmsStore((state) => state.loadAll);

  useEffect(() => {
    if (!workspace) {
      void loadAll();
    }
  }, [workspace, loadAll]);

  const compliance = useMemo(
    () => computeComplianceStats(workspace?.clauseStatus ?? {}, workspace?.controlStatus ?? {}),
    [workspace],
  );

  const clauseRows = useMemo(
    () =>
      ISO_CLAUSES.map((clause) => {
        const total = clause.requirements.length;
        const implemented = clause.requirements.filter(
          (req) => workspace?.clauseStatus?.[req.id] === 'implemented',
        ).length;
        const inProgress = clause.requirements.filter(
          (req) => workspace?.clauseStatus?.[req.id] === 'in-progress',
        ).length;

        return {
          id: clause.id,
          title: clause.title,
          total,
          implemented,
          inProgress,
          completion: pct(implemented, total),
        };
      }),
    [workspace],
  );

  const annexRows = useMemo(
    () =>
      ANNEX_THEME_ORDER.map((theme) => {
        const controls = ANNEX_A_CONTROLS.filter((control) => control.theme === theme);
        const implemented = controls.filter(
          (control) => workspace?.controlStatus?.[control.id] === 'implemented',
        ).length;

        return {
          theme,
          label: ANNEX_THEME_METADATA[theme].label,
          implemented,
          total: controls.length,
          completion: pct(implemented, controls.length),
        };
      }),
    [workspace],
  );

  const topRisks = useMemo(() => {
    return [...risks]
      .filter((risk) => risk.status !== 'Closed')
      .sort((a, b) => getRiskScore(b.likelihood, b.impact) - getRiskScore(a.likelihood, a.impact))
      .slice(0, 6)
      .map((risk) => {
        const score = getRiskScore(risk.likelihood, risk.impact);
        const level = getRiskLevel(score);
        return {
          ...risk,
          score,
          level,
          days: daysTo(risk.targetDate),
        };
      });
  }, [risks]);

  const openRisks = risks.filter((risk) => risk.status !== 'Closed').length;
  const riskBuckets = useMemo(
    () =>
      risks
        .filter((risk) => risk.status !== 'Closed')
        .reduce(
          (acc, risk) => {
            const level = getRiskLevel(getRiskScore(risk.likelihood, risk.impact));
            acc[level] += 1;
            return acc;
          },
          { Critical: 0, High: 0, Medium: 0, Low: 0 },
        ),
    [risks],
  );

  const overdueTasks = tasks.filter(
    (task) => task.status !== 'done' && getTaskDueStatus(task.dueDate) === 'overdue',
  ).length;
  const dueSoonTasks = tasks.filter(
    (task) => task.status !== 'done' && getTaskDueStatus(task.dueDate) === 'due-soon',
  ).length;
  const openTasks = tasks.filter((task) => task.status !== 'done').length;

  const openIncidents = incidents.filter(
    (incident) => !['Closed', 'Resolved'].includes(incident.status),
  ).length;
  const criticalIncidents = incidents.filter(
    (incident) =>
      !['Closed', 'Resolved'].includes(incident.status) &&
      ['High', 'Critical'].includes(incident.severity),
  ).length;

  const openNcas = ncas.filter((nca) => nca.status !== 'Closed').length;
  const overdueNcas = ncas.filter((nca) => {
    if (nca.status === 'Closed') {
      return false;
    }

    const dueDays = daysTo(nca.dueDate);
    return dueDays !== null && dueDays < 0;
  }).length;

  const docs = [...MANDATORY_DOCUMENTS, ...SUPPORTING_DOCUMENTS, ...POLICY_DOCUMENTS];
  const implementedDocs = docs.filter((doc) => workspace?.docStatus?.[doc.ref] === 'implemented').length;
  const inProgressDocs = docs.filter((doc) => workspace?.docStatus?.[doc.ref] === 'in-progress').length;
  const docsPct = docs.length > 0 ? Math.round((implementedDocs / docs.length) * 100) : 0;

  const awarenessCompletion =
    awareness.length > 0
      ? Math.round(awareness.reduce((sum, entry) => sum + entry.completionRate, 0) / awareness.length)
      : 0;

  const suppliersAssessed = suppliers.filter((supplier) =>
    ['Completed', 'Approved'].includes(supplier.assessment),
  ).length;
  const suppliersHighRisk = suppliers.filter((supplier) =>
    ['High', 'Critical'].includes(supplier.riskLevel),
  ).length;
  const supplierAssurancePct = pct(suppliersAssessed, suppliers.length);

  const onTargetKpis = kpis.filter((kpi) => getKpiStatus(kpi) === 'on-target').length;
  const kpiAchievedPct = pct(onTargetKpis, kpis.length);

  const upcomingItems = useMemo<UpcomingItem[]>(() => {
    const list: UpcomingItem[] = [];

    for (const task of tasks) {
      if (task.status === 'done' || !task.dueDate) {
        continue;
      }

      const days = daysTo(task.dueDate);
      if (days === null) {
        continue;
      }

      list.push({
        id: `task:${task.id}`,
        source: 'Task',
        title: task.title || 'Untitled task',
        status: task.status,
        date: task.dueDate,
        days,
        variant: dueVariant(days),
      });
    }

    for (const audit of audits) {
      if (!audit.auditDate || audit.status === 'Completed') {
        continue;
      }

      const days = daysTo(audit.auditDate);
      if (days === null) {
        continue;
      }

      list.push({
        id: `audit:${audit.id}`,
        source: 'Audit',
        title: audit.title || 'Untitled audit',
        status: audit.status || 'Planned',
        date: audit.auditDate,
        days,
        variant: days < 0 ? 'danger' : audit.status === 'In Progress' ? 'info' : 'neutral',
      });
    }

    for (const nca of ncas) {
      if (!nca.dueDate || nca.status === 'Closed') {
        continue;
      }

      const days = daysTo(nca.dueDate);
      if (days === null) {
        continue;
      }

      list.push({
        id: `nca:${nca.id}`,
        source: 'NCA',
        title: nca.reference || 'Corrective action',
        status: nca.status,
        date: nca.dueDate,
        days,
        variant: days < 0 ? 'danger' : days <= 7 ? 'warning' : 'info',
      });
    }

    for (const supplier of suppliers) {
      if (!supplier.nextReview) {
        continue;
      }

      const days = daysTo(supplier.nextReview);
      if (days === null) {
        continue;
      }

      list.push({
        id: `supplier:${supplier.id}`,
        source: 'Supplier Review',
        title: supplier.name || 'Supplier review',
        status: supplier.assessment || 'Not Started',
        date: supplier.nextReview,
        days,
        variant: days < 0 ? 'danger' : days <= 14 ? 'warning' : 'neutral',
      });
    }

    return list.sort((a, b) => a.days - b.days).slice(0, 8);
  }, [audits, ncas, suppliers, tasks]);

  const targetDays = daysTo(workspace?.targetDate);
  const clausesOnTrack = clauseRows.filter((row) => row.completion >= 80).length;
  const overallActionsOpen = openTasks + openNcas + openIncidents;
  const escalations = overdueTasks + overdueNcas + criticalIncidents;

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      <div
        style={{
          border: '1px solid var(--isms-border)',
          borderRadius: '12px',
          background: 'var(--isms-hero-gradient)',
          padding: '16px',
          boxShadow: 'var(--isms-panel-shadow)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '12px',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'grid', gap: '7px' }}>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, letterSpacing: '-0.01em' }}>Executive Dashboard</h2>
          <p style={{ margin: 0, color: 'var(--isms-txt2)', fontSize: '13px', maxWidth: '72ch' }}>
            Unified operational posture for ISO 27001 implementation, risk exposure, and action execution.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <StatusBadge variant='info'>Updated {formatDateTime(workspace?.updatedAt)}</StatusBadge>
            <StatusBadge variant={targetDays !== null && targetDays < 0 ? 'danger' : 'neutral'}>
              Target {workspace?.targetDate ? formatDate(workspace.targetDate) : 'Not Set'}
            </StatusBadge>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
          <div style={{ border: '1px solid var(--isms-context-border)', borderRadius: '10px', background: 'var(--isms-context-bg)', padding: '10px' }}>
            <div style={{ fontSize: '11px', color: 'var(--isms-txt3)' }}>Organization</div>
            <div style={{ marginTop: '3px', fontWeight: 700, fontSize: '14px' }}>{workspace?.orgName || 'Not Set'}</div>
          </div>

          <div style={{ border: '1px solid var(--isms-context-border)', borderRadius: '10px', background: 'var(--isms-context-bg)', padding: '10px' }}>
            <div style={{ fontSize: '11px', color: 'var(--isms-txt3)' }}>CISO</div>
            <div style={{ marginTop: '3px', fontWeight: 700, fontSize: '14px' }}>{workspace?.cisoName || 'Not Set'}</div>
          </div>

          <div style={{ border: '1px solid var(--isms-context-border)', borderRadius: '10px', background: 'var(--isms-context-bg)', padding: '10px' }}>
            <div style={{ fontSize: '11px', color: 'var(--isms-txt3)' }}>Certification Body</div>
            <div style={{ marginTop: '3px', fontWeight: 700, fontSize: '14px' }}>{workspace?.certBody || 'Not Set'}</div>
          </div>

          <div style={{ border: '1px solid var(--isms-context-border)', borderRadius: '10px', background: 'var(--isms-context-bg)', padding: '10px' }}>
            <div style={{ fontSize: '11px', color: 'var(--isms-txt3)' }}>Days to Milestone</div>
            <div style={{ marginTop: '3px', fontWeight: 700, fontSize: '14px' }}>{targetDays ?? '-'}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '10px' }}>
        <KpiCard label='Overall Compliance' value={`${compliance.overallPct}%`} hint='ISO clauses and Annex controls' />
        <KpiCard label='Clause Progress' value={`${compliance.implementedClauses}/${compliance.totalClauses}`} hint='Implemented requirements' />
        <KpiCard label='Annex Coverage' value={`${Math.round((compliance.annexPct['5'] + compliance.annexPct['6'] + compliance.annexPct['7'] + compliance.annexPct['8']) / 4)}%`} hint='Average across A.5-A.8' />
        <KpiCard label='Open Risks' value={openRisks} hint='Risks not yet closed' />
        <KpiCard label='Open Incidents' value={openIncidents} hint='Unresolved incidents' />
        <KpiCard label='Open Actions' value={overallActionsOpen} hint='Tasks + NCAs + incidents' />
        <KpiCard label='Escalations' value={escalations} hint='Overdue tasks, NCAs, critical incidents' />
        <KpiCard label='Documents Complete' value={`${docsPct}%`} hint={`${implementedDocs}/${docs.length} implemented`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '12px' }}>
        <div
          style={{
            border: '1px solid var(--isms-border)',
            borderRadius: '12px',
            background: 'var(--isms-surf-raised)',
            padding: '16px',
            boxShadow: 'var(--isms-panel-shadow)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Clause Performance (4-10)</h3>
            <StatusBadge variant={clausesOnTrack >= 5 ? 'success' : 'info'}>
              {clausesOnTrack}/{clauseRows.length} on track
            </StatusBadge>
          </div>

          <div style={{ marginTop: '12px', display: 'grid', gap: '10px' }}>
            {clauseRows.map((row) => (
              <div key={row.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: '"Fira Code", monospace', fontSize: '11px', color: 'var(--isms-txt3)' }}>
                      {row.id}
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--isms-txt2)' }}>{row.title}</span>
                  </div>
                  <div style={{ fontFamily: '"Fira Code", monospace', fontSize: '11px', color: 'var(--isms-txt3)' }}>
                    {row.implemented}/{row.total} ({row.completion}%)
                  </div>
                </div>

                <ProgressBar value={row.completion} tone={progressTone(row.completion)} />

                {row.inProgress > 0 ? (
                  <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--isms-blue)' }}>
                    {row.inProgress} requirements in progress
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gap: '12px' }}>
          <div
            style={{
              border: '1px solid var(--isms-border)',
              borderRadius: '12px',
              background: 'var(--isms-surf-raised)',
              padding: '16px',
              boxShadow: 'var(--isms-panel-shadow)',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Annex A Theme Coverage</h3>

            <div style={{ marginTop: '12px', display: 'grid', gap: '10px' }}>
              {annexRows.map((row) => (
                <div key={row.theme}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '5px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <StatusBadge variant='neutral'>A.{row.theme}</StatusBadge>
                      <span style={{ fontSize: '13px', color: 'var(--isms-txt2)' }}>{row.label}</span>
                    </div>
                    <div style={{ fontFamily: '"Fira Code", monospace', fontSize: '11px', color: 'var(--isms-txt3)' }}>
                      {row.implemented}/{row.total} ({row.completion}%)
                    </div>
                  </div>

                  <ProgressBar value={row.completion} tone={progressTone(row.completion)} />
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              border: '1px solid var(--isms-border)',
              borderRadius: '12px',
              background: 'var(--isms-surf-raised)',
              padding: '16px',
              boxShadow: 'var(--isms-panel-shadow)',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Execution Pulse</h3>
            <div style={{ marginTop: '10px', display: 'grid', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--isms-txt2)', fontSize: '13px' }}>
                  <FiClock size={14} /> Overdue Tasks
                </div>
                <StatusBadge variant={overdueTasks > 0 ? 'danger' : 'success'}>{overdueTasks}</StatusBadge>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--isms-txt2)', fontSize: '13px' }}>
                  <FiAlertTriangle size={14} /> Critical Incidents
                </div>
                <StatusBadge variant={criticalIncidents > 0 ? 'danger' : 'success'}>{criticalIncidents}</StatusBadge>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--isms-txt2)', fontSize: '13px' }}>
                  <FiTarget size={14} /> Open NCAs
                </div>
                <StatusBadge variant={openNcas > 0 ? 'warning' : 'success'}>{openNcas}</StatusBadge>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--isms-txt2)', fontSize: '13px' }}>
                  <FiCalendar size={14} /> Due Soon Tasks
                </div>
                <StatusBadge variant={dueSoonTasks > 0 ? 'info' : 'neutral'}>{dueSoonTasks}</StatusBadge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '12px' }}>
        <div
          style={{
            border: '1px solid var(--isms-border)',
            borderRadius: '12px',
            background: 'var(--isms-surf-raised)',
            padding: '16px',
            boxShadow: 'var(--isms-panel-shadow)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Top Risk Register</h3>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <StatusBadge variant='danger'>C {riskBuckets.Critical}</StatusBadge>
              <StatusBadge variant='warning'>H {riskBuckets.High}</StatusBadge>
              <StatusBadge variant='info'>M {riskBuckets.Medium}</StatusBadge>
            </div>
          </div>

          <div style={{ marginTop: '10px', display: 'grid', gap: '8px' }}>
            {topRisks.length === 0 ? (
              <div style={{ color: 'var(--isms-txt2)', fontSize: '13px' }}>No active risks recorded.</div>
            ) : (
              topRisks.map((risk) => (
                <div
                  key={risk.id}
                  style={{
                    border: '1px solid var(--isms-border)',
                    borderRadius: '10px',
                    background: 'var(--isms-surf-soft)',
                    padding: '10px',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: '8px',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'grid', gap: '3px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>{risk.title || 'Untitled risk'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--isms-txt2)' }}>
                      {risk.category || 'General'} · Owner: {risk.owner || 'Unassigned'} · Target {formatDate(risk.targetDate)}
                    </div>
                  </div>

                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <StatusBadge variant={riskVariant(risk.level)}>{risk.level}</StatusBadge>
                    <StatusBadge variant='neutral'>S {risk.score}</StatusBadge>
                    {risk.days !== null ? <StatusBadge variant={dueVariant(risk.days)}>{dueLabel(risk.days)}</StatusBadge> : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div
          style={{
            border: '1px solid var(--isms-border)',
            borderRadius: '12px',
            background: 'var(--isms-surf-raised)',
            padding: '16px',
            boxShadow: 'var(--isms-panel-shadow)',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Upcoming Actions and Reviews</h3>

          <div style={{ marginTop: '10px', display: 'grid', gap: '8px' }}>
            {upcomingItems.length === 0 ? (
              <div style={{ color: 'var(--isms-txt2)', fontSize: '13px' }}>No upcoming dated actions found.</div>
            ) : (
              upcomingItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    border: '1px solid var(--isms-border)',
                    borderRadius: '10px',
                    background: 'var(--isms-surf-soft)',
                    padding: '9px 10px',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: '8px',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <StatusBadge variant='neutral'>{item.source}</StatusBadge>
                      <span style={{ fontSize: '13px', fontWeight: 700 }}>{item.title}</span>
                    </div>

                    <div style={{ marginTop: '3px', fontSize: '11px', color: 'var(--isms-txt2)' }}>
                      {item.status} · {formatDate(item.date)}
                    </div>
                  </div>

                  <StatusBadge variant={item.variant}>{dueLabel(item.days)}</StatusBadge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
        <div style={{ border: '1px solid var(--isms-border)', borderRadius: '12px', background: 'var(--isms-surf-raised)', padding: '14px', boxShadow: 'var(--isms-kpi-shadow)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
            <FiFileText size={15} />
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Document Control</h4>
          </div>

          <ProgressBar value={docsPct} tone={progressTone(docsPct)} />
          <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--isms-txt2)' }}>
            {implementedDocs} complete · {inProgressDocs} in progress · {docs.length - implementedDocs - inProgressDocs} not started
          </div>
        </div>

        <div style={{ border: '1px solid var(--isms-border)', borderRadius: '12px', background: 'var(--isms-surf-raised)', padding: '14px', boxShadow: 'var(--isms-kpi-shadow)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
            <FiUsers size={15} />
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Awareness Program</h4>
          </div>

          <ProgressBar value={awarenessCompletion} tone={progressTone(awarenessCompletion)} />
          <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--isms-txt2)' }}>
            {awareness.length} sessions tracked · average completion {awarenessCompletion}%
          </div>
        </div>

        <div style={{ border: '1px solid var(--isms-border)', borderRadius: '12px', background: 'var(--isms-surf-raised)', padding: '14px', boxShadow: 'var(--isms-kpi-shadow)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
            <FiShield size={15} />
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Supplier Assurance</h4>
          </div>

          <ProgressBar value={supplierAssurancePct} tone={progressTone(supplierAssurancePct)} />
          <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--isms-txt2)' }}>
            {suppliersAssessed}/{suppliers.length} assessed · {suppliersHighRisk} high risk suppliers
          </div>
        </div>

        <div style={{ border: '1px solid var(--isms-border)', borderRadius: '12px', background: 'var(--isms-surf-raised)', padding: '14px', boxShadow: 'var(--isms-kpi-shadow)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
            <FiTrendingUp size={15} />
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>KPI Achievement</h4>
          </div>

          <ProgressBar value={kpiAchievedPct} tone={progressTone(kpiAchievedPct)} />
          <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--isms-txt2)' }}>
            {onTargetKpis}/{kpis.length} on target · {audits.filter((audit) => audit.status === 'Completed').length}/{audits.length} audits completed
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        <StatusBadge variant={targetDays !== null && targetDays < 0 ? 'danger' : targetDays !== null && targetDays <= 30 ? 'warning' : 'info'}>
          <FiCalendar size={12} style={{ marginRight: 5 }} />
          Target {targetDays === null ? 'Not Set' : dueLabel(targetDays)}
        </StatusBadge>
        <StatusBadge variant={overdueTasks + overdueNcas === 0 ? 'success' : 'warning'}>
          <FiClock size={12} style={{ marginRight: 5 }} />
          {overdueTasks + overdueNcas} overdue actions
        </StatusBadge>
        <StatusBadge variant={criticalIncidents === 0 ? 'success' : 'danger'}>
          <FiAlertTriangle size={12} style={{ marginRight: 5 }} />
          {criticalIncidents} critical incidents
        </StatusBadge>
        <StatusBadge variant={compliance.overallPct >= 80 ? 'success' : 'info'}>
          <FiCheckCircle size={12} style={{ marginRight: 5 }} />
          Compliance baseline {compliance.overallPct}%
        </StatusBadge>
      </div>
    </div>
  );
}
