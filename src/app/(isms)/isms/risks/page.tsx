'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { FiEdit2, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';
import type { IsmsRisk, RiskStatus } from '@/types/isms';
import { useIsmsStore } from '@/store/ismsStore';
import { getRiskLevel, getRiskScore } from '@/lib/isms/calculations';
import { RISK_CATEGORIES } from '@/lib/isms/constants';
import KpiCard from '@/components/isms/shared/KpiCard';
import Modal from '@/components/isms/shared/Modal';
import StatusBadge from '@/components/isms/shared/StatusBadge';

type SeverityFilter = 'all' | 'Critical' | 'High' | 'Medium' | 'Low';

type RiskForm = {
  title: string;
  category: string;
  asset: string;
  likelihood: number;
  impact: number;
  treatment: string;
  treatDesc: string;
  owner: string;
  targetDate: string;
  status: RiskStatus;
};

const STATUS_OPTIONS: RiskStatus[] = ['Open', 'In Treatment', 'Accepted', 'Closed'];
const TREATMENT_OPTIONS = ['Mitigate', 'Transfer', 'Accept', 'Avoid'];

const EMPTY_FORM: RiskForm = {
  title: '',
  category: 'Cyber Threat',
  asset: '',
  likelihood: 3,
  impact: 3,
  treatment: 'Mitigate',
  treatDesc: '',
  owner: '',
  targetDate: '',
  status: 'Open',
};

function levelVariant(level: ReturnType<typeof getRiskLevel>): 'danger' | 'warning' | 'info' | 'success' {
  if (level === 'Critical') return 'danger';
  if (level === 'High') return 'warning';
  if (level === 'Medium') return 'info';
  return 'success';
}

function statusVariant(status: RiskStatus): 'neutral' | 'warning' | 'danger' | 'success' | 'info' {
  if (status === 'Closed') return 'success';
  if (status === 'Accepted') return 'neutral';
  if (status === 'In Treatment') return 'info';
  return 'warning';
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

export default function IsmsRisksPage() {
  const workspace = useIsmsStore((state) => state.workspace);
  const risks = useIsmsStore((state) => state.risks);
  const loadAll = useIsmsStore((state) => state.loadAll);
  const addRisk = useIsmsStore((state) => state.addRisk);
  const updateRisk = useIsmsStore((state) => state.updateRisk);
  const deleteRisk = useIsmsStore((state) => state.deleteRisk);

  const [query, setQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | RiskStatus>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<RiskForm>(EMPTY_FORM);

  useEffect(() => {
    if (!workspace) {
      void loadAll();
    }
  }, [workspace, loadAll]);

  const stats = useMemo(() => {
    const open = risks.filter((risk) => risk.status === 'Open').length;
    const accepted = risks.filter((risk) => risk.status === 'Accepted').length;
    const highPlus = risks.filter((risk) => getRiskScore(risk.likelihood, risk.impact) >= 10).length;

    return {
      total: risks.length,
      open,
      highPlus,
      accepted,
    };
  }, [risks]);

  const filteredRisks = useMemo(
    () =>
      risks.filter((risk) => {
        const score = getRiskScore(risk.likelihood, risk.impact);
        const level = getRiskLevel(score);

        if (query.trim().length > 0) {
          const q = query.toLowerCase();
          const searchable = `${risk.title} ${risk.category} ${risk.owner} ${risk.asset}`.toLowerCase();
          if (!searchable.includes(q)) {
            return false;
          }
        }

        if (severityFilter !== 'all' && level !== severityFilter) {
          return false;
        }

        if (statusFilter !== 'all' && risk.status !== statusFilter) {
          return false;
        }

        return true;
      }),
    [query, risks, severityFilter, statusFilter],
  );

  const currentScore = getRiskScore(form.likelihood, form.impact);
  const currentLevel = getRiskLevel(currentScore);

  function openCreateModal() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  }

  function openEditModal(risk: IsmsRisk) {
    setEditingId(risk.id);
    setForm({
      title: risk.title,
      category: risk.category || 'Cyber Threat',
      asset: risk.asset,
      likelihood: risk.likelihood,
      impact: risk.impact,
      treatment: risk.treatment || 'Mitigate',
      treatDesc: risk.treatDesc,
      owner: risk.owner,
      targetDate: risk.targetDate,
      status: (risk.status || 'Open') as RiskStatus,
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
    if (!form.title.trim()) {
      setFormError('Risk title is required.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingId) {
        await updateRisk(editingId, {
          title: form.title.trim(),
          category: form.category,
          asset: form.asset.trim(),
          likelihood: form.likelihood,
          impact: form.impact,
          treatment: form.treatment,
          treatDesc: form.treatDesc.trim(),
          owner: form.owner.trim(),
          targetDate: form.targetDate,
          status: form.status,
        });
      } else {
        await addRisk({
          title: form.title.trim(),
          category: form.category,
          asset: form.asset.trim(),
          likelihood: form.likelihood,
          impact: form.impact,
          treatment: form.treatment,
          treatDesc: form.treatDesc.trim(),
          owner: form.owner.trim(),
          targetDate: form.targetDate,
          status: form.status,
        });
      }

      closeModal();
    } catch (error) {
      console.error('Failed to persist risk:', error);
      setFormError(error instanceof Error ? error.message : 'Failed to save risk');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function removeRisk(id: string) {
    const approved = window.confirm('Delete this risk? This action cannot be undone.');
    if (!approved) {
      return;
    }

    try {
      await deleteRisk(id);
      if (editingId === id) {
        closeModal();
      }
    } catch (error) {
      console.error('Failed to delete risk:', error);
      setFormError(error instanceof Error ? error.message : 'Failed to delete risk');
    }
  }

  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      <div
        style={{
          border: '1px solid var(--isms-border)',
          borderRadius: '12px',
          background: 'var(--isms-surf)',
          padding: '12px',
          display: 'grid',
          gridTemplateColumns: '2fr repeat(2, 1fr) auto',
          gap: '10px',
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative' }}>
          <FiSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--isms-txt3)' }} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder='Search title, category, owner, or asset'
            style={{ ...fieldStyle(), paddingLeft: '30px' }}
          />
        </div>

        <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value as SeverityFilter)} style={fieldStyle()}>
          <option value='all'>All Severity</option>
          <option value='Critical'>Critical</option>
          <option value='High'>High</option>
          <option value='Medium'>Medium</option>
          <option value='Low'>Low</option>
        </select>

        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | RiskStatus)} style={fieldStyle()}>
          <option value='all'>All Status</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
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
          Add Risk
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px' }}>
        <KpiCard label='Total Risks' value={stats.total} hint='All records in scope' />
        <KpiCard label='Open' value={stats.open} hint='Requires treatment decision' />
        <KpiCard label='High + Critical' value={stats.highPlus} hint='Score 10 or above' />
        <KpiCard label='Accepted' value={stats.accepted} hint='Risk formally accepted' />
      </div>

      <div
        style={{
          border: '1px solid var(--isms-border)',
          borderRadius: '12px',
          background: 'var(--isms-surf)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', fontSize: '11px', color: 'var(--isms-txt3)' }}>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>ID</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Title</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Category</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>L</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>I</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Score</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Level</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Status</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Owner</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRisks.map((risk) => {
              const score = getRiskScore(risk.likelihood, risk.impact);
              const level = getRiskLevel(score);

              return (
                <tr key={risk.id}>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', fontFamily: '"Fira Code", monospace', fontSize: '11px', color: 'var(--isms-txt3)' }}>
                    {risk.id.slice(0, 8)}
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>
                    {risk.title || 'Untitled risk'}
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', color: 'var(--isms-txt2)' }}>
                    {risk.category || '-'}
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', fontFamily: '"Fira Code", monospace' }}>
                    {risk.likelihood}
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', fontFamily: '"Fira Code", monospace' }}>
                    {risk.impact}
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', fontFamily: '"Fira Code", monospace' }}>
                    {score}
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>
                    <StatusBadge variant={levelVariant(level)}>{level}</StatusBadge>
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>
                    <StatusBadge variant={statusVariant(risk.status as RiskStatus)}>{risk.status}</StatusBadge>
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', color: 'var(--isms-txt2)' }}>
                    {risk.owner || '-'}
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        type='button'
                        onClick={() => openEditModal(risk)}
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
                        onClick={() => void removeRisk(risk.id)}
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
            })}

            {filteredRisks.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ padding: '14px 12px', color: 'var(--isms-txt2)' }}>
                  No risks match the current filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Risk' : 'Add Risk'}
        subtitle='Capture treatment, ownership, and due date details for board-level visibility.'
        footer={
          <>
            <div>
              {editingId ? (
                <button
                  type='button'
                  onClick={() => void removeRisk(editingId)}
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
                  Delete Risk
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
                {isSubmitting ? 'Saving...' : editingId ? 'Update Risk' : 'Save Risk'}
              </button>
            </div>
          </>
        }
      >
        <div style={{ display: 'grid', gap: '12px' }}>
          {formError ? (
            <div style={{
              border: '1px solid rgba(239,68,68,0.45)',
              background: 'rgba(239,68,68,0.12)',
              color: 'var(--isms-red)',
              borderRadius: '8px',
              padding: '8px 10px',
              fontSize: '12px',
            }}>
              {formError}
            </div>
          ) : null}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Risk Title</label>
              <input
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                style={fieldStyle()}
                placeholder='Describe the risk scenario'
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Category</label>
              <select
                value={form.category}
                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                style={fieldStyle()}
              >
                {RISK_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Asset / Process</label>
              <input
                value={form.asset}
                onChange={(event) => setForm((prev) => ({ ...prev, asset: event.target.value }))}
                style={fieldStyle()}
                placeholder='Optional context'
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Likelihood (1-5)</label>
              <input
                type='number'
                min={1}
                max={5}
                value={form.likelihood}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, likelihood: Math.max(1, Math.min(5, Number(event.target.value) || 1)) }))
                }
                style={fieldStyle()}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Impact (1-5)</label>
              <input
                type='number'
                min={1}
                max={5}
                value={form.impact}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, impact: Math.max(1, Math.min(5, Number(event.target.value) || 1)) }))
                }
                style={fieldStyle()}
              />
            </div>

            <div style={{
              border: '1px solid var(--isms-border)',
              borderRadius: '8px',
              background: 'var(--isms-bg3)',
              padding: '9px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '12px', color: 'var(--isms-txt2)' }}>Calculated Score</span>
              <StatusBadge variant={levelVariant(currentLevel)}>
                {currentScore} · {currentLevel}
              </StatusBadge>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Treatment</label>
              <select
                value={form.treatment}
                onChange={(event) => setForm((prev) => ({ ...prev, treatment: event.target.value }))}
                style={fieldStyle()}
              >
                {TREATMENT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Owner</label>
              <input
                value={form.owner}
                onChange={(event) => setForm((prev) => ({ ...prev, owner: event.target.value }))}
                style={fieldStyle()}
                placeholder='Risk owner'
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Status</label>
              <select
                value={form.status}
                onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as RiskStatus }))}
                style={fieldStyle()}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Target Date</label>
              <input
                type='date'
                value={form.targetDate}
                onChange={(event) => setForm((prev) => ({ ...prev, targetDate: event.target.value }))}
                style={fieldStyle()}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Treatment Notes</label>
              <textarea
                value={form.treatDesc}
                onChange={(event) => setForm((prev) => ({ ...prev, treatDesc: event.target.value }))}
                style={{ ...fieldStyle(), minHeight: '72px', resize: 'vertical' }}
                placeholder='Capture selected treatment rationale and follow-up details'
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
