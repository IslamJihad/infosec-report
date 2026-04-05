'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import type { ControlStatus } from '@/types/isms';
import { ISO_CLAUSES } from '@/lib/isms/constants';
import { useIsmsStore } from '@/store/ismsStore';
import EmptyState from '@/components/isms/shared/EmptyState';
import ControlStatusPill from '@/components/isms/shared/ControlStatusPill';

export default function ClauseDetailsPage() {
  const params = useParams<{ id: string }>();
  const clauseId = Array.isArray(params.id) ? params.id[0] : params.id;

  const workspace = useIsmsStore((state) => state.workspace);
  const loadAll = useIsmsStore((state) => state.loadAll);
  const updateWorkspace = useIsmsStore((state) => state.updateWorkspace);

  useEffect(() => {
    if (!workspace) {
      void loadAll();
    }
  }, [workspace, loadAll]);

  const clause = ISO_CLAUSES.find((entry) => entry.id === clauseId);

  if (!clause) {
    return <EmptyState title="Clause not found" description="Select a clause from the sidebar to continue." />;
  }

  const clauseStatus = workspace?.clauseStatus ?? {};

  function setRequirementStatus(requirementId: string, status: ControlStatus) {
    void updateWorkspace({
      clauseStatus: {
        ...clauseStatus,
        [requirementId]: status,
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
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
          Clause {clause.id} - {clause.title}
        </h2>
        <p style={{ margin: '8px 0 0', color: 'var(--isms-txt2)', fontSize: '13px' }}>
          Set implementation status for each requirement. Changes are saved to workspace state with debounced persistence.
        </p>
      </div>

      {clause.requirements.map((requirement) => {
        const currentStatus = clauseStatus[requirement.id] ?? 'not-started';

        return (
          <div
            key={requirement.id}
            style={{
              border: '1px solid var(--isms-border)',
              borderRadius: '10px',
              background: 'var(--isms-surf)',
              padding: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{ fontFamily: '"Fira Code", monospace', fontSize: '11px', color: 'var(--isms-txt3)' }}>
                  {requirement.id}
                </div>
                <div style={{ marginTop: '4px', fontSize: '15px', fontWeight: 600 }}>{requirement.title}</div>
              </div>

              <ControlStatusPill
                value={currentStatus}
                onChange={(status) => setRequirementStatus(requirement.id, status as ControlStatus)}
              />
            </div>

            <p style={{ margin: '8px 0 0', color: 'var(--isms-txt2)', fontSize: '13px' }}>{requirement.description}</p>
            <p style={{ margin: '8px 0 0', color: 'var(--isms-txt3)', fontSize: '12px' }}>{requirement.guidance}</p>
          </div>
        );
      })}
    </div>
  );
}
