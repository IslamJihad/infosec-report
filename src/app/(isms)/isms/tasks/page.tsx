'use client';

import { useEffect, useMemo } from 'react';
import { useIsmsStore } from '@/store/ismsStore';
import { getTaskDueStatus } from '@/lib/isms/calculations';

const COLUMNS = [
  { key: 'todo', label: 'To Do' },
  { key: 'inprogress', label: 'In Progress' },
  { key: 'review', label: 'In Review' },
  { key: 'done', label: 'Done' },
] as const;

export default function IsmsTasksPage() {
  const workspace = useIsmsStore((state) => state.workspace);
  const tasks = useIsmsStore((state) => state.tasks);
  const loadAll = useIsmsStore((state) => state.loadAll);

  useEffect(() => {
    if (!workspace) {
      void loadAll();
    }
  }, [workspace, loadAll]);

  const grouped = useMemo(
    () =>
      COLUMNS.map((column) => ({
        ...column,
        tasks: tasks.filter((task) => task.status === column.key),
      })),
    [tasks],
  );

  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      <div
        style={{
          border: '1px solid var(--isms-border)',
          borderRadius: '12px',
          background: 'var(--isms-surf)',
          padding: '16px',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Task Board</h2>
        <p style={{ margin: '8px 0 0', color: 'var(--isms-txt2)', fontSize: '13px' }}>
          Kanban view by status. Full drag-and-drop modal workflow will follow in the next implementation pass.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px' }}>
        {grouped.map((column) => (
          <div
            key={column.key}
            style={{
              border: '1px solid var(--isms-border)',
              borderRadius: '12px',
              background: 'var(--isms-bg3)',
              padding: '12px',
              minHeight: '200px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                {column.label}
              </div>
              <span style={{ color: 'var(--isms-txt2)', fontSize: '11px', fontFamily: '"Fira Code", monospace' }}>
                {column.tasks.length}
              </span>
            </div>

            <div style={{ display: 'grid', gap: '8px' }}>
              {column.tasks.length === 0 ? (
                <div style={{ color: 'var(--isms-txt2)', fontSize: '12px' }}>No tasks</div>
              ) : (
                column.tasks.map((task) => {
                  const due = getTaskDueStatus(task.dueDate);
                  const dueColor =
                    due === 'overdue'
                      ? 'var(--isms-red)'
                      : due === 'due-soon'
                        ? 'var(--isms-amber)'
                        : 'var(--isms-txt2)';

                  return (
                    <div
                      key={task.id}
                      style={{
                        border: '1px solid var(--isms-border)',
                        background: 'var(--isms-surf)',
                        borderRadius: '8px',
                        padding: '10px',
                      }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{task.title || 'Untitled task'}</div>
                      <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--isms-txt2)' }}>
                        {task.assignee || 'Unassigned'} · {task.domain || 'General'}
                      </div>
                      <div style={{ marginTop: '6px', fontSize: '11px', color: dueColor }}>
                        Due: {task.dueDate || 'Not set'}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
