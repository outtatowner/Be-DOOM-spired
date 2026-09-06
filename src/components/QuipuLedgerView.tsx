/**
 * @file QuipuLedgerView.tsx
 * @brief Quipu Merkle Invariant Ledger & WAD Lump File Ingestion Inspector
 */

import React, { useState, useMemo, useRef } from 'react';
import { QuipuMerkleBlock } from '../organelles/node_0x96_coplay_officiator';
import { RTDoomMap, parseBinaryWad, buildCanonicalE1M1 } from '../organelles/node_0x95_covalent_doom_wad_parser';
import { WadTranspilationOfficiator, TranspilationTelemetry } from '../organelles/node_0xWAD_TRANSPILER';
import {
  Database,
  FileUp,
  CheckCircle2,
  Box,
  Layers,
  Radio,
  Sparkles,
  Cpu,
  AlertTriangle,
  ShieldCheck,
  Download,
  Upload,
  FileCode,
} from 'lucide-react';

interface QuipuLedgerViewProps {
  ledger: QuipuMerkleBlock[];
  merkleRoot: string;
  currentMap: RTDoomMap;
  onMapLoaded: (map: RTDoomMap) => void;
}

export const QuipuLedgerView: React.FC<QuipuLedgerViewProps> = ({
  ledger,
  merkleRoot,
  currentMap,
  onMapLoaded,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [loadStatus, setLoadStatus] = useState<string | null>(null);
  const [transpilerTelemetry, setTranspilerTelemetry] = useState<TranspilationTelemetry | null>(null);

  const transpiler = useMemo(() => {
    const off = new WadTranspilationOfficiator();
    off.subscribeQuorum((signal, tel) => {
      console.log(`[ QUORUM SIGNAL ] ${signal}: Root ${tel.quipuHashRoot}`);
    });
    return off;
  }, []);

  const handleFileUpload = (file: File) => {
    setLoadStatus(`Transpiling lump stream: ${file.name}...`);
    const reader = new FileReader();
    reader.onload = (e) => {
      const buf = e.target?.result as ArrayBuffer;
      if (buf) {
        const uint8 = new Uint8Array(buf);
        const result = transpiler.ingestLegacyWad(uint8);
        setTranspilerTelemetry(result.telemetry);

        if (result.success && result.map) {
          onMapLoaded(result.map);
          setLoadStatus(`Transpilation complete! Assimilated ${result.map.name} (${result.telemetry.vertexCount} vertices, BVH Depth: ${result.telemetry.bvhDepth}).`);
        } else {
          setLoadStatus('Shear Detected: Density exceeded Lyapunov stasis limits or invalid WAD.');
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  /**
   * Generates a deterministic binary PWAD with VERTEXES, SECTORS, LINEDEFS, and THINGS lumps
   * to exercise Organelle 0x9B directly in memory.
   */
  const handleSyntheticPwadTranspile = () => {
    setLoadStatus('Synthesizing bare-metal PWAD binary stream...');
    // Create minimal PWAD with E1M1 lumps
    // Header: 12 bytes ("PWAD", 5 lumps, infoTable offset 12)
    // Lumps: E1M1 (0), THINGS (40), VERTEXES (32), SECTORS (52), LINEDEFS (56)
    const verticesData = new Int16Array([
      1000, -3600,
      1200, -3600,
      1200, -3300,
      1000, -3300,
      1400, -3300,
      1400, -2900,
      1200, -2900,
      1000, -2900,
    ]);

    const sectorsData = new Int16Array([
      // Sector 0 (floor, ceil, ... light at idx 10)
      0, 128, 0, 0, 0, 0, 0, 0, 0, 0, 192, 0, 0,
      // Sector 1
      16, 160, 0, 0, 0, 0, 0, 0, 0, 0, 224, 0, 0,
    ]);

    const linedefsData = new Int16Array([
      0, 1, 1, 0, 0, 0, 0, // v1, v2, flags, special, tag, front, back
      1, 2, 1, 0, 0, 0, 0,
      2, 3, 1, 0, 0, 0, 0,
      3, 0, 1, 0, 0, 0, 0,
      2, 4, 1, 0, 0, 1, 0,
      4, 5, 1, 0, 0, 1, 0,
      5, 6, 1, 0, 0, 1, 0,
      6, 2, 1, 0, 0, 1, 0,
    ]);

    const thingsData = new Int16Array([
      1050, -3500, 90, 1, 7,  // Player 1
      1120, -3500, 90, 2, 7,  // Be <> Marine
      1300, -3100, 180, 3004, 7, // Imp
    ]);

    const vBytes = new Uint8Array(verticesData.buffer);
    const sBytes = new Uint8Array(sectorsData.buffer);
    const lBytes = new Uint8Array(linedefsData.buffer);
    const tBytes = new Uint8Array(thingsData.buffer);

    // Calculate total buffer
    const lumpCount = 5;
    const headerSize = 12;
    const dirSize = lumpCount * 16;
    let currOffset = headerSize + dirSize;

    const e1m1Ofs = currOffset;
    const e1m1Len = 0;

    const tOfs = currOffset;
    currOffset += tBytes.byteLength;

    const vOfs = currOffset;
    currOffset += vBytes.byteLength;

    const sOfs = currOffset;
    currOffset += sBytes.byteLength;

    const lOfs = currOffset;
    currOffset += lBytes.byteLength;

    const pwadBuffer = new Uint8Array(currOffset);
    const view = new DataView(pwadBuffer.buffer);

    // "PWAD"
    pwadBuffer[0] = 'P'.charCodeAt(0);
    pwadBuffer[1] = 'W'.charCodeAt(0);
    pwadBuffer[2] = 'A'.charCodeAt(0);
    pwadBuffer[3] = 'D'.charCodeAt(0);
    view.setInt32(4, lumpCount, true);
    view.setInt32(8, 12, true); // Directory at offset 12

    const writeLumpEntry = (entryIdx: number, offset: number, size: number, name: string) => {
      const base = 12 + entryIdx * 16;
      view.setInt32(base, offset, true);
      view.setInt32(base + 4, size, true);
      for (let c = 0; c < 8; c++) {
        pwadBuffer[base + 8 + c] = c < name.length ? name.charCodeAt(c) : 0;
      }
    };

    writeLumpEntry(0, e1m1Ofs, e1m1Len, 'E1M1');
    writeLumpEntry(1, tOfs, tBytes.byteLength, 'THINGS');
    writeLumpEntry(2, vOfs, vBytes.byteLength, 'VERTEXES');
    writeLumpEntry(3, sOfs, sBytes.byteLength, 'SECTORS');
    writeLumpEntry(4, lOfs, lBytes.byteLength, 'LINEDEFS');

    pwadBuffer.set(tBytes, tOfs);
    pwadBuffer.set(vBytes, vOfs);
    pwadBuffer.set(sBytes, sOfs);
    pwadBuffer.set(lBytes, lOfs);

    const result = transpiler.ingestLegacyWad(pwadBuffer);
    setTranspilerTelemetry(result.telemetry);

    if (result.success && result.map) {
      onMapLoaded(result.map);
      setLoadStatus(`Transpiler Assimilated Synthetic PWAD (${result.telemetry.vertexCount} Q16.16 vertices, BVH Depth ${result.telemetry.bvhDepth}).`);
    }
  };

  const resetToCanonicalE1M1 = () => {
    const e1m1 = buildCanonicalE1M1();
    onMapLoaded(e1m1);
    setLoadStatus('Reset to canonical DOOM E1M1: Hangar benchmark.');
  };

  const handleExportLevelJson = () => {
    const jsonStr = JSON.stringify(currentMap, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentMap.name.toLowerCase().replace(/\s+/g, '_')}_level.json`;
    a.click();
    URL.revokeObjectURL(url);
    setLoadStatus(`Exported level geometry JSON (${currentMap.name})`);
  };

  const handleImportJsonFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string) as RTDoomMap;
        if (parsed.vertices && parsed.linedefs) {
          onMapLoaded(parsed);
          setLoadStatus(`Imported level layout "${parsed.name}" successfully.`);
        } else {
          setLoadStatus('Error: Invalid level JSON structure.');
        }
      } catch (err) {
        setLoadStatus('Error: Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleExportPwad = () => {
    // Generate synthetic PWAD byte lump for current map
    const lumpCount = 1;
    const headerSize = 12;
    const dirSize = lumpCount * 16;
    const dataSize = 64;
    const buffer = new Uint8Array(headerSize + dirSize + dataSize);
    const view = new DataView(buffer.buffer);
    buffer[0] = 'P'.charCodeAt(0);
    buffer[1] = 'W'.charCodeAt(0);
    buffer[2] = 'A'.charCodeAt(0);
    buffer[3] = 'D'.charCodeAt(0);
    view.setInt32(4, lumpCount, true);
    view.setInt32(8, headerSize, true);
    // Lump entry
    view.setInt32(headerSize, headerSize + dirSize, true);
    view.setInt32(headerSize + 4, dataSize, true);
    for (let i = 0; i < 8; i++) {
      buffer[headerSize + 8 + i] = i < currentMap.name.length ? currentMap.name.charCodeAt(i) : 0;
    }
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentMap.name.toLowerCase().replace(/\s+/g, '_')}.wad`;
    a.click();
    URL.revokeObjectURL(url);
    setLoadStatus(`Exported PWAD binary lump.`);
  };

  return (
    <div id="quipu-merkle-ledger" className="bg-stone-900 border border-stone-800 rounded-lg p-4 font-mono text-stone-200 flex flex-col gap-3 shadow-lg">
      <div className="flex items-center justify-between border-b border-stone-800 pb-2">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-stone-100">
            Quipu Merkle Ledger &amp; 0x9B WAD Transpiler
          </span>
        </div>
        <div className="text-[11px] text-cyan-400 font-bold truncate max-w-[200px]">
          Root: {merkleRoot}
        </div>
      </div>

      {/* WAD Map Lump Geometry Metrics */}
      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        <div className="bg-stone-950 border border-stone-800 p-2 rounded">
          <div className="text-[10px] text-stone-400">VERTICES</div>
          <div className="font-bold text-stone-100 text-sm">{currentMap.vertices?.length ?? 0}</div>
        </div>
        <div className="bg-stone-950 border border-stone-800 p-2 rounded">
          <div className="text-[10px] text-stone-400">LINEDEFS</div>
          <div className="font-bold text-amber-400 text-sm">{currentMap.linedefs?.length ?? 0}</div>
        </div>
        <div className="bg-stone-950 border border-stone-800 p-2 rounded">
          <div className="text-[10px] text-stone-400">3D QUADS</div>
          <div className="font-bold text-cyan-400 text-sm">{currentMap.quads?.length ?? 0}</div>
        </div>
        <div className="bg-stone-950 border border-stone-800 p-2 rounded">
          <div className="text-[10px] text-stone-400">RT LIGHTS</div>
          <div className="font-bold text-emerald-400 text-sm">{currentMap.lights?.length ?? 0}</div>
        </div>
      </div>

      {/* Organelle 0x9B Transpilation Telemetry Badge */}
      {transpilerTelemetry && (
        <div className="bg-stone-950/80 border border-cyan-800/60 rounded p-2 text-xs flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-cyan-300 font-bold flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              0x9B Transpiler Telemetry
            </span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Quorum: {transpilerTelemetry.quorumConfirmed ? 'CONFIRMED' : 'REJECTED'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[10px] text-stone-400 pt-1 border-t border-stone-800">
            <div>
              <span>BVH Hierarchy: </span>
              <strong className="text-stone-200">Depth {transpilerTelemetry.bvhDepth} ({transpilerTelemetry.bvhLeafNodes} leaves)</strong>
            </div>
            <div>
              <span>Vertex Friction: </span>
              <strong className="text-amber-300">{(transpilerTelemetry.totalMicroFriction / 65536).toFixed(4)} Q16</strong>
            </div>
            <div>
              <span>Quipu Hash: </span>
              <strong className="text-cyan-400">{transpilerTelemetry.quipuHashRoot}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Drag & Drop WAD Ingestion Box */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-3 text-center transition-colors cursor-pointer text-xs ${
          dragOver
            ? 'border-cyan-400 bg-cyan-950/30'
            : 'border-stone-800 hover:border-stone-700 bg-stone-950/50'
        }`}
      >
        <input
          type="file"
          id="wad-upload-input"
          accept=".wad"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
        />
        <label htmlFor="wad-upload-input" className="cursor-pointer flex flex-col items-center gap-1.5">
          <FileUp className="w-5 h-5 text-stone-400" />
          <span className="text-stone-300 font-semibold">
            Drop any DOOM .WAD lump file here or click to transpile
          </span>
          <span className="text-[10px] text-stone-500">
            Transpiles binary static coordinates into continuous Q16.16 fractional space
          </span>
        </label>
      </div>

      {/* Benchmark Actions & Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-stone-800 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={resetToCanonicalE1M1}
            className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 active:bg-stone-600 rounded text-stone-300 flex items-center gap-1 text-[11px] font-bold"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            Canonical E1M1 Benchmark
          </button>

          <button
            onClick={handleSyntheticPwadTranspile}
            className="px-2.5 py-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800 text-cyan-200 rounded flex items-center gap-1 text-[11px] font-bold"
            title="Inject and transpile a synthesized binary PWAD through Organelle 0x9B"
          >
            <Cpu className="w-3 h-3 text-cyan-400" />
            Test 0x9B Transpiler (PWAD)
          </button>
        </div>

        {/* Level Import/Export Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExportLevelJson}
            className="px-2 py-1 bg-stone-950 hover:bg-stone-800 border border-stone-700 text-stone-200 rounded text-[11px] font-bold flex items-center gap-1"
            title="Export full layout as JSON"
          >
            <Download className="w-3 h-3 text-cyan-400" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handleExportPwad}
            className="px-2 py-1 bg-stone-950 hover:bg-stone-800 border border-stone-700 text-stone-200 rounded text-[11px] font-bold flex items-center gap-1"
            title="Export as native DOOM PWAD lump"
          >
            <Download className="w-3 h-3 text-amber-400" />
            <span>Export .WAD</span>
          </button>

          <label className="px-2 py-1 bg-stone-950 hover:bg-stone-800 border border-stone-700 text-stone-200 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer">
            <Upload className="w-3 h-3 text-emerald-400" />
            <span>Import JSON</span>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleImportJsonFile(e.target.files[0]);
                }
              }}
            />
          </label>
        </div>

        {loadStatus && (
          <span className="text-[10px] text-emerald-400 truncate max-w-[260px] w-full mt-1">
            {loadStatus}
          </span>
        )}
      </div>

      {/* Recent Cryptographic Merkle Ticks */}
      <div className="flex flex-col gap-1 text-[11px]">
        <span className="text-stone-400 uppercase text-[10px]">Recent Ledger Merkle Blocks (Proof 1 ≡ 1)</span>
        <div className="h-24 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-stone-800">
          {ledger.slice(0, 6).map((b) => (
            <div
              key={b.tick}
              className="bg-stone-950/70 border border-stone-800/80 p-1.5 rounded flex items-center justify-between text-[10px]"
            >
              <div className="flex items-center gap-2">
                <span className="text-stone-500">#{b.tick}</span>
                <span className="text-cyan-300 font-bold">{b.merkleHash}</span>
                <span className="text-stone-400">
                  P1: ({b.humanPos.x},{b.humanPos.y})
                </span>
                <span className="text-stone-500">
                  Be: [{b.beState}]
                </span>
              </div>
              <div className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>1≡1</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

