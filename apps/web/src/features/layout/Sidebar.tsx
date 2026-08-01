'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookMarked,
  Search,
  FolderKanban,
  Layers,
  GitMerge,
  Network,
  Plus,
  LogOut,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/resources', label: 'Resources', icon: BookMarked },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/duplicates', label: 'Duplicates', icon: GitMerge },
  { href: '/graph', label: 'Graph', icon: Network },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/collections', label: 'Collections', icon: Layers },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  userEmail: string | null;
  onLogout: () => void;
}

export function Sidebar({ open, onClose, onSave, userEmail, onLogout }: SidebarProps) {
  const pathname = usePathname();

  const content = (
    <>
      <div className="flex items-center justify-between px-5 h-14 border-b">
        <Link href="/dashboard" onClick={onClose} className="text-lg font-bold tracking-tight">
          Axiom
        </Link>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:text-foreground md:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-secondary text-secondary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}

        <button
          onClick={onSave}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10 mt-3"
        >
          <Plus className="h-4 w-4 shrink-0" />
          Save resource
        </button>
      </nav>

      <div className="border-t p-3 space-y-1">
        <p className="truncate px-3 py-1.5 text-xs text-muted-foreground">{userEmail}</p>
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/50"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onClose} />
      )}

      {/* Mobile slide-over */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-background transition-transform duration-200 md:hidden',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {content}
      </aside>

      {/* Desktop fixed sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:bg-background md:shrink-0 md:sticky md:top-0 md:h-screen">
        {content}
      </aside>
    </>
  );
}
