'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, DragEvent } from 'react';
import {
  FiArrowLeft,
  FiArrowRight,
  FiCalendar,
  FiEdit2,
  FiPlus,
  FiSearch,
  FiTrash2,
} from 'react-icons/fi';
import { useIsmsStore } from '@/store/ismsStore';
import { getTaskDueStatus } from '@/lib/isms/calculations';
import type { IsmsTask, TaskPriority, TaskStatus } from '@/types/isms';
import KpiCard from '@/components/isms/shared/KpiCard';
import StatusBadge from '@/components/isms/shared/StatusBadge';
import Modal from '@/components/isms/shared/Modal';

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: 'var(--isms-txt3)' },
  { key: 'inprogress', label: 'In Progress', color: 'var(--isms-blue)' },
  { key: 'review', label: 'In Review', color: 'var(--isms-amber)' },
  { key: 'done', label: 'Done', color: 'var(--isms-green)' },
] as const;

type TaskForm = {
  title: string;
  description: string;
  assignee: string;
  priority: TaskPriority;
  domain: string;
  dueDate: string;
  status: TaskStatus;
  notes: string;
};

const PRIORITY_OPTIONS: TaskPriority[] = ['Low', 'Medium', 'High', 'Critical'];
const DEFAULT_DOMAIN_OPTIONS = [
  'General',
  'Clause 4',
  'Clause 5',
  'Clause 6',
  'Clause 7',
  'Clause 8',
  'Clause 9',
  'Clause 10',
  'Annex A',
  'Risk Management',
  'KPI Monitoring',
  'Awareness',
  'Audit',
];

const EMPTY_FORM: TaskForm = {
  title: '',
  description: '',
  assignee: '',
  priority: 'Medium',
  domain: 'General',
  dueDate: '',
  status: 'todo',
  notes: '',
};

function asTaskPriority(value: string): TaskPriority {
  if (value === 'Low' || value === 'Medium' || value === 'High' || value === 'Critical') {
    return value;
  }

  return 'Medium';
}

function asTaskStatus(value: string): TaskStatus {
  if (value === 'todo' || value === 'inprogress' || value === 'review' || value === 'done') {
    return value;
  }

  return 'todo';
}

function priorityVariant(value: TaskPriority): 'neutral' | 'info' | 'warning' | 'danger' {
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

export default function IsmsTasksPage() {
  const workspace = useIsmsStore((state) => state.workspace);
  const tasks = useIsmsStore((state) => state.tasks);
  const team = useIsmsStore((state) => state.team);
  const loadAll = useIsmsStore((state) => state.loadAll);
  const addTask = useIsmsStore((state) => state.addTask);
  const updateTask = useIsmsStore((state) => state.updateTask);
  const deleteTask = useIsmsStore((state) => state.deleteTask);

  const [query, setQuery] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState<'all' | string>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [domainFilter, setDomainFilter] = useState<'all' | string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [boardError, setBoardError] = useState<string | null>(null);
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dropColumn, setDropColumn] = useState<TaskStatus | null>(null);
  const [form, setForm] = useState<TaskForm>(EMPTY_FORM);

  useEffect(() => {
    if (!workspace) {
      void loadAll();
    }
  }, [workspace, loadAll]);

  const assigneeOptions = useMemo(() => {
    const values = new Set<string>();

    for (const member of team) {
      if (member.name.trim()) {
        values.add(member.name.trim());
      }
    }

    for (const task of tasks) {
      if (task.assignee.trim()) {
        values.add(task.assignee.trim());
      }
    }

    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [tasks, team]);

  const domainOptions = useMemo(() => {
    const values = new Set<string>(DEFAULT_DOMAIN_OPTIONS);

    for (const task of tasks) {
      if (task.domain.trim()) {
        values.add(task.domain.trim());
      }
    }

    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [tasks]);

  const stats = useMemo(() => {
    const overdue = tasks.filter((task) => asTaskStatus(task.status) !== 'done' && getTaskDueStatus(task.dueDate) === 'overdue').length;
    const dueSoon = tasks.filter((task) => asTaskStatus(task.status) !== 'done' && getTaskDueStatus(task.dueDate) === 'due-soon').length;
    const done = tasks.filter((task) => asTaskStatus(task.status) === 'done').length;

    return {
      total: tasks.length,
      overdue,
      dueSoon,
      done,
    };
  }, [tasks]);

  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
        if (query.trim().length > 0) {
          const searchable = `${task.title} ${task.description} ${task.assignee} ${task.domain} ${task.notes}`.toLowerCase();
          if (!searchable.includes(query.toLowerCase())) {
            return false;
          }
        }

        if (assigneeFilter !== 'all' && task.assignee !== assigneeFilter) {
          return false;
        }

        if (priorityFilter !== 'all' && asTaskPriority(task.priority) !== priorityFilter) {
          return false;
        }

        if (domainFilter !== 'all' && task.domain !== domainFilter) {
          return false;
        }

        return true;
      }),
    [assigneeFilter, domainFilter, priorityFilter, query, tasks],
  );

  const grouped = useMemo(
    () =>
      COLUMNS.map((column) => ({
        ...column,
        tasks: filteredTasks.filter((task) => asTaskStatus(task.status) === column.key),
      })),
    [filteredTasks],
  );

  function openCreateModal(defaultStatus: TaskStatus = 'todo') {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, status: defaultStatus });
    setFormError(null);
    setModalOpen(true);
  }

  function openEditModal(task: IsmsTask) {
    setEditingId(task.id);
    setForm({
      title: task.title,
      description: task.description,
      assignee: task.assignee,
      priority: asTaskPriority(task.priority),
      domain: task.domain || 'General',
      dueDate: task.dueDate,
      status: asTaskStatus(task.status),
      notes: task.notes,
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
      setFormError('Task title is required.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        assignee: form.assignee.trim(),
        priority: form.priority,
        domain: form.domain.trim() || 'General',
        dueDate: form.dueDate,
        status: form.status,
        notes: form.notes.trim(),
      };

      if (editingId) {
        await updateTask(editingId, payload);
      } else {
        await addTask(payload);
      }

      closeModal();
    } catch (error) {
      console.error('Failed to persist task:', error);
      setFormError(error instanceof Error ? error.message : 'Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function removeTask(id: string) {
    const approved = window.confirm('Delete this task? This action cannot be undone.');
    if (!approved) {
      return;
    }

    try {
      await deleteTask(id);
      if (editingId === id) {
        closeModal();
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      setFormError(error instanceof Error ? error.message : 'Failed to delete task');
    }
  }

  async function moveTaskToStatus(id: string, status: TaskStatus) {
    setBoardError(null);
    try {
      await updateTask(id, { status });
    } catch (error) {
      console.error('Failed to move task status:', error);
      setBoardError(error instanceof Error ? error.message : 'Failed to move task');
    }
  }

  function onDragStartTask(id: string) {
    setDragTaskId(id);
  }

  function onDragOverColumn(event: DragEvent<HTMLDivElement>, column: TaskStatus) {
    event.preventDefault();
    if (dropColumn !== column) {
      setDropColumn(column);
    }
  }

  async function onDropColumn(column: TaskStatus) {
    if (!dragTaskId) {
      setDropColumn(null);
      return;
    }

    const source = tasks.find((task) => task.id === dragTaskId);
    if (source && asTaskStatus(source.status) !== column) {
      await moveTaskToStatus(dragTaskId, column);
    }

    setDragTaskId(null);
    setDropColumn(null);
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
          gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
          gap: '10px',
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative' }}>
          <FiSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--isms-txt3)' }} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder='Search title, assignee, domain, or notes'
            style={{ ...fieldStyle(), paddingLeft: '30px' }}
          />
        </div>

        <select value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)} style={fieldStyle()}>
          <option value='all'>All Assignees</option>
          {assigneeOptions.map((assignee) => (
            <option key={assignee} value={assignee}>
              {assignee}
            </option>
          ))}
        </select>

        <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as 'all' | TaskPriority)} style={fieldStyle()}>
          <option value='all'>All Priority</option>
          {PRIORITY_OPTIONS.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>

        <select value={domainFilter} onChange={(event) => setDomainFilter(event.target.value)} style={fieldStyle()}>
          <option value='all'>All Domains</option>
          {domainOptions.map((domain) => (
            <option key={domain} value={domain}>
              {domain}
            </option>
          ))}
        </select>

        <button
          type='button'
          onClick={() => openCreateModal('todo')}
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
          Add Task
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px' }}>
        <KpiCard label='Total Tasks' value={stats.total} hint='All implementation actions' />
        <KpiCard label='Overdue' value={stats.overdue} hint='Due date has passed' />
        <KpiCard label='Due Soon' value={stats.dueSoon} hint='Due in next 3 days' />
        <KpiCard label='Completed' value={stats.done} hint='Status marked done' />
      </div>

      {boardError ? (
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
          {boardError}
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px' }}>
        {grouped.map((column) => (
          <div
            key={column.key}
            onDragOver={(event) => onDragOverColumn(event, column.key)}
            onDrop={() => void onDropColumn(column.key)}
            onDragLeave={() => setDropColumn((prev) => (prev === column.key ? null : prev))}
            style={{
              border: dropColumn === column.key ? '1px solid rgba(79,142,247,0.6)' : '1px solid var(--isms-border)',
              borderRadius: '12px',
              background: dropColumn === column.key ? 'rgba(79,142,247,0.12)' : 'var(--isms-bg3)',
              padding: '12px',
              minHeight: '260px',
              transition: 'all 0.12s ease-out',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: column.color }}>
                {column.label}
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--isms-txt2)', fontSize: '11px', fontFamily: '"Fira Code", monospace' }}>
                  {column.tasks.length}
                </span>
                <button
                  type='button'
                  onClick={() => openCreateModal(column.key)}
                  style={{
                    border: '1px solid var(--isms-border)',
                    background: 'var(--isms-bg2)',
                    color: 'var(--isms-txt2)',
                    borderRadius: '7px',
                    padding: '2px 6px',
                    fontSize: '11px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <FiPlus size={11} />
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '8px' }}>
              {column.tasks.length === 0 ? (
                <div style={{ color: 'var(--isms-txt2)', fontSize: '12px', padding: '8px 0' }}>No tasks</div>
              ) : (
                column.tasks.map((task) => {
                  const status = asTaskStatus(task.status);
                  const due = getTaskDueStatus(task.dueDate);
                  const currentIdx = COLUMNS.findIndex((item) => item.key === status);
                  const prevStatus = currentIdx > 0 ? COLUMNS[currentIdx - 1].key : null;
                  const nextStatus = currentIdx < COLUMNS.length - 1 ? COLUMNS[currentIdx + 1].key : null;
                  const dueColor =
                    due === 'overdue'
                      ? 'var(--isms-red)'
                      : due === 'due-soon'
                        ? 'var(--isms-amber)'
                        : 'var(--isms-txt2)';

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => onDragStartTask(task.id)}
                      onDragEnd={() => {
                        setDragTaskId(null);
                        setDropColumn(null);
                      }}
                      style={{
                        border: '1px solid var(--isms-border)',
                        background: 'var(--isms-surf)',
                        borderRadius: '8px',
                        padding: '9px',
                        cursor: 'grab',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', gap: '6px' }}>
                        <span style={{ fontFamily: '"Fira Code", monospace', color: 'var(--isms-txt3)', fontSize: '10px' }}>
                          {task.id.slice(0, 8)}
                        </span>
                        <StatusBadge variant={priorityVariant(asTaskPriority(task.priority))}>{asTaskPriority(task.priority)}</StatusBadge>
                      </div>

                      <div style={{ fontSize: '13px', fontWeight: 600, lineHeight: 1.35 }}>{task.title || 'Untitled task'}</div>

                      <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--isms-txt2)' }}>
                        {task.assignee || 'Unassigned'} · {task.domain || 'General'}
                      </div>

                      <div style={{ marginTop: '6px', fontSize: '11px', color: dueColor, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <FiCalendar size={11} />
                        {task.dueDate || 'No due date'}
                      </div>

                      {task.notes ? (
                        <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--isms-txt3)', fontStyle: 'italic', lineHeight: 1.35 }}>
                          {task.notes.slice(0, 64)}
                          {task.notes.length > 64 ? '...' : ''}
                        </div>
                      ) : null}

                      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                        <button
                          type='button'
                          onClick={() => openEditModal(task)}
                          style={{
                            border: '1px solid var(--isms-border)',
                            background: 'var(--isms-bg3)',
                            color: 'var(--isms-txt2)',
                            borderRadius: '7px',
                            padding: '4px 7px',
                            fontSize: '11px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            cursor: 'pointer',
                          }}
                        >
                          <FiEdit2 size={11} /> Edit
                        </button>

                        <div style={{ display: 'inline-flex', gap: '5px' }}>
                          {prevStatus ? (
                            <button
                              type='button'
                              onClick={() => void moveTaskToStatus(task.id, prevStatus)}
                              style={{
                                border: '1px solid var(--isms-border)',
                                background: 'var(--isms-bg3)',
                                color: 'var(--isms-txt2)',
                                borderRadius: '7px',
                                padding: '4px 6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                cursor: 'pointer',
                              }}
                            >
                              <FiArrowLeft size={11} />
                            </button>
                          ) : null}

                          {nextStatus ? (
                            <button
                              type='button'
                              onClick={() => void moveTaskToStatus(task.id, nextStatus)}
                              style={{
                                border: '1px solid var(--isms-border)',
                                background: 'var(--isms-bg3)',
                                color: 'var(--isms-txt2)',
                                borderRadius: '7px',
                                padding: '4px 6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                cursor: 'pointer',
                              }}
                            >
                              <FiArrowRight size={11} />
                            </button>
                          ) : null}

                          <button
                            type='button'
                            onClick={() => void removeTask(task.id)}
                            style={{
                              border: '1px solid rgba(239,68,68,0.45)',
                              background: 'rgba(239,68,68,0.18)',
                              color: 'var(--isms-red)',
                              borderRadius: '7px',
                              padding: '4px 6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              cursor: 'pointer',
                            }}
                          >
                            <FiTrash2 size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Task' : 'Add Task'}
        subtitle='Track ownership, due dates, and implementation status across the ISMS board.'
        footer={
          <>
            <div>
              {editingId ? (
                <button
                  type='button'
                  onClick={() => void removeTask(editingId)}
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
                  Delete Task
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
                {isSubmitting ? 'Saving...' : editingId ? 'Update Task' : 'Save Task'}
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
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Task Title</label>
              <input
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                style={fieldStyle()}
                placeholder='Implementation task title'
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Assignee</label>
              <select
                value={form.assignee}
                onChange={(event) => setForm((prev) => ({ ...prev, assignee: event.target.value }))}
                style={fieldStyle()}
              >
                <option value=''>Unassigned</option>
                {assigneeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Priority</label>
              <select
                value={form.priority}
                onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value as TaskPriority }))}
                style={fieldStyle()}
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Domain</label>
              <input
                value={form.domain}
                onChange={(event) => setForm((prev) => ({ ...prev, domain: event.target.value }))}
                style={fieldStyle()}
                list='task-domain-options'
                placeholder='Clause 6, Annex A, Audit, etc.'
              />
              <datalist id='task-domain-options'>
                {domainOptions.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Due Date</label>
              <input
                type='date'
                value={form.dueDate}
                onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                style={fieldStyle()}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Status</label>
              <select
                value={form.status}
                onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as TaskStatus }))}
                style={fieldStyle()}
              >
                {COLUMNS.map((column) => (
                  <option key={column.key} value={column.key}>
                    {column.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Description / Acceptance Criteria</label>
              <textarea
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                style={{ ...fieldStyle(), minHeight: '68px', resize: 'vertical' }}
                placeholder='What needs to be completed and what evidence is expected?'
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--isms-txt2)' }}>Notes</label>
              <textarea
                value={form.notes}
                onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                style={{ ...fieldStyle(), minHeight: '62px', resize: 'vertical' }}
                placeholder='Blockers, dependencies, or update notes'
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
