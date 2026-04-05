'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { FiEdit2, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';
import type { IsmsAudit, IsmsNca } from '@/types/isms';
import { useIsmsStore } from '@/store/ismsStore';
import KpiCard from '@/components/isms/shared/KpiCard';
import StatusBadge from '@/components/isms/shared/StatusBadge';
import Modal from '@/components/isms/shared/Modal';

type AuditForm = {
  title: string;
  scope: string;
  auditDate: string;
  auditor: string;
  clauses: string;
  auditType: string;
  status: string;
  findings: string;
};

type NcaForm = {
  reference: string;
  type: string;
  description: string;
  rootCause: string;
  correctiveAction: string;
  owner: string;
  dueDate: string;
  status: string;
};

const AUDIT_TYPE_OPTIONS = ['Internal', 'Stage 1 (CB)', 'Stage 2 (CB)', 'Surveillance'];
const AUDIT_STATUS_OPTIONS = ['Planned', 'In Progress', 'Completed'];
const NCA_TYPE_OPTIONS = ['Major NC', 'Minor NC', 'Observation', 'OFI'];
const NCA_STATUS_OPTIONS = ['Open', 'In Progress', 'Closed'];

const EMPTY_AUDIT_FORM: AuditForm = {
  title: '',
  scope: '',
  auditDate: '',
  auditor: '',
  clauses: '',
  auditType: 'Internal',
  status: 'Planned',
  findings: '',
};

const EMPTY_NCA_FORM: NcaForm = {
  reference: '',
  type: 'Minor NC',
  description: '',
  rootCause: '',
  correctiveAction: '',
  owner: '',
  dueDate: '',
  status: 'Open',
};

function auditStatusVariant(value: string): 'neutral' | 'info' | 'warning' | 'success' {
  if (value === 'Completed') return 'success';
  if (value === 'In Progress') return 'info';
  if (value === 'Planned') return 'neutral';
  return 'warning';
}

function ncaStatusVariant(value: string): 'warning' | 'info' | 'success' {
  if (value === 'Closed') return 'success';
  if (value === 'In Progress') return 'info';
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

export default function AuditPage() {
  const workspace = useIsmsStore((state) => state.workspace);
  const audits = useIsmsStore((state) => state.audits);
  const ncas = useIsmsStore((state) => state.ncas);
  const loadAll = useIsmsStore((state) => state.loadAll);
  const addAudit = useIsmsStore((state) => state.addAudit);
  const updateAudit = useIsmsStore((state) => state.updateAudit);
  const deleteAudit = useIsmsStore((state) => state.deleteAudit);
  const addNca = useIsmsStore((state) => state.addNca);
  const updateNca = useIsmsStore((state) => state.updateNca);
  const deleteNca = useIsmsStore((state) => state.deleteNca);

  const [auditQuery, setAuditQuery] = useState('');
  const [auditStatusFilter, setAuditStatusFilter] = useState<'all' | string>('all');
  const [ncaQuery, setNcaQuery] = useState('');
  const [ncaStatusFilter, setNcaStatusFilter] = useState<'all' | string>('all');

  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [editingAuditId, setEditingAuditId] = useState<string | null>(null);
  const [auditSubmitting, setAuditSubmitting] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditForm, setAuditForm] = useState<AuditForm>(EMPTY_AUDIT_FORM);

  const [ncaModalOpen, setNcaModalOpen] = useState(false);
  const [editingNcaId, setEditingNcaId] = useState<string | null>(null);
  const [ncaSubmitting, setNcaSubmitting] = useState(false);
  const [ncaError, setNcaError] = useState<string | null>(null);
  const [ncaForm, setNcaForm] = useState<NcaForm>(EMPTY_NCA_FORM);

  useEffect(() => {
    if (!workspace) {
      void loadAll();
    }
  }, [workspace, loadAll]);

  const stats = useMemo(() => {
    const openNcas = ncas.filter((nca) => nca.status !== 'Closed').length;
    const completedAudits = audits.filter((audit) => audit.status === 'Completed').length;

    return {
      audits: audits.length,
      completedAudits,
      ncas: ncas.length,
      openNcas,
    };
  }, [audits, ncas]);

  const filteredAudits = useMemo(
    () =>
      audits.filter((audit) => {
        if (auditQuery.trim().length > 0) {
          const searchable = `${audit.title} ${audit.scope} ${audit.auditor} ${audit.clauses} ${audit.findings}`.toLowerCase();
          if (!searchable.includes(auditQuery.toLowerCase())) {
            return false;
          }
        }

        if (auditStatusFilter !== 'all' && audit.status !== auditStatusFilter) {
          return false;
        }

        return true;
      }),
    [auditQuery, auditStatusFilter, audits],
  );

  const filteredNcas = useMemo(
    () =>
      ncas.filter((nca) => {
        if (ncaQuery.trim().length > 0) {
          const searchable = `${nca.reference} ${nca.type} ${nca.owner} ${nca.description} ${nca.correctiveAction}`.toLowerCase();
          if (!searchable.includes(ncaQuery.toLowerCase())) {
            return false;
          }
        }

        if (ncaStatusFilter !== 'all' && nca.status !== ncaStatusFilter) {
          return false;
        }

        return true;
      }),
    [ncaQuery, ncaStatusFilter, ncas],
  );

  function openCreateAuditModal() {
    setEditingAuditId(null);
    setAuditForm(EMPTY_AUDIT_FORM);
    setAuditError(null);
    setAuditModalOpen(true);
  }

  function openEditAuditModal(audit: IsmsAudit) {
    setEditingAuditId(audit.id);
    setAuditForm({
      title: audit.title,
      scope: audit.scope,
      auditDate: audit.auditDate,
      auditor: audit.auditor,
      clauses: audit.clauses,
      auditType: audit.auditType || 'Internal',
      status: audit.status || 'Planned',
      findings: audit.findings,
    });
    setAuditError(null);
    setAuditModalOpen(true);
  }

  function closeAuditModal() {
    setAuditModalOpen(false);
    setEditingAuditId(null);
    setAuditError(null);
  }

  async function submitAudit() {
    if (!auditForm.title.trim()) {
      setAuditError('Audit title is required.');
      return;
    }

    setAuditSubmitting(true);
    setAuditError(null);

    try {
      const payload = {
        title: auditForm.title.trim(),
        scope: auditForm.scope.trim(),
        auditDate: auditForm.auditDate,
        auditor: auditForm.auditor.trim(),
        clauses: auditForm.clauses.trim(),
        auditType: auditForm.auditType,
        status: auditForm.status,
        findings: auditForm.findings.trim(),
      };

      if (editingAuditId) {
        await updateAudit(editingAuditId, payload);
      } else {
        await addAudit(payload);
      }

      closeAuditModal();
    } catch (error) {
      console.error('Failed to persist audit:', error);
      setAuditError(error instanceof Error ? error.message : 'Failed to save audit');
    } finally {
      setAuditSubmitting(false);
    }
  }

  async function removeAudit(id: string) {
    const approved = window.confirm('Delete this audit? This action cannot be undone.');
    if (!approved) {
      return;
    }

    try {
      await deleteAudit(id);
      if (editingAuditId === id) {
        closeAuditModal();
      }
    } catch (error) {
      console.error('Failed to delete audit:', error);
      setAuditError(error instanceof Error ? error.message : 'Failed to delete audit');
    }
  }

  function openCreateNcaModal() {
    setEditingNcaId(null);
    setNcaForm(EMPTY_NCA_FORM);
    setNcaError(null);
    setNcaModalOpen(true);
  }

  function openEditNcaModal(nca: IsmsNca) {
    setEditingNcaId(nca.id);
    setNcaForm({
      reference: nca.reference,
      type: nca.type || 'Minor NC',
      description: nca.description,
      rootCause: nca.rootCause,
      correctiveAction: nca.correctiveAction,
      owner: nca.owner,
      dueDate: nca.dueDate,
      status: nca.status || 'Open',
    });
    setNcaError(null);
    setNcaModalOpen(true);
  }

  function closeNcaModal() {
    setNcaModalOpen(false);
    setEditingNcaId(null);
    setNcaError(null);
  }

  async function submitNca() {
    if (!ncaForm.reference.trim()) {
      setNcaError('NCA reference is required.');
      return;
    }

    if (!ncaForm.description.trim()) {
      setNcaError('NCA description is required.');
      return;
    }

    setNcaSubmitting(true);
    setNcaError(null);

    try {
      const payload = {
        reference: ncaForm.reference.trim(),
        type: ncaForm.type,
        description: ncaForm.description.trim(),
        rootCause: ncaForm.rootCause.trim(),
        correctiveAction: ncaForm.correctiveAction.trim(),
        owner: ncaForm.owner.trim(),
        dueDate: ncaForm.dueDate,
        status: ncaForm.status,
      };

      if (editingNcaId) {
        await updateNca(editingNcaId, payload);
      } else {
        await addNca(payload);
      }

      closeNcaModal();
    } catch (error) {
      console.error('Failed to persist NCA:', error);
      setNcaError(error instanceof Error ? error.message : 'Failed to save NCA');
    } finally {
      setNcaSubmitting(false);
    }
  }

  async function removeNca(id: string) {
    const approved = window.confirm('Delete this NCA? This action cannot be undone.');
    if (!approved) {
      return;
    }

    try {
      await deleteNca(id);
      if (editingNcaId === id) {
        closeNcaModal();
      }
    } catch (error) {
      console.error('Failed to delete NCA:', error);
      setNcaError(error instanceof Error ? error.message : 'Failed to delete NCA');
    }
  }

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px' }}>
        <KpiCard label='Audits' value={stats.audits} hint='Planned and completed audits' />
        <KpiCard label='Completed Audits' value={stats.completedAudits} hint='Status completed' />
        <KpiCard label='NCAs' value={stats.ncas} hint='Nonconformities and observations' />
        <KpiCard label='Open NCAs' value={stats.openNcas} hint='Require action tracking' />
      </div>

      <div
        style={{
          border: '1px solid var(--isms-border)',
          borderRadius: '12px',
          background: 'var(--isms-surf)',
          overflowX: 'auto',
        }}
      >
        <div style={{ padding: '12px', borderBottom: '1px solid var(--isms-border)', display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <FiSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--isms-txt3)' }} />
            <input
              value={auditQuery}
              onChange={(event) => setAuditQuery(event.target.value)}
              placeholder='Search title, auditor, scope, clauses, or findings'
              style={{ ...fieldStyle(), paddingLeft: '30px' }}
            />
          </div>

          <select value={auditStatusFilter} onChange={(event) => setAuditStatusFilter(event.target.value)} style={fieldStyle()}>
            <option value='all'>All Status</option>
            {AUDIT_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <button
            type='button'
            onClick={openCreateAuditModal}
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
            Schedule Audit
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--isms-txt3)', fontSize: '11px' }}>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>ID</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Title</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Type</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Date</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Auditor</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Status</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Findings</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAudits.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '12px', color: 'var(--isms-txt2)' }}>
                  No audits match the current filters.
                </td>
              </tr>
            ) : (
              filteredAudits.map((audit) => (
                <tr key={audit.id}>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', color: 'var(--isms-txt3)', fontFamily: '"Fira Code", monospace', fontSize: '11px' }}>{audit.id.slice(0, 8)}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{audit.title || 'Untitled audit'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{audit.auditType}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{audit.auditDate || '-'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', color: 'var(--isms-txt2)' }}>{audit.auditor || '-'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>
                    <StatusBadge variant={auditStatusVariant(audit.status)}>
                      {audit.status}
                    </StatusBadge>
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', color: 'var(--isms-txt2)' }}>
                    {(audit.findings || '-').slice(0, 72)}
                    {(audit.findings || '').length > 72 ? '...' : ''}
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        type='button'
                        onClick={() => openEditAuditModal(audit)}
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
                        onClick={() => void removeAudit(audit.id)}
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
              ))
            )}
          </tbody>
        </table>
      </div>

      <div
        style={{
          border: '1px solid var(--isms-border)',
          borderRadius: '12px',
          background: 'var(--isms-surf)',
          overflowX: 'auto',
        }}
      >
        <div style={{ padding: '12px', borderBottom: '1px solid var(--isms-border)', display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <FiSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--isms-txt3)' }} />
            <input
              value={ncaQuery}
              onChange={(event) => setNcaQuery(event.target.value)}
              placeholder='Search reference, owner, description, or corrective action'
              style={{ ...fieldStyle(), paddingLeft: '30px' }}
            />
          </div>

          <select value={ncaStatusFilter} onChange={(event) => setNcaStatusFilter(event.target.value)} style={fieldStyle()}>
            <option value='all'>All Status</option>
            {NCA_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <button
            type='button'
            onClick={openCreateNcaModal}
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
            Add NCA
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--isms-txt3)', fontSize: '11px' }}>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>ID</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Reference</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Type</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Owner</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Due Date</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Status</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Description</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredNcas.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '12px', color: 'var(--isms-txt2)' }}>
                  No NCAs match the current filters.
                </td>
              </tr>
            ) : (
              filteredNcas.map((nca) => (
                <tr key={nca.id}>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', color: 'var(--isms-txt3)', fontFamily: '"Fira Code", monospace', fontSize: '11px' }}>{nca.id.slice(0, 8)}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', fontFamily: '"Fira Code", monospace' }}>{nca.reference || '-'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{nca.type}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', color: 'var(--isms-txt2)' }}>{nca.owner || '-'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{nca.dueDate || '-'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>
                    <StatusBadge variant={ncaStatusVariant(nca.status)}>
                      {nca.status}
                    </StatusBadge>
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', color: 'var(--isms-txt2)' }}>
                    {(nca.description || '-').slice(0, 72)}
                    {(nca.description || '').length > 72 ? '...' : ''}
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        type='button'
                        onClick={() => openEditNcaModal(nca)}
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
                        onClick={() => void removeNca(nca.id)}
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
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={auditModalOpen}
        onClose={closeAuditModal}
        title={editingAuditId ? 'Edit Audit' : 'Schedule Audit'}
        subtitle='Plan, track, and evidence the internal audit programme under Clause 9.2.'
        footer={
          <>
            <div>
              {editingAuditId ? (
                <button
                  type='button'
                  onClick={() => void removeAudit(editingAuditId)}
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
                  Delete Audit
                </button>
              ) : null}
            </div>

            <div style={{ display: 'inline-flex', gap: '8px' }}>
              <button
                type='button'
                onClick={closeAuditModal}
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
                onClick={() => void submitAudit()}
                disabled={auditSubmitting}
                style={{
                  border: '1px solid rgba(79,142,247,0.48)',
                  background: 'rgba(79,142,247,0.18)',
                  color: '#b9d6ff',
                  borderRadius: '8px',
                  padding: '7px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: auditSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                {auditSubmitting ? 'Saving...' : editingAuditId ? 'Update Audit' : 'Save Audit'}
              </button>
            </div>
          </>
        }
      >
        <div style={{ display: 'grid', gap: '12px' }}>
          {auditError ? (
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
              {auditError}
            </div>
          ) : null}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Audit Title</label>
              <input value={auditForm.title} onChange={(event) => setAuditForm((prev) => ({ ...prev, title: event.target.value }))} style={fieldStyle()} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Audit Scope</label>
              <textarea
                value={auditForm.scope}
                onChange={(event) => setAuditForm((prev) => ({ ...prev, scope: event.target.value }))}
                style={{ ...fieldStyle(), minHeight: '60px', resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Planned Date</label>
              <input type='date' value={auditForm.auditDate} onChange={(event) => setAuditForm((prev) => ({ ...prev, auditDate: event.target.value }))} style={fieldStyle()} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Lead Auditor</label>
              <input value={auditForm.auditor} onChange={(event) => setAuditForm((prev) => ({ ...prev, auditor: event.target.value }))} style={fieldStyle()} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Clauses / Controls</label>
              <input
                value={auditForm.clauses}
                onChange={(event) => setAuditForm((prev) => ({ ...prev, clauses: event.target.value }))}
                style={fieldStyle()}
                placeholder='e.g. Clause 4, 5, A.5.1-A.5.10'
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Audit Type</label>
              <select value={auditForm.auditType} onChange={(event) => setAuditForm((prev) => ({ ...prev, auditType: event.target.value }))} style={fieldStyle()}>
                {AUDIT_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Status</label>
              <select value={auditForm.status} onChange={(event) => setAuditForm((prev) => ({ ...prev, status: event.target.value }))} style={fieldStyle()}>
                {AUDIT_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Findings / Observations</label>
              <textarea
                value={auditForm.findings}
                onChange={(event) => setAuditForm((prev) => ({ ...prev, findings: event.target.value }))}
                style={{ ...fieldStyle(), minHeight: '64px', resize: 'vertical' }}
              />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={ncaModalOpen}
        onClose={closeNcaModal}
        title={editingNcaId ? 'Edit NCA' : 'Add NCA'}
        subtitle='Manage nonconformities with root cause and corrective action tracking.'
        footer={
          <>
            <div>
              {editingNcaId ? (
                <button
                  type='button'
                  onClick={() => void removeNca(editingNcaId)}
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
                  Delete NCA
                </button>
              ) : null}
            </div>

            <div style={{ display: 'inline-flex', gap: '8px' }}>
              <button
                type='button'
                onClick={closeNcaModal}
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
                onClick={() => void submitNca()}
                disabled={ncaSubmitting}
                style={{
                  border: '1px solid rgba(79,142,247,0.48)',
                  background: 'rgba(79,142,247,0.18)',
                  color: '#b9d6ff',
                  borderRadius: '8px',
                  padding: '7px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: ncaSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                {ncaSubmitting ? 'Saving...' : editingNcaId ? 'Update NCA' : 'Save NCA'}
              </button>
            </div>
          </>
        }
      >
        <div style={{ display: 'grid', gap: '12px' }}>
          {ncaError ? (
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
              {ncaError}
            </div>
          ) : null}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Reference</label>
              <input value={ncaForm.reference} onChange={(event) => setNcaForm((prev) => ({ ...prev, reference: event.target.value }))} style={fieldStyle()} placeholder='e.g. NCA-001' />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Type</label>
              <select value={ncaForm.type} onChange={(event) => setNcaForm((prev) => ({ ...prev, type: event.target.value }))} style={fieldStyle()}>
                {NCA_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Nonconformity Description</label>
              <textarea
                value={ncaForm.description}
                onChange={(event) => setNcaForm((prev) => ({ ...prev, description: event.target.value }))}
                style={{ ...fieldStyle(), minHeight: '62px', resize: 'vertical' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Root Cause Analysis</label>
              <textarea
                value={ncaForm.rootCause}
                onChange={(event) => setNcaForm((prev) => ({ ...prev, rootCause: event.target.value }))}
                style={{ ...fieldStyle(), minHeight: '56px', resize: 'vertical' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Corrective Action Plan</label>
              <textarea
                value={ncaForm.correctiveAction}
                onChange={(event) => setNcaForm((prev) => ({ ...prev, correctiveAction: event.target.value }))}
                style={{ ...fieldStyle(), minHeight: '62px', resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Owner</label>
              <input value={ncaForm.owner} onChange={(event) => setNcaForm((prev) => ({ ...prev, owner: event.target.value }))} style={fieldStyle()} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Due Date</label>
              <input type='date' value={ncaForm.dueDate} onChange={(event) => setNcaForm((prev) => ({ ...prev, dueDate: event.target.value }))} style={fieldStyle()} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Status</label>
              <select value={ncaForm.status} onChange={(event) => setNcaForm((prev) => ({ ...prev, status: event.target.value }))} style={fieldStyle()}>
                {NCA_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
