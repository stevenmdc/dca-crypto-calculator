'use client';

import { useId } from 'react';
import type { LucideIcon } from 'lucide-react';

interface InputFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  icon: LucideIcon;
  min?: number;
  max?: number;
  step?: number | 'any';
  placeholder?: string;
}

export function InputField({
  label,
  value,
  onChange,
  icon: Icon,
  min = 0,
  max,
  step = 1,
  placeholder,
}: InputFieldProps) {
  const inputId = useId();

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-medium text-white">{label}</label>
      <div className="relative">
        <Icon aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 transform -translate-y-1/2 text-white" size={18} />
        <input
          id={inputId}
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          className="w-full bg-midnight-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20 transition-all"
        />
      </div>
    </div>
  );
}
