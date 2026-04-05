'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';

type ModalProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
};

export default function Modal({ open, title, subtitle, onClose, footer, children }: ModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      role='dialog'
      aria-modal='true'
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(4, 8, 16, 0.66)',
        backdropFilter: 'blur(4px)',
        zIndex: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: 'min(760px, 100%)',
          maxHeight: 'calc(100vh - 48px)',
          overflow: 'hidden',
          borderRadius: '12px',
          border: '1px solid var(--isms-border)',
          background: 'var(--isms-bg2)',
          boxShadow: '0 16px 40px rgba(3, 8, 18, 0.55)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--isms-border)',
            background: 'var(--isms-bg1)',
            position: 'sticky',
            top: 0,
            zIndex: 2,
          }}
        >
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--isms-txt)' }}>{title}</div>
          {subtitle ? <div style={{ marginTop: '3px', fontSize: '12px', color: 'var(--isms-txt2)' }}>{subtitle}</div> : null}
        </div>

        <div style={{ padding: '16px', overflowY: 'auto' }}>{children}</div>

        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--isms-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--isms-bg1)',
          }}
        >
          {footer}
        </div>
      </div>
    </div>
  );
}
