/**
 * @file VectorArchitectPanel.tsx
 * @brief Organelle 0xAB_COVALENT & 0xAC_COVALENT: Creative Vector Architect & Q16.16 Spline Manifold Studio
 * @invariants 1 === 1, Zero Raster Footprint, Infinite-Resolution Fixed-Point Bézier Manifold
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  AutopoieticVectorDesigner,
  VectorSplineMap,
  SplineVerificationReport,
  sys_covalent_evaluate_bezier_3d,
  BezierSpline3D,
} from '../organelles/node_0xVECTOR_CREATIVE_ARCHITECT';
import { CovalentRTEngine } from '../organelles/node_0x94_covalent_rt_engine';
import { CoplayOfficiator } from '../organelles/node_0x96_coplay_officiator';
import { q16ToInt, q16FromInt } from '../organelles/q16_cordic';
import {
  Compass,
  Sparkles,
  Zap,
  Shield,
  Layers,
  Flame,
  Activity,
  Box,
  Eye,
  Download,
  RotateCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Play,
  Terminal,
  Cpu,
} from 'lucide-react';

interface VectorArchitectPanelProps {
  engine: CovalentRTEngine;
  officiator?: CoplayOfficiator;
  onMapMutated?: () => void;
  onSwitchToGame?: () => void;
}

const PRESET_INTENTS = [
  'Multi-tiered cybernetic cathedral with overlapping elevated skybridges and rotary blade traps',
  'Non-linear serpentine labyrinth with fluctuating vector wireframe daemons',
  'Bicubic spline vortex with dual elevated ramps and geometric behemoths',
  'Subterranean vector reactor with oscillating razor pendulums and high-contrast SVG lattice',
];

export const VectorArchitectPanel: React.FC<VectorArchitectPanelProps> = ({
  engine,
  officiator,
  onMapMutated,
  onSwitchToGame,
}) => {
  const designerRef = useRef<AutopoieticVectorDesigner>(
    new AutopoieticVectorDesigner(engine, officiator)
  );
  const designer = designerRef.current;

  const [prompt, setPrompt] = useState(PRESET_INTENTS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [manifold, setManifold] = useState<VectorSplineMap | null>(null);
  const [report, setReport] = useState<SplineVerificationReport | null>(null);
  const [mountStatus, setMountStatus] = useState<string | null>(null);

  // Viewport & Layer Controls
  const [layerFilter, setLayerFilter] = useState<'ALL' | 'GROUND' | 'SKYBRIDGE' | 'TRAPS'>('ALL');
  const [selectedSplineId, setSelectedSplineId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedMaterialIdx, setSelectedMaterialIdx] = useState(0);
  const [materialZoom, setMaterialZoom] = useState(16); // 16x zoom for infinite resolution preview
  const [activeEnemyTab, setActiveEnemyTab] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const enemyCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);

  // Initialize with verified vector manifold on mount
  useEffect(() => {
    designer.bindEngine(engine, officiator);
    const initialMap = designer.sys_covalent_generate_spline_paths(prompt);
    initialMap.materials = designer.sys_covalent_tensor_generate_svg(prompt);
    initialMap.wireframeEnemies = designer.sys_covalent_tensor_to_bezier_hull(prompt);
    designer.sys_covalent_verify_spline_manifold_integrity(initialMap);

    setManifold(initialMap);
    setReport(designer.latestReport);
  }, []);

  // Primary Generation Action: Organelle 0xAB
  const handleGenerate = async () => {
    setIsGenerating(true);
    setMountStatus(null);
    try {
      const generated = await designer.generateVectorManifold(prompt);
      setManifold(generated);
      setReport(designer.latestReport);
      setMountStatus(
        `SUCCESS: Spline manifold verified & mounted! Merkle: ${designer.latestReport?.splineMerkleRoot} • Be <> Woken (0x01)`
      );
      onMapMutated?.();
    } catch (err) {
      console.error(err);
      setMountStatus('ERROR: Synthesis fault occurred.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Mount directly to active engine
  const handleMountToEngine = () => {
    if (!manifold) return;
    const archive = designer.sys_covalent_pack_vector_quadbit(
      manifold,
      manifold.wireframeEnemies,
      manifold.materials
    );
    designer.sys_covalent_mount_qbit_to_engine(archive, manifold);
    designer.sys_covalent_set_tristate_mode(0x01);
    setMountStatus('Live Ray-Tracer updated with vector spline manifold! Be <> Woken (0x01)');
    onMapMutated?.();
  };

  // Export .qbit binary
  const handleExportQbit = () => {
    if (!manifold) return;
    const archive = designer.sys_covalent_pack_vector_quadbit(
      manifold,
      manifold.wireframeEnemies,
      manifold.materials
    );
    const blob = new Blob([archive], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vector_manifold_${manifold.name.toLowerCase()}.qbit`;
    a.click();
    URL.revokeObjectURL(url);
    setMountStatus(`Exported .qbit vector archive (${archive.byteLength} bytes)`);
  };

  // 2D/3D Multi-Layer Spline Topology Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !manifold) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animAngle = 0;

    const render = () => {
      animAngle += 0.04;
      const w = canvas.width;
      const h = canvas.height;

      // Dark cybernetic canvas background with vector grid lines
      ctx.fillStyle = '#06090e';
      ctx.fillRect(0, 0, w, h);

      // Fine coordinate grid
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 1;
      const gridSize = 32 * zoomLevel;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Coordinate scaling: Map 0..1100 to canvas coordinates
      const scale = (Math.min(w, h) / 1150) * zoomLevel;
      const offsetX = 40;
      const offsetY = 40;

      const toScreen = (pt: { x: number; y: number }) => ({
        x: offsetX + pt.x * scale,
        y: offsetY + pt.y * scale,
      });

      // 1. Render Boundary Walls (Splines)
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#475569';
      for (const bound of manifold.boundarySplines) {
        ctx.beginPath();
        const p0 = toScreen({ x: q16ToInt(bound.p0.x), y: q16ToInt(bound.p0.y) });
        const p1 = toScreen({ x: q16ToInt(bound.p1.x), y: q16ToInt(bound.p1.y) });
        const p2 = toScreen({ x: q16ToInt(bound.p2.x), y: q16ToInt(bound.p2.y) });

        ctx.moveTo(p0.x, p0.y);
        ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);
        ctx.stroke();
      }

      // 2. Render Path Splines (with Overlapping Elevations)
      for (const path of manifold.pathSplines) {
        const isUpper = path.id.includes('SKYBRIDGE');
        if (layerFilter === 'GROUND' && isUpper) continue;
        if (layerFilter === 'SKYBRIDGE' && !isUpper) continue;

        const isSelected = selectedSplineId === path.id;

        // Draw swept hull buffer (radiance band)
        ctx.lineWidth = Math.max(8, q16ToInt(path.radius) * scale * 1.5);
        ctx.strokeStyle = isUpper ? 'rgba(245, 158, 11, 0.15)' : 'rgba(14, 165, 233, 0.15)';
        ctx.beginPath();
        const p0 = toScreen({ x: q16ToInt(path.p0.x), y: q16ToInt(path.p0.y) });
        const p1 = toScreen({ x: q16ToInt(path.p1.x), y: q16ToInt(path.p1.y) });
        const p2 = toScreen({ x: q16ToInt(path.p2.x), y: q16ToInt(path.p2.y) });
        ctx.moveTo(p0.x, p0.y);
        ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);
        ctx.stroke();

        // Core spline wire
        ctx.lineWidth = isSelected ? 4 : 2.5;
        ctx.strokeStyle = isUpper ? '#f59e0b' : '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);
        ctx.stroke();

        // Control point anchors
        ctx.fillStyle = isUpper ? '#fbbf24' : '#0284c7';
        ctx.fillRect(p1.x - 3, p1.y - 3, 6, 6);

        // Spline Label
        ctx.fillStyle = isUpper ? '#fef3c7' : '#e0f2fe';
        ctx.font = '10px monospace';
        ctx.fillText(path.label, p1.x + 8, p1.y - 4);
      }

      // 3. Render Dynamic Oscillating Blade Traps (Animated harmonic sweeps)
      if (layerFilter === 'ALL' || layerFilter === 'TRAPS') {
        for (const trap of manifold.dynamicTraps) {
          const sweepSin = Math.sin(animAngle * 2 + (trap.trapPhase || 0));
          const offset = sweepSin * 40;

          const p0 = toScreen({ x: q16ToInt(trap.p0.x), y: q16ToInt(trap.p0.y) });
          const p1 = toScreen({ x: q16ToInt(trap.p1.x) + offset, y: q16ToInt(trap.p1.y) });
          const p2 = toScreen({ x: q16ToInt(trap.p2.x), y: q16ToInt(trap.p2.y) });

          // Sweep zone shadow
          ctx.lineWidth = 14;
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);
          ctx.stroke();

          // Lethal blade spine
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);
          ctx.stroke();

          // Oscillating Blade tip
          ctx.fillStyle = '#fee2e2';
          ctx.beginPath();
          ctx.arc(p1.x, p1.y, 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#f87171';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(`⚡ ${trap.label}`, p1.x + 8, p1.y + 4);
        }
      }

      // 4. Player 1 and Be <> Spawn Points
      const playerPos = toScreen({
        x: q16ToInt(manifold.playerSpawn.x),
        y: q16ToInt(manifold.playerSpawn.y),
      });
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(playerPos.x, playerPos.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#d1fae5';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('P1 START', playerPos.x + 12, playerPos.y + 3);

      const bePos = toScreen({
        x: q16ToInt(manifold.beAgentSpawn.x),
        y: q16ToInt(manifold.beAgentSpawn.y),
      });
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(bePos.x, bePos.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#67e8f9';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#cffafe';
      ctx.fillText('Be <> WINGMAN', bePos.x + 12, bePos.y + 3);

      // Exit Beacon
      const exitPos = toScreen({
        x: q16ToInt(manifold.exitSanctum.x),
        y: q16ToInt(manifold.exitSanctum.y),
      });
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(exitPos.x, exitPos.y, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#f3e8ff';
      ctx.fillText('EXIT SANCTUM', exitPos.x + 12, exitPos.y + 3);

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [manifold, layerFilter, selectedSplineId, zoomLevel]);

  // Wireframe Daemon 3D Morphing Renderer
  useEffect(() => {
    const canvas = enemyCanvasRef.current;
    if (!canvas || !manifold || manifold.wireframeEnemies.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rot = 0;
    let animId = 0;

    const renderEnemy = () => {
      rot += 0.03;
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, w, h);

      const enemy = manifold.wireframeEnemies[activeEnemyTab] || manifold.wireframeEnemies[0];
      const cx = w / 2;
      const cy = h / 2;

      ctx.save();
      ctx.translate(cx, cy);

      // Render wireframe splines with 3D rotation projection
      const cosR = Math.cos(rot);
      const sinR = Math.sin(rot);

      for (const spline of enemy.splines) {
        ctx.strokeStyle = '#' + spline.colorRgb.toString(16).padStart(6, '0');
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        const SUBDIV = 10;
        for (let s = 0; s <= SUBDIV; s++) {
          const t = Math.round((s / SUBDIV) * 65536);
          const pt = sys_covalent_evaluate_bezier_3d(spline, t);

          // Relative to enemy center
          const rx = q16ToInt(pt.x - enemy.center.x);
          const ry = q16ToInt(pt.y - enemy.center.y);
          const rz = q16ToInt(pt.z - enemy.center.z);

          // Rotate around Z and Y axes
          const rotX = rx * cosR - ry * sinR;
          const rotY = rx * sinR * 0.5 + ry * cosR * 0.5 - rz * 0.8;

          const screenX = rotX * 2.2;
          const screenY = rotY * 2.2;

          if (s === 0) {
            ctx.moveTo(screenX, screenY);
          } else {
            ctx.lineTo(screenX, screenY);
          }
        }
        ctx.stroke();
      }

      ctx.restore();

      // Label & Stats
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px monospace';
      ctx.fillText(`TYPE: ${enemy.type} | HP: ${enemy.health}`, 12, h - 14);

      animId = requestAnimationFrame(renderEnemy);
    };

    renderEnemy();
    return () => cancelAnimationFrame(animId);
  }, [manifold, activeEnemyTab]);

  return (
    <div className="flex flex-col gap-5 text-stone-200 font-mono text-xs">
      {/* Organelle Badges & Identity Banner */}
      <div className="p-4 bg-stone-900/90 border border-cyan-800/60 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black text-black text-base shadow">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-stone-100 uppercase tracking-wide">
                Organelle 0xAB &amp; 0xAC // Autopoietic Vector Designer
              </span>
              <span className="text-[10px] px-1.5 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-600 rounded font-bold">
                Q16.16 BÉZIER MANIFOLD
              </span>
            </div>
            <p className="text-[11px] text-stone-400">
              Infinite-Resolution Vector Splines • Zero-Raster Wall SVGs • Extruded Wireframe Daemons • Dynamic Traps
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-950 border border-emerald-900/60 rounded text-emerald-400">
            <Shield className="w-3.5 h-3.5" />
            <span>Topological Proof: 1 ≡ 1</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-950 border border-cyan-900/60 rounded text-cyan-400">
            <Zap className="w-3.5 h-3.5" />
            <span>Be &lt;&gt; Wingman Active</span>
          </div>
        </div>
      </div>

      {/* 1. Creative Intent Studio Prompt & Presets */}
      <div className="p-4 bg-stone-900/70 border border-stone-800 rounded-xl flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-stone-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Creative Intent Specification (Organelle 0xAB_COVALENT)
          </span>
          <span className="text-[10px] text-stone-500">Autonomous Tensor Sieve Vector Unspooling</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe non-linear vector manifold, overlapping paths, dynamic traps..."
            className="flex-1 px-3 py-2 bg-stone-950 border border-stone-700 rounded-lg text-stone-200 text-xs focus:outline-none focus:border-cyan-500 font-mono shadow-inner"
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow ${
              isGenerating
                ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                : 'bg-cyan-500 hover:bg-cyan-400 text-black cursor-pointer'
            }`}
          >
            {isGenerating ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Unspooling...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Unspool Creative Intent</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] text-stone-500 font-bold uppercase">Presets:</span>
          {PRESET_INTENTS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setPrompt(p)}
              className="px-2 py-0.5 bg-stone-950 hover:bg-stone-800 border border-stone-800 rounded text-[10px] text-stone-300 truncate max-w-[260px] text-left transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left = Spline Viewport, Right = Vector Textures & Wireframe Daemons */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: 2D/3D Vector Spline Multi-Layer Canvas */}
        <div className="lg:col-span-7 flex flex-col gap-3 bg-stone-900/60 border border-stone-800 p-3.5 rounded-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800/80 pb-2">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-stone-200">Vector Spline Topology &amp; Overlapping Elevations</span>
            </div>

            {/* Layer Filter Buttons */}
            <div className="flex items-center gap-1 bg-stone-950 p-0.5 rounded border border-stone-800">
              {(['ALL', 'GROUND', 'SKYBRIDGE', 'TRAPS'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLayerFilter(l)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                    layerFilter === l
                      ? 'bg-cyan-900 text-cyan-200'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Spline Canvas */}
          <div className="relative w-full aspect-[4/3] bg-stone-950 rounded-lg border border-stone-800 overflow-hidden flex items-center justify-center shadow-inner">
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="w-full h-full object-contain"
            />
            {/* Viewport Overlay Tag */}
            <div className="absolute top-2 left-2 px-2 py-1 bg-stone-900/80 border border-stone-700/60 rounded text-[10px] text-stone-400 pointer-events-none flex items-center gap-2">
              <span className="text-cyan-400 font-bold">● Ground (Cyan)</span>
              <span className="text-amber-400 font-bold">● Skybridge (Amber)</span>
              <span className="text-red-400 font-bold">● Rotary Traps (Red)</span>
            </div>

            <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-stone-900/80 p-1 rounded border border-stone-800">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                className="px-2 py-0.5 bg-stone-950 hover:bg-stone-800 text-stone-300 rounded font-bold text-xs"
              >
                -
              </button>
              <span className="text-[10px] text-stone-400 px-1">{Math.round(zoomLevel * 100)}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.2))}
                className="px-2 py-0.5 bg-stone-950 hover:bg-stone-800 text-stone-300 rounded font-bold text-xs"
              >
                +
              </button>
            </div>
          </div>

          {/* Dynamic Splines List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1">
            {manifold?.pathSplines.map((path) => (
              <button
                key={path.id}
                onClick={() => setSelectedSplineId(path.id)}
                className={`p-2 rounded border text-left flex flex-col gap-0.5 transition-colors ${
                  selectedSplineId === path.id
                    ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200'
                    : 'bg-stone-950 border-stone-800 hover:border-stone-700 text-stone-300'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span>{path.label}</span>
                  <span className="text-[10px] text-stone-500 font-mono">r={q16ToInt(path.radius)}u</span>
                </div>
                <div className="text-[10px] text-stone-400 font-mono truncate">
                  P0:({q16ToInt(path.p0.x)},{q16ToInt(path.p0.y)},{q16ToInt(path.p0.z)}) → P2:({q16ToInt(path.p2.x)},{q16ToInt(path.p2.y)},{q16ToInt(path.p2.z)})
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Infinite-Resolution Procedural Materials & Extruded Wireframes */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Procedural Vector Textures (SVGs / Gradients) */}
          <div className="bg-stone-900/60 border border-stone-800 p-3.5 rounded-xl flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-stone-800/80 pb-2">
              <span className="font-bold text-stone-200 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-400" />
                Procedural Vector Materials (Zero-Raster)
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">∞ RESOLUTION</span>
            </div>

            {/* Material Selector Tabs */}
            <div className="flex items-center gap-1 bg-stone-950 p-1 rounded border border-stone-800">
              {manifold?.materials.map((mat, idx) => (
                <button
                  key={mat.name}
                  onClick={() => setSelectedMaterialIdx(idx)}
                  className={`flex-1 py-1 rounded text-[10px] font-bold truncate transition-colors ${
                    selectedMaterialIdx === idx
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {mat.name.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            {/* Material Preview Card */}
            {manifold && manifold.materials[selectedMaterialIdx] && (
              <div className="flex flex-col gap-2 bg-stone-950 p-2.5 rounded-lg border border-stone-800">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-stone-300">
                    {manifold.materials[selectedMaterialIdx].name}
                  </span>
                  <span className="text-[10px] text-stone-500">
                    Type: {manifold.materials[selectedMaterialIdx].type}
                  </span>
                </div>

                {/* SVG Render Preview with Magnification */}
                <div className="relative w-full h-32 bg-stone-950 rounded border border-stone-800 overflow-hidden flex items-center justify-center">
                  <div
                    className="w-full h-full flex items-center justify-center transition-transform duration-200"
                    style={{ transform: `scale(${materialZoom / 16})` }}
                    dangerouslySetInnerHTML={{
                      __html: manifold.materials[selectedMaterialIdx].svgMarkup,
                    }}
                  />
                  <div className="absolute top-2 right-2 text-[10px] bg-stone-900/90 px-1.5 py-0.5 rounded border border-stone-700 text-stone-400">
                    {materialZoom}x Magnification
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-stone-400 font-bold">Zoom:</span>
                  <input
                    type="range"
                    min={4}
                    max={64}
                    value={materialZoom}
                    onChange={(e) => setMaterialZoom(Number(e.target.value))}
                    className="flex-1 accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Extruded Entity Hulls (Hostile Vector Wireframe Daemons) */}
          <div className="bg-stone-900/60 border border-stone-800 p-3.5 rounded-xl flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-stone-800/80 pb-2">
              <span className="font-bold text-stone-200 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-red-400" />
                Extruded Vector Daemons (Spline Cages)
              </span>
              <span className="text-[10px] text-red-400 font-mono">MORPHING WIREFRAMES</span>
            </div>

            {/* Entity Selector Tabs */}
            <div className="flex items-center gap-1 bg-stone-950 p-1 rounded border border-stone-800">
              {manifold?.wireframeEnemies.map((enemy, idx) => (
                <button
                  key={enemy.id}
                  onClick={() => setActiveEnemyTab(idx)}
                  className={`flex-1 py-1 rounded text-[10px] font-bold truncate transition-colors ${
                    activeEnemyTab === idx
                      ? 'bg-red-950 text-red-300 border border-red-600'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {enemy.name.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* 3D Wireframe Canvas */}
            <div className="relative w-full h-36 bg-stone-950 rounded-lg border border-stone-800 overflow-hidden flex items-center justify-center shadow-inner">
              <canvas
                ref={enemyCanvasRef}
                width={320}
                height={160}
                className="w-full h-full object-contain"
              />
              <div className="absolute top-2 right-2 text-[10px] text-stone-500 bg-stone-900/80 px-1.5 py-0.5 rounded border border-stone-800">
                Rotating Spline Spine
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Be <> Spline Manifold Referee Verification Report (1 === 1) */}
      <div
        className={`p-4 rounded-xl border flex flex-col gap-2.5 transition-colors ${
          report?.isValid
            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
            : 'bg-red-950/20 border-red-500/40 text-red-300'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-900/40 pb-2">
          <div className="flex items-center gap-2">
            {report?.isValid ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <div>
              <div className="font-bold text-sm uppercase tracking-wide">
                {report?.isValid
                  ? 'Be <> Spline Referee: Manifold Verified Contiguous (1 ≡ 1)'
                  : 'Be <> Spline Referee: Topological Fault Detected'}
              </div>
              <div className="text-[11px] text-stone-400 font-mono">
                Cryptographic Merkle Root: <strong>{report?.splineMerkleRoot}</strong> • Pacing:{' '}
                <strong>{report?.ludicPacingRating}</strong>
              </div>
            </div>
          </div>

          {/* Action Mount and Download Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportQbit}
              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded-lg font-bold text-xs flex items-center gap-1.5 text-stone-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export .qbit</span>
            </button>

            <button
              onClick={handleMountToEngine}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Mount to Live Engine &amp; Wake Be &lt;&gt;</span>
            </button>

            {onSwitchToGame && (
              <button
                onClick={onSwitchToGame}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Test in Full Screen</span>
              </button>
            )}
          </div>
        </div>

        {/* Verification Stat Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
          <div className="bg-stone-950/80 p-2 rounded border border-stone-800">
            <span className="text-stone-500">CLEARANCE RADIUS</span>
            <div className="font-bold text-stone-200">{report?.minClearanceRadius} units (Passed)</div>
          </div>
          <div className="bg-stone-950/80 p-2 rounded border border-stone-800">
            <span className="text-stone-500">OVERLAPPING ELEVATIONS</span>
            <div className="font-bold text-amber-400">{report?.overlappingElevationsCount} Tiers (Skybridge)</div>
          </div>
          <div className="bg-stone-950/80 p-2 rounded border border-stone-800">
            <span className="text-stone-500">DYNAMIC BLADE TRAPS</span>
            <div className="font-bold text-red-400">{report?.dynamicTrapsVerified} Active Pendulums</div>
          </div>
          <div className="bg-stone-950/80 p-2 rounded border border-stone-800">
            <span className="text-stone-500">COPLAY WINGMAN</span>
            <div className="font-bold text-cyan-400">Tri-State: 0x01 (Woken)</div>
          </div>
        </div>

        {mountStatus && (
          <div className="text-[11px] font-bold text-cyan-300 mt-1 bg-cyan-950/40 p-2 rounded border border-cyan-800/40">
            {mountStatus}
          </div>
        )}
      </div>
    </div>
  );
};
