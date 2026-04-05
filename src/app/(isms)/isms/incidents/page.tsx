'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { FiEdit2, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';
import { INCIDENT_CATEGORIES } from '@/lib/isms/constants';
import type { IncidentSeverity, IncidentStatus, IsmsIncident } from '@/types/isms';
import { useIsmsStore } from '@/store/ismsStore';
import KpiCard from '@/components/isms/shared/KpiCard';
import StatusBadge from '@/components/isms/shared/StatusBadge';
import Modal from '@/components/isms/shared/Modal';

type IncidentForm = {
  title: string;
  detectedAt: string;
  severity: IncidentSeverity;
  category: string;
  status: IncidentStatus;
  description: string;
  impact: string;
  actions: string;
  lessons: string;
};

const SEVERITY_OPTIONS: IncidentSeverity[] = ['Low', 'Medium', 'High', 'Critical'];
const STATUS_OPTIONS: IncidentStatus[] = ['Open', 'Under Investigation', 'Resolved', 'Closed'];

const EMPTY_FORM: IncidentForm = {
  title: '',
  detectedAt: new Date().toISOString().slice(0, 10),
  severity: 'Medium',
  category: 'Other',
  status: 'Open',
  description: '',
  impact: '',
  actions: '',
  lessons: '',
};

function asIncidentSeverity(value: string): IncidentSeverity {
  if (value === 'Low' || value === 'Medium' || value === 'High' || value === 'Critical') {
    return value;
  }

  return 'Medium';
}

function asIncidentStatus(value: string): IncidentStatus {
  if (value === 'Open' || value === 'Under Investigation' || value === 'Resolved' || value === 'Closed') {
    return value;
  }

  return 'Open';
}

function severityVariant(value: IncidentSeverity): 'success' | 'info' | 'warning' | 'danger' {
  if (value === 'Critical') return 'danger';
  if (value === 'High') return 'warning';
  if (value === 'Medium') return 'info';
  return 'success';
}

function statusVariant(value: IncidentStatus): 'warning' | 'info' | 'success' | 'neutral' {
  if (value === 'Open') return 'warning';
  if (value === 'Under Investigation') return 'info';
  if (value === 'Resolved') return 'success';
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

export default function IncidentsPage() {
  const workspace = useIsmsStore((state) => state.workspace);
  const incidents = useIsmsStore((state) => state.incidents);
  const loadAll = useIsmsStore((state) => state.loadAll);
  const addIncident = useIsmsStore((state) => state.addIncident);
  const updateIncident = useIsmsStore((state) => state.updateIncident);
  const deleteIncident = useIsmsStore((state) => state.deleteIncident);

  const [query, setQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | IncidentSeverity>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | IncidentStatus>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<IncidentForm>(EMPTY_FORM);

  useEffect(() => {
    if (!workspace) {
      void loadAll();
    }
  }, [workspace, loadAll]);

  const stats = useMemo(() => {
    const open = incidents.filter((incident) => incident.status === 'Open').length;
    const critical = incidents.filter((incident) => incident.severity === 'Critical').length;

    return {
      total: incidents.length,
      open,
      critical,
    };
  }, [incidents]);

  const filteredIncidents = useMemo(
    () =>
      incidents.filter((incident) => {
        if (query.trim().length > 0) {
          const searchable = `${incident.title} ${incident.category} ${incident.description} ${incident.impact}`.toLowerCase();
          if (!searchable.includes(query.toLowerCase())) {
            return false;
          }
        }

        const severity = asIncidentSeverity(incident.severity);
        const status = asIncidentStatus(incident.status);

        if (severityFilter !== 'all' && severity !== severityFilter) {
          return false;
        }

        if (statusFilter !== 'all' && status !== statusFilter) {
          return false;
        }

        return true;
      }),
    [incidents, query, severityFilter, statusFilter],
  );

  function openCreateModal() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, detectedAt: new Date().toISOString().slice(0, 10) });
    setFormError(null);
    setModalOpen(true);
  }

  function openEditModal(incident: IsmsIncident) {
    setEditingId(incident.id);
    setForm({
      title: incident.title,
      detectedAt: incident.detectedAt || new Date().toISOString().slice(0, 10),
      severity: asIncidentSeverity(incident.severity),
      category: incident.category || 'Other',
      status: asIncidentStatus(incident.status),
      description: incident.description,
      impact: incident.impact,
      actions: incident.actions,
      lessons: incident.lessons,
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
      setFormError('Incident title is required.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        title: form.title.trim(),
        detectedAt: form.detectedAt,
        severity: form.severity,
        category: form.category,
        status: form.status,
        description: form.description.trim(),
        impact: form.impact.trim(),
        actions: form.actions.trim(),
        lessons: form.lessons.trim(),
      };

      if (editingId) {
        await updateIncident(editingId, payload);
      } else {
        await addIncident(payload);
      }

      closeModal();
    } catch (error) {
      console.error('Failed to persist incident:', error);
      setFormError(error instanceof Error ? error.message : 'Failed to save incident');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function removeIncident(id: string) {
    const approved = window.confirm('Delete this incident? This action cannot be undone.');
    if (!approved) {
      return;
    }

    try {
      await deleteIncident(id);
      if (editingId === id) {
        closeModal();
      }
    } catch (error) {
      console.error('Failed to delete incident:', error);
      setFormError(error instanceof Error ? error.message : 'Failed to delete incident');
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
            placeholder='Search title, category, description, or impact'
            style={{ ...fieldStyle(), paddingLeft: '30px' }}
          />
        </div>

        <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value as 'all' | IncidentSeverity)} style={fieldStyle()}>
          <option value='all'>All Severity</option>
          {SEVERITY_OPTIONS.map((severity) => (
            <option key={severity} value={severity}>
              {severity}
            </option>
          ))}
        </select>

        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | IncidentStatus)} style={fieldStyle()}>
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
          Log Incident
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px' }}>
        <KpiCard label='Total Incidents' value={stats.total} hint='All logged events' />
        <KpiCard label='Open Incidents' value={stats.open} hint='Require active handling' />
        <KpiCard label='Critical Incidents' value={stats.critical} hint='Highest severity' />
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
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Date</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Category</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Severity</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Status</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Impact</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredIncidents.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '12px', color: 'var(--isms-txt2)' }}>
                  No incidents match the current filters.
                </td>
              </tr>
            ) : (
              filteredIncidents.map((incident) => {
                const severity = asIncidentSeverity(incident.severity);
                const status = asIncidentStatus(incident.status);

                return (
                  <tr key={incident.id}>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', color: 'var(--isms-txt3)', fontFamily: '"Fira Code", monospace', fontSize: '11px' }}>
                      {incident.id.slice(0, 8)}
                    </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{incident.title || 'Untitled incident'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{incident.detectedAt || '-'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', color: 'var(--isms-txt2)' }}>{incident.category || '-'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>
                    <StatusBadge variant={severityVariant(severity)}>
                      {severity}
                    </StatusBadge>
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>
                    <StatusBadge variant={statusVariant(status)}>
                      {status}
                    </StatusBadge>
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', color: 'var(--isms-txt2)' }}>
                    {(incident.impact || '-').slice(0, 72)}
                    {(incident.impact || '').length > 72 ? '...' : ''}
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        type='button'
                        onClick={() => openEditModal(incident)}
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
                        onClick={() => void removeIncident(incident.id)}
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
        title={editingId ? 'Edit Incident' : 'Log Incident'}
        subtitle='Capture details, containment actions, and lessons learned for operational evidence.'
        footer={
          <>
            <div>
              {editingId ? (
                <button
                  type='button'
                  onClick={() => void removeIncident(editingId)}
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
                  Delete Incident
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
                {isSubmitting ? 'Saving...' : editingId ? 'Update Incident' : 'Log Incident'}
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
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Incident Title</label>
              <input
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                style={fieldStyle()}
                placeholder='Describe the incident clearly'
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Detected Date</label>
              <input
                type='date'
                value={form.detectedAt}
                onChange={(event) => setForm((prev) => ({ ...prev, detectedAt: event.target.value }))}
                style={fieldStyle()}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Category</label>
              <select
                value={form.category}
                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                style={fieldStyle()}
              >
                {INCIDENT_CATEGORIES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Severity</label>
              <select
                value={form.severity}
                onChange={(event) => setForm((prev) => ({ ...prev, severity: event.target.value as IncidentSeverity }))}
                style={fieldStyle()}
              >
                {SEVERITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Status</label>
              <select
                value={form.status}
                onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as IncidentStatus }))}
                style={fieldStyle()}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Description</label>
              <textarea
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                style={{ ...fieldStyle(), minHeight: '68px', resize: 'vertical' }}
                placeholder='What happened and how was it detected?'
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Business Impact</label>
              <textarea
                value={form.impact}
                onChange={(event) => setForm((prev) => ({ ...prev, impact: event.target.value }))}
                style={{ ...fieldStyle(), minHeight: '62px', resize: 'vertical' }}
                placeholder='Impact to services, confidentiality, integrity, or availability'
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Containment / Actions Taken</label>
              <textarea
                value={form.actions}
                onChange={(event) => setForm((prev) => ({ ...prev, actions: event.target.value }))}
                style={{ ...fieldStyle(), minHeight: '62px', resize: 'vertical' }}
                placeholder='Actions and response activities performed'
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Lessons Learned</label>
              <textarea
                value={form.lessons}
                onChange={(event) => setForm((prev) => ({ ...prev, lessons: event.target.value }))}
                style={{ ...fieldStyle(), minHeight: '62px', resize: 'vertical' }}
                placeholder='Post-incident learnings and process improvements'
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
