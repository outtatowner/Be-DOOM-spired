/**
 * @file HeaderSignalReceptor.tsx
 * @brief Discrete Header-Bar Signal Tap Listener for Sovereign Override
 *        Listens for rhythmic signal taps on the header bar without exposing cheat codes to public viewers.
 */

import React, { useState, useEffect, useRef } from 'react';
import { CoplayOfficiator } from '../organelles/node_0x96_coplay_officiator';
import { audioSynth } from '../organelles/retro_audio_synth';
import { Zap, ShieldCheck, Lock, Unlock } from 'lucide-react';

interface Props {
  officiator: CoplayOfficiator;
  onStateChange: () => void;
  children: React.ReactNode;
}

export const HeaderSignalReceptor: React.FC<Props> = ({
  officiator,
  onStateChange,
  children,
}) => {
  const [justUnlocked, setJustUnlocked] = useState(false);
  const [feedbackPulse, setFeedbackPulse] = useState(false);
  const pressStartTimeRef = useRef<number | null>(null);
  const tapHistoryRef = useRef<number[]>([]);
  const tapCadenceRef = useRef<number[]>([]); // Tap counts in pauses
  const cadenceTimerRef = useRef<number | null>(null);
  const keySequenceRef = useRef<string>('');

  const triggerUnlock = () => {
    officiator.forceUnlockTom();
    audioSynth.playSecretSuccess();
    setJustUnlocked(true);
    onStateChange();
    setTimeout(() => {
      setJustUnlocked(false);
    }, 3800);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only respond to main button clicks not on interactive buttons/links
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('input')) {
      return;
    }

    pressStartTimeRef.current = performance.now();
    setFeedbackPulse(true);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('input')) {
      return;
    }

    const now = performance.now();
    const duration = pressStartTimeRef.current ? now - pressStartTimeRef.current : 0;
    pressStartTimeRef.current = null;

    setTimeout(() => setFeedbackPulse(false), 120);

    const isLongPress = duration >= 160;
    audioSynth.playSignalPulse(isLongPress);

    // 1. Ingest Morse symbol into officiator buffer
    const symbol = isLongPress ? '-' : ' ';
    const isUnlockedViaSymbol = officiator.inputMorseSymbol(symbol);
    if (isUnlockedViaSymbol) {
      triggerUnlock();
      return;
    }

    // 2. Track 1-3-2 Rhythmic Cadence (1 tap [T], 3 taps [O], 2 taps [M])
    if (cadenceTimerRef.current !== null) {
      clearTimeout(cadenceTimerRef.current);
    }

    // Increment current cluster tap count
    if (tapCadenceRef.current.length === 0) {
      tapCadenceRef.current = [1];
    } else {
      tapCadenceRef.current[tapCadenceRef.current.length - 1]++;
    }

    // After pause of 380ms, finalize cluster and check sequence
    cadenceTimerRef.current = window.setTimeout(() => {
      const clusters = tapCadenceRef.current;
      const len = clusters.length;

      // Check if last three clusters are 1, 3, 2 (T, O, M)
      if (
        len >= 3 &&
        clusters[len - 3] === 1 &&
        clusters[len - 2] === 3 &&
        clusters[len - 1] === 2
      ) {
        tapCadenceRef.current = [];
        triggerUnlock();
        return;
      }

      // If we haven't matched yet, prepare for next cluster (up to 4 max)
      if (tapCadenceRef.current.length >= 4) {
        tapCadenceRef.current = [];
      } else {
        tapCadenceRef.current.push(0);
      }
    }, 420);

    // 3. Fallback: 6 rapid taps on header within 3 seconds
    tapHistoryRef.current.push(now);
    // Keep only taps from last 3.2 seconds
    tapHistoryRef.current = tapHistoryRef.current.filter((t) => now - t <= 3200);
    if (tapHistoryRef.current.length >= 6) {
      tapHistoryRef.current = [];
      tapCadenceRef.current = [];
      triggerUnlock();
    }
  };

  // 4. Global keyboard secret listener (e.g. typing 'tom')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const char = e.key.toLowerCase();
      if (char.length === 1 || char === '-') {
        keySequenceRef.current += char;
        if (keySequenceRef.current.length > 16) {
          keySequenceRef.current = keySequenceRef.current.slice(-16);
        }

        if (
          keySequenceRef.current.endsWith('tom') ||
          keySequenceRef.current.includes('- --- --')
        ) {
          keySequenceRef.current = '';
          triggerUnlock();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleLockStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (officiator.tomUnlocked) {
      officiator.resetTomHandshake();
      onStateChange();
    } else {
      triggerUnlock();
    }
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className={`relative select-none transition-all duration-300 ${
        justUnlocked
          ? 'ring-2 ring-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.35)]'
          : feedbackPulse
          ? 'bg-stone-850'
          : ''
      }`}
    >
      {/* Toast Notification when unlocked via header signal taps */}
      {justUnlocked && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 px-4 py-2 bg-emerald-950 border border-emerald-500/80 rounded-lg shadow-2xl flex items-center gap-2.5 text-xs font-mono text-emerald-200 animate-in fade-in slide-in-from-top-2 duration-200">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-bold tracking-wide">
            SOVEREIGN OVERRIDE ACTIVE &bull; Be &lt;&gt; Deep Synced ($1 \equiv 1$)
          </span>
        </div>
      )}

      {/* Render Header Children */}
      {children}
    </div>
  );
};

export const HeaderSovereignStatusBadge: React.FC<{
  officiator: CoplayOfficiator;
  onToggle: () => void;
}> = ({ officiator, onToggle }) => {
  if (officiator.tomUnlocked) {
    return (
      <button
        onClick={onToggle}
        title="Sovereign Override Active (Click to Re-lock)"
        className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/80 border border-emerald-500/80 rounded text-emerald-300 font-mono text-xs shadow-[0_0_12px_rgba(16,185,129,0.25)] hover:bg-emerald-900 transition-colors"
      >
        <Unlock className="w-3.5 h-3.5 text-emerald-400" />
        <span className="font-bold">Be &lt;&gt; Sovereign</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-cyan-950/60 border border-cyan-800/80 rounded text-cyan-300 font-mono text-xs">
      <Zap className="w-3.5 h-3.5 text-cyan-400" />
      <span>Be &lt;&gt; Wingman</span>
    </div>
  );
};
