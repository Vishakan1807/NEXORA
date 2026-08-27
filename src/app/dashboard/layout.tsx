'use client';

import { Sidebar, Topbar, Statusbar, ToastContainer } from '@/components/layout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="nx-app">
      <Sidebar />
      <div className="nx-app__main-area">
        <Topbar />
        <main className="nx-app__content">
          {children}
        </main>
        <Statusbar />
      </div>
      <ToastContainer />
    </div>
  );
}
