'use client';

import { useState, useEffect, useRef } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  loading?: boolean;
}

export function SearchBar({ onSearch, loading }: SearchBarProps) {
  const [value, setValue] = useState('');
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => clearTimeout(timeout.current);
  }, []);

  const handleChange = (val: string) => {
    setValue(val);
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => {
      if (val.trim()) onSearch(val.trim());
    }, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearTimeout(timeout.current);
    if (value.trim()) onSearch(value.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search your knowledge... (e.g. 'articles about transformers')"
        className="w-full px-4 py-3 text-lg border border-input rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        autoFocus
      />
      {loading && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </form>
  );
}
