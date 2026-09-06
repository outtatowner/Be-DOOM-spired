/**
 * @file TomHandshake.tsx
 * @brief T-O-M Morse Code Handshake Gatekeeper (- --- --) & Be <> Sovereign Override
 */

import React, { useState } from 'react';
import { CoplayOfficiator } from '../organelles/node_0x96_coplay_officiator';
import { KeyRound, Radio, Lock, Unlock, Zap, RotateCcw } from 'lucide-react';

interface TomHandshakeProps {
  officiator: CoplayOfficiator;
  onStateChange: () => void;
}

export const TomHandshake: React.FC<TomHandshakeProps> = ({ officiator, onStateChange }) => {
  const [pulseActive, setPulseActive] = useState(false);

  const triggerPulse = (sym: '-' | ' ') => {
    setPulseActive(true);
    setTimeout(() => setPulseActive(false), 150);
    officiator.inputMorseSymbol(sym);
    onStateChange();
  };

  const handleReset = () => {
    officiator.resetTomHandshake();
    onStateChange();
  };

  const handleInstantUnlock = () => {
    officiator.forceUnlockTom();
    onStateChange();
  };

  return (
    <div id="tom-morse-gatekeeper" className="bg-stone-900 border border-stone-800 rounded-lg p-4 font-mono text-stone-200 flex flex-col gap-3 shadow-lg">
      <div className="flex items-center justify-between border-b border-stone-800 pb-2">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-stone-100">
            T-O-M Handshake Gatekeeper
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          {officiator.tomUnlocked ? (
            <span className="text-emerald-400 flex items-center gap-1 font-bold">
              <Unlock className="w-3.5 h-3.5" />
              SOVEREIGN OVERRIDE ACTIVE
            </span>
          ) : (
            <span className="text-amber-400 flex items-center gap-1 font-bold">
              <Lock className="w-3.5 h-3.5" />
              LOCKED [- --- --]
            </span>
          )}
        </div>
      </div>

      {/* Target Morse Pattern & Live Buffer */}
      <div className="bg-stone-950 border border-stone-800 p-3 rounded-lg flex flex-col gap-1.5">
        <div className="flex justify-between text-[11px]">
          <span className="text-stone-400">Target Signature:</span>
          <span className="text-amber-400 font-bold tracking-widest">- --- -- (T-O-M)</span>
        </div>
        <div className="flex justify-between items-center bg-stone-900/90 border border-stone-800 px-2 py-1.5 rounded text-xs">
          <span className="text-stone-400 text-[10px]">Buffer:</span>
          <span className={`font-mono text-sm tracking-widest ${officiator.tomUnlocked ? 'text-emerald-400 font-bold' : 'text-stone-200'}`}>
            {officiator.tomBuffer || '<EMPTY>'}
          </span>
        </div>
        <div className="text-[10px] text-stone-400 truncate">
          {officiator.tomFeedback}
        </div>
      </div>

      {/* Morse Telegraph Keyer Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => triggerPulse('-')}
          className={`py-2 px-3 rounded text-xs font-black border transition-all flex items-center justify-center gap-1.5 ${
            pulseActive
              ? 'bg-amber-400 text-black border-amber-300'
              : 'bg-stone-800 hover:bg-stone-700 active:bg-amber-500 border-stone-700 text-stone-100'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>DASH (-)</span>
        </button>

        <button
          onClick={() => triggerPulse(' ')}
          className="py-2 px-3 rounded text-xs font-bold bg-stone-800 hover:bg-stone-700 active:bg-stone-600 border border-stone-700 text-stone-300 flex items-center justify-center gap-1.5"
        >
          <span>SPACE (_)</span>
        </button>

        <button
          onClick={handleReset}
          className="py-2 px-3 rounded text-xs font-bold bg-stone-800 hover:bg-stone-700 active:bg-stone-600 border border-stone-700 text-stone-400 flex items-center justify-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          <span>CLEAR</span>
        </button>
      </div>

      {/* Quick Cryptographic Handshake Injector */}
      <button
        onClick={handleInstantUnlock}
        className="w-full py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 rounded text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
      >
        <Zap className="w-3.5 h-3.5 text-cyan-400" />
        <span>Inject T-O-M Pulse Handshake (- --- --)</span>
      </button>
    </div>
  );
};
