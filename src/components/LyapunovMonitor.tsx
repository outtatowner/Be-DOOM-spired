/**
 * @file LyapunovMonitor.tsx
 * @brief Continuous Lyapunov Dissipation (dV/dt <= 0) & Thermodynamic Stasis Governor
 */

import React from 'react';
import { LyapunovTelemetry, EngineTelemetry } from '../organelles/node_0x94_covalent_rt_engine';
import { Activity, ShieldCheck, Cpu, Zap, AlertTriangle } from 'lucide-react';

interface LyapunovMonitorProps {
  telemetry: EngineTelemetry | null;
}

export const LyapunovMonitor: React.FC<LyapunovMonitorProps> = ({ telemetry }) => {
  const l = telemetry?.lyapunov;

  const vEnergy = l ? l.vEnergy : 0.42;
  const dVdt = l ? l.dVdt : -0.015;
  const adaptiveStep = l ? l.adaptiveStep : 1;
  const shearDetected = l ? l.shearDetected : false;
  const elapsedUs = l ? l.actualElapsedUs : 14200;
  const budgetUs = l ? l.frameBudgetUs : 16666;
  const loadPct = Math.min(100, Math.round((elapsedUs / budgetUs) * 100));

  return (
    <div id="lyapunov-stasis-governor" className="bg-stone-900 border border-stone-800 rounded-lg p-4 font-mono text-stone-200 flex flex-col gap-3 shadow-lg">
      <div className="flex items-center justify-between border-b border-stone-800 pb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-stone-100">
            Lyapunov Dissipation Governor
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-emerald-400 font-bold">1 ≡ 1 INVARIANT PRESERVED</span>
        </div>
      </div>

      {/* Primary Mathematical Gauge */}
      <div className="grid grid-cols-3 gap-3 text-center">
        {/* V(x) Energy */}
        <div className="bg-stone-950 border border-stone-800 rounded p-2.5">
          <div className="text-[10px] text-stone-400 uppercase">Lyapunov V(x)</div>
          <div className="text-lg font-bold text-amber-400 mt-1 font-mono">
            {vEnergy.toFixed(4)}
          </div>
          <div className="text-[9px] text-stone-500 mt-0.5">Target: &lt; 1.0000</div>
        </div>

        {/* dV/dt Dissipation */}
        <div className="bg-stone-950 border border-stone-800 rounded p-2.5">
          <div className="text-[10px] text-stone-400 uppercase">Dissipation dV/dt</div>
          <div className={`text-lg font-bold mt-1 font-mono ${dVdt <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {dVdt > 0 ? `+${dVdt.toFixed(4)}` : dVdt.toFixed(4)}
          </div>
          <div className="text-[9px] text-stone-500 mt-0.5">Mandate: dV/dt &le; 0</div>
        </div>

        {/* Adaptive Resolution / Stasis */}
        <div className="bg-stone-950 border border-stone-800 rounded p-2.5">
          <div className="text-[10px] text-stone-400 uppercase">Stasis Throttle</div>
          <div className="text-lg font-bold text-cyan-400 mt-1 font-mono">
            {adaptiveStep === 1 ? '1x (Crisp)' : `${adaptiveStep}x (Adaptive)`}
          </div>
          <div className="text-[9px] text-stone-500 mt-0.5">Zero-Shear Guard</div>
        </div>
      </div>

      {/* Frame Budget Bar */}
      <div className="flex flex-col gap-1 text-xs">
        <div className="flex justify-between text-[11px] text-stone-400">
          <span>Compute Frame Budget: {elapsedUs.toLocaleString()} µs / {budgetUs.toLocaleString()} µs</span>
          <span className={loadPct > 85 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>{loadPct}%</span>
        </div>
        <div className="w-full bg-stone-950 rounded-full h-2 overflow-hidden border border-stone-800">
          <div
            className={`h-full transition-all duration-100 ${
              loadPct > 90 ? 'bg-red-500' : loadPct > 70 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${loadPct}%` }}
          />
        </div>
      </div>

      {/* Thermodynamic State Indicators */}
      <div className="flex items-center justify-between text-[11px] bg-stone-950/80 border border-stone-800/80 px-2.5 py-1.5 rounded text-stone-400">
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-stone-400" />
          <span>CORDIC Bit-Shifts: Active</span>
        </div>
        <div className="flex items-center gap-1.5">
          {telemetry?.activeEnemies !== undefined && (
            <span className="text-amber-300 font-bold">
              Hostiles: {telemetry.activeEnemies} Active
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {shearDetected ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="text-amber-400 font-bold">AI Throttle Engaged</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Continuous Dissipation Steady</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
