'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const KnowledgeGraph = dynamic(
  () =>
    import('../../../features/graph/KnowledgeGraph').then((m) => m.KnowledgeGraph),
  { ssr: false },
);

export default function GraphPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Knowledge graph</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Every dot is a saved resource. The system links related ones automatically.
        </p>
      </div>
      <Suspense fallback={<div className="h-[calc(100vh-10rem)] rounded-lg border" />}>
        <KnowledgeGraph />
      </Suspense>
    </div>
  );
}
