'use client';

import { Loader2 } from 'lucide-react';

interface CalculateButtonProps {
  onClick: () => void;
  isLoading: boolean;
  isDisabled: boolean;
}

export function CalculateButton({
  onClick,
  isLoading,
  isDisabled,
}: CalculateButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading || isDisabled}
      className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
        isLoading || isDisabled
          ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
          : 'bg-linear-to-r from-purple-500 to-orange-500 text-white hover:from-purple-600 hover:to-orange-600 shadow-lg shadow-purple-500/30 hover:shadow-lg hover:shadow-purple-600/40'
      }`}
    >
      {isLoading ? (
        <>
          <Loader2 size={20} className="animate-spin" />
          <span>Calcul en cours...</span>
        </>
      ) : (
        <span>Calculer</span>
      )}
    </button>
  );
}
