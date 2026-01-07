'use client';

import { useState, useEffect, useRef } from 'react';

export interface DealLeadOption {
  id: string;
  type: 'deal' | 'lead';
  name: string;
  company?: string | null;
  label: string;
}

interface SearchableSelectProps {
  label: string;
  value: DealLeadOption | null;
  onChange: (option: DealLeadOption | null) => void;
  placeholder?: string;
  error?: string;
  searchEndpoint?: string;
}

const baseInputClasses =
  'w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 ' +
  'focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 ' +
  'transition-colors';

const labelClasses = 'block text-sm font-medium text-white/70 mb-1.5';
const errorClasses = 'mt-1 text-xs text-red-400';

export function SearchableSelect({
  label,
  value,
  onChange,
  placeholder = 'Search...',
  error,
  searchEndpoint = '/api/search/deals-leads',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<DealLeadOption[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (isOpen) {
        setLoading(true);
        try {
          const res = await fetch(`${searchEndpoint}?q=${encodeURIComponent(search)}`);
          const data = await res.json();
          setOptions(data);
        } catch (err) {
          console.error('Search failed:', err);
        } finally {
          setLoading(false);
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, isOpen, searchEndpoint]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: DealLeadOption) => {
    onChange(option);
    setSearch('');
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearch('');
  };

  return (
    <div ref={containerRef} className="relative">
      <label className={labelClasses}>{label}</label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? search : value?.label || ''}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={value ? '' : placeholder}
          className={`${baseInputClasses} pr-8 ${error ? 'border-red-500/30' : ''}`}
        />
        {value && !isOpen && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white/60"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-white/10 bg-[#1a1f2e] shadow-xl max-h-60 overflow-auto">
          {loading && <div className="px-4 py-3 text-sm text-white/40">Loading...</div>}
          {!loading && options.length === 0 && (
            <div className="px-4 py-3 text-sm text-white/40">No results found</div>
          )}
          {!loading &&
            options.map((option) => (
              <button
                key={`${option.type}-${option.id}`}
                type="button"
                onClick={() => handleSelect(option)}
                className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    option.type === 'deal' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-purple-500/20 text-purple-400'
                  }`}
                >
                  {option.type === 'deal' ? 'Deal' : 'Lead'}
                </span>
                <span>{option.name}</span>
                {option.company && <span className="text-white/40">- {option.company}</span>}
              </button>
            ))}
        </div>
      )}
      {error && <p className={errorClasses}>{error}</p>}
    </div>
  );
}
