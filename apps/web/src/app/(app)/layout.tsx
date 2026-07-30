'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../features/auth/useAuth';
import { SaveResourceDialog } from '../../features/resources/SaveResourceDialog';

const nav = [
  { href: '/resources', label: 'Resources', icon: '📑' },
  { href: '/search', label: 'Search', icon: '🔍' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [saveOpen, setSaveOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [user, isLoading, router]);

  if (isLoading || !user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-4 sm:px-6 py-3 flex items-center justify-between bg-background">
        <div className="flex items-center gap-6">
          <Link href="/resources" className="text-lg font-bold">Axiom</Link>
          <nav className="hidden sm:flex items-center gap-1">
            {nav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    active
                      ? 'bg-secondary text-secondary-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSaveOpen(true)}
            className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
          >
            + Save
          </button>
          <button
            onClick={logout}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6 max-w-5xl w-full mx-auto">
        {children}
      </main>
      <SaveResourceDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
