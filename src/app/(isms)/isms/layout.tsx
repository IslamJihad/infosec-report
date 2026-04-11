import type { ReactNode } from 'react';
import IsmsSidebar from '@/components/isms/layout/IsmsSidebar';
import IsmsTopBar from '@/components/isms/layout/IsmsTopBar';
import IsmsUnsavedBanner from '@/components/isms/layout/IsmsUnsavedBanner';
import IsmsUnloadGuard from '@/components/isms/layout/IsmsUnloadGuard';

export default function IsmsShellLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        backgroundColor: 'var(--isms-bg0)',
        color: 'var(--isms-txt)',
        overflow: 'hidden',
      }}
    >
      <IsmsUnloadGuard />
      <IsmsSidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <IsmsTopBar />
        <IsmsUnsavedBanner />
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>{children}</main>
      </div>
    </div>
  );
}
