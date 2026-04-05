'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { FiEdit2, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';
import type { IsmsAsset } from '@/types/isms';
import { useIsmsStore } from '@/store/ismsStore';
import KpiCard from '@/components/isms/shared/KpiCard';
import StatusBadge from '@/components/isms/shared/StatusBadge';
import Modal from '@/components/isms/shared/Modal';

type AssetForm = {
  name: string;
  type: string;
  classification: string;
  criticality: string;
  owner: string;
  location: string;
  description: string;
};

const TYPE_OPTIONS = [
  'Information',
  'Application',
  'Database',
  'Endpoint',
  'Network',
  'Cloud Service',
  'Facility',
  'Other',
];

const CLASSIFICATION_OPTIONS = ['Public', 'Internal', 'Confidential', 'Restricted'];
const CRITICALITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];

const EMPTY_FORM: AssetForm = {
  name: '',
  type: 'Information',
  classification: 'Internal',
  criticality: 'Medium',
  owner: '',
  location: '',
  description: '',
};

function classificationVariant(value: string): 'neutral' | 'info' | 'warning' | 'danger' {
  if (value === 'Restricted') return 'danger';
  if (value === 'Confidential') return 'warning';
  if (value === 'Internal') return 'info';
  return 'neutral';
}

function criticalityVariant(value: string): 'neutral' | 'info' | 'warning' | 'danger' {
  if (value === 'Critical') return 'danger';
  if (value === 'High') return 'warning';
  if (value === 'Medium') return 'info';
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

export default function AssetsPage() {
  const workspace = useIsmsStore((state) => state.workspace);
  const assets = useIsmsStore((state) => state.assets);
  const loadAll = useIsmsStore((state) => state.loadAll);
  const addAsset = useIsmsStore((state) => state.addAsset);
  const updateAsset = useIsmsStore((state) => state.updateAsset);
  const deleteAsset = useIsmsStore((state) => state.deleteAsset);

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | string>('all');
  const [classificationFilter, setClassificationFilter] = useState<'all' | string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<AssetForm>(EMPTY_FORM);

  useEffect(() => {
    if (!workspace) {
      void loadAll();
    }
  }, [workspace, loadAll]);

  const stats = useMemo(() => {
    const highCritical = assets.filter((asset) => ['High', 'Critical'].includes(asset.criticality)).length;
    const restricted = assets.filter((asset) => asset.classification === 'Restricted').length;

    return {
      total: assets.length,
      highCritical,
      restricted,
    };
  }, [assets]);

  const filteredAssets = useMemo(
    () =>
      assets.filter((asset) => {
        if (query.trim().length > 0) {
          const text = `${asset.name} ${asset.owner} ${asset.location} ${asset.type}`.toLowerCase();
          if (!text.includes(query.toLowerCase())) {
            return false;
          }
        }

        if (typeFilter !== 'all' && asset.type !== typeFilter) {
          return false;
        }

        if (classificationFilter !== 'all' && asset.classification !== classificationFilter) {
          return false;
        }

        return true;
      }),
    [assets, classificationFilter, query, typeFilter],
  );

  function openCreateModal() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  }

  function openEditModal(asset: IsmsAsset) {
    setEditingId(asset.id);
    setForm({
      name: asset.name,
      type: asset.type || 'Information',
      classification: asset.classification || 'Internal',
      criticality: asset.criticality || 'Medium',
      owner: asset.owner,
      location: asset.location,
      description: asset.description,
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
      setFormError('Asset name is required.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        classification: form.classification,
        criticality: form.criticality,
        owner: form.owner.trim(),
        location: form.location.trim(),
        description: form.description.trim(),
      };

      if (editingId) {
        await updateAsset(editingId, payload);
      } else {
        await addAsset(payload);
      }

      closeModal();
    } catch (error) {
      console.error('Failed to persist asset:', error);
      setFormError(error instanceof Error ? error.message : 'Failed to save asset');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function removeAsset(id: string) {
    const approved = window.confirm('Delete this asset? This action cannot be undone.');
    if (!approved) {
      return;
    }

    try {
      await deleteAsset(id);
      if (editingId === id) {
        closeModal();
      }
    } catch (error) {
      console.error('Failed to delete asset:', error);
      setFormError(error instanceof Error ? error.message : 'Failed to delete asset');
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
            placeholder='Search by name, type, owner, or location'
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

        <select value={classificationFilter} onChange={(event) => setClassificationFilter(event.target.value)} style={fieldStyle()}>
          <option value='all'>All Classification</option>
          {CLASSIFICATION_OPTIONS.map((classification) => (
            <option key={classification} value={classification}>
              {classification}
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
          Add Asset
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px' }}>
        <KpiCard label='Total Assets' value={stats.total} hint='Items in inventory' />
        <KpiCard label='High or Critical' value={stats.highCritical} hint='By criticality field' />
        <KpiCard label='Restricted Data' value={stats.restricted} hint='Restricted classification entries' />
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
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Name</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Type</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Classification</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Criticality</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Owner</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Location</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '12px', color: 'var(--isms-txt2)' }}>
                  No assets match the current filters.
                </td>
              </tr>
            ) : (
              filteredAssets.map((asset) => (
                <tr key={asset.id}>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', color: 'var(--isms-txt3)', fontFamily: '"Fira Code", monospace', fontSize: '11px' }}>{asset.id.slice(0, 8)}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{asset.name || 'Unnamed asset'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', color: 'var(--isms-txt2)' }}>{asset.type}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>
                    <StatusBadge variant={classificationVariant(asset.classification)}>{asset.classification}</StatusBadge>
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>
                    <StatusBadge variant={criticalityVariant(asset.criticality)}>{asset.criticality}</StatusBadge>
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{asset.owner || '-'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{asset.location || '-'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        type='button'
                        onClick={() => openEditModal(asset)}
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
                        onClick={() => void removeAsset(asset.id)}
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
        title={editingId ? 'Edit Asset' : 'Add Asset'}
        subtitle='Maintain controlled inventory with ownership and classification context.'
        footer={
          <>
            <div>
              {editingId ? (
                <button
                  type='button'
                  onClick={() => void removeAsset(editingId)}
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
                  Delete Asset
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
                {isSubmitting ? 'Saving...' : editingId ? 'Update Asset' : 'Save Asset'}
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
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Asset Name</label>
              <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} style={fieldStyle()} placeholder='Business or technical asset name' />
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
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Owner</label>
              <input value={form.owner} onChange={(event) => setForm((prev) => ({ ...prev, owner: event.target.value }))} style={fieldStyle()} placeholder='Business owner' />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Classification</label>
              <select value={form.classification} onChange={(event) => setForm((prev) => ({ ...prev, classification: event.target.value }))} style={fieldStyle()}>
                {CLASSIFICATION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Criticality</label>
              <select value={form.criticality} onChange={(event) => setForm((prev) => ({ ...prev, criticality: event.target.value }))} style={fieldStyle()}>
                {CRITICALITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Location</label>
              <input value={form.location} onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))} style={fieldStyle()} placeholder='System, environment, or physical location' />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Description</label>
              <textarea
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                style={{ ...fieldStyle(), minHeight: '72px', resize: 'vertical' }}
                placeholder='Scope, data sensitivity, dependencies, and handling context'
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
