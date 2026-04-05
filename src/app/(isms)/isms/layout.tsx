import type { CSSProperties, ReactNode } from 'react';
import IsmsSidebar from '@/components/isms/layout/IsmsSidebar';
import IsmsTopBar from '@/components/isms/layout/IsmsTopBar';

const ismsThemeVars = {
  '--isms-bg0': '#060a12',
  '--isms-bg1': '#090e1a',
  '--isms-bg2': '#0d1424',
  '--isms-bg3': '#111a2e',
  '--isms-surf': '#141e34',
  '--isms-border': '#253658',
  '--isms-txt': '#c8d8f0',
  '--isms-txt2': '#7e9bc0',
  '--isms-txt3': '#445e80',
  '--isms-blue': '#4f8ef7',
  '--isms-cyan': '#22d3ee',
  '--isms-green': '#22c55e',
  '--isms-amber': '#f59e0b',
  '--isms-red': '#ef4444',
  '--isms-purple': '#a78bfa',
  '--isms-teal': '#2dd4bf',
  '--isms-sidebar-width': '256px',
  '--isms-topbar-height': '56px',
  '--isms-radius': '10px',
} as CSSProperties;

export default function IsmsShellLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        ...ismsThemeVars,
        display: 'flex',
        height: '100vh',
        backgroundColor: 'var(--isms-bg0)',
        color: 'var(--isms-txt)',
        overflow: 'hidden',
      }}
    >
      <IsmsSidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <IsmsTopBar />
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>{children}</main>
      </div>
    </div>
  );
}
