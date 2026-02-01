'use client';

import { CryptoType } from '@/types';
import { Bitcoin, Zap } from 'lucide-react';

interface CryptoSelectorProps {
  selectedCrypto: CryptoType;
  onSelectCrypto: (crypto: CryptoType) => void;
}

export function CryptoSelector({
  selectedCrypto,
  onSelectCrypto,
}: CryptoSelectorProps) {
  return (
    <div className="flex gap-3">
      <button
        onClick={() => onSelectCrypto('bitcoin')}
        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-all ${
          selectedCrypto === 'bitcoin'
            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
        }`}
      >
        <Bitcoin size={20} />
        <span>Bitcoin</span>
      </button>
      <button
        onClick={() => onSelectCrypto('ethereum')}
        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-all ${
          selectedCrypto === 'ethereum'
            ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
        }`}
      >
        <Zap size={20} />
        <span>Ethereum</span>
      </button>
    </div>
  );
}
