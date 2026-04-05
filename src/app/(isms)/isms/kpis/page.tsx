'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { FiEdit2, FiPlus, FiSearch, FiTrash2, FiTrendingDown, FiTrendingUp } from 'react-icons/fi';
import { useIsmsStore } from '@/store/ismsStore';
import { getKpiStatus } from '@/lib/isms/calculations';
import type { IsmsKpi } from '@/types/isms';
import KpiCard from '@/components/isms/shared/KpiCard';
import StatusBadge from '@/components/isms/shared/StatusBadge';
import Modal from '@/components/isms/shared/Modal';

type KpiTrend = 'up' | 'flat' | 'down';

type KpiForm = {
  name: string;
  category: string;
  unit: string;
  target: string;
  current: string;
  frequency: string;
  trend: KpiTrend;
};

const CATEGORY_OPTIONS = [
  'Incident Response',
  'Vulnerability Mgmt',
  'Access Control',
  'Awareness',
  'Compliance',
  'Risk',
  'Audit',
  'Operations',
];

const FREQUENCY_OPTIONS = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually'];

const EMPTY_FORM: KpiForm = {
  name: '',
  category: 'Compliance',
  unit: '%',
  target: '100',
  current: '0',
  frequency: 'Monthly',
  trend: 'flat',
};

function asTrend(value: string): KpiTrend {
  if (value === 'up' || value === 'flat' || value === 'down') {
    return value;
  }

  return 'flat';
}

function trendView(value: KpiTrend): { label: string; icon: 'up' | 'down' | 'flat'; color: string } {
  if (value === 'up') {
    return { label: 'Improving', icon: 'up', color: 'var(--isms-green)' };
  }

  if (value === 'down') {
    return { label: 'Declining', icon: 'down', color: 'var(--isms-red)' };
  }

  return { label: 'Stable', icon: 'flat', color: 'var(--isms-txt3)' };
}

function fieldStyle(): CSSProperties {
  return {
    border: '1px solid var(--isms-border)',
    borderRadius: '8px',
    background: 'var(--isms-bg3)',
    color: 'var(--isms-txt)',
    padding: '8px 10px',
    fontSize: '13px',
    width: '100%',
  };
}

function badge(status: ReturnType<typeof getKpiStatus>): 'success' | 'warning' | 'danger' {
  if (status === 'on-target') return 'success';
  if (status === 'below-target') return 'warning';
  return 'danger';
}

function statusLabel(status: ReturnType<typeof getKpiStatus>): string {
  if (status === 'on-target') return 'On Target';
  if (status === 'below-target') return 'Below Target';
  return 'Critical';
}

export default function KpisPage() {
  const workspace = useIsmsStore((state) => state.workspace);
  const kpis = useIsmsStore((state) => state.kpis);
  const loadAll = useIsmsStore((state) => state.loadAll);
  const addKpi = useIsmsStore((state) => state.addKpi);
  const updateKpi = useIsmsStore((state) => state.updateKpi);
  const deleteKpi = useIsmsStore((state) => state.deleteKpi);

  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ReturnType<typeof getKpiStatus>>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<KpiForm>(EMPTY_FORM);

  useEffect(() => {
    if (!workspace) {
      void loadAll();
    }
  }, [workspace, loadAll]);

  const stats = useMemo(() => {
    const onTarget = kpis.filter((kpi) => getKpiStatus(kpi) === 'on-target').length;
    const below = kpis.filter((kpi) => getKpiStatus(kpi) === 'below-target').length;
    const critical = kpis.filter((kpi) => getKpiStatus(kpi) === 'critical').length;

    return { onTarget, below, critical };
  }, [kpis]);

  const categoryOptions = useMemo(() => {
    const values = new Set<string>(CATEGORY_OPTIONS);
    for (const kpi of kpis) {
      if (kpi.category.trim()) {
        values.add(kpi.category.trim());
      }
    }

    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [kpis]);

  const filteredKpis = useMemo(
    () =>
      kpis.filter((kpi) => {
        if (query.trim().length > 0) {
          const searchable = `${kpi.name} ${kpi.category} ${kpi.frequency}`.toLowerCase();
          if (!searchable.includes(query.toLowerCase())) {
            return false;
          }
        }

        if (categoryFilter !== 'all' && kpi.category !== categoryFilter) {
          return false;
        }

        const status = getKpiStatus(kpi);
        if (statusFilter !== 'all' && status !== statusFilter) {
          return false;
        }

        return true;
      }),
    [categoryFilter, kpis, query, statusFilter],
  );

  function openCreateModal() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  }

  function openEditModal(kpi: IsmsKpi) {
    setEditingId(kpi.id);
    setForm({
      name: kpi.name,
      category: kpi.category || 'Compliance',
      unit: kpi.unit || '%',
      target: String(kpi.target),
      current: String(kpi.current),
      frequency: kpi.frequency || 'Monthly',
      trend: asTrend(kpi.trend),
    });
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setFormError(null);
  }

  async function submitForm() {
    if (!form.name.trim()) {
      setFormError('KPI name is required.');
      return;
    }

    const target = Number(form.target);
    const current = Number(form.current);

    if (!Number.isFinite(target) || !Number.isFinite(current)) {
      setFormError('Target and current values must be valid numbers.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        name: form.name.trim(),
        category: form.category.trim() || 'Compliance',
        unit: form.unit.trim() || '%',
        target,
        current,
        frequency: form.frequency,
        trend: form.trend,
      };

      if (editingId) {
        await updateKpi(editingId, payload);
      } else {
        await addKpi(payload);
      }

      closeModal();
    } catch (error) {
      console.error('Failed to persist KPI:', error);
      setFormError(error instanceof Error ? error.message : 'Failed to save KPI');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function removeKpi(id: string) {
    const approved = window.confirm('Delete this KPI metric? This action cannot be undone.');
    if (!approved) {
      return;
    }

    try {
      await deleteKpi(id);
      if (editingId === id) {
        closeModal();
      }
    } catch (error) {
      console.error('Failed to delete KPI:', error);
      setFormError(error instanceof Error ? error.message : 'Failed to delete KPI');
    }
  }

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      <div
        style={{
          border: '1px solid var(--isms-border)',
          borderRadius: '12px',
          background: 'var(--isms-surf)',
          padding: '12px',
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr auto',
          gap: '10px',
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative' }}>
          <FiSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--isms-txt3)' }} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder='Search KPI name, category, or frequency'
            style={{ ...fieldStyle(), paddingLeft: '30px' }}
          />
        </div>

        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} style={fieldStyle()}>
          <option value='all'>All Categories</option>
          {categoryOptions.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | ReturnType<typeof getKpiStatus>)} style={fieldStyle()}>
          <option value='all'>All Status</option>
          <option value='on-target'>On Target</option>
          <option value='below-target'>Below Target</option>
          <option value='critical'>Critical</option>
        </select>

        <button
          type='button'
          onClick={openCreateModal}
          style={{
            border: '1px solid rgba(79,142,247,0.48)',
            background: 'rgba(79,142,247,0.18)',
            color: '#b9d6ff',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            cursor: 'pointer',
          }}
        >
          <FiPlus size={14} />
          Add KPI
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px' }}>
        <KpiCard label='On Target' value={stats.onTarget} hint='Current >= target' />
        <KpiCard label='Below Target' value={stats.below} hint='Current between 80% and 99%' />
        <KpiCard label='Critical' value={stats.critical} hint='Current below 80%' />
      </div>

      <div
        style={{
          border: '1px solid var(--isms-border)',
          borderRadius: '12px',
          background: 'var(--isms-surf)',
          overflowX: 'auto',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--isms-txt3)', fontSize: '11px' }}>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>ID</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>KPI</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Category</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Current</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Target</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Unit</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Frequency</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Trend</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Status</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredKpis.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ padding: '12px', color: 'var(--isms-txt2)' }}>
                  No KPI metrics match the current filters.
                </td>
              </tr>
            ) : (
              filteredKpis.map((kpi) => {
                const status = getKpiStatus(kpi);
                const trend = trendView(asTrend(kpi.trend));

                return (
                  <tr key={kpi.id}>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', color: 'var(--isms-txt3)', fontFamily: '"Fira Code", monospace', fontSize: '11px' }}>{kpi.id.slice(0, 8)}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{kpi.name || 'Unnamed KPI'}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', color: 'var(--isms-txt2)' }}>{kpi.category || '-'}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', fontFamily: '"Fira Code", monospace' }}>{kpi.current}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', fontFamily: '"Fira Code", monospace' }}>{kpi.target}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{kpi.unit}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{kpi.frequency}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: trend.color }}>
                        {trend.icon === 'up' ? <FiTrendingUp size={13} /> : trend.icon === 'down' ? <FiTrendingDown size={13} /> : <span style={{ fontWeight: 700 }}>-</span>}
                        {trend.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>
                      <StatusBadge variant={badge(status)}>{statusLabel(status)}</StatusBadge>
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type='button'
                          onClick={() => openEditModal(kpi)}
                          style={{
                            border: '1px solid var(--isms-border)',
                            background: 'var(--isms-bg3)',
                            color: 'var(--isms-txt2)',
                            borderRadius: '7px',
                            padding: '5px 8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            cursor: 'pointer',
                          }}
                        >
                          <FiEdit2 size={12} /> Edit
                        </button>

                        <button
                          type='button'
                          onClick={() => void removeKpi(kpi.id)}
                          style={{
                            border: '1px solid rgba(239,68,68,0.45)',
                            background: 'rgba(239,68,68,0.18)',
                            color: 'var(--isms-red)',
                            borderRadius: '7px',
                            padding: '5px 8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            cursor: 'pointer',
                          }}
                        >
                          <FiTrash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit KPI Metric' : 'Add KPI Metric'}
        subtitle='Monitor ISMS performance against measurable objectives and expected trends.'
        footer={
          <>
            <div>
              {editingId ? (
                <button
                  type='button'
                  onClick={() => void removeKpi(editingId)}
                  style={{
                    border: '1px solid rgba(239,68,68,0.45)',
                    background: 'rgba(239,68,68,0.15)',
                    color: 'var(--isms-red)',
                    borderRadius: '8px',
                    padding: '7px 12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Delete KPI
                </button>
              ) : null}
            </div>

            <div style={{ display: 'inline-flex', gap: '8px' }}>
              <button
                type='button'
                onClick={closeModal}
                style={{
                  border: '1px solid var(--isms-border)',
                  background: 'var(--isms-bg3)',
                  color: 'var(--isms-txt2)',
                  borderRadius: '8px',
                  padding: '7px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type='button'
                onClick={() => void submitForm()}
                disabled={isSubmitting}
                style={{
                  border: '1px solid rgba(79,142,247,0.48)',
                  background: 'rgba(79,142,247,0.18)',
                  color: '#b9d6ff',
                  borderRadius: '8px',
                  padding: '7px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                {isSubmitting ? 'Saving...' : editingId ? 'Update KPI' : 'Save KPI'}
              </button>
            </div>
          </>
        }
      >
        <div style={{ display: 'grid', gap: '12px' }}>
          {formError ? (
            <div
              style={{
                border: '1px solid rgba(239,68,68,0.45)',
                background: 'rgba(239,68,68,0.12)',
                color: 'var(--isms-red)',
                borderRadius: '8px',
                padding: '8px 10px',
                fontSize: '12px',
              }}
            >
              {formError}
            </div>
          ) : null}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>KPI Name</label>
              <input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                style={fieldStyle()}
                placeholder='e.g. Mean Time to Detect'
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Category</label>
              <select value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))} style={fieldStyle()}>
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Unit</label>
              <input
                value={form.unit}
                onChange={(event) => setForm((prev) => ({ ...prev, unit: event.target.value }))}
                style={fieldStyle()}
                placeholder='e.g. %, hours, count'
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Target Value</label>
              <input
                type='number'
                step='any'
                value={form.target}
                onChange={(event) => setForm((prev) => ({ ...prev, target: event.target.value }))}
                style={fieldStyle()}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Current Value</label>
              <input
                type='number'
                step='any'
                value={form.current}
                onChange={(event) => setForm((prev) => ({ ...prev, current: event.target.value }))}
                style={fieldStyle()}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Frequency</label>
              <select value={form.frequency} onChange={(event) => setForm((prev) => ({ ...prev, frequency: event.target.value }))} style={fieldStyle()}>
                {FREQUENCY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Trend</label>
              <select value={form.trend} onChange={(event) => setForm((prev) => ({ ...prev, trend: event.target.value as KpiTrend }))} style={fieldStyle()}>
                <option value='up'>Improving</option>
                <option value='flat'>Stable</option>
                <option value='down'>Declining</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
