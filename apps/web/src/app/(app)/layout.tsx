'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Plus } from 'lucide-react';
import { useAuth } from '../../features/auth/useAuth';
import { SaveResourceDialog } from '../../features/resources/SaveResourceDialog';
import { Sidebar } from '../../features/layout/Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [saveOpen, setSaveOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [user, isLoading, router]);

  if (isLoading || !user) return null;

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen flex">
      <Sidebar
        open={sidebarOpen}
        onClose={closeSidebar}
        onSave={() => setSaveOpen(true)}
        userEmail={user.email}
        onLogout={logout}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between px-4 h-14 border-b md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-lg font-bold tracking-tight">Axiom</span>
          <button
            onClick={() => setSaveOpen(true)}
            className="rounded-md p-1 text-primary hover:bg-primary/10"
            aria-label="Save resource"
          >
            <Plus className="h-5 w-5" />
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-5xl w-full mx-auto">
          {children}
        </main>
      </div>

      <SaveResourceDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
