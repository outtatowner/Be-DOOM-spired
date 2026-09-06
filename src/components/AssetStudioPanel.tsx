/**
 * @file AssetStudioPanel.tsx
 * @brief Organelle 0xA3_COVALENT: Asset Studio UI Shard & Native .qbit Ingestion
 * @provenance Parent: Zuma_QUIPU & Forge Evolutionary Branch
 * @invariants 1 === 1, CORDIC Bit-Shift Ray Intersection, Continuous Lyapunov Dissipation
 */

import React, { useState } from 'react';
import {
  QuadbitAssetStudio,
  CompiledQuadbitArchive,
  convertQuadbitMapToRTDoomMap,
  testCordicOctreeRayIntersection,
} from '../organelles/node_0xASSET_STUDIO';
import { CovalentRTEngine } from '../organelles/node_0x94_covalent_rt_engine';
import { RTDoomMap } from '../organelles/node_0x95_covalent_doom_wad_parser';
import { q16Vec3FromInt, q16Vec3Normalize } from '../organelles/q16_cordic';
import {
  Box,
  Layers,
  Sparkles,
  Download,
  Upload,
  Cpu,
  Shield,
  Binary,
  Flame,
  Check,
  Play,
  RotateCw,
  Crosshair,
  Database,
  FileCode,
} from 'lucide-react';

interface AssetStudioPanelProps {
  engine: CovalentRTEngine;
  onMapLoaded: (newMap: RTDoomMap) => void;
}

const PRESET_INTENTS = [
  {
    label: 'Subterranean Bunker & Chrome Marine',
    map: 'Subterranean ferro-concrete bunker with axial crossfire corridor and warning beacons',
    avatar: 'Chrome-visored tactical marine, emissive blue telemetry lines, PBR',
  },
  {
    label: 'Obsidian Citadel & Plasma Brute',
    map: 'Non-convex obsidian citadel with dual elevated chicanes and toxic moat',
    avatar: 'Cybernetic biomechanical brute with plasma accumulator, heavy armor',
  },
  {
    label: 'Basalt Cathedral & Hazard Inquisitor',
    map: 'Cathedral of the Unbound with floating basalt octagons and emissive reactors',
    avatar: 'Heavy hazard suit inquisitor with copper shoulder reactors, PBR',
  },
];

export const AssetStudioPanel: React.FC<AssetStudioPanelProps> = ({ engine, onMapLoaded }) => {
  const [studio] = useState(() => new QuadbitAssetStudio());
  const [mapIntent, setMapIntent] = useState(PRESET_INTENTS[0].map);
  const [avatarIntent, setAvatarIntent] = useState(PRESET_INTENTS[0].avatar);
  const [isCompiling, setIsCompiling] = useState(false);
  const [archive, setArchive] = useState<CompiledQuadbitArchive | null>(null);
  const [activeTab, setActiveTab] = useState<'matrix' | 'octree' | 'materials' | 'cordic'>('matrix');
  const [ingested, setIngested] = useState(false);

  // Compile Native .qbit Archive
  const handleCompile = async () => {
    setIsCompiling(true);
    setIngested(false);
    try {
      await studio.compileNativeArchive(mapIntent, avatarIntent);
      setArchive(studio.getLastArchive());
    } catch (e) {
      console.error('[ ASSET STUDIO ] Compilation failed:', e);
    } finally {
      setIsCompiling(false);
    }
  };

  // Stage & Ingest into Ray-Tracer
  const handleIngest = () => {
    if (!archive) return;
    const rtMap = convertQuadbitMapToRTDoomMap(archive.map, archive.materials);
    onMapLoaded(rtMap);
    setIngested(true);
  };

  // Export .qbit binary
  const handleDownload = () => {
    if (!archive) return;
    const blob = new Blob([archive.binary], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `covalent_${archive.map.name.toLowerCase()}.qbit`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Live CORDIC bit-shift simulation
  const testRayHit = archive?.avatar.octreeNodes[0]
    ? testCordicOctreeRayIntersection(
        archive.avatar.octreeNodes[0],
        q16Vec3FromInt(0, -96, 32),
        q16Vec3Normalize(q16Vec3FromInt(0, 96, 0))
      )
    : null;

  return (
    <section
      id="asset-studio-panel"
      className="bg-stone-900/90 border border-stone-800 rounded-xl p-4 md:p-5 flex flex-col gap-4 font-mono shadow-xl relative overflow-hidden"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-950 border border-cyan-700/60 flex items-center justify-center text-cyan-400 shadow-inner">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm md:text-base font-black tracking-wider text-stone-100 uppercase">
                ORGANELLE 0xA2 &amp; 0xA3 // THE QUADBIT DATA SIEVE &amp; ASSET STUDIO
              </h2>
              <span className="text-[10px] px-2 py-0.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded font-bold">
                .QBIT NATIVE ARCHIVE
              </span>
            </div>
            <p className="text-xs text-stone-400">
              BVH Voxel Octrees • 1024x1024 Quantized PBR Integer Maps • CORDIC Bit-Shift Intersections
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-2 text-xs">
          <div className="px-2.5 py-1 bg-stone-950 border border-stone-800 rounded text-stone-300 flex items-center gap-1.5">
            <Binary className="w-3.5 h-3.5 text-cyan-400" />
            <span>MAGIC: 0x51424954</span>
          </div>
          {archive && (
            <div className="px-2.5 py-1 bg-emerald-950/60 border border-emerald-800/80 rounded text-emerald-300 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>CHECKSUM: 0x{archive.topologicalChecksum.toString(16).toUpperCase()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Semantic Description Inputs & Presets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Input Prompts */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-stone-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                XY LEVEL MAP INTENT (Generates Q16.16 Wall Planes &amp; Sectors)
              </span>
              <span className="text-[10px] text-stone-500 font-normal">Replaces VERTEXES &amp; LINEDEFS</span>
            </label>
            <input
              type="text"
              value={mapIntent}
              onChange={(e) => setMapIntent(e.target.value)}
              placeholder="Describe level architecture, geometry, chicanes..."
              className="w-full px-3 py-2 bg-stone-950 border border-stone-700/80 rounded-lg text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-stone-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                3D AVATAR VOXEL INTENT (Generates Spatial Octree &amp; Emissive Materials)
              </span>
              <span className="text-[10px] text-stone-500 font-normal">Replaces THINGS &amp; 2D Sprites</span>
            </label>
            <input
              type="text"
              value={avatarIntent}
              onChange={(e) => setAvatarIntent(e.target.value)}
              placeholder="Describe entity appearance, visor, emissive lines..."
              className="w-full px-3 py-2 bg-stone-950 border border-stone-700/80 rounded-lg text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[10px] text-stone-500 font-bold uppercase">Presets:</span>
            {PRESET_INTENTS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setMapIntent(p.map);
                  setAvatarIntent(p.avatar);
                }}
                className="text-[11px] px-2.5 py-1 bg-stone-950 hover:bg-stone-800 border border-stone-700 rounded text-stone-300 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-2.5 bg-stone-950/80 p-3 rounded-lg border border-stone-800/80">
          <div className="text-[11px] text-stone-400 leading-relaxed">
            Synthesizes raw voxel octrees and integer PBR textures, packing into mathematically rigid <strong className="text-cyan-300">.qbit</strong> nodes for pure CORDIC ray intersections.
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleCompile}
              disabled={isCompiling}
              className="w-full py-2 px-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-black text-xs rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              {isCompiling ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>COMPILING QUADBIT ARCHIVE...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>COMPILE NATIVE .QBIT ARCHIVE</span>
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleIngest}
                disabled={!archive}
                className={`py-1.5 px-2 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all ${
                  ingested
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                    : archive
                    ? 'bg-stone-900 hover:bg-stone-800 text-stone-100 border-stone-700'
                    : 'bg-stone-950 text-stone-600 border-stone-800 cursor-not-allowed'
                }`}
              >
                {ingested ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Play className="w-3.5 h-3.5 text-amber-400" />}
                <span>{ingested ? 'INGESTED' : 'STAGE & INGEST'}</span>
              </button>

              <button
                onClick={handleDownload}
                disabled={!archive}
                className="py-1.5 px-2 text-xs font-bold bg-stone-900 hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed text-stone-100 border border-stone-700 rounded-lg flex items-center justify-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>EXPORT .QBIT</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs for Detailed Inspector */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pt-2 pb-2">
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1 rounded font-bold transition-all ${
              activeTab === 'matrix' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            GENERATION MATRIX
          </button>
          <button
            onClick={() => setActiveTab('octree')}
            className={`px-3 py-1 rounded font-bold transition-all ${
              activeTab === 'octree' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            VOXEL OCTREE (0xA2)
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`px-3 py-1 rounded font-bold transition-all ${
              activeTab === 'materials' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            1024x1024 PBR MATRIX
          </button>
          <button
            onClick={() => setActiveTab('cordic')}
            className={`px-3 py-1 rounded font-bold transition-all ${
              activeTab === 'cordic' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            CORDIC BIT-SHIFT INTERSECT
          </button>
        </div>

        {archive && (
          <div className="text-[11px] text-stone-400 font-mono">
            Payload: <span className="text-cyan-300 font-bold">{archive.byteLength} Bytes</span> • Mass:{' '}
            <span className="text-amber-300 font-bold">{archive.thermodynamicMass} Q16</span>
          </div>
        )}
      </div>

      {/* Tab 1: The Asset Studio Generation Matrix */}
      {activeTab === 'matrix' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Tile 1: 3D Avatars (Entities) */}
          <div className="bg-stone-950 p-3.5 rounded-lg border border-cyan-900/40 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px] border-b border-stone-800 pb-1.5">
              <span className="text-stone-300 font-bold flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                3D AVATARS (ENTITIES)
              </span>
              <span className="text-[10px] text-cyan-300 font-mono">avatar_offset</span>
            </div>
            <div className="text-stone-400 text-[11px] leading-relaxed">
              Voxelized spatial octrees with embedded emissive materials. Bypasses 2D billboard sprites.
            </div>
            <div className="mt-auto pt-2 border-t border-stone-900 flex flex-col gap-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-stone-500">Binary Target:</span>
                <span className="text-stone-300 font-bold">avatar_offset (Replaces THINGS)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Bounding Cylinder:</span>
                <span className="text-cyan-300 font-bold">R=32, H=64 (Q16.16)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Friction Mass:</span>
                <span className="text-amber-300 font-bold">{archive ? `${archive.thermodynamicMass} μ` : '42000 μ'}</span>
              </div>
            </div>
          </div>

          {/* Tile 2: PBR Textures */}
          <div className="bg-stone-950 p-3.5 rounded-lg border border-cyan-900/40 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px] border-b border-stone-800 pb-1.5">
              <span className="text-stone-300 font-bold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                PBR TEXTURES
              </span>
              <span className="text-[10px] text-amber-300 font-mono">material_offset</span>
            </div>
            <div className="text-stone-400 text-[11px] leading-relaxed">
              Quantized 1024x1024 Albedo, Normal, and Roughness integer maps. Replaces FLATS &amp; paletted patches.
            </div>
            <div className="mt-auto pt-2 border-t border-stone-900 flex flex-col gap-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-stone-500">Binary Target:</span>
                <span className="text-stone-300 font-bold">material_offset (Replaces FLATS)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Resolution:</span>
                <span className="text-emerald-300 font-bold">1024 x 1024 Integer Maps</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Channels:</span>
                <span className="text-stone-300 font-bold">Albedo / Normal / Roughness</span>
              </div>
            </div>
          </div>

          {/* Tile 3: XY Level Maps */}
          <div className="bg-stone-950 p-3.5 rounded-lg border border-cyan-900/40 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px] border-b border-stone-800 pb-1.5">
              <span className="text-stone-300 font-bold flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
                XY LEVEL MAPS
              </span>
              <span className="text-[10px] text-emerald-300 font-mono">map_offset</span>
            </div>
            <div className="text-stone-400 text-[11px] leading-relaxed">
              Q16.16 sector boundary constraints and non-convex wall planes. Replaces VERTEXES and LINEDEFS.
            </div>
            <div className="mt-auto pt-2 border-t border-stone-900 flex flex-col gap-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-stone-500">Binary Target:</span>
                <span className="text-stone-300 font-bold">map_offset (Replaces LINEDEFS)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Wall Planes:</span>
                <span className="text-cyan-300 font-bold">{archive ? archive.map.wallPlanes.length : 8} Planes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Z-Bounds:</span>
                <span className="text-stone-300 font-bold">Z &isin; [0, 144] Q16</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Voxel Octree Nodes */}
      {activeTab === 'octree' && (
        <div className="bg-stone-950 p-3 rounded-lg border border-stone-800 flex flex-col gap-2 text-xs">
          <div className="flex items-center justify-between text-[11px] text-stone-400 border-b border-stone-800 pb-1.5">
            <span>VOXEL OCTREE SPATIAL HIERARCHY (Root + 8 Child Octants)</span>
            <span className="text-cyan-300 font-bold">{archive?.avatar.octreeNodes.length || 9} Nodes Active</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {(archive?.avatar.octreeNodes || []).map((node) => (
              <div key={node.id} className="bg-stone-900/80 p-2.5 rounded border border-stone-800 flex flex-col gap-1 text-[11px]">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-stone-200">Octant #{node.id}</span>
                  <span className={node.isLeaf ? 'text-emerald-400' : 'text-cyan-400'}>
                    {node.isLeaf ? 'LEAF VOXEL' : 'OCTREE ROOT'}
                  </span>
                </div>
                <div className="text-stone-500 text-[10px]">
                  Bounds: [{node.minBounds[0] >> 16}, {node.minBounds[1] >> 16}, {node.minBounds[2] >> 16}] &rarr; [
                  {node.maxBounds[0] >> 16}, {node.maxBounds[1] >> 16}, {node.maxBounds[2] >> 16}]
                </div>
                <div className="flex items-center justify-between text-[10px] mt-1 pt-1 border-t border-stone-800">
                  <span className="text-stone-400">Density:</span>
                  <span className="text-amber-300 font-bold">{node.voxelDensity}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: 1024x1024 PBR Materials */}
      {activeTab === 'materials' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {(archive?.materials || []).map((mat) => (
            <div key={mat.materialId} className="bg-stone-950 p-3 rounded-lg border border-stone-800 flex flex-col gap-2">
              <div className="flex items-center justify-between font-bold text-[11px]">
                <span className="text-stone-200">{mat.name}</span>
                <span className="text-cyan-300">ID: {mat.materialId}</span>
              </div>
              <div className="flex items-center gap-3 py-2">
                <div
                  className="w-12 h-12 rounded border border-stone-700 shrink-0 shadow-inner flex items-center justify-center text-[10px] font-bold"
                  style={{ backgroundColor: `#${mat.averageColor.toString(16).padStart(6, '0')}` }}
                >
                  PBR
                </div>
                <div className="flex flex-col text-[10px] text-stone-400 gap-0.5">
                  <div>Resolution: <strong className="text-stone-200">1024 x 1024</strong></div>
                  <div>Albedo: <strong className="text-stone-200">Quantized 8-Bit</strong></div>
                  <div>Normal: <strong className="text-stone-200">Q16 Perturbation</strong></div>
                  <div>Roughness: <strong className="text-stone-200">Specular Array</strong></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: CORDIC Bit-Shift Ray Intersection */}
      {activeTab === 'cordic' && (
        <div className="bg-stone-950 p-3.5 rounded-lg border border-stone-800 flex flex-col gap-3 text-xs">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <span className="font-bold text-stone-200 flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-cyan-400" />
              PURE CORDIC BIT-SHIFT RAY-INTERSECT DIAGNOSTIC
            </span>
            <span className="text-[10px] px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-700 rounded font-bold">
              ZERO IEEE-754 FLOATS
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-stone-900 p-2.5 rounded border border-stone-800 flex flex-col gap-1">
              <span className="text-stone-500 text-[10px]">Test Ray Origin:</span>
              <span className="font-mono text-cyan-300 text-xs">[0, -96, 32] Q16</span>
              <span className="text-stone-500 text-[10px]">Test Ray Vector:</span>
              <span className="font-mono text-cyan-300 text-xs">[0, +65536, 0] Q16</span>
            </div>
            <div className="bg-stone-900 p-2.5 rounded border border-stone-800 flex flex-col gap-1">
              <span className="text-stone-500 text-[10px]">CORDIC Ray Invariant:</span>
              <span className="font-mono text-emerald-400 text-xs font-bold">
                {testRayHit?.hit ? 'OCTREE INTERSECTION VALID' : 'CLEAR TRAVERSAL'}
              </span>
              <span className="text-stone-500 text-[10px]">Intersection Distance:</span>
              <span className="font-mono text-amber-300 text-xs font-bold">
                {testRayHit ? `${(testRayHit.distQ16 >> 16)} Units` : 'N/A'}
              </span>
            </div>
            <div className="bg-stone-900 p-2.5 rounded border border-stone-800 flex flex-col gap-1">
              <span className="text-stone-500 text-[10px]">Slabs Algorithm Shift:</span>
              <span className="font-mono text-stone-300 text-xs">&gt;&gt; 16 (Bit-Shifted)</span>
              <span className="text-stone-500 text-[10px]">Simulated BVH Hits:</span>
              <span className="font-mono text-cyan-300 text-xs font-bold">
                {archive?.cordicRayHitsSimulated || 8} Octree Nodes Hit
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
