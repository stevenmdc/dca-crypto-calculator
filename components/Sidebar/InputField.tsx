'use client';

import { LucideIcon } from 'lucide-react';

interface InputFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  icon: LucideIcon;
  min?: number;
  step?: number;
  placeholder?: string;
}

export function InputField({
  label,
  value,
  onChange,
  icon: Icon,
  min = 0,
  step = 1,
  placeholder,
}: InputFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-300">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          step={step}
          placeholder={placeholder}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20 transition-all"
        />
      </div>
    </div>
  );
}
