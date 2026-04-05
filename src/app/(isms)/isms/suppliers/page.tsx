'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { FiEdit2, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';
import type { IsmsSupplier } from '@/types/isms';
import { useIsmsStore } from '@/store/ismsStore';
import KpiCard from '@/components/isms/shared/KpiCard';
import StatusBadge from '@/components/isms/shared/StatusBadge';
import Modal from '@/components/isms/shared/Modal';

type SupplierForm = {
  name: string;
  category: string;
  riskLevel: string;
  dataAccess: string;
  service: string;
  contractExp: string;
  nextReview: string;
  assessment: string;
  notes: string;
};

const CATEGORY_OPTIONS = [
  'Cloud Provider',
  'Software Vendor',
  'IT Services',
  'Managed Security',
  'Data Processor',
  'Outsourced Ops',
  'Consultant',
  'Other',
];

const RISK_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];
const DATA_ACCESS_OPTIONS = ['None', 'Internal', 'Confidential', 'Restricted'];
const ASSESSMENT_OPTIONS = ['Not Started', 'In Progress', 'Completed', 'Approved', 'Issues Found'];

const EMPTY_FORM: SupplierForm = {
  name: '',
  category: 'Cloud Provider',
  riskLevel: 'Medium',
  dataAccess: 'Internal',
  service: '',
  contractExp: '',
  nextReview: '',
  assessment: 'Not Started',
  notes: '',
};

function riskVariant(value: string): 'success' | 'info' | 'warning' | 'danger' {
  if (value === 'Critical') return 'danger';
  if (value === 'High') return 'warning';
  if (value === 'Medium') return 'info';
  return 'success';
}

function dataAccessVariant(value: string): 'neutral' | 'info' | 'warning' | 'danger' {
  if (value === 'Restricted') return 'danger';
  if (value === 'Confidential') return 'warning';
  if (value === 'Internal') return 'info';
  return 'neutral';
}

function assessmentVariant(value: string): 'neutral' | 'info' | 'warning' | 'danger' | 'success' {
  if (value === 'Completed' || value === 'Approved') return 'success';
  if (value === 'In Progress') return 'info';
  if (value === 'Issues Found') return 'danger';
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

export default function SuppliersPage() {
  const workspace = useIsmsStore((state) => state.workspace);
  const suppliers = useIsmsStore((state) => state.suppliers);
  const loadAll = useIsmsStore((state) => state.loadAll);
  const addSupplier = useIsmsStore((state) => state.addSupplier);
  const updateSupplier = useIsmsStore((state) => state.updateSupplier);
  const deleteSupplier = useIsmsStore((state) => state.deleteSupplier);

  const [query, setQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | string>('all');
  const [assessmentFilter, setAssessmentFilter] = useState<'all' | string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<SupplierForm>(EMPTY_FORM);

  useEffect(() => {
    if (!workspace) {
      void loadAll();
    }
  }, [workspace, loadAll]);

  const stats = useMemo(() => {
    const highRisk = suppliers.filter((supplier) => ['High', 'Critical'].includes(supplier.riskLevel)).length;
    const completed = suppliers.filter((supplier) => supplier.assessment === 'Completed' || supplier.assessment === 'Approved').length;

    return {
      total: suppliers.length,
      highRisk,
      completed,
    };
  }, [suppliers]);

  const filteredSuppliers = useMemo(
    () =>
      suppliers.filter((supplier) => {
        if (query.trim().length > 0) {
          const searchable = `${supplier.name} ${supplier.category} ${supplier.service} ${supplier.dataAccess}`.toLowerCase();
          if (!searchable.includes(query.toLowerCase())) {
            return false;
          }
        }

        if (riskFilter !== 'all' && supplier.riskLevel !== riskFilter) {
          return false;
        }

        if (assessmentFilter !== 'all' && supplier.assessment !== assessmentFilter) {
          return false;
        }

        return true;
      }),
    [assessmentFilter, query, riskFilter, suppliers],
  );

  function openCreateModal() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  }

  function openEditModal(supplier: IsmsSupplier) {
    setEditingId(supplier.id);
    setForm({
      name: supplier.name,
      category: supplier.category || 'Cloud Provider',
      riskLevel: supplier.riskLevel || 'Medium',
      dataAccess: supplier.dataAccess || 'Internal',
      service: supplier.service,
      contractExp: supplier.contractExp,
      nextReview: supplier.nextReview,
      assessment: supplier.assessment || 'Not Started',
      notes: supplier.notes,
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
      setFormError('Supplier name is required.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        name: form.name.trim(),
        category: form.category,
        riskLevel: form.riskLevel,
        dataAccess: form.dataAccess,
        service: form.service.trim(),
        contractExp: form.contractExp,
        nextReview: form.nextReview,
        assessment: form.assessment,
        notes: form.notes.trim(),
      };

      if (editingId) {
        await updateSupplier(editingId, payload);
      } else {
        await addSupplier(payload);
      }

      closeModal();
    } catch (error) {
      console.error('Failed to persist supplier:', error);
      setFormError(error instanceof Error ? error.message : 'Failed to save supplier');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function removeSupplier(id: string) {
    const approved = window.confirm('Delete this supplier? This action cannot be undone.');
    if (!approved) {
      return;
    }

    try {
      await deleteSupplier(id);
      if (editingId === id) {
        closeModal();
      }
    } catch (error) {
      console.error('Failed to delete supplier:', error);
      setFormError(error instanceof Error ? error.message : 'Failed to delete supplier');
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
            placeholder='Search supplier name, category, service, or data access'
            style={{ ...fieldStyle(), paddingLeft: '30px' }}
          />
        </div>

        <select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)} style={fieldStyle()}>
          <option value='all'>All Risk Levels</option>
          {RISK_OPTIONS.map((risk) => (
            <option key={risk} value={risk}>
              {risk}
            </option>
          ))}
        </select>

        <select value={assessmentFilter} onChange={(event) => setAssessmentFilter(event.target.value)} style={fieldStyle()}>
          <option value='all'>All Assessment</option>
          {ASSESSMENT_OPTIONS.map((assessment) => (
            <option key={assessment} value={assessment}>
              {assessment}
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
          Add Supplier
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px' }}>
        <KpiCard label='Total Suppliers' value={stats.total} hint='Third-party inventory' />
        <KpiCard label='High Risk' value={stats.highRisk} hint='High and critical risk levels' />
        <KpiCard label='Assessments Complete' value={stats.completed} hint='Completed or approved assessments' />
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
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Supplier</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Category</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Risk</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Data Access</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Service</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Contract Expiry</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Next Review</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Assessment</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ padding: '12px', color: 'var(--isms-txt2)' }}>
                  No suppliers match the current filters.
                </td>
              </tr>
            ) : (
              filteredSuppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', color: 'var(--isms-txt3)', fontFamily: '"Fira Code", monospace', fontSize: '11px' }}>{supplier.id.slice(0, 8)}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{supplier.name || 'Unnamed supplier'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', color: 'var(--isms-txt2)' }}>{supplier.category || '-'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>
                    <StatusBadge variant={riskVariant(supplier.riskLevel)}>
                      {supplier.riskLevel}
                    </StatusBadge>
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>
                    <StatusBadge variant={dataAccessVariant(supplier.dataAccess)}>
                      {supplier.dataAccess || 'None'}
                    </StatusBadge>
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{supplier.service || '-'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', fontFamily: '"Fira Code", monospace', fontSize: '11px' }}>{supplier.contractExp || '-'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{supplier.nextReview || '-'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>
                    <StatusBadge variant={assessmentVariant(supplier.assessment)}>{supplier.assessment}</StatusBadge>
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        type='button'
                        onClick={() => openEditModal(supplier)}
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
                        onClick={() => void removeSupplier(supplier.id)}
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
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Supplier' : 'Add Supplier'}
        subtitle='Track third-party risk level, data exposure, and security review cadence.'
        footer={
          <>
            <div>
              {editingId ? (
                <button
                  type='button'
                  onClick={() => void removeSupplier(editingId)}
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
                  Delete Supplier
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
                {isSubmitting ? 'Saving...' : editingId ? 'Update Supplier' : 'Save Supplier'}
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
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Supplier Name</label>
              <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} style={fieldStyle()} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Category</label>
              <select value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))} style={fieldStyle()}>
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Risk Level</label>
              <select value={form.riskLevel} onChange={(event) => setForm((prev) => ({ ...prev, riskLevel: event.target.value }))} style={fieldStyle()}>
                {RISK_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Data Access</label>
              <select value={form.dataAccess} onChange={(event) => setForm((prev) => ({ ...prev, dataAccess: event.target.value }))} style={fieldStyle()}>
                {DATA_ACCESS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Services Provided</label>
              <textarea
                value={form.service}
                onChange={(event) => setForm((prev) => ({ ...prev, service: event.target.value }))}
                style={{ ...fieldStyle(), minHeight: '62px', resize: 'vertical' }}
                placeholder='Describe services, dependencies, and support context'
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Contract Expiry</label>
              <input
                type='date'
                value={form.contractExp}
                onChange={(event) => setForm((prev) => ({ ...prev, contractExp: event.target.value }))}
                style={fieldStyle()}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Next Review</label>
              <input
                type='date'
                value={form.nextReview}
                onChange={(event) => setForm((prev) => ({ ...prev, nextReview: event.target.value }))}
                style={fieldStyle()}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Assessment Status</label>
              <select value={form.assessment} onChange={(event) => setForm((prev) => ({ ...prev, assessment: event.target.value }))} style={fieldStyle()}>
                {ASSESSMENT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Notes</label>
              <textarea
                value={form.notes}
                onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                style={{ ...fieldStyle(), minHeight: '62px', resize: 'vertical' }}
                placeholder='Security questionnaire outcomes, issues, or mitigation notes'
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
