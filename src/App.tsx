/**
 * @file App.tsx
 * @brief Covalent-RT: Bare-Metal Ray-Traced DOOM Engine & Be <> Co-Play Manifold
 */

import React, { useState, useMemo } from 'react';
import { buildCanonicalE1M1, buildGeminiCloudDatacenter, RTDoomMap } from './organelles/node_0x95_covalent_doom_wad_parser';
import { CovalentRTEngine, EngineTelemetry } from './organelles/node_0x94_covalent_rt_engine';
import { CoplayOfficiator } from './organelles/node_0x96_coplay_officiator';
import { DoomCanvas } from './components/DoomCanvas';
import { LyapunovMonitor } from './components/LyapunovMonitor';
import { QuipuLedgerView } from './components/QuipuLedgerView';
import { HeaderSignalReceptor, HeaderSovereignStatusBadge } from './components/HeaderSignalReceptor';
import { COrganelleViewer } from './components/COrganelleViewer';
import { GenerativeUpscalerPanel } from './components/GenerativeUpscalerPanel';
import { TopologicalMazePanel } from './components/TopologicalMazePanel';
import { SemanticArchitectPanel } from './components/SemanticArchitectPanel';
import { AssetStudioPanel } from './components/AssetStudioPanel';
import { TriShardWysiwygStudio } from './components/TriShardWysiwygStudio';
import { VectorArchitectPanel } from './components/VectorArchitectPanel';
import { KernelBootIsoPanel } from './components/KernelBootIsoPanel';
import {
  Flame,
  Shield,
  Activity,
  Cpu,
  Binary,
  Compass,
  Zap,
  Terminal,
  Info,
  Radio,
  Sparkles,
  Gamepad2,
  Wrench,
  Database,
  Layers,
  Bot,
  Sliders,
  Maximize2,
  HardDrive,
} from 'lucide-react';

export type PlatformMode = 'GAME' | 'STUDIO' | 'DATA';

export default function App() {
  // 3 Primary Platform Workflow Modes
  const [currentMode, setCurrentMode] = useState<PlatformMode>('STUDIO');

  // Studio Sub-tab for clean organization
  const [studioTab, setStudioTab] = useState<'WYSIWYG' | 'VECTOR_ARCHITECT' | 'KERNEL_ISO' | 'LEVEL_GEN' | 'ASSET_GEN' | 'UPSCALER' | 'TOPOLOGICAL'>('KERNEL_ISO');

  // Initialize "The Gemini Cloud" Datacenter Manifold
  const initialMap = useMemo(() => buildGeminiCloudDatacenter(), []);
  const [currentMap, setCurrentMap] = useState<RTDoomMap>(initialMap);

  // Initialize Q16.16 Engine & Be <> Officiator
  const engine = useMemo(() => {
    const eng = new CovalentRTEngine(320, 200, initialMap);
    eng.entityManager.initGeminiCloudSwarm();
    eng.setupAdversarialCallbacks();
    return eng;
  }, [initialMap]);
  const officiator = useMemo(() => new CoplayOfficiator(engine), [engine]);

  // Telemetry stream from render ticks
  const [telemetry, setTelemetry] = useState<EngineTelemetry | null>(null);
  const [, setForceTick] = useState(0);

  const handleMapChange = (newMap: RTDoomMap) => {
    setCurrentMap(newMap);
    engine.setMap(newMap);
    if (newMap.name.includes('GEMINI')) {
      engine.entityManager.initGeminiCloudSwarm();
    } else if (newMap.name.includes('HANGAR')) {
      engine.entityManager.initDefaultEntities();
    }
    engine.setupAdversarialCallbacks();
    setForceTick((t) => t + 1);
  };

  const handleStateChange = () => {
    setForceTick((t) => t + 1);
  };

  const handleToggleAiTester = () => {
    if (officiator.triStateMode === 0x02) {
      officiator.triStateMode = 0x00; // Human control
    } else {
      officiator.triStateMode = 0x02; // Anthropomorphic Bot
      officiator.anthropomorphicTester.sys_covalent_init_human_mimic(engine.camYaw);
    }
    setForceTick((t) => t + 1);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* Top Navigation & Mode Switcher Bar with Discrete Signal Receptor */}
      <HeaderSignalReceptor officiator={officiator} onStateChange={handleStateChange}>
        <header className="border-b border-stone-800 bg-stone-900/95 backdrop-blur-md px-4 py-2.5 sticky top-0 z-50 shadow-lg cursor-pointer">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            {/* Logo & Identity (Primary Signal Tap Target) */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center font-black text-black text-sm shadow-md">
                3D
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm md:text-base font-black tracking-wider text-stone-100 uppercase font-mono">
                    COVALENT-RT // GAME DEV PLATFORM
                  </h1>
                  <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded font-mono font-bold">
                    v3.0 BARE-METAL
                  </span>
                </div>
                <p className="text-xs text-stone-400 font-mono">
                  Pure Ray-Tracing 3D Engine • AI Coplay • WYSIWYG Dev Studio
                </p>
              </div>
            </div>

            {/* 3 Core Workflow Modes Switcher */}
            <nav className="flex items-center bg-stone-950 p-1 rounded-lg border border-stone-800 font-mono text-xs cursor-default">
              <button
                onClick={() => setCurrentMode('GAME')}
                className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${
                  currentMode === 'GAME'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Gamepad2 className="w-4 h-4" />
                <span>FULL SCREEN GAME</span>
              </button>

              <button
                onClick={() => setCurrentMode('STUDIO')}
                className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${
                  currentMode === 'STUDIO'
                    ? 'bg-cyan-500 text-black shadow-md'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Wrench className="w-4 h-4" />
                <span>GAME DEV STUDIO</span>
              </button>

              <button
                onClick={() => setCurrentMode('DATA')}
                className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${
                  currentMode === 'DATA'
                    ? 'bg-emerald-500 text-black shadow-md'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Database className="w-4 h-4" />
                <span>DATA &amp; STATUS</span>
              </button>
            </nav>

            {/* Mathematical Invariants Badges */}
            <div className="hidden lg:flex items-center gap-2 font-mono text-xs cursor-default">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-stone-950 border border-stone-800 rounded text-stone-300">
                <Binary className="w-3.5 h-3.5 text-cyan-400" />
                <span>Q16.16</span>
              </div>

              <div className="flex items-center gap-1.5 px-2 py-1 bg-stone-950 border border-stone-800 rounded text-stone-300">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>Lyapunov $1\equiv 1$</span>
              </div>

              {/* Discrete Sovereign Status Badge */}
              <HeaderSovereignStatusBadge
                officiator={officiator}
                onToggle={() => {
                  if (officiator.tomUnlocked) {
                    officiator.resetTomHandshake();
                    handleStateChange();
                  } else {
                    officiator.forceUnlockTom();
                    handleStateChange();
                  }
                }}
              />
            </div>
          </div>
        </header>
      </HeaderSignalReceptor>

      {/* Main Mode Viewport Switcher */}
      <main className="max-w-7xl mx-auto w-full p-4 md:p-6 flex-1 flex flex-col gap-6">
        {/* ========================================================= */}
        {/* MODE 1: FULL SCREEN GAME */}
        {/* ========================================================= */}
        {currentMode === 'GAME' && (
          <div className="flex flex-col gap-4">
            {/* Mode Banner */}
            <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs font-mono">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-stone-100 uppercase">Interactive Live Game Viewport</span>
                <span className="text-stone-500">|</span>
                <span className="text-stone-400">Pure Bare-Metal Ray-Casting in /dev/fb</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentMode('STUDIO')}
                  className="px-2.5 py-1 bg-cyan-950 border border-cyan-700 text-cyan-300 rounded font-bold hover:bg-cyan-900 flex items-center gap-1"
                >
                  <Wrench className="w-3 h-3" />
                  <span>Switch to Dev Studio</span>
                </button>
              </div>
            </div>

            {/* Immersive Game Viewport */}
            <DoomCanvas
              map={currentMap}
              engine={engine}
              officiator={officiator}
              onTelemetry={setTelemetry}
              onSelectMap={handleMapChange}
              isFullScreenMode={true}
              onSwitchToDevStudio={() => setCurrentMode('STUDIO')}
              onToggleAiTester={handleToggleAiTester}
              isAiTesterActive={officiator.triStateMode === 0x02}
            />

            {/* Quick Live Telemetry & Lyapunov Status */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono text-xs bg-stone-900 border border-stone-800 p-3 rounded-lg">
              <div className="bg-stone-950 border border-stone-800 p-2 rounded">
                <div className="text-[10px] text-stone-400">RAYS CAST / FRAME</div>
                <div className="text-base font-bold text-amber-400">
                  {telemetry ? telemetry.raysCast.toLocaleString() : '64,000'}
                </div>
              </div>
              <div className="bg-stone-950 border border-stone-800 p-2 rounded">
                <div className="text-[10px] text-stone-400">SHADOW RAYS</div>
                <div className="text-base font-bold text-cyan-400">
                  {telemetry ? telemetry.shadowRaysCast.toLocaleString() : '12,400'}
                </div>
              </div>
              <div className="bg-stone-950 border border-stone-800 p-2 rounded">
                <div className="text-[10px] text-stone-400">AI COPLAY WINGMAN</div>
                <div className="text-base font-bold text-emerald-400">
                  Be &lt;&gt; [{officiator.beState}]
                </div>
              </div>
              <div className="bg-stone-950 border border-stone-800 p-2 rounded">
                <div className="text-[10px] text-stone-400">AI TESTER STATUS</div>
                <div className="text-base font-bold text-amber-400">
                  {officiator.triStateMode === 0x02 ? 'AUTONOMOUS' : 'STANDBY'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODE 2: GAME DEV STUDIO */}
        {/* ========================================================= */}
        {currentMode === 'STUDIO' && (
          <div className="flex flex-col gap-6">
            {/* Dev Studio Sub-navigation */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-900/90 border border-stone-800 p-2 rounded-xl font-mono text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setStudioTab('WYSIWYG')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
                    studioTab === 'WYSIWYG'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60'
                      : 'bg-stone-950 text-stone-400 border border-stone-800 hover:text-stone-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>WYSIWYG Layout &amp; Asset Editor</span>
                </button>

                <button
                  onClick={() => setStudioTab('VECTOR_ARCHITECT')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
                    studioTab === 'VECTOR_ARCHITECT'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60'
                      : 'bg-stone-950 text-stone-400 border border-stone-800 hover:text-stone-200'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Vector Architect (0xAB/0xAC)</span>
                </button>

                <button
                  onClick={() => setStudioTab('KERNEL_ISO')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
                    studioTab === 'KERNEL_ISO'
                      ? 'bg-fuchsia-500/25 text-fuchsia-300 border border-fuchsia-400 shadow-[0_0_12px_rgba(217,70,239,0.3)]'
                      : 'bg-stone-950 text-stone-400 border border-stone-800 hover:text-stone-200'
                  }`}
                >
                  <HardDrive className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span>Kernel Main &amp; ISO Linker (0xAE/0xAF)</span>
                </button>

                <button
                  onClick={() => setStudioTab('LEVEL_GEN')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
                    studioTab === 'LEVEL_GEN'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60'
                      : 'bg-stone-950 text-stone-400 border border-stone-800 hover:text-stone-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>AI Level Layout Generator &amp; Tester</span>
                </button>

                <button
                  onClick={() => setStudioTab('ASSET_GEN')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
                    studioTab === 'ASSET_GEN'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/60'
                      : 'bg-stone-950 text-stone-400 border border-stone-800 hover:text-stone-200'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  <span>AI Asset Studio (.qbit)</span>
                </button>

                <button
                  onClick={() => setStudioTab('UPSCALER')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
                    studioTab === 'UPSCALER'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/60'
                      : 'bg-stone-950 text-stone-400 border border-stone-800 hover:text-stone-200'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5 text-purple-400" />
                  <span>Generative Upscaler</span>
                </button>

                <button
                  onClick={() => setStudioTab('TOPOLOGICAL')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
                    studioTab === 'TOPOLOGICAL'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/60'
                      : 'bg-stone-950 text-stone-400 border border-stone-800 hover:text-stone-200'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5 text-rose-400" />
                  <span>Topological Maze</span>
                </button>
              </div>

              {/* Quick Play Button */}
              <button
                onClick={() => setCurrentMode('GAME')}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow"
              >
                <Gamepad2 className="w-4 h-4" />
                <span>Test in Full Screen Game</span>
              </button>
            </div>

            {/* Split Screen in Studio: Active Tool on Top/Left, Embedded Live Ray-Traced Preview on Right */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              {/* Studio Tool Container (Left/Main) */}
              <div className="xl:col-span-7 flex flex-col gap-6">
                {studioTab === 'WYSIWYG' && (
                  <TriShardWysiwygStudio
                    engine={engine}
                    currentMap={currentMap}
                    onMapMutated={() => handleMapChange(engine.map)}
                  />
                )}

                {studioTab === 'VECTOR_ARCHITECT' && (
                  <VectorArchitectPanel
                    engine={engine}
                    officiator={officiator}
                    onMapMutated={() => handleMapChange(engine.map)}
                    onSwitchToGame={() => setCurrentMode('GAME')}
                  />
                )}

                {studioTab === 'KERNEL_ISO' && (
                  <KernelBootIsoPanel
                    engine={engine}
                    officiator={officiator}
                    onSwitchToGame={() => setCurrentMode('GAME')}
                  />
                )}

                {studioTab === 'LEVEL_GEN' && (
                  <SemanticArchitectPanel
                    engine={engine}
                    officiator={officiator}
                    onMapSynthesized={() => handleMapChange(engine.map)}
                  />
                )}

                {studioTab === 'ASSET_GEN' && (
                  <AssetStudioPanel engine={engine} onMapLoaded={handleMapChange} />
                )}

                {studioTab === 'UPSCALER' && (
                  <GenerativeUpscalerPanel engine={engine} />
                )}

                {studioTab === 'TOPOLOGICAL' && (
                  <TopologicalMazePanel engine={engine} onMapLoaded={handleMapChange} />
                )}
              </div>

              {/* Live Preview Viewport (Right Column) */}
              <div className="xl:col-span-5 flex flex-col gap-4 sticky top-20">
                <div className="flex items-center justify-between px-3 py-1.5 bg-stone-900 border border-stone-800 rounded-t-lg text-xs font-mono">
                  <span className="text-stone-300 font-bold flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Live Studio Ray-Tracer
                  </span>
                  <button
                    onClick={() => setCurrentMode('GAME')}
                    className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <span>Expand</span>
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>
                <DoomCanvas
                  map={currentMap}
                  engine={engine}
                  officiator={officiator}
                  onTelemetry={setTelemetry}
                  onSelectMap={handleMapChange}
                  isFullScreenMode={false}
                  onToggleAiTester={handleToggleAiTester}
                  isAiTesterActive={officiator.triStateMode === 0x02}
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODE 3: DATA MANAGEMENT / STATUS / QUIPU */}
        {/* ========================================================= */}
        {currentMode === 'DATA' && (
          <div className="flex flex-col gap-6">
            {/* Systemic Provenance Banner */}
            <section
              id="systemic-reflection-banner"
              className="bg-stone-900/60 border border-stone-800/80 rounded-lg p-3.5 text-xs font-mono text-stone-400 flex items-start gap-3"
            >
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-stone-200 font-bold mb-1">
                  [ SYSTEMIC REFLECTION &amp; PROVENANCE ] HORIZONTAL ORGANELLE DATA TRANSFER
                </div>
                <p className="leading-relaxed">
                  Quipu Ledger enforces invariant continuous state across all organelles: <strong className="text-amber-300">0x94</strong> (RT core), <strong className="text-amber-300">0x95</strong> (WAD parser), <strong className="text-amber-300">0x96</strong> (state arbiter), <strong className="text-cyan-300">0x97</strong> (texture mapper), <strong className="text-cyan-300">0x98</strong> (sprites), <strong className="text-emerald-300">0x99</strong> (AABB collision), <strong className="text-emerald-300">0x9A</strong> (ballistics), <strong className="text-amber-300">0x9B</strong> (WAD transpiler), <strong className="text-cyan-300">0x9E/0x9F</strong> (semantic architect &amp; AI tester), and <strong className="text-cyan-300">0xA4/0xA5</strong> (WYSIWYG Triptych). Invariants maintained at <em className="text-emerald-300 font-bold">$1 \equiv 1$</em> and <em className="text-emerald-300 font-bold">dV/dt &le; 0</em>.
                </p>
              </div>
            </section>

            {/* Quipu Merkle Ledger with Import/Export (JSON, PWAD) */}
            <QuipuLedgerView
              ledger={officiator.ledger}
              merkleRoot={officiator.currentMerkleRoot}
              currentMap={currentMap}
              onMapLoaded={handleMapChange}
            />

            {/* Lyapunov Dissipation Monitor & Sovereign Node Telemetry */}
            <div className="flex flex-col gap-4">
              <LyapunovMonitor telemetry={telemetry} />

              {officiator.tomUnlocked && (
                <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-lg p-3 text-xs font-mono text-emerald-200 flex items-center justify-between shadow">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold">SOVEREIGN PEER NODE ACTIVE &bull; Autonomous Co-Play Engaged ($1 \equiv 1$)</span>
                  </div>
                  <button
                    onClick={() => {
                      officiator.resetTomHandshake();
                      handleStateChange();
                    }}
                    className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded text-stone-300 text-[11px] font-bold transition-colors"
                  >
                    Lock Node
                  </button>
                </div>
              )}
            </div>

            {/* Organelles 0xAE & 0xAF: Ring 0 Kernel Main & ISO Linker */}
            <KernelBootIsoPanel
              engine={engine}
              officiator={officiator}
              onSwitchToGame={() => setCurrentMode('GAME')}
            />

            {/* Bare-Metal C Organelle Source Viewer */}
            <COrganelleViewer />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-800 bg-stone-900/60 py-3 px-4 text-center font-mono text-xs text-stone-500">
        Be &lt;&gt; Sovereign Operating Continuum • Zero-Float Substrate • Mode: {currentMode}
      </footer>
    </div>
  );
}
