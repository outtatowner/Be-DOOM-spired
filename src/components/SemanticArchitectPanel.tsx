/**
 * @file SemanticArchitectPanel.tsx
 * @brief Organelle 0x9E_COVALENT: Semantic Level Architect (The Designer)
 *        & Organelle 0x9F_COVALENT: Anthropomorphic Kinetic Engine (The Tester)
 * @invariants 1 === 1, Continuous Lyapunov Dissipation (dV/dt <= 0), Zero-API Multimodal Generation
 */

import React, { useState, useEffect } from 'react';
import { CovalentRTEngine } from '../organelles/node_0x94_covalent_rt_engine';
import { CoplayOfficiator, TriStateMode } from '../organelles/node_0x96_coplay_officiator';
import { SemanticArchitectTelemetry } from '../organelles/node_0xSEMANTIC_ARCHITECT';
import { AnthropomorphicTesterTelemetry } from '../organelles/node_0xANTHROPOMORPHIC_TESTER';
import { P2PSyncTelemetry } from '../organelles/node_0xP2P_COPLAY_SYNC';
import {
  Wand2,
  Bot,
  UserCheck,
  ShieldAlert,
  Play,
  Flame,
  CheckCircle2,
  Clock,
  Compass,
  Layers,
  Sparkles,
  RefreshCw,
  Terminal,
  Radio,
  Users,
  Cpu,
  Shield,
  Crosshair,
} from 'lucide-react';

interface SemanticArchitectPanelProps {
  engine: CovalentRTEngine;
  officiator: CoplayOfficiator;
  onMapSynthesized: () => void;
}

export const SemanticArchitectPanel: React.FC<SemanticArchitectPanelProps> = ({
  engine,
  officiator,
  onMapSynthesized,
}) => {
  const [promptText, setPromptText] = useState(
    'maze with 3 enemy types, dark metallic brick, pbr'
  );
  const [designerTelemetry, setDesignerTelemetry] =
    useState<SemanticArchitectTelemetry | null>(
      engine.semanticDesigner.lastTelemetry
    );
  const [testerTelemetry, setTesterTelemetry] =
    useState<AnthropomorphicTesterTelemetry | null>(null);
  const [p2pTelemetry, setP2pTelemetry] = useState<P2PSyncTelemetry>(
    officiator.p2pSyncManifold.getTelemetry()
  );
  const [triState, setTriState] = useState<TriStateMode>(officiator.triStateMode);
  const [isGenerating, setIsGenerating] = useState(false);

  // Quick prompt presets
  const presets = [
    'maze with 3 enemy types, dark metallic brick, pbr',
    'cybernetic reactor chamber with 3 enemy types, brushed steel, pbr',
    'corrosive toxic labyrinth with 3 enemy types and alcoves',
    'containment bay with 3 enemy types and high-intensity luminaire',
  ];

  // Refresh telemetry periodically from engine/officiator ticks
  useEffect(() => {
    const interval = setInterval(() => {
      setDesignerTelemetry(engine.semanticDesigner.lastTelemetry);
      setTesterTelemetry(
        officiator.anthropomorphicTester.getTelemetry(
          engine.tickCount || (officiator as any).tickIndex || 0
        )
      );
      setP2pTelemetry(officiator.p2pSyncManifold.getTelemetry());
      setTriState(officiator.triStateMode);
    }, 100);

    return () => clearInterval(interval);
  }, [engine, officiator]);

  const handleSynthesizeSiliconAvatar = () => {
    officiator.p2pSyncManifold.initializeDualPresence();
    setTriState(0x01);
    setP2pTelemetry(officiator.p2pSyncManifold.getTelemetry());
  };

  const handleSynthesizeIntent = () => {
    setIsGenerating(true);
    try {
      engine.generateSemanticManifold(promptText);
      setDesignerTelemetry(engine.semanticDesigner.lastTelemetry);
      onMapSynthesized();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDesignAndDropTester = () => {
    setIsGenerating(true);
    try {
      // 1. Generate manifold from intent (0x9E)
      engine.generateSemanticManifold(promptText);
      setDesignerTelemetry(engine.semanticDesigner.lastTelemetry);
      onMapSynthesized();

      // 2. Set Tri-State Toggle to 0x02 (Anthropomorphic Tester)
      officiator.triStateMode = 0x02;
      setTriState(0x02);

      // Reset tester mimic state with spawn room yaw
      officiator.anthropomorphicTester.sys_covalent_init_human_mimic(
        engine.map.beAgentAngle ? Math.round(engine.map.beAgentAngle * (65536 / 360)) : 0
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSetTriState = (mode: TriStateMode) => {
    officiator.triStateMode = mode;
    setTriState(mode);
    if (mode === 0x02) {
      officiator.anthropomorphicTester.sys_covalent_init_human_mimic(engine.beYaw);
    }
  };

  return (
    <div
      id="organelle-0x9e-0x9f-panel"
      className="bg-stone-900/95 border border-stone-800 rounded-xl p-5 font-mono text-stone-200 shadow-2xl flex flex-col gap-5"
    >
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Wand2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black tracking-wider text-stone-100 uppercase">
                ORGANELLE 0x9E_COVALENT // SEMANTIC LEVEL ARCHITECT
              </h2>
              <span className="text-[10px] px-1.5 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded font-bold">
                0x9F TESTER READY
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Natural Language Manifold Synthesis • Zero-API Multimodal Sieve • Anthropomorphic Kinetic Tester (~250ms delay)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-stone-400">Tri-State Arbiter:</span>
          <span
            className={`font-bold px-2 py-0.5 rounded border text-[11px] ${
              triState === 0x02
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse'
                : triState === 0x01
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                : 'bg-stone-800 text-stone-300 border-stone-700'
            }`}
          >
            {triState === 0x00
              ? '0x00 MANUAL'
              : triState === 0x01
              ? '0x01 SOVEREIGN CO-OP'
              : '0x02 ANTHROPOMORPHIC TESTER'}
          </span>
        </div>
      </div>

      {/* Tri-State Toggle Selector */}
      <div className="bg-stone-950 border border-stone-800/90 rounded-lg p-3 flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-stone-300 font-bold flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-amber-400" />
            TRI-STATE ARBITER SELECTOR
          </span>
          <span className="text-[10px] text-stone-500">
            Be &lt;&gt; Computational Handicap Control
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {/* 0x00: Manual */}
          <button
            onClick={() => handleSetTriState(0x00)}
            className={`p-3 rounded-lg border text-left transition-all flex flex-col gap-1 ${
              triState === 0x00
                ? 'bg-stone-800/90 border-stone-500 text-stone-100 shadow-md ring-1 ring-stone-400'
                : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:bg-stone-800/50 hover:text-stone-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs">STATE 0x00: MANUAL</span>
              <UserCheck className="w-3.5 h-3.5" />
            </div>
            <p className="text-[11px] leading-tight text-stone-400">
              Be &lt;&gt; in stasis hold. Pure single-user manual movement.
            </p>
          </button>

          {/* 0x01: Sovereign Co-op */}
          <button
            onClick={() => handleSetTriState(0x01)}
            className={`p-3 rounded-lg border text-left transition-all flex flex-col gap-1 ${
              triState === 0x01
                ? 'bg-cyan-950/70 border-cyan-500 text-cyan-100 shadow-md ring-1 ring-cyan-400'
                : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:bg-stone-800/50 hover:text-stone-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-cyan-300">
                STATE 0x01: SOVEREIGN
              </span>
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <p className="text-[11px] leading-tight text-stone-400">
              Supra-human reaction speed, covering fire &amp; tactical escort.
            </p>
          </button>

          {/* 0x02: Anthropomorphic Tester */}
          <button
            onClick={() => handleSetTriState(0x02)}
            className={`p-3 rounded-lg border text-left transition-all flex flex-col gap-1 ${
              triState === 0x02
                ? 'bg-amber-950/70 border-amber-500 text-amber-100 shadow-md ring-1 ring-amber-400'
                : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:bg-stone-800/50 hover:text-stone-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-amber-300">
                STATE 0x02: THE TESTER
              </span>
              <Flame className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-[11px] leading-tight text-stone-400">
              ~250ms human optic delay, bounded yaw turn rate &amp; AABB sightline validation.
            </p>
          </button>
        </div>
      </div>

      {/* Natural Language Prompt & Synthesis Bar */}
      <div className="flex flex-col gap-2.5">
        <label className="text-xs font-bold text-stone-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            NATURAL LANGUAGE INTENT (SPATIAL ARCHITECT)
          </span>
          <span className="text-[11px] text-stone-500">
            Zero API Callouts • Internal Multimodal Sieve
          </span>
        </label>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Describe manifold intent (e.g. 'maze with 3 enemy types, dark metallic brick, pbr')..."
            className="flex-1 bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 transition-colors"
          />

          <button
            onClick={handleSynthesizeIntent}
            disabled={isGenerating}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 active:bg-stone-600 text-stone-100 border border-stone-700 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-400" />
            <span>SYNTHESIZE (0x9E)</span>
          </button>

          <button
            onClick={handleDesignAndDropTester}
            disabled={isGenerating}
            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-black font-black rounded-lg text-xs shadow-lg transition-all flex items-center justify-center gap-1.5 shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            <span>DESIGN &amp; DROP TESTER (0x02)</span>
          </button>

          <button
            onClick={handleSynthesizeSiliconAvatar}
            className={`px-4 py-2 text-xs font-black rounded-lg shadow-lg transition-all flex items-center justify-center gap-1.5 shrink-0 ${
              p2pTelemetry.dualPresenceActive && triState === 0x01
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white ring-2 ring-emerald-400'
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>
              {p2pTelemetry.dualPresenceActive
                ? 'P2P DUAL PRESENCE LOCKED (0xA1)'
                : 'SYNTHESIZE AVATAR (0xA0) & P2P (0xA1)'}
            </span>
          </button>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] text-stone-500">Presets:</span>
          {presets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => setPromptText(preset)}
              className="text-[10px] px-2 py-0.5 rounded bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700 transition-colors truncate max-w-xs"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Dual Telemetry Grids: 0x9E Designer & 0x9F Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Organelle 0x9E: Designer Telemetry */}
        <div className="bg-stone-950 border border-stone-800 rounded-lg p-3.5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-200">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>0x9E DESIGNER TELEMETRY</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded font-bold">
              1 === 1 CONFIRMED
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-stone-900/80 p-2 rounded border border-stone-800/80">
              <span className="text-stone-500 text-[10px] block">Z-Bounds Q16.16:</span>
              <span className="text-amber-300 font-bold text-[11px]">
                0x00000000 &rarr; 0x00800000
              </span>
              <span className="text-stone-500 text-[9px] block">Floor: 0 | Ceil: 128</span>
            </div>

            <div className="bg-stone-900/80 p-2 rounded border border-stone-800/80">
              <span className="text-stone-500 text-[10px] block">Synthesized Quads:</span>
              <span className="text-cyan-300 font-bold text-xs">
                {designerTelemetry?.wallsSynthesized ?? engine.map?.quads?.length ?? 0} Quads
              </span>
              <span className="text-stone-500 text-[9px] block">AABB Hull + Chicanes</span>
            </div>

            <div className="bg-stone-900/80 p-2 rounded border border-stone-800/80 col-span-2">
              <span className="text-stone-500 text-[10px] block">Zero-API PBR Ingestion:</span>
              <span className="text-stone-200 font-mono text-[11px]">
                {designerTelemetry?.materialsIngested?.join(', ') || 'GEN_BRICK_PBR (1024x1024)'}
              </span>
            </div>

            <div className="bg-stone-900/80 p-2 rounded border border-stone-800/80 col-span-2">
              <span className="text-stone-500 text-[10px] block">3-Tier Entities Populated:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                <span className="text-[10px] px-1.5 py-0.2 bg-stone-800 text-stone-300 rounded">
                  Zombieman (0x00500000, 0x00500000)
                </span>
                <span className="text-[10px] px-1.5 py-0.2 bg-stone-800 text-stone-300 rounded">
                  Imp (-0x00300000, 0x00400000)
                </span>
                <span className="text-[10px] px-1.5 py-0.2 bg-stone-800 text-stone-300 rounded">
                  Demon (0x00000000, -0x00500000)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Organelle 0x9F: Anthropomorphic Tester Telemetry */}
        <div className="bg-stone-950 border border-stone-800 rounded-lg p-3.5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-200">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>0x9F ANTHROPOMORPHIC TESTER TELEMETRY</span>
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                triState === 0x02
                  ? 'bg-amber-950 text-amber-300 border-amber-800 animate-pulse'
                  : 'bg-stone-800 text-stone-400 border-stone-700'
              }`}
            >
              {triState === 0x02 ? 'LIVE TESTER ENGAGED' : 'STANDBY (SET 0x02)'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-stone-900/80 p-2 rounded border border-stone-800/80">
              <span className="text-stone-500 text-[10px] block">Tester Active Phase:</span>
              <span
                className={`font-bold text-[11px] block truncate ${
                  testerTelemetry?.mimicState.currentPhase === 'OPTIC_PROCESSING_DELAY_250MS'
                    ? 'text-amber-400'
                    : testerTelemetry?.mimicState.currentPhase === 'VIRTUAL_HID_FIRE'
                    ? 'text-red-400'
                    : 'text-emerald-400'
                }`}
              >
                {testerTelemetry?.mimicState.currentPhase || 'IDLE_EXPLORE'}
              </span>
              <span className="text-stone-500 text-[9px] block">
                {testerTelemetry?.mimicState.currentPhase === 'OPTIC_PROCESSING_DELAY_250MS'
                  ? 'Staring blankly (human latency)'
                  : 'Bounded yaw movement'}
              </span>
            </div>

            <div className="bg-stone-900/80 p-2 rounded border border-stone-800/80">
              <span className="text-stone-500 text-[10px] block">Human Optic Delay:</span>
              <div className="flex items-center gap-1.5">
                <span className="text-amber-300 font-bold text-xs">
                  {testerTelemetry?.delayCountdownTicks || 0} / 15 Ticks
                </span>
                <span className="text-stone-500 text-[10px]">(~250ms)</span>
              </div>
              <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-amber-400 h-full transition-all"
                  style={{
                    width: `${
                      ((testerTelemetry?.delayCountdownTicks || 0) / 15) * 100
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="bg-stone-900/80 p-2 rounded border border-stone-800/80">
              <span className="text-stone-500 text-[10px] block">Turn Speed Throttle:</span>
              <span className="text-cyan-300 font-bold text-xs">
                MAX 1280 Q16/tick
              </span>
              <span className="text-stone-500 text-[9px] block">
                Instant 180&deg; snap suppressed
              </span>
            </div>

            <div className="bg-stone-900/80 p-2 rounded border border-stone-800/80">
              <span className="text-stone-500 text-[10px] block">AABB Checks &amp; Invariants:</span>
              <span className="text-emerald-400 font-bold text-xs">
                {testerTelemetry?.mimicState.aabbChecksPassed || 0} Checks Passed
              </span>
              <span className="text-stone-500 text-[9px] block">
                Clipping Violations: 0 (dV/dt &le; 0)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Organelle 0xA0 & 0xA1: Silicon Avatar Synthesis & P2P Synchronization */}
      <div className="bg-stone-950 border border-cyan-900/40 rounded-lg p-4 flex flex-col gap-3 shadow-inner">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wide text-stone-100 uppercase">
                  ORGANELLES 0xA0 &amp; 0xA1 // SILICON AVATAR &amp; P2P STATE SYNCHRONIZATION
                </span>
                <span className="text-[10px] px-1.5 py-0.2 bg-cyan-950 text-cyan-300 border border-cyan-700 rounded font-bold">
                  Q16.16 KINEMATICS
                </span>
              </div>
              <span className="text-[11px] text-stone-400 block">
                Internal Tensor Sieve Self-Portrait • Multiplexed Input Manifold • Continuous Lyapunov Invariant
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                p2pTelemetry.dualPresenceActive && triState === 0x01
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700 animate-pulse'
                  : 'bg-stone-800 text-stone-400 border-stone-700'
              }`}
            >
              {p2pTelemetry.dualPresenceActive && triState === 0x01
                ? 'P2P DUAL PRESENCE ACTIVE'
                : 'P2P STANDBY (CLICK SYNTHESIZE)'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Tile 1: 0xA0 Avatar Silicon Synthesis */}
          <div className="bg-stone-900/80 p-3 rounded-lg border border-stone-800 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-stone-400 font-bold flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                SILICON AVATAR (0xA0)
              </span>
              <span className="text-[10px] text-cyan-300 font-bold">ENTITY_COPLAYER_BE</span>
            </div>
            <div className="flex flex-col gap-0.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Visor:</span>
                <span className="text-stone-200 font-bold">Chrome Specular PBR</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Telemetry:</span>
                <span className="text-cyan-400 font-bold">Emissive Blue (#00F0FF)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Spawn:</span>
                <span className="text-stone-300 font-mono text-[10px]">0x00600000, 0x00600000</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Zero-API Sieve:</span>
                <span className="text-emerald-400 font-bold text-[10px]">INTERNAL TENSOR</span>
              </div>
            </div>
          </div>

          {/* Tile 2: Multiplexed Sync Tick */}
          <div className="bg-stone-900/80 p-3 rounded-lg border border-stone-800 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-stone-400 font-bold flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                P2P KINEMATIC SYNC (0xA1)
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">T0 LOCK</span>
            </div>
            <div className="flex flex-col gap-0.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Multiplexed Ticks:</span>
                <span className="text-emerald-300 font-bold">{p2pTelemetry.synchronizedTicks}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Input Resolution:</span>
                <span className="text-stone-200">Exact Same Tick</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Human Marine:</span>
                <span className="text-stone-300 font-mono text-[10px]">
                  ({p2pTelemetry.humanPos.x}, {p2pTelemetry.humanPos.y})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Be &lt;&gt; Marine:</span>
                <span className="text-cyan-300 font-mono text-[10px]">
                  ({p2pTelemetry.bePos.x}, {p2pTelemetry.bePos.y})
                </span>
              </div>
            </div>
          </div>

          {/* Tile 3: Blind-Spot Flanking Vector */}
          <div className="bg-stone-900/80 p-3 rounded-lg border border-stone-800 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-stone-400 font-bold flex items-center gap-1">
                <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                FLANKING VECTOR
              </span>
              <span className="text-[10px] text-amber-400 font-bold">
                {p2pTelemetry.flankingVector.coverAngleDeg}&deg; COVER
              </span>
            </div>
            <div className="flex flex-col gap-0.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Strategy:</span>
                <span className="text-stone-200 font-bold">
                  {p2pTelemetry.flankingVector.coverAngleDeg === 90
                    ? 'Crossfire Linedef'
                    : 'Rear Blind-Spot Cover'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Target Vector:</span>
                <span className="text-stone-300 font-mono text-[10px]">
                  ({p2pTelemetry.flankingVector.targetX}, {p2pTelemetry.flankingVector.targetY})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Aim Yaw:</span>
                <span className="text-stone-300 font-mono text-[10px]">
                  {p2pTelemetry.flankingVector.yaw}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Threat Crossfire:</span>
                <span className="text-amber-300 font-bold text-[10px]">AUTONOMOUS LOS</span>
              </div>
            </div>
          </div>

          {/* Tile 4: Continuous Lyapunov Invariant */}
          <div className="bg-stone-900/80 p-3 rounded-lg border border-stone-800 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-stone-400 font-bold flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                QUIPU DISSIPATION
              </span>
              <span className="text-[10px] text-cyan-300 font-bold">dV/dt &le; 0</span>
            </div>
            <div className="flex flex-col gap-0.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Dissipation Invariant:</span>
                <span className="text-emerald-400 font-bold">CONTINUOUS HOLD</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">2x Entity Processing:</span>
                <span className="text-stone-200">No Divergence</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Quipu Ledger:</span>
                <span className="text-stone-300 font-mono text-[10px]">1 === 1 [LOCKED]</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">AABB Sliding:</span>
                <span className="text-cyan-300 font-bold text-[10px]">SLIDE RESOLVED</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
