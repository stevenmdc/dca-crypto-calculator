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
      className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
        isLoading || isDisabled
          ? 'bg-midnight-700 text-white cursor-not-allowed'
          : 'bg-blue-600 text-white'
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
