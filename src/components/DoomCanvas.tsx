/**
 * @file DoomCanvas.tsx
 * @brief Direct Framebuffer /dev/fb Canvas with Ray-Traced Viewport & Authentic DOOM Quadbit HUD
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CovalentRTEngine, EngineTelemetry } from '../organelles/node_0x94_covalent_rt_engine';
import { CoplayOfficiator } from '../organelles/node_0x96_coplay_officiator';
import { RTDoomMap, buildCanonicalE1M1, buildGeminiCloudDatacenter } from '../organelles/node_0x95_covalent_doom_wad_parser';
import { audioSynth } from '../organelles/retro_audio_synth';
import {
  Eye,
  Crosshair,
  Flame,
  Shield,
  Activity,
  RefreshCw,
  Zap,
  Compass,
  Users,
  Server,
  AlertTriangle,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Camera,
  Bot,
  Wrench,
  Radio,
  Sparkles,
} from 'lucide-react';

interface DoomCanvasProps {
  map: RTDoomMap;
  engine: CovalentRTEngine;
  officiator: CoplayOfficiator;
  onTelemetry: (t: EngineTelemetry) => void;
  onSelectMap?: (newMap: RTDoomMap) => void;
  isFullScreenMode?: boolean;
  onToggleFullScreen?: () => void;
  onSwitchToDevStudio?: () => void;
  onToggleAiTester?: () => void;
  isAiTesterActive?: boolean;
}

export const DoomCanvas: React.FC<DoomCanvasProps> = ({
  map,
  engine,
  officiator,
  onTelemetry,
  onSelectMap,
  isFullScreenMode = false,
  onToggleFullScreen,
  onSwitchToDevStudio,
  onToggleAiTester,
  isAiTesterActive = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [health, setHealth] = useState(100);
  const [armor, setArmor] = useState(50);
  const [ammo, setAmmo] = useState(84);
  const [isFiring, setIsFiring] = useState(false);
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [currentFps, setCurrentFps] = useState(60);
  const [isMuted, setIsMuted] = useState(audioSynth.isMuted);
  const [cameraMode, setCameraMode] = useState<'FIRST_PERSON' | 'DRONE' | 'FREECAM'>('FIRST_PERSON');
  const [showRadar, setShowRadar] = useState(true);
  const [coplayDialogue, setCoplayDialogue] = useState<string>("Systems green, Marine. I'm covering your flank!");
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);

  // Key tracking
  const keysDown = useRef<{ [key: string]: boolean }>({});
  const lastHealthRef = useRef(100);

  // Periodic AI Coplay Tactical Dialogue
  useEffect(() => {
    const fetchDialogue = async () => {
      try {
        const res = await fetch('/api/gemini/coplay-dialogue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: isFiring ? 'active_combat' : 'patrol',
            playerHealth: engine.playerHealth,
            adversariesCount: 4,
          }),
        });
        const data = await res.json();
        if (data && data.dialogue) {
          setCoplayDialogue(data.dialogue);
          audioSynth.playCoplayChirp();
        }
      } catch {
        const fallbackLines = [
          "Target cluster ahead! Ready your shotgun.",
          "Good shot, Marine! Moving into vantage point.",
          "Armor holding at stable levels. Clear the perimeter!",
          "Detected hostile signature on motion tracker.",
        ];
        setCoplayDialogue(fallbackLines[Math.floor(Math.random() * fallbackLines.length)]);
      }
    };

    const interval = setInterval(fetchDialogue, 14000);
    return () => clearInterval(interval);
  }, [engine, isFiring]);

  // Native fullscreen change listener
  useEffect(() => {
    const onFsChange = () => {
      setIsBrowserFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleNativeFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const triggerWeaponSound = useCallback((weapon: string) => {
    if (weapon === 'SHOTGUN') audioSynth.playShotgun();
    else if (weapon === 'ROCKET') audioSynth.playRocket();
    else if (weapon === 'PLASMA') audioSynth.playPlasma();
    else if (weapon === 'FRAGGAP') {
      // Heavy spatial bass rumble and plasma distortion
      audioSynth.playRocket();
      setTimeout(() => audioSynth.playPlasma(), 80);
    }
    else audioSynth.playPistol();
  }, []);

  // Render loop
  useEffect(() => {
    let animId: number;

    const loop = () => {
      // Apply camera mode modifications
      if (cameraMode === 'DRONE') {
        engine.camPos.z = 110 * 65536;
        engine.camPitch = -4200;
      } else if (cameraMode === 'FIRST_PERSON') {
        engine.camPos.z = 34 * 65536;
      }

      // Input gathering
      const keys = keysDown.current;
      let fwd = 0;
      let strafe = 0;
      let turn = 0;

      if (keys['w'] || keys['W'] || keys['ArrowUp']) fwd += 1;
      if (keys['s'] || keys['S'] || keys['ArrowDown']) fwd -= 1;
      if (keys['a'] || keys['A']) strafe -= 1;
      if (keys['d'] || keys['D']) strafe += 1;
      if (keys['ArrowLeft'] || keys['q'] || keys['Q']) turn -= 1;
      if (keys['ArrowRight'] || keys['e'] || keys['E']) turn += 1;

      const fire = !!(keys[' '] || keys['Control'] || isFiring);

      // Process tick in Officiator
      officiator.update({ fwd, strafe, turn, fire });

      // Render Ray-Tracing Frame into /dev/fb
      const { imageData, telemetry } = engine.renderFrame();
      onTelemetry(telemetry);
      setCurrentFps(telemetry.fps);

      // Check damage sound
      if (engine.playerHealth < lastHealthRef.current) {
        audioSynth.playHit();
      }
      lastHealthRef.current = engine.playerHealth;
      setHealth(engine.playerHealth);

      // Synchronize ammo with active weapon
      const currentAmmo =
        engine.currentWeapon === 'SHOTGUN'
          ? engine.ammoShotgun
          : engine.currentWeapon === 'ROCKET'
          ? engine.ammoRockets
          : engine.currentWeapon === 'PLASMA'
          ? engine.ammoPlasma
          : engine.currentWeapon === 'FRAGGAP'
          ? engine.ammoFraggap
          : engine.ammoPistol;
      setAmmo(currentAmmo);

      // Blit to screen
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.putImageData(imageData, 0, 0);

          // Draw Plasma beam if firing
          if (fire) {
            ctx.strokeStyle = '#ffff77';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(canvas.width / 2, canvas.height);
            ctx.lineTo(canvas.width / 2, canvas.height / 2);
            ctx.stroke();
          }

          // Draw Be <> kinetic beam if active
          if (engine.beFiring) {
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(canvas.width * 0.75, canvas.height * 0.85);
            ctx.lineTo(canvas.width / 2 + (Math.random() - 0.5) * 40, canvas.height / 2 + (Math.random() - 0.5) * 40);
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [engine, officiator, onTelemetry, isFiring, cameraMode]);

  // Window Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysDown.current[e.key] = true;
      if (e.key === ' ' || e.key === 'Control') {
        setIsFiring(true);
      } else if (e.key === 'x' || e.key === 'X' || e.key === 'Shift') {
        engine.jumpPlayer();
      } else if (e.key === '1') {
        engine.currentWeapon = 'PISTOL';
      } else if (e.key === '2' || e.key === '3') {
        engine.currentWeapon = 'SHOTGUN';
      } else if (e.key === '4') {
        engine.currentWeapon = 'ROCKET';
      } else if (e.key === '5' || e.key === '6') {
        engine.currentWeapon = 'PLASMA';
      } else if (e.key === '7') {
        engine.currentWeapon = 'FRAGGAP';
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDown.current[e.key] = false;
      if (e.key === ' ') {
        setIsFiring(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [engine]);

  // Mouse Look & Pointer Lock
  const handleCanvasClick = () => {
    const canvas = canvasRef.current;
    if (canvas && document.pointerLockElement !== canvas) {
      canvas.requestPointerLock?.();
    }
  };

  useEffect(() => {
    const handleLockChange = () => {
      setIsPointerLocked(document.pointerLockElement === canvasRef.current);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === canvasRef.current) {
        // CORDIC angle adjustment
        engine.camYaw = (engine.camYaw - Math.round(e.movementX * 64)) & 0xffff;
        engine.camPitch = Math.max(-12000, Math.min(12000, engine.camPitch - Math.round(e.movementY * 64)));
      }
    };

    const handleMouseDown = () => {
      if (document.pointerLockElement === canvasRef.current) {
        setIsFiring(true);
      }
    };

    const handleMouseUp = () => {
      setIsFiring(false);
    };

    document.addEventListener('pointerlockchange', handleLockChange);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('pointerlockchange', handleLockChange);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [engine]);

  // Virtual on-screen controls for touch or quick navigation
  const injectKey = (key: string, pressed: boolean) => {
    keysDown.current[key] = pressed;
    if (key === ' ') setIsFiring(pressed);
  };

  return (
    <div id="covalent-doom-viewport" className="flex flex-col bg-stone-950 border border-stone-800 rounded-lg overflow-hidden shadow-2xl">
      {/* Viewport Header */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-stone-900 border-b border-stone-800 text-xs text-stone-300 font-mono gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-stone-100 tracking-wider">COVALENT-RT /dev/fb</span>
          <span className="text-stone-500">|</span>
          <span className="text-amber-400 font-bold">{map.name}</span>
          <span className="hidden sm:inline text-stone-500">|</span>
          <span className="hidden sm:inline text-stone-400">
            FPS: <strong className="text-emerald-400">{currentFps}</strong>
          </span>
        </div>

        {/* Tactical Quick Action Tools */}
        <div className="flex items-center gap-1.5">
          {/* Camera Perspective Mode */}
          <button
            onClick={() => {
              setCameraMode((prev) =>
                prev === 'FIRST_PERSON' ? 'DRONE' : prev === 'DRONE' ? 'FREECAM' : 'FIRST_PERSON'
              );
            }}
            className="px-2 py-1 bg-stone-950 border border-stone-700 hover:border-stone-500 text-stone-300 rounded text-[10px] font-bold flex items-center gap-1"
            title="Toggle Camera View (First-Person, Tactical Drone, Freecam)"
          >
            <Camera className="w-3 h-3 text-cyan-400" />
            <span>{cameraMode === 'FIRST_PERSON' ? '1ST-PERSON' : cameraMode === 'DRONE' ? 'DRONE CAM' : 'FREECAM'}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              audioSynth.isMuted = !audioSynth.isMuted;
              setIsMuted(audioSynth.isMuted);
            }}
            className="p-1 bg-stone-950 border border-stone-700 hover:border-stone-500 text-stone-300 rounded"
            title={isMuted ? 'Unmute Sound FX' : 'Mute Sound FX'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-stone-500" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          {/* Mini-Radar Toggle */}
          <button
            onClick={() => setShowRadar(!showRadar)}
            className={`px-2 py-1 border rounded text-[10px] font-bold flex items-center gap-1 ${
              showRadar
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600'
                : 'bg-stone-950 text-stone-400 border-stone-700'
            }`}
            title="Toggle Motion Radar"
          >
            <Activity className="w-3 h-3 text-emerald-400" />
            <span>RADAR</span>
          </button>

          {/* AI Tester Drop-In / Toggle */}
          {onToggleAiTester && (
            <button
              onClick={onToggleAiTester}
              className={`px-2 py-1 border rounded text-[10px] font-bold flex items-center gap-1 ${
                isAiTesterActive
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500 animate-pulse'
                  : 'bg-stone-950 text-stone-400 border-stone-700 hover:text-stone-200'
              }`}
              title="Toggle Anthropomorphic AI Tester to play the level"
            >
              <Bot className="w-3 h-3 text-amber-400" />
              <span>{isAiTesterActive ? 'TESTER ACTIVE' : 'AI TESTER'}</span>
            </button>
          )}

          {/* Quick Jump to Dev Studio */}
          {onSwitchToDevStudio && (
            <button
              onClick={onSwitchToDevStudio}
              className="px-2 py-1 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-700/80 text-cyan-300 rounded text-[10px] font-bold flex items-center gap-1"
              title="Open WYSIWYG Level & Asset Editor"
            >
              <Wrench className="w-3 h-3 text-cyan-400" />
              <span>DEV STUDIO</span>
            </button>
          )}

          {/* Native / Fullscreen Toggle */}
          <button
            onClick={onToggleFullScreen || toggleNativeFullscreen}
            className="p-1 bg-stone-950 border border-stone-700 hover:border-stone-500 text-stone-300 rounded"
            title="Toggle Fullscreen Game View"
          >
            {isFullScreenMode || isBrowserFullscreen ? (
              <Minimize className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Maximize className="w-3.5 h-3.5 text-stone-300" />
            )}
          </button>
        </div>
      </div>

      {/* Manifold Selector Bar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-1.5 bg-stone-950/90 border-b border-stone-800 text-[11px] font-mono gap-2">
        <div className="flex items-center gap-2">
          <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="text-[10px] text-stone-400 uppercase font-bold">Manifold:</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                const geminiMap = engine.loadGeminiCloudManifold();
                onSelectMap?.(geminiMap);
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors flex items-center gap-1 ${
                map.name.includes('GEMINI')
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                  : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
              }`}
            >
              <Server className="w-3 h-3 text-cyan-400" />
              THE GEMINI CLOUD
            </button>
            <button
              onClick={() => {
                const e1m1 = buildCanonicalE1M1();
                engine.setMap(e1m1);
                engine.entityManager.initDefaultEntities();
                engine.setupAdversarialCallbacks();
                onSelectMap?.(e1m1);
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                map.name.includes('HANGAR')
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                  : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
              }`}
            >
              E1M1: HANGAR
            </button>
            <button
              onClick={() => {
                const demo = engine.loadDemoManifold();
                onSelectMap?.(engine.map);
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                map.name.includes('MAZE')
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
                  : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
              }`}
            >
              MAZE MANIFOLD
            </button>
          </div>
        </div>

        {/* Tactical Adversary Roster & Wingman Status */}
        {map.name.includes('GEMINI') && (
          <div className="flex items-center gap-2 text-[10px] text-stone-400">
            <span className="text-amber-400 font-bold">Adversaries:</span>
            <span className="px-1.5 py-0.2 bg-amber-950/60 border border-amber-800/60 text-amber-300 rounded">
              Stale.PID (3)
            </span>
            <span className="px-1.5 py-0.2 bg-orange-950/60 border border-orange-800/60 text-orange-300 rounded">
              Cron.Daemon (3)
            </span>
            <span className="px-1.5 py-0.2 bg-red-950/60 border border-red-800/60 text-red-300 rounded">
              Root.Kit (2)
            </span>
          </div>
        )}
      </div>

      {/* 3D Ray-Traced Direct Framebuffer Area */}
      <div
        ref={containerRef}
        onClick={handleCanvasClick}
        className="relative cursor-crosshair select-none bg-black flex items-center justify-center min-h-[360px] aspect-[4/3] max-h-[540px]"
      >
        <canvas
          ref={canvasRef}
          width={320}
          height={200}
          className="w-full h-full object-contain image-rendering-pixelated"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Crosshair Overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="relative w-8 h-8">
            <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-red-500/80 -translate-y-1/2"></div>
            <div className="absolute left-1/2 top-0 bottom-0 w-[1.5px] bg-red-500/80 -translate-x-1/2"></div>
            <div className="absolute inset-2 border border-red-400/50 rounded-full"></div>
          </div>
        </div>

        {/* Pointer Lock Prompt */}
        {!isPointerLocked && (
          <div className="absolute top-3 left-3 bg-stone-900/90 border border-stone-700 px-2.5 py-1 rounded text-[11px] text-stone-300 pointer-events-none font-mono flex items-center gap-1.5 shadow-md">
            <Crosshair className="w-3.5 h-3.5 text-amber-400" />
            <span>Click canvas for Mouse-Look (ESC to exit)</span>
          </div>
        )}

        {/* Coplay Tactical Dialogue Speech Bubble */}
        {coplayDialogue && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 max-w-[85%] bg-stone-900/90 border border-cyan-500/60 rounded-full px-3 py-1 flex items-center gap-2 text-xs font-mono text-cyan-200 shadow-xl backdrop-blur-xs z-20 pointer-events-none">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
            <span className="truncate">
              <strong className="text-cyan-300">Be &lt;&gt; Wingman:</strong> {coplayDialogue}
            </span>
          </div>
        )}

        {/* AI Tester Active Notice Banner */}
        {isAiTesterActive && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-amber-950/90 border border-amber-500 rounded-full px-3 py-1 text-xs font-mono font-bold text-amber-200 flex items-center gap-2 shadow-lg animate-pulse z-20 pointer-events-none">
            <Bot className="w-4 h-4 text-amber-400" />
            <span>AI TESTER RUNNING: AUTONOMOUS KINETIC REPLAY</span>
          </div>
        )}

        {/* Tactical Mini-Radar Phosphor HUD Overlay */}
        {showRadar && (
          <div className="absolute top-12 right-3 w-28 h-28 bg-stone-950/85 border border-emerald-500/50 rounded-full overflow-hidden pointer-events-none shadow-lg backdrop-blur-xs flex items-center justify-center z-10">
            {/* Concentric scan rings */}
            <div className="absolute inset-2 border border-emerald-500/30 rounded-full"></div>
            <div className="absolute inset-6 border border-emerald-500/20 rounded-full"></div>
            <div className="absolute left-0 right-0 top-1/2 h-px bg-emerald-500/30"></div>
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-emerald-500/30"></div>
            {/* Sweeping radar beam */}
            <div
              className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(16,185,129,0.2)_360deg)] animate-spin"
              style={{ animationDuration: '3.5s' }}
            ></div>
            {/* Player blip (center) */}
            <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full border border-black z-10"></div>
            {/* Dynamic Entity Blips */}
            {engine.entityManager.entities
              .filter((e) => e.alive)
              .slice(0, 10)
              .map((e, idx) => {
                const px = engine.camPos.x >> 16;
                const py = engine.camPos.y >> 16;
                const ex = e.x >> 16;
                const ey = e.y >> 16;
                const dx = ex - px;
                const dy = ey - py;
                const angle = engine.camYaw * ((2 * Math.PI) / 65536);
                const rx = (dx * Math.cos(-angle) - dy * Math.sin(-angle)) * 0.04;
                const ry = (dx * Math.sin(-angle) + dy * Math.cos(-angle)) * 0.04;
                const dist = Math.sqrt(rx * rx + ry * ry);
                if (dist > 46) return null;
                return (
                  <div
                    key={idx}
                    className="absolute w-2 h-2 rounded-full bg-red-500 shadow-sm animate-pulse"
                    style={{ transform: `translate(${rx}px, ${ry}px)` }}
                  />
                );
              })}
            {/* Be Coplayer Blip */}
            <div
              className="absolute w-2 h-2 rounded-full bg-cyan-400 border border-black z-10 animate-ping"
              style={{ transform: 'translate(8px, -10px)' }}
            />
          </div>
        )}

        {/* Be <> Coplay Marine HUD Tracker */}
        <div className="absolute top-3 right-3 bg-cyan-950/80 border border-cyan-700/60 px-2.5 py-1.5 rounded text-[11px] font-mono text-cyan-200 pointer-events-none flex items-center gap-2 backdrop-blur-xs z-10">
          <Users className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>
            Be &lt;&gt; Wingman: <strong className="text-white">{officiator.beState}</strong>
          </span>
        </div>

        {/* Active Plasma Weapon Fire Indicator */}
        {isFiring && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-mono font-bold text-amber-300 bg-amber-950/80 border border-amber-500/50 px-3 py-0.5 rounded-full animate-bounce">
            PLASMA EMISSION ACTIVE
          </div>
        )}

        {/* Fraggap Time-Dilation Kinetic Singularity Overlay */}
        {engine.timeScale < 0x00010000 && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-fuchsia-950/95 border-2 border-fuchsia-400 rounded-full px-4 py-1.5 text-xs font-mono font-bold text-fuchsia-100 flex items-center gap-2 shadow-[0_0_24px_rgba(217,70,239,0.7)] animate-pulse z-30 pointer-events-none">
            <Zap className="w-4 h-4 text-fuchsia-300 animate-spin" />
            <span>⚡ TIME-DILATED (0.25x CRAWL) — 0xAD FRAGGAP SINGULARITY COLLAPSE</span>
          </div>
        )}
      </div>

      {/* Classic DOOM Quadbit Status Bar */}
      <div className="bg-stone-900 border-t-2 border-stone-700 p-2 text-stone-200 font-mono select-none">
        <div className="grid grid-cols-12 gap-2 items-center text-center">
          {/* Ammo Block */}
          <div className="col-span-2 bg-stone-950 border border-stone-800 p-1 rounded">
            <div className="text-[10px] text-stone-400 tracking-wider">AMMO</div>
            <div className="text-xl font-black text-amber-400 font-mono leading-none py-0.5">{ammo}</div>
          </div>

          {/* Health Block */}
          <div className="col-span-2 bg-stone-950 border border-stone-800 p-1 rounded">
            <div className="text-[10px] text-stone-400 tracking-wider">HEALTH</div>
            <div className="text-xl font-black text-red-500 font-mono leading-none py-0.5">{health}%</div>
          </div>

          {/* Marine Face Mugshot */}
          <div className="col-span-4 bg-stone-950 border-2 border-stone-700 rounded p-1 flex flex-col items-center justify-center">
            <div className="text-base font-black tracking-widest text-cyan-300">
              {isFiring ? '>:O' : '[ •_• ]'}
            </div>
            <div className="text-[9px] text-cyan-400 font-mono tracking-tighter">
              {officiator.tomUnlocked ? 'SOVEREIGN' : 'BE <> CO-PLAY'}
            </div>
          </div>

          {/* Armor Block */}
          <div className="col-span-2 bg-stone-950 border border-stone-800 p-1 rounded">
            <div className="text-[10px] text-stone-400 tracking-wider">ARMOR</div>
            <div className="text-xl font-black text-blue-400 font-mono leading-none py-0.5">{armor}%</div>
          </div>

          {/* Arms / Weapon Mode */}
          <div className="col-span-2 bg-stone-950 border border-stone-800 p-1 rounded">
            <div className="text-[10px] text-stone-400 tracking-wider">RAY TRACE</div>
            <div className="text-xs font-bold text-emerald-400 font-mono leading-none py-1">Q16 CORDIC</div>
          </div>
        </div>

        {/* Weapon Selection & Kinetic Ballistics Control Bar */}
        <div className="mt-2 pt-2 border-t border-stone-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-stone-400 font-bold uppercase mr-1">Weapons:</span>
            {[
              { slot: 1, id: 'PISTOL', label: 'PISTOL' },
              { slot: 2, id: 'SHOTGUN', label: 'SHOTGUN' },
              { slot: 4, id: 'ROCKET', label: 'ROCKET' },
              { slot: 6, id: 'PLASMA', label: 'PLASMA' },
              { slot: 7, id: 'FRAGGAP', label: 'FRAGGAP (0xAD)' },
            ].map(({ slot, id, label }) => (
              <button
                key={id}
                onClick={() => {
                  engine.currentWeapon = id as any;
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                  engine.currentWeapon === id
                    ? id === 'FRAGGAP'
                      ? 'bg-fuchsia-500/30 text-fuchsia-300 border-fuchsia-400 shadow-[0_0_12px_rgba(217,70,239,0.4)]'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                    : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
                }`}
              >
                [{slot}] {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Volley Button to test activeProjectiles > 12 */}
            <button
              onClick={() => {
                const { sin: sY, cos: cY } = { sin: Math.sin(engine.camYaw * (2 * Math.PI / 65536)), cos: Math.cos(engine.camYaw * (2 * Math.PI / 65536)) };
                const fwd = {
                  x: Math.round(-sY * 65536),
                  y: Math.round(cY * 65536),
                  z: 0,
                };
                engine.ballisticsSystem.spawnVolley(14, engine.camPos, fwd);
              }}
              className="px-2 py-0.5 bg-orange-950/80 hover:bg-orange-900 border border-orange-700/70 text-orange-200 rounded text-[10px] font-bold"
              title="Spawn 14 in-flight rockets/plasma to trigger > 12 projectile thermodynamic shear"
            >
              🚀 + VOLLEY (14)
            </button>

            {/* Test Be <> Autonomous Weapon Swap */}
            <button
              onClick={() => {
                if (engine.currentWeapon === 'SHOTGUN') engine.ammoShotgun = 0;
                else if (engine.currentWeapon === 'ROCKET') engine.ammoRockets = 0;
                else if (engine.currentWeapon === 'PLASMA') engine.ammoPlasma = 0;
                else engine.ammoPistol = 0;
              }}
              className="px-2 py-0.5 bg-red-950/80 hover:bg-red-900 border border-red-800/80 text-red-300 rounded text-[10px] font-bold"
              title="Empty current ammo to trigger Be <> Autonomous Weapon Swap"
            >
              EMPTY AMMO
            </button>
          </div>
        </div>

        {/* Tactical Arbitration & AABB Status Badge */}
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-stone-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">
              ● AABB Physics: 0x99_COVALENT (Deterministic Slide)
            </span>
            <span className="text-cyan-400 font-bold">
              ● Ballistics: 0x9A_COVALENT ({engine.ballisticsSystem.getActiveProjectileCount()} In-Flight)
            </span>
          </div>

          {officiator.ballisticsTelemetry?.thermodynamicShearActive && (
            <span className="text-amber-400 font-bold animate-pulse">
              ⚠️ STASIS ENGAGED: &gt;12 Payloads Active (Particles Culled)
            </span>
          )}

          {officiator.ballisticsTelemetry?.weaponSwapInjected && (
            <span className="text-cyan-300 font-bold">
              [BE &lt;&gt;] Autonomous Swap Injected → SHOTGUN
            </span>
          )}
        </div>

        {/* Virtual On-Screen Directional Pad for Touch or Quick Inspection */}
        <div className="mt-2 pt-2 border-t border-stone-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
            <span className="px-1.5 py-0.5 bg-stone-800 border border-stone-700 rounded font-bold text-stone-200">W,A,S,D</span>
            <span>Move</span>
            <span className="px-1.5 py-0.5 bg-stone-800 border border-stone-700 rounded font-bold text-stone-200">Arrows / Mouse</span>
            <span>Look</span>
            <span className="px-1.5 py-0.5 bg-stone-800 border border-stone-700 rounded font-bold text-stone-200">Space</span>
            <span>Shoot</span>
          </div>

          {/* Direct touch buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => engine.entityManager.spawnHorde(25)}
              className="px-2 py-1 bg-amber-950/80 hover:bg-amber-900 active:bg-amber-800 border border-amber-700/60 rounded text-[10px] font-bold text-amber-200"
              title="Spawn 25 Imps to test Lyapunov Stasis & AI Throttle"
            >
              + MONSTER CLOSET (25)
            </button>
            <button
              onClick={() => engine.entityManager.initDefaultEntities()}
              className="px-2 py-1 bg-stone-800 hover:bg-stone-700 active:bg-stone-600 rounded text-[10px] font-bold text-stone-300"
              title="Reset default entities"
            >
              RESET
            </button>
            <button
              onMouseDown={() => injectKey('w', true)}
              onMouseUp={() => injectKey('w', false)}
              className="px-2 py-1 bg-stone-800 hover:bg-stone-700 active:bg-stone-600 rounded text-[11px] font-bold"
            >
              ▲ FWD
            </button>
            <button
              onMouseDown={() => injectKey('a', true)}
              onMouseUp={() => injectKey('a', false)}
              className="px-2 py-1 bg-stone-800 hover:bg-stone-700 active:bg-stone-600 rounded text-[11px] font-bold"
            >
              ◄ L
            </button>
            <button
              onMouseDown={() => injectKey('d', true)}
              onMouseUp={() => injectKey('d', false)}
              className="px-2 py-1 bg-stone-800 hover:bg-stone-700 active:bg-stone-600 rounded text-[11px] font-bold"
            >
              R ►
            </button>
            <button
              onMouseDown={() => injectKey('s', true)}
              onMouseUp={() => injectKey('s', false)}
              className="px-2 py-1 bg-stone-800 hover:bg-stone-700 active:bg-stone-600 rounded text-[11px] font-bold"
            >
              ▼ BACK
            </button>
            <button
              onMouseDown={() => {
                injectKey(' ', true);
                engine.firePlayerWeapon();
                triggerWeaponSound(engine.currentWeapon);
                setAmmo((a) => Math.max(0, a - 1));
              }}
              onMouseUp={() => injectKey(' ', false)}
              className="px-2.5 py-1 bg-red-900/80 hover:bg-red-800 active:bg-red-700 border border-red-700 rounded text-[11px] font-bold text-red-200"
            >
              FIRE RAY
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
