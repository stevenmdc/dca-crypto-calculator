'use client';

import { CryptoType } from '@/types';
import { Bitcoin } from 'lucide-react';
import { EthereumIcon } from './EthereumIcon';

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
        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-all cursor-pointer ${
          selectedCrypto === 'bitcoin'
            ? 'bg-orange-500 text-white'
            : 'bg-midnight-800 text-white hover:bg-midnight-700'
        }`}
      >
        <Bitcoin size={20} />
        <span>Bitcoin</span>
      </button>
      <button
        onClick={() => onSelectCrypto('ethereum')}
        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-all cursor-pointer ${
          selectedCrypto === 'ethereum'
            ? 'bg-purple-500 text-white'
            : 'bg-midnight-800 text-white hover:bg-midnight-700'
        }`}
      >
        <EthereumIcon />
        <span>Ethereum</span>
      </button>
    </div>
  );
}
