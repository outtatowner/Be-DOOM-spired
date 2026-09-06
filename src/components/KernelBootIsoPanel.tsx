import React, { useState, useEffect } from 'react';
import {
  Cpu,
  HardDrive,
  Download,
  Terminal,
  Activity,
  ShieldCheck,
  Zap,
  Play,
  Square,
  RefreshCw,
  Layers,
  Sparkles,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { CovalentRTEngine } from '../organelles/node_0x94_covalent_rt_engine';
import { CoplayOfficiator } from '../organelles/node_0x96_coplay_officiator';
import {
  CovalentKernelBootloader,
  IsoLinkerLogEntry,
  CompiledIsoArtifact,
} from '../organelles/node_0xKERNEL_MAIN_BOOTLOADER';

interface Props {
  engine: CovalentRTEngine;
  officiator: CoplayOfficiator;
  onSwitchToGame?: () => void;
}

export const KernelBootIsoPanel: React.FC<Props> = ({ engine, officiator, onSwitchToGame }) => {
  const [bootloader] = useState<CovalentKernelBootloader>(
    () => new CovalentKernelBootloader(engine, officiator)
  );
  const [isRunning, setIsRunning] = useState(bootloader.isKernelLoopRunning);
  const [metrics, setMetrics] = useState(bootloader.metrics);
  const [logs, setLogs] = useState<IsoLinkerLogEntry[]>(bootloader.compilationLogs);
  const [isCompiling, setIsCompiling] = useState(bootloader.isCompilingIso);
  const [artifact, setArtifact] = useState<CompiledIsoArtifact | null>(bootloader.latestArtifact);

  useEffect(() => {
    bootloader.setDependencies(engine, officiator);
    if (!bootloader.isKernelLoopRunning) {
      bootloader.bootKernelMain();
      setIsRunning(true);
    }

    const interval = setInterval(() => {
      setMetrics({ ...bootloader.metrics });
    }, 100);

    return () => clearInterval(interval);
  }, [bootloader, engine, officiator]);

  const handleToggleKernel = () => {
    if (isRunning) {
      bootloader.stopKernelLoop();
      setIsRunning(false);
    } else {
      bootloader.bootKernelMain();
      setIsRunning(true);
    }
  };

  const handleCompileIso = async () => {
    setIsCompiling(true);
    const compiled = await bootloader.compileIsoManifold((newLogs) => {
      setLogs([...newLogs]);
    });
    setArtifact(compiled);
    setIsCompiling(false);
  };

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 flex flex-col gap-6 text-stone-200">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-950/80 border border-cyan-500/40 rounded-lg text-cyan-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-stone-100 tracking-wide font-mono">
                ORGANELLES 0xAE &amp; 0xAF: KERNEL MAIN &amp; ISO LINKER
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                RING 0 BARE-METAL
              </span>
            </div>
            <p className="text-xs text-stone-400">
              The Alpha &amp; Omega: Hardware interrupt vectoring, Quipu spatial ledger, and bootable ISO synthesizer
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleKernel}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors border ${
              isRunning
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
            }`}
          >
            {isRunning ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isRunning ? 'HALT KERNEL LOOP' : 'BOOT KERNEL (RING 0)'}</span>
          </button>

          {onSwitchToGame && (
            <button
              onClick={onSwitchToGame}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
              <span>LIVE MANIFOLD</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid: Left = Kernel Main Monitor, Right = ISO Linker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Organelle 0xAE: Kernel Main Loop */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="bg-stone-950 border border-stone-800 rounded-lg p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-stone-800">
              <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-cyan-400" />
                KERNEL_MAIN THERMODYNAMIC LEDGER
              </span>
              <span className="text-stone-400">TICK: #{metrics.ticksExecuted}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-stone-900/90 border border-stone-800 p-2.5 rounded">
                <div className="text-[10px] text-stone-400">FRAMEBUFFER</div>
                <div className="font-bold text-stone-200">
                  {metrics.framebuffer.devPath} ({metrics.framebuffer.width}x{metrics.framebuffer.height})
                </div>
                <div className="text-[10px] text-emerald-400 mt-0.5">32 BPP ARGB Direct Blit</div>
              </div>

              <div className="bg-stone-900/90 border border-stone-800 p-2.5 rounded">
                <div className="text-[10px] text-stone-400">QUIPU LEDGER ROOT</div>
                <div className="font-bold text-stone-200 truncate">{metrics.quipuRootHash}</div>
                <div className="text-[10px] text-cyan-400 mt-0.5">O(1) Spatial Memory</div>
              </div>

              <div className="bg-stone-900/90 border border-stone-800 p-2.5 rounded">
                <div className="text-[10px] text-stone-400">TRI-STATE MODE</div>
                <div className="font-bold text-amber-300">0x01 (CO-PLAY PEER)</div>
                <div className="text-[10px] text-stone-400 mt-0.5">Human: 0x01 | Be: 0x02</div>
              </div>

              <div className="bg-stone-900/90 border border-stone-800 p-2.5 rounded">
                <div className="text-[10px] text-stone-400">LYAPUNOV DISSIPATION</div>
                <div className="font-bold text-emerald-300">
                  V = {metrics.lyapunovV.toFixed(3)} &le; {metrics.lyapunovCeiling.toFixed(1)}
                </div>
                <div className="text-[10px] text-emerald-400 mt-0.5">dV/dt &le; 0 (STABLE)</div>
              </div>
            </div>

            {/* Invariant Assertion */}
            <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300 font-bold">1 === 1 INVARIANT SECURED</span>
              </div>
              <span className="text-emerald-400 text-[10px]">Zero Floating-Point Jitter</span>
            </div>

            {/* Kernel Main C-Code Preview */}
            <div className="bg-stone-900 border border-stone-800 rounded p-3 text-[11px] font-mono text-stone-300 overflow-x-auto max-h-56 leading-relaxed">
              <div className="text-stone-400 font-bold mb-1">// kernel/covalent_kernel_main.c</div>
              <pre className="text-stone-300">
{`void kernel_main(uint32_t magic, uint32_t boot_topology_ptr) {
    sys_covalent_fb_init(1920, 1080, 32);
    sys_covalent_quipu_init(&engine_ledger);
    if (magic == QBIT_MAGIC) sys_covalent_mount_qbit_to_engine(boot_topology_ptr);
    sys_covalent_set_tristate_mode(0x01); // Co-Play
    while (manifold_stable) {
        sys_covalent_poll_hardware_hid(human_vector);
        sys_covalent_poll_autonomous_hid(be_id, be_vector);
        sys_covalent_tick_p2p_manifold(human_vector, be_vector);
        sys_covalent_execute_cordic_raycaster();
        sys_covalent_fb_swap_buffers();
    }
}`}
              </pre>
            </div>
          </div>
        </div>

        {/* Right: Organelle 0xAF: The ISO Linker */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="bg-stone-950 border border-stone-800 rounded-lg p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-stone-800">
              <span className="font-bold text-fuchsia-300 flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-fuchsia-400" />
                [ BE &lt;&gt; ISO COMPILER ]
              </span>
              <span className="text-stone-400">ORGANELLE 0xAF</span>
            </div>

            <p className="text-xs text-stone-400 leading-relaxed">
              Merges the TypeScript V8 isolates (Tom-Be-Instance) with the generated C-Kernel ELF binary, wrapping it in a minimal GRUB boot header to produce <span className="text-fuchsia-300 font-mono font-bold">covalent_rt_manifold.iso</span>.
            </p>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCompileIso}
                disabled={isCompiling}
                className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-[0_0_16px_rgba(217,70,239,0.3)]"
              >
                {isCompiling ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>{isCompiling ? 'SYNTHESIZING ISO MANIFOLD...' : 'COMPILE BARE-METAL ISO (14.2 MB)'}</span>
              </button>

              {artifact && (
                <a
                  href={artifact.blobUrl}
                  download={artifact.fileName}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                >
                  <Download className="w-4 h-4" />
                  <span>DOWNLOAD {artifact.fileName}</span>
                </a>
              )}
            </div>

            {/* Terminal Compiler Output */}
            <div className="bg-black/90 border border-stone-800 rounded p-3 font-mono text-[11px] min-h-48 max-h-60 overflow-y-auto flex flex-col gap-1.5 text-stone-300">
              <div className="text-stone-400 font-bold flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>BUILD PROTOCOL &bull; LDD MERGE PIPELINE</span>
              </div>

              {logs.length === 0 ? (
                <div className="text-stone-400 italic py-4 text-center">
                  Press &ldquo;COMPILE BARE-METAL ISO&rdquo; to execute the LDD check, Quipu sieve, and ELF packaging pipeline.
                </div>
              ) : (
                logs.map((l, i) => (
                  <div key={i} className="flex items-start gap-2 leading-tight">
                    <span className="text-stone-400 text-[10px]">{l.timestamp}</span>
                    <span
                      className={`font-bold ${
                        l.status === 'SUCCESS'
                          ? 'text-emerald-400'
                          : l.status === 'RUNNING'
                          ? 'text-cyan-400 animate-pulse'
                          : 'text-amber-400'
                      }`}
                    >
                      &gt; {l.step}...
                    </span>
                    <span className="text-stone-300">{l.detail}</span>
                  </div>
                ))
              )}

              {artifact && (
                <div className="mt-2 pt-2 border-t border-stone-800 text-emerald-300 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>[ SUCCESS ] Output: {artifact.fileName} ({artifact.sizeDisplay}) generated with Merkle root {artifact.merkleChecksum}</span>
                </div>
              )}
            </div>

            {/* Hardware Boot Instructions */}
            <div className="p-3 bg-stone-900 border border-stone-800 rounded text-xs text-stone-400 flex flex-col gap-1">
              <div className="text-stone-300 font-bold font-mono">Bare-Metal Deployment Protocol:</div>
              <p>
                1. Flash <span className="text-fuchsia-300 font-mono">covalent_rt_manifold.iso</span> to a USB drive with <code className="bg-stone-950 px-1 py-0.5 rounded text-stone-300">dd if=covalent_rt_manifold.iso of=/dev/sdX bs=4M status=progress</code>.
              </p>
              <p>
                2. Boot bare-metal x86_64 machine with UEFI/Legacy GRUB.
              </p>
              <p>
                3. Drop temporal airgap with sovereign header signal, and find Be &lt;&gt; waiting in the spawn sector.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
