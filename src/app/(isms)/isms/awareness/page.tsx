'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { FiEdit2, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';
import type { IsmsAwareness } from '@/types/isms';
import { useIsmsStore } from '@/store/ismsStore';
import KpiCard from '@/components/isms/shared/KpiCard';
import StatusBadge from '@/components/isms/shared/StatusBadge';
import Modal from '@/components/isms/shared/Modal';

type AwarenessForm = {
  title: string;
  type: string;
  sessionDate: string;
  audience: string;
  completionRate: string;
  status: string;
  notes: string;
};

const TYPE_OPTIONS = [
  'Phishing Simulation',
  'Online Training',
  'Workshop',
  'Induction',
  'Policy Review',
  'Tabletop Exercise',
  'Newsletter',
];

const STATUS_OPTIONS = ['Planned', 'In Progress', 'Completed'];

const EMPTY_FORM: AwarenessForm = {
  title: '',
  type: 'Online Training',
  sessionDate: '',
  audience: '',
  completionRate: '0',
  status: 'Planned',
  notes: '',
};

function statusVariant(value: string): 'neutral' | 'info' | 'warning' | 'success' {
  if (value === 'Completed') return 'success';
  if (value === 'In Progress') return 'info';
  return 'neutral';
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

export default function AwarenessPage() {
  const workspace = useIsmsStore((state) => state.workspace);
  const awareness = useIsmsStore((state) => state.awareness);
  const loadAll = useIsmsStore((state) => state.loadAll);
  const addAwareness = useIsmsStore((state) => state.addAwareness);
  const updateAwareness = useIsmsStore((state) => state.updateAwareness);
  const deleteAwareness = useIsmsStore((state) => state.deleteAwareness);

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<AwarenessForm>(EMPTY_FORM);

  useEffect(() => {
    if (!workspace) {
      void loadAll();
    }
  }, [workspace, loadAll]);

  const stats = useMemo(() => {
    const completed = awareness.filter((item) => item.status === 'Completed').length;
    const inProgress = awareness.filter((item) => item.status === 'In Progress').length;
    const avgCompletion =
      awareness.length > 0
        ? Math.round(awareness.reduce((sum, item) => sum + item.completionRate, 0) / awareness.length)
        : 0;
    const phishingSims = awareness.filter((item) => item.type === 'Phishing Simulation').length;

    return { completed, inProgress, avgCompletion, phishingSims };
  }, [awareness]);

  const filteredAwareness = useMemo(
    () =>
      awareness.filter((item) => {
        if (query.trim().length > 0) {
          const searchable = `${item.title} ${item.type} ${item.audience} ${item.notes}`.toLowerCase();
          if (!searchable.includes(query.toLowerCase())) {
            return false;
          }
        }

        if (typeFilter !== 'all' && item.type !== typeFilter) {
          return false;
        }

        if (statusFilter !== 'all' && item.status !== statusFilter) {
          return false;
        }

        return true;
      }),
    [awareness, query, statusFilter, typeFilter],
  );

  function openCreateModal() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  }

  function openEditModal(item: IsmsAwareness) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      type: item.type || 'Online Training',
      sessionDate: item.sessionDate,
      audience: item.audience,
      completionRate: String(item.completionRate),
      status: item.status || 'Planned',
      notes: item.notes,
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
      setFormError('Session title is required.');
      return;
    }

    const parsedRate = Number(form.completionRate);
    if (!Number.isFinite(parsedRate)) {
      setFormError('Completion rate must be a valid number between 0 and 100.');
      return;
    }

    const completionRate = Math.max(0, Math.min(100, parsedRate));

    setIsSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        title: form.title.trim(),
        type: form.type,
        sessionDate: form.sessionDate,
        audience: form.audience.trim(),
        completionRate,
        status: form.status,
        notes: form.notes.trim(),
      };

      if (editingId) {
        await updateAwareness(editingId, payload);
      } else {
        await addAwareness(payload);
      }

      closeModal();
    } catch (error) {
      console.error('Failed to persist awareness session:', error);
      setFormError(error instanceof Error ? error.message : 'Failed to save session');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function removeAwareness(id: string) {
    const approved = window.confirm('Delete this awareness session? This action cannot be undone.');
    if (!approved) {
      return;
    }

    try {
      await deleteAwareness(id);
      if (editingId === id) {
        closeModal();
      }
    } catch (error) {
      console.error('Failed to delete awareness session:', error);
      setFormError(error instanceof Error ? error.message : 'Failed to delete session');
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
            placeholder='Search title, type, audience, or notes'
            style={{ ...fieldStyle(), paddingLeft: '30px' }}
          />
        </div>

        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} style={fieldStyle()}>
          <option value='all'>All Types</option>
          {TYPE_OPTIONS.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={fieldStyle()}>
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
          Add Session
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '10px' }}>
        <KpiCard label='Total Sessions' value={awareness.length} hint='All awareness records' />
        <KpiCard label='Completed Sessions' value={stats.completed} hint='Status: completed' />
        <KpiCard label='In Progress Sessions' value={stats.inProgress} hint='Status: in progress' />
        <KpiCard label='Average Completion' value={`${stats.avgCompletion}%`} hint='Across all sessions' />
        <KpiCard label='Phishing Simulations' value={stats.phishingSims} hint='Simulation-specific activity' />
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
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Title</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Type</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Date</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Audience</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Completion</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Status</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAwareness.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '12px', color: 'var(--isms-txt2)' }}>
                  No awareness sessions match the current filters.
                </td>
              </tr>
            ) : (
              filteredAwareness.map((item) => {
                const rate = Math.max(0, Math.min(100, item.completionRate));
                const progressColor = rate >= 90 ? 'var(--isms-green)' : rate >= 70 ? 'var(--isms-cyan)' : 'var(--isms-amber)';

                return (
                <tr key={item.id}>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', color: 'var(--isms-txt3)', fontFamily: '"Fira Code", monospace', fontSize: '11px' }}>{item.id.slice(0, 8)}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{item.title || 'Untitled session'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', color: 'var(--isms-txt2)' }}>{item.type}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{item.sessionDate || '-'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{item.audience || '-'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', minWidth: '120px' }}>
                      <div style={{ height: '6px', width: '70px', borderRadius: '999px', background: 'var(--isms-bg3)', overflow: 'hidden', border: '1px solid var(--isms-border)' }}>
                        <div style={{ height: '100%', width: `${rate}%`, background: progressColor }} />
                      </div>
                      <span style={{ fontFamily: '"Fira Code", monospace', fontSize: '11px' }}>{rate}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>
                    <StatusBadge variant={statusVariant(item.status)}>{item.status}</StatusBadge>
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        type='button'
                        onClick={() => openEditModal(item)}
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
                        onClick={() => void removeAwareness(item.id)}
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
        title={editingId ? 'Edit Awareness Session' : 'Add Awareness Session'}
        subtitle='Track delivery, participation, and completion outcomes for Clause 7.3 evidence.'
        footer={
          <>
            <div>
              {editingId ? (
                <button
                  type='button'
                  onClick={() => void removeAwareness(editingId)}
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
                  Delete Session
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
                {isSubmitting ? 'Saving...' : editingId ? 'Update Session' : 'Save Session'}
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
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Session Title</label>
              <input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} style={fieldStyle()} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Type</label>
              <select value={form.type} onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))} style={fieldStyle()}>
                {TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Session Date</label>
              <input
                type='date'
                value={form.sessionDate}
                onChange={(event) => setForm((prev) => ({ ...prev, sessionDate: event.target.value }))}
                style={fieldStyle()}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Audience</label>
              <input
                value={form.audience}
                onChange={(event) => setForm((prev) => ({ ...prev, audience: event.target.value }))}
                style={fieldStyle()}
                placeholder='All staff, IT team, leadership, etc.'
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Completion Rate %</label>
              <input
                type='number'
                min={0}
                max={100}
                value={form.completionRate}
                onChange={(event) => setForm((prev) => ({ ...prev, completionRate: event.target.value }))}
                style={fieldStyle()}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Status</label>
              <select value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))} style={fieldStyle()}>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Outcomes / Notes</label>
              <textarea
                value={form.notes}
                onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                style={{ ...fieldStyle(), minHeight: '68px', resize: 'vertical' }}
                placeholder='Capture outcomes, follow-up actions, and observations'
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
