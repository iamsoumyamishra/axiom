'use client';

import { useAuth } from '../../../features/auth/useAuth';

export default function ResourcesPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Resources</h2>
        <p className="text-sm text-muted-foreground">
          Signed in as {user?.email}
        </p>
      </div>
      <p className="text-muted-foreground">
        Your saved resources will appear here. The resource list and search are coming next.
      </p>
    </div>
  );
}
