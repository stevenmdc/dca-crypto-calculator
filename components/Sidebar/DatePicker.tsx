// components/Sidebar/DatePicker.tsx
'use client';

import { useId, useRef } from 'react';
import { Calendar } from 'lucide-react';

interface DatePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
}

export function DatePicker({
  label,
  value,
  onChange,
  min,
  max,
}: DatePickerProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpenPicker = () => {
    const input = inputRef.current;
    if (!input) return;

    if (typeof input.showPicker === 'function') {
      input.showPicker();
      return;
    }

    input.focus();
  };

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-medium text-white">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={handleOpenPicker}
          aria-label={`Ouvrir le calendrier: ${label}`}
          className="absolute inset-y-0 left-0 z-10 hidden w-7 cursor-pointer place-items-center rounded text-white hover:text-slate-200 supports-[selector(input::-webkit-calendar-picker-indicator)]:grid"
        >
          <Calendar size={14} aria-hidden="true" className="-translate-y-px" />
        </button>
        <input
          ref={inputRef}
          id={inputId}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          className="block w-full min-w-0 bg-midnight-800 border border-slate-700 rounded-lg px-2 py-2 text-sm text-white focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20 transition-all supports-[selector(input::-webkit-calendar-picker-indicator)]:pl-7 supports-[selector(input::-webkit-calendar-picker-indicator)]:pr-1 [&::-webkit-calendar-picker-indicator]:hidden"
        />
      </div>
    </div>
  );
}
