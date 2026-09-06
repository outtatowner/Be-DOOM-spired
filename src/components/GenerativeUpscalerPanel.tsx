/**
 * @file GenerativeUpscalerPanel.tsx
 * @brief Organelle 0x9C_COVALENT: Integer-Quantized Tensor Sieve & Generative Assimilation Matrix
 * @description Controls the 3 modalities: Vision (PBR 1024x1024), Acoustic (48kHz Spatial HRTF), Kinetic (C-Kernel Macros)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Layers,
  Volume2,
  Cpu,
  RefreshCw,
  CheckCircle,
  Eye,
  Sliders,
  Play,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import {
  GenerativeUpscaleOfficiator,
  GenerativeTelemetry,
} from '../organelles/node_0xGENERATIVE_UPSCALER';
import { CovalentRTEngine } from '../organelles/node_0x94_covalent_rt_engine';

interface Props {
  engine: CovalentRTEngine;
}

export const GenerativeUpscalerPanel: React.FC<Props> = ({ engine }) => {
  const upscaler = engine.generativeUpscaler;
  const [telemetry, setTelemetry] = useState<GenerativeTelemetry>(upscaler.telemetry);
  const [selectedTexture, setSelectedTexture] = useState<'STARTAN3' | 'COMP2' | 'TEKWALL4' | 'NUKAGE3'>('STARTAN3');
  const [activeViewMode, setActiveViewMode] = useState<'albedo' | 'normals' | 'roughness' | 'legacy'>('albedo');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const unsub = upscaler.subscribe((t) => {
      setTelemetry({ ...t });
    });
    return unsub;
  }, [upscaler]);

  // Render texture preview on the canvas
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pbr = upscaler.getPbrMaterial(selectedTexture);
    const size = 128; // Downsampled preview for responsive display
    canvas.width = size;
    canvas.height = size;
    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    if (!pbr || activeViewMode === 'legacy') {
      // Draw legacy 64x64 style
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const sampleU = Math.floor((x / size) * 64) << 16;
          const sampleV = Math.floor((y / size) * 64) << 16;
          const col = engine.textureMapper.sampleTextureRGB(selectedTexture, sampleU, sampleV);
          const idx = (y * size + x) * 4;
          data[idx] = (col >> 16) & 0xff;
          data[idx + 1] = (col >> 8) & 0xff;
          data[idx + 2] = col & 0xff;
          data[idx + 3] = 255;
        }
      }
    } else {
      const step = pbr.width / size;
      for (let y = 0; y < size; y++) {
        const srcY = Math.floor(y * step);
        for (let x = 0; x < size; x++) {
          const srcX = Math.floor(x * step);
          const pbrIdx = srcY * pbr.width + srcX;
          const outIdx = (y * size + x) * 4;

          if (activeViewMode === 'albedo') {
            const c = pbr.albedoBuffer[pbrIdx];
            data[outIdx] = (c >> 16) & 0xff;
            data[outIdx + 1] = (c >> 8) & 0xff;
            data[outIdx + 2] = c & 0xff;
            data[outIdx + 3] = 255;
          } else if (activeViewMode === 'normals') {
            // Visualize Q16.16 normal vectors as RGB (0.5 + N/2)
            const nx = pbr.normalXBuffer[pbrIdx] / 65536;
            const ny = pbr.normalYBuffer[pbrIdx] / 65536;
            const nz = (pbr.normalZBuffer[pbrIdx] || 65536) / 65536;
            data[outIdx] = Math.min(255, Math.max(0, Math.round((nx * 0.5 + 0.5) * 255)));
            data[outIdx + 1] = Math.min(255, Math.max(0, Math.round((ny * 0.5 + 0.5) * 255)));
            data[outIdx + 2] = Math.min(255, Math.max(0, Math.round((nz * 0.5 + 0.5) * 255)));
            data[outIdx + 3] = 255;
          } else if (activeViewMode === 'roughness') {
            // Roughness grayscale
            const rough = (pbr.roughnessBuffer[pbrIdx] / 65536) * 255;
            data[outIdx] = rough;
            data[outIdx + 1] = rough;
            data[outIdx + 2] = rough;
            data[outIdx + 3] = 255;
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }, [upscaler, selectedTexture, activeViewMode, telemetry]);

  const handleSynthesize = async () => {
    setIsSynthesizing(true);
    await upscaler.synthesizeMaterial(selectedTexture);
    setTimeout(() => setIsSynthesizing(false), 300);
  };

  const handleTestAudioBounce = () => {
    setIsAudioPlaying(true);
    // Use center ray bounce or default 450 units
    upscaler.synthesizeSpatialHrtf(engine.currentWeapon, 540, 25);
    setTimeout(() => setIsAudioPlaying(false), 450);
  };

  return (
    <div id="generative-upscaler-matrix" className="bg-stone-900 border border-stone-800 rounded-lg p-4 font-mono text-stone-200 flex flex-col gap-4 shadow-lg">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-stone-800 pb-2.5 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-stone-100 flex items-center gap-1.5">
              <span>0x9C_COVALENT: Integer-Quantized Tensor Sieve</span>
            </div>
            <p className="text-[11px] text-stone-400">
              Generative Assimilation Matrix (Vision • Acoustic • Kinetic)
            </p>
          </div>
        </div>

        {/* Master PBR Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => upscaler.togglePbrActive()}
            className={`px-3 py-1 rounded text-xs font-bold border transition-colors flex items-center gap-1.5 ${
              telemetry.pbrActive
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80 shadow-inner'
                : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>PBR SUPER-RES: {telemetry.pbrActive ? 'ENGAGED' : 'LEGACY 8-BIT'}</span>
          </button>
        </div>
      </div>

      {/* 3-Modality Assimilation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        {/* Modality 1: Vision */}
        <div className="bg-stone-950 border border-stone-800/80 rounded-lg p-3 flex flex-col justify-between gap-2.5">
          <div>
            <div className="flex items-center justify-between border-b border-stone-800/60 pb-1 mb-2">
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> 1. VISION (Image)
              </span>
              <span className="text-[10px] text-stone-400">1024x1024 PBR</span>
            </div>
            <p className="text-[11px] text-stone-400 leading-snug mb-2">
              64x64 8-bit patch elevated to Q16.16 Albedo, Normal &amp; Roughness matrices.
            </p>

            {/* Texture Selector */}
            <div className="grid grid-cols-4 gap-1 mb-2">
              {(['STARTAN3', 'COMP2', 'TEKWALL4', 'NUKAGE3'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTexture(t)}
                  className={`px-1 py-0.5 rounded text-[10px] font-bold border truncate transition-colors ${
                    selectedTexture === t
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                      : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Preview Canvas with Map Channels */}
            <div className="flex items-center gap-3">
              <div className="relative border border-stone-800 rounded bg-black p-0.5 shrink-0">
                <canvas
                  ref={previewCanvasRef}
                  className="w-20 h-20 rounded image-render-pixelated block"
                />
              </div>

              <div className="flex flex-col gap-1 text-[10px] flex-1">
                {(['albedo', 'normals', 'roughness', 'legacy'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setActiveViewMode(mode)}
                    className={`px-2 py-0.5 rounded text-left border capitalize font-mono transition-colors ${
                      activeViewMode === mode
                        ? 'bg-stone-800 text-cyan-300 border-stone-700 font-bold'
                        : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-300'
                    }`}
                  >
                    {mode === 'legacy' ? '64x64 8-Bit' : mode}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleSynthesize}
            disabled={isSynthesizing}
            className="w-full py-1.5 bg-amber-950/80 hover:bg-amber-900 active:bg-amber-800 border border-amber-700/60 rounded text-[11px] font-bold text-amber-200 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isSynthesizing ? 'animate-spin' : ''}`} />
            <span>SYNTHESIZE MATRIX</span>
          </button>
        </div>

        {/* Modality 2: Acoustic */}
        <div className="bg-stone-950 border border-stone-800/80 rounded-lg p-3 flex flex-col justify-between gap-2.5">
          <div>
            <div className="flex items-center justify-between border-b border-stone-800/60 pb-1 mb-2">
              <span className="text-cyan-400 font-bold flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5" /> 2. ACOUSTIC (Audio)
              </span>
              <span className="text-[10px] text-stone-400">48kHz HRTF</span>
            </div>
            <p className="text-[11px] text-stone-400 leading-snug mb-2">
              Ray-traced acoustic bounce wave with wall impulse reverb and binaural delay.
            </p>

            <div className="bg-stone-900 border border-stone-800/80 rounded p-2 flex flex-col gap-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-stone-400">Sample Rate:</span>
                <span className="text-cyan-300 font-bold">48,000 Hz</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Ray Bounce Latency:</span>
                <span className="text-amber-300 font-bold">
                  {telemetry.lastAcousticTelemetry ? `${telemetry.lastAcousticTelemetry.latencyMs} ms` : '15 ms'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Wall Absorption:</span>
                <span className="text-stone-200">
                  {telemetry.lastAcousticTelemetry ? `${Math.round((1 - telemetry.lastAcousticTelemetry.reverbDecay) * 100)}%` : '35%'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Binaural Panning:</span>
                <span className="text-emerald-400">
                  {telemetry.lastAcousticTelemetry ? `${Math.round(telemetry.lastAcousticTelemetry.pan * 100)}%` : 'Center'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleTestAudioBounce}
            disabled={isAudioPlaying}
            className="w-full py-1.5 bg-cyan-950/80 hover:bg-cyan-900 active:bg-cyan-800 border border-cyan-700/60 rounded text-[11px] font-bold text-cyan-200 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Play className={`w-3 h-3 ${isAudioPlaying ? 'animate-pulse' : ''}`} />
            <span>TEST RAY-BOUNCE AUDIO</span>
          </button>
        </div>

        {/* Modality 3: Kinetic */}
        <div className="bg-stone-950 border border-stone-800/80 rounded-lg p-3 flex flex-col justify-between gap-2.5">
          <div>
            <div className="flex items-center justify-between border-b border-stone-800/60 pb-1 mb-2">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5" /> 3. KINETIC (Code)
              </span>
              <span className="text-[10px] text-stone-400">C-Kernel Macros</span>
            </div>
            <p className="text-[11px] text-stone-400 leading-snug mb-2">
              Autonomous behavioral macros replacing static enemy loops with dynamic flanking.
            </p>

            <div className="bg-stone-900 border border-stone-800/80 rounded p-2 flex flex-col gap-1 text-[10px]">
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Active Macro:</span>
                <span className="text-emerald-300 font-bold">
                  {telemetry.lastKineticMacro ? telemetry.lastKineticMacro.macroName : 'MACRO_FLANK_ANGULAR_OFFSET'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Flank Angle:</span>
                <span className="text-cyan-300 font-bold">
                  {telemetry.lastKineticMacro ? `${telemetry.lastKineticMacro.flankAngleDeg}°` : '45°'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Ray Probe Cover:</span>
                <span className="text-amber-300 font-bold">
                  {telemetry.lastKineticMacro?.coverProbeActive ? 'ENGAGED' : 'READY'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Tactical Stasis:</span>
                <span className="text-emerald-400 font-bold">OPTIMAL (dV/dt &le; 0)</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              upscaler.generateKineticBehaviorMacros('IMP', 240 << 16, true);
            }}
            className="w-full py-1.5 bg-emerald-950/80 hover:bg-emerald-900 active:bg-emerald-800 border border-emerald-700/60 rounded text-[11px] font-bold text-emerald-200 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Zap className="w-3 h-3" />
            <span>TRIGGER KINETIC MACRO</span>
          </button>
        </div>
      </div>

      {/* Quipu Ledger Binding & Lyapunov Dissipation Status */}
      <div className="pt-2 border-t border-stone-800 flex flex-wrap items-center justify-between text-[11px] text-stone-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Quipu Root: <strong className="font-mono text-stone-200">{telemetry.quipuHashRoot}</strong></span>
          </span>
          <span>
            Upscaled Materials: <strong className="text-cyan-300">{telemetry.materialsUpscaled}</strong>
          </span>
          <span>
            Acoustic Bounces: <strong className="text-amber-300">{telemetry.acousticBounceCount}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-stone-400">Thermodynamic State:</span>
          <span className="font-mono font-bold text-emerald-400">
            dV/dt = {telemetry.dVdt_State.toFixed(2)} (Dissipative Cooling)
          </span>
        </div>
      </div>
    </div>
  );
};
