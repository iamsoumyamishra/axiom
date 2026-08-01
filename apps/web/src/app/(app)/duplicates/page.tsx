'use client';

import { MergeSuggestionsList } from '../../../features/resources/MergeSuggestionsList';

export default function DuplicatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Duplicates</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Review resources the system flagged as duplicates and merge them.
        </p>
      </div>
      <MergeSuggestionsList />
    </div>
  );
}
