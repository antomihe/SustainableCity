// frontend\app\(main)\admin\layout.tsx
'use client'; // Como usas hooks de estado, el layout debe ser client component

import { useState } from 'react';
import AdminSidebar from '@/components/shared/AdminSidebar';
import Header from '@/components/shared/Header';
import { SocketProvider } from '@/contexts/SocketContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SocketProvider namespace="containers">
      <div className="flex h-screen bg-background text-foreground">
        {/* Sidebar - recibe estado y setter para controlar apertura móvil */}
        <AdminSidebar
          isMobileMenuOpen={isSidebarOpen}
          setMobileMenuOpen={setSidebarOpen}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            onMenuClick={() => setSidebarOpen(true)}
          />
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </SocketProvider>
  );
}
