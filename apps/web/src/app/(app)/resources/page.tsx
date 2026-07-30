'use client';

import { ResourceList } from '../../../features/resources/ResourceList';

export default function ResourcesPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Resources</h2>
      <ResourceList />
    </div>
  );
}
