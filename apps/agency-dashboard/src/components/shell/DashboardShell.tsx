'use client';

/**
 * Desktop dashboard frame: sidebar + (topbar over scrollable content). The shell
 * root is a plain flex row; RTL flips the whole layout via the document `dir`
 * set by LangProvider, so the sidebar moves to the right with no absolute sides.
 */
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Toast } from './Toast';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-sand">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-auto px-7 py-6">{children}</main>
      </div>
      <Toast />
    </div>
  );
}
