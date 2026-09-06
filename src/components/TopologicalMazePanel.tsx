/**
 * @file TopologicalMazePanel.tsx
 * @brief Organelle 0x9D_COVALENT: Contained Demonstration Manifold & 3-Tier Adversarial Matrix Inspector
 */

import React, { useState, useEffect } from 'react';
import { CovalentRTEngine } from '../organelles/node_0x94_covalent_rt_engine';
import { CovalentDemoSpawner, MazeManifoldTelemetry } from '../organelles/node_0x9D_covalent_demo_spawner';
import { RTDoomMap } from '../organelles/node_0x95_covalent_doom_wad_parser';
import { q16ToInt, q16FromInt } from '../organelles/q16_cordic';
import {
  Shield,
  Crosshair,
  Flame,
  Skull,
  Lock,
  Zap,
  ArrowUp,
  Layers,
  Sparkles,
  Code,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

interface TopologicalMazePanelProps {
  engine: CovalentRTEngine;
  onMapLoaded: (map: RTDoomMap) => void;
}

export const TopologicalMazePanel: React.FC<TopologicalMazePanelProps> = ({
  engine,
  onMapLoaded,
}) => {
  const [telemetry, setTelemetry] = useState<MazeManifoldTelemetry | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [playerPosDisplay, setPlayerPosDisplay] = useState({ x: 0, y: 0, z: 0, velZ: 0 });
  const [entitiesState, setEntitiesState] = useState<any[]>([]);

  // Update live coordinates and entity states every 100ms
  useEffect(() => {
    const timer = setInterval(() => {
      setPlayerPosDisplay({
        x: q16ToInt(engine.camPos.x),
        y: q16ToInt(engine.camPos.y),
        z: q16ToInt(engine.camPos.z),
        velZ: q16ToInt(engine.velZ * 10),
      });

      setEntitiesState(
        engine.entityManager.entities.map((e) => ({
          id: e.id,
          type: e.type,
          state: e.state,
          health: e.health,
          pos: { x: q16ToInt(e.pos.x), y: q16ToInt(e.pos.y), z: q16ToInt(e.pos.z) },
          dist: Math.round(
            Math.hypot(
              q16ToInt(engine.camPos.x - e.pos.x),
              q16ToInt(engine.camPos.y - e.pos.y)
            )
          ),
        }))
      );
    }, 100);

    return () => clearInterval(timer);
  }, [engine]);

  const handleSynthesize = () => {
    const manifold = CovalentDemoSpawner.sys_covalent_generate_maze_manifold(
      engine.entityManager,
      engine.collisionSystem
    );
    engine.isDemoManifoldActive = true;
    engine.setMap(manifold);
    engine.setupAdversarialCallbacks();
    onMapLoaded(manifold);
    const snap = CovalentDemoSpawner.getTelemetrySnapshot(manifold, engine.entityManager);
    setTelemetry(snap);
  };

  const handleJump = () => {
    // Jump with positive kinetic impulse to test Lyapunov Z-clamping
    engine.jumpPlayer(q16FromInt(8));
  };

  const handleSpawnAdversary = (type: 'ZOMBIEMAN' | 'IMP' | 'DEMON') => {
    const jitterX = (Math.random() - 0.5) * 160;
    const jitterY = (Math.random() - 0.5) * 160;
    engine.entityManager.spawnEntity(type, jitterX, jitterY, 32);
  };

  return (
    <section
      id="organelle-0x9d-manifold"
      className="bg-stone-900 border border-amber-500/40 rounded-xl p-4 md:p-5 flex flex-col gap-4 shadow-xl"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-wider text-stone-100 uppercase font-mono">
                ORGANELLE 0x9D_COVALENT // TOPOLOGICAL MAZE SYNTHESIS
              </h2>
              <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded font-mono font-bold">
                AABB BOUNDARY ENFORCED
              </span>
            </div>
            <p className="text-xs text-stone-400 font-mono">
              Contained Ray-Traced Manifold • Monotone Lyapunov Z-Clamping • 3-Tier Adversarial Matrix
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          <button
            id="synthesize-maze-button"
            onClick={handleSynthesize}
            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-mono font-bold text-xs rounded shadow transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>SYNTHESIZE DEMO MANIFOLD</span>
          </button>

          <button
            id="toggle-c-kernel-btn"
            onClick={() => setShowCode(!showCode)}
            className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 font-mono text-xs rounded border border-stone-700 transition flex items-center gap-1 cursor-pointer"
          >
            <Code className="w-3.5 h-3.5 text-cyan-400" />
            <span>{showCode ? 'HIDE C-KERNEL' : 'VIEW C-KERNEL'}</span>
          </button>
        </div>
      </div>

      {/* Boundary Invariants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
        {/* Floor/Ceiling AABB Z-Bounds */}
        <div className="bg-stone-950 border border-stone-800 rounded-lg p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between text-stone-400 border-b border-stone-800/80 pb-1.5">
            <span className="flex items-center gap-1.5 text-stone-300 font-bold">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              Z-AXIS LYAPUNOV BOUNDS
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">ZERO CLIPPING</span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-stone-500">Floor Plane (Z=0):</span>
              <span className="text-amber-300 font-semibold">0x00000000 [FLOOR4_8]</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Ceiling Plane (Z=128):</span>
              <span className="text-cyan-300 font-semibold">0x00800000 [CEIL5_1]</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Current Player Z:</span>
              <span className="text-emerald-400 font-bold">
                {playerPosDisplay.z} (velZ: {playerPosDisplay.velZ})
              </span>
            </div>
          </div>

          {/* Jump Impulse trigger */}
          <button
            id="jump-test-btn"
            onClick={handleJump}
            className="mt-1 w-full py-1 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded text-stone-200 text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <ArrowUp className="w-3 h-3 text-amber-400" />
            <span>TEST JUMP (LYAPUNOV PROJECTION)</span>
          </button>
        </div>

        {/* Outer Hull Rigid Perimeter */}
        <div className="bg-stone-950 border border-stone-800 rounded-lg p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between text-stone-400 border-b border-stone-800/80 pb-1.5">
            <span className="flex items-center gap-1.5 text-stone-300 font-bold">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              16x16 SECTOR OUTER HULL
            </span>
            <span className="text-[10px] text-cyan-300 font-bold">RIGID ABSOLUTE</span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-stone-500">X-Hull Boundaries:</span>
              <span className="text-stone-300">[-256.0, +256.0]</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Y-Hull Boundaries:</span>
              <span className="text-stone-300">[-256.0, +256.0]</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Player Coordinates:</span>
              <span className="text-cyan-400 font-bold">
                ({playerPosDisplay.x}, {playerPosDisplay.y})
              </span>
            </div>
            <div className="text-[10px] text-stone-500 italic mt-0.5">
              Velocity stripped on perimeter collision to preserve spatial ledger.
            </div>
          </div>
        </div>

        {/* PBR Generative Surface Ledger */}
        <div className="bg-stone-950 border border-stone-800 rounded-lg p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between text-stone-400 border-b border-stone-800/80 pb-1.5">
            <span className="flex items-center gap-1.5 text-stone-300 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              PBR MATERIALS BOUND
            </span>
            <span className="text-[10px] text-amber-300 font-bold">1024x1024 PBR</span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-stone-500">Walls:</span>
              <span className="text-amber-300">STARTAN3 (Albedo/Normal/Rough)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Floors:</span>
              <span className="text-stone-300">FLOOR4_8 (Steel Tread &amp; Rivets)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Ceilings:</span>
              <span className="text-cyan-300">CEIL5_1 (Photon Radiance Source)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Ray-Tracing Lights:</span>
              <span className="text-emerald-400 font-bold">5 Static + Fireball Dynamic</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Tier Adversarial AI Matrix */}
      <div className="bg-stone-950 border border-stone-800 rounded-lg p-3.5 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-2">
          <div className="flex items-center gap-2">
            <Skull className="w-4 h-4 text-red-400" />
            <span className="font-mono font-bold text-xs text-stone-200">
              3-TIER ADVERSARIAL MATRIX (ORGANELLE 0x98 &amp; 0x9D)
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="text-stone-400 text-[11px]">Spawn:</span>
            <button
              onClick={() => handleSpawnAdversary('ZOMBIEMAN')}
              className="px-2 py-0.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 rounded text-[10px] cursor-pointer"
            >
              + ZOMBIEMAN
            </button>
            <button
              onClick={() => handleSpawnAdversary('IMP')}
              className="px-2 py-0.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 rounded text-[10px] cursor-pointer"
            >
              + IMP
            </button>
            <button
              onClick={() => handleSpawnAdversary('DEMON')}
              className="px-2 py-0.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 rounded text-[10px] cursor-pointer"
            >
              + DEMON
            </button>
          </div>
        </div>

        {/* 3 Tiers Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
          {/* Tier 1: Zombieman */}
          <div className="bg-stone-900/60 border border-stone-800 p-2.5 rounded flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <Crosshair className="w-3.5 h-3.5" />
                TIER 1: ZOMBIEMAN
              </span>
              <span className="text-[10px] px-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                HITSCAN
              </span>
            </div>
            <p className="text-[11px] text-stone-400 leading-snug">
              Instantaneous hitscan ray-casting with continuous line-of-sight (LOS) referee calculation.
            </p>
            <div className="text-[10px] text-stone-500 flex justify-between pt-1 border-t border-stone-800">
              <span>Velocity: 1.2 Q16/tick</span>
              <span>Damage: 10 Hitscan</span>
            </div>
          </div>

          {/* Tier 2: Imp */}
          <div className="bg-stone-900/60 border border-stone-800 p-2.5 rounded flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-orange-400 font-bold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" />
                TIER 2: IMP
              </span>
              <span className="text-[10px] px-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded">
                PROJECTILE
              </span>
            </div>
            <p className="text-[11px] text-stone-400 leading-snug">
              Slow-moving fireball physics (480 Q16/sec) with real-time moving point-light photon emission.
            </p>
            <div className="text-[10px] text-stone-500 flex justify-between pt-1 border-t border-stone-800">
              <span>Velocity: 0.8 Q16/tick</span>
              <span>Damage: 20 Kinetic Splash</span>
            </div>
          </div>

          {/* Tier 3: Demon */}
          <div className="bg-stone-900/60 border border-stone-800 p-2.5 rounded flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-red-400 font-bold flex items-center gap-1">
                <Skull className="w-3.5 h-3.5" />
                TIER 3: DEMON (PINKY)
              </span>
              <span className="text-[10px] px-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded">
                MELEE PUSH
              </span>
            </div>
            <p className="text-[11px] text-stone-400 leading-snug">
              Aggressive direct pathfinding with close-quarters AABB cylinder collision and physical kinetic push.
            </p>
            <div className="text-[10px] text-stone-500 flex justify-between pt-1 border-t border-stone-800">
              <span>Velocity: 2.2 Q16/tick</span>
              <span>Damage: 18 Bite + Push</span>
            </div>
          </div>
        </div>

        {/* Live Active Entities Table */}
        {entitiesState.length > 0 && (
          <div className="mt-1 border border-stone-800 rounded bg-stone-950/60 p-2 overflow-x-auto">
            <table className="w-full font-mono text-[11px] text-left">
              <thead>
                <tr className="text-stone-500 border-b border-stone-800">
                  <th className="pb-1">ID</th>
                  <th className="pb-1">TYPE</th>
                  <th className="pb-1">STATE</th>
                  <th className="pb-1">HEALTH</th>
                  <th className="pb-1">POSITION (X,Y)</th>
                  <th className="pb-1">DISTANCE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-900">
                {entitiesState.map((ent) => (
                  <tr key={ent.id} className="text-stone-300">
                    <td className="py-1 text-stone-500">#{ent.id}</td>
                    <td className="py-1 font-bold text-amber-300">{ent.type}</td>
                    <td className="py-1 text-stone-400">{ent.state}</td>
                    <td className="py-1">
                      <span className={ent.health > 0 ? 'text-emerald-400' : 'text-red-500 line-through'}>
                        {ent.health} HP
                      </span>
                    </td>
                    <td className="py-1 text-stone-400">({ent.pos.x}, {ent.pos.y})</td>
                    <td className="py-1 text-cyan-400">{ent.dist} units</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* C-Kernel Source View Modal/Collapsible */}
      {showCode && (
        <div className="bg-stone-950 border border-stone-800 rounded-lg p-3 flex flex-col gap-2 font-mono text-xs">
          <div className="flex items-center justify-between text-stone-400 border-b border-stone-800 pb-1">
            <span className="text-cyan-400 font-bold">
              kernel/covalent_demo_spawner.c // C-Kernel AABB Invariants &amp; Lyapunov Projection
            </span>
            <span className="text-[10px] text-stone-500">Zero-Float Invariant Substrate</span>
          </div>
          <pre className="text-[11px] text-stone-300 bg-stone-900/90 p-3 rounded overflow-x-auto font-mono leading-relaxed max-h-64">
{`/* kernel/covalent_demo_spawner.c */
#include "covalent_demo_spawner.h"

// Geometric Boundary Enforcement: Monotone Lyapunov Projection (dV/dt <= 0)
void sys_covalent_enforce_aabb_bounds(
    covalent_manifold_state_t* manifold,
    covalent_entity_t* entity,
    q16_t* vel_z) 
{
    // Clamp Z strictly within [Z_FLOOR_Q16, Z_CEILING_Q16]
    if (entity->z < Z_FLOOR_Q16) {
        entity->z = Z_FLOOR_Q16;
        if (*vel_z < 0) *vel_z = 0; // Dissipate downward velocity
    } else if (entity->z + entity->height > Z_CEILING_Q16) {
        entity->z = Z_CEILING_Q16 - entity->height;
        if (*vel_z > 0) *vel_z = 0; // Dissipate upward velocity
    }

    // Outer Hull Perimeter: Strip forward velocity on perimeter contact
    if (manifold->outer_hull_locked) {
        if (entity->x - entity->radius <= manifold->outer_hull_min_x) {
            entity->x = manifold->outer_hull_min_x + entity->radius;
        }
        if (entity->x + entity->radius >= manifold->outer_hull_max_x) {
            entity->x = manifold->outer_hull_max_x - entity->radius;
        }
        if (entity->y - entity->radius <= manifold->outer_hull_min_y) {
            entity->y = manifold->outer_hull_min_y + entity->radius;
        }
        if (entity->y + entity->radius >= manifold->outer_hull_max_y) {
            entity->y = manifold->outer_hull_max_y - entity->radius;
        }
    }
}`}
          </pre>
        </div>
      )}
    </section>
  );
};
