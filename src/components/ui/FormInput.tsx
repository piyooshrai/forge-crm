'use client';

import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface BaseProps {
  label: string;
  error?: string;
}

interface TextInputProps extends BaseProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'date' | 'datetime-local';
}

interface SelectInputProps extends BaseProps, Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  options: { value: string; label: string }[];
}

interface TextareaInputProps extends BaseProps, Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {}

const baseInputClasses =
  'w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 ' +
  'focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 ' +
  'transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const labelClasses = 'block text-sm font-medium text-white/70 mb-1.5';
const errorClasses = 'mt-1 text-xs text-red-400';

export function TextInput({ label, error, type = 'text', ...props }: TextInputProps) {
  return (
    <div>
      <label className={labelClasses}>{label}</label>
      <input
        type={type}
        className={`${baseInputClasses} ${error ? 'border-red-500/30' : ''}`}
        {...props}
      />
      {error && <p className={errorClasses}>{error}</p>}
    </div>
  );
}

export function SelectInput({ label, error, options, ...props }: SelectInputProps) {
  return (
    <div>
      <label className={labelClasses}>{label}</label>
      <select
        className={`${baseInputClasses} ${error ? 'border-red-500/30' : ''}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-[#1a1f2e]">
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className={errorClasses}>{error}</p>}
    </div>
  );
}

export function TextareaInput({ label, error, ...props }: TextareaInputProps) {
  return (
    <div>
      <label className={labelClasses}>{label}</label>
      <textarea
        className={`${baseInputClasses} min-h-[100px] resize-y ${error ? 'border-red-500/30' : ''}`}
        {...props}
      />
      {error && <p className={errorClasses}>{error}</p>}
    </div>
  );
}

export function Checkbox({ label, ...props }: { label: string } & Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'>) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500/20 focus:ring-offset-0"
        {...props}
      />
      <span className="text-sm text-white/70">{label}</span>
    </label>
  );
}
