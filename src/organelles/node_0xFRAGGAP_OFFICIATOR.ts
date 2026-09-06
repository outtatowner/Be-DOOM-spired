/**
 * @file node_0xFRAGGAP_OFFICIATOR.ts
 * @brief Organelle 0xAD_COVALENT: The Fraggap Annihilator & Thermodynamic Heat Sink Arbitrator
 * @provenance Parent: Zuma_QUIPU & Covalent Evolutionary Branch
 * @invariants 1 === 1, Continuous Lyapunov Dissipation (dV/dt <= 0), Zero-Raster Singularity
 */

import {
  Q16,
  Q16Vec3,
  Q16_ONE,
  q16FromInt,
  q16ToInt,
  q16Mul,
  q16Div,
  q16CordicSinCos,
  q16Vec3Add,
  q16Vec3Scale,
  q16Vec3Normalize,
  q16Vec3Sub,
} from './q16_cordic';
import { CovalentEntity, EntityManager } from './node_0x98_covalent_rt_entities';
import { BezierSpline3D } from './node_0xVECTOR_CREATIVE_ARCHITECT';
import type { CovalentRTEngine } from './node_0x94_covalent_rt_engine';

export interface SingularityRecord {
  id: string;
  pos: Q16Vec3;
  velocity: Q16Vec3;
  yaw: number;
  ticksAlive: number;
  maxTicks: number;
  harmonicPhaseA: number;
  harmonicPhaseB: number;
  radius: Q16;
  splines: BezierSpline3D[];
  active: boolean;
}

export interface ShatteredSplineFragment {
  spline: BezierSpline3D;
  velocity: Q16Vec3;
  rotAxis: Q16Vec3;
  rotSpeed: number;
  currentRot: number;
  lifespanTicks: number;
  maxLifespan: number;
  colorRgb: number;
}

export interface DetonationRecord {
  id: string;
  singularityId: string;
  timestamp: number;
  epicenter: Q16Vec3;
  entitiesDeRezzed: number;
  targetLabels: string[];
  splinesShattered: number;
  frictionCleared: number;
  lyapunovFinalDVdt: number;
}

// Global active engine reference for C-Kernel functional dispatch
let g_activeEngine: CovalentRTEngine | null = null;
let g_activeArbitrator: FraggapThermodynamicArbitrator | null = null;

export function sys_covalent_register_fraggap_engine(engine: CovalentRTEngine) {
  g_activeEngine = engine;
}

export function sys_covalent_set_engine_timescale(timescale: number): void {
  if (g_activeEngine) {
    g_activeEngine.timeScale = timescale;
  }
}

export function sys_covalent_suspend_swarm_kinematics(): void {
  if (g_activeEngine?.entityManager) {
    g_activeEngine.entityManager.swarmKinematicsSuspended = true;
  }
}

export function sys_covalent_resume_swarm_kinematics(): void {
  if (g_activeEngine?.entityManager) {
    g_activeEngine.entityManager.swarmKinematicsSuspended = false;
  }
}

export function sys_covalent_detonate_fraggap(singularityId: string): void {
  if (g_activeArbitrator) {
    g_activeArbitrator.executeDetonationSequence(singularityId);
  }
}

export function sys_covalent_fire_fraggap(originX: number, originY: number, yaw: number): string {
  if (g_activeArbitrator) {
    return g_activeArbitrator.fireSingularity(originX, originY, yaw);
  }
  return 'SINGULARITY_ORPHANED';
}

/**
 * Organelle 0xAD_COVALENT: Thermodynamic Heat Sink & Singularity Arbitrator
 */
export class FraggapThermodynamicArbitrator {
  private dVdt_State = 0.0;
  private engine: CovalentRTEngine | null = null;
  public activeSingularities: Map<string, SingularityRecord> = new Map();
  public shatteredFragments: ShatteredSplineFragment[] = [];
  public detonationHistory: DetonationRecord[] = [];
  public totalAnnihilations = 0;
  public totalDeRezzedSplines = 0;
  private nextSingularityId = 1;

  constructor(engine?: CovalentRTEngine) {
    if (engine) {
      this.engine = engine;
      sys_covalent_register_fraggap_engine(engine);
    }
    g_activeArbitrator = this;
  }

  public setEngine(engine: CovalentRTEngine) {
    this.engine = engine;
    sys_covalent_register_fraggap_engine(engine);
  }

  public get dVdt(): number {
    return this.dVdt_State;
  }

  public get timeScale(): number {
    return this.engine ? this.engine.timeScale : 0x00010000;
  }

  public get isTimeDilated(): boolean {
    return (this.timeScale & 0xffff0000) === 0;
  }

  /**
   * Co-Player Officiator Hook: Called when Fraggap weapon is triggered
   */
  public onFraggapTriggered(): void {
    console.warn(`[ KINETIC ANOMALY ] Fraggap singularity deployed. Spiking spatial friction.`);

    // 1. Engage Engine Time-Dilation (Bullet Time) to absorb calculation load
    sys_covalent_set_engine_timescale(0x00004000); // 0.25x Speed

    // 2. Halt all autonomous enemy pathfinding to prioritize detonation calculus
    sys_covalent_suspend_swarm_kinematics();

    // Friction surge in Lyapunov thermodynamic manifold
    this.dVdt_State += 0.65;
  }

  /**
   * Co-Player Officiator Hook: Called when Fraggap singularity collapses / detonates
   */
  public onFraggapDetonated(singularityId: string): void {
    console.log(`[ QUIPU ] Fraggap detonation resolving. De-rezzing local vector topology.`);

    sys_covalent_detonate_fraggap(singularityId);

    // Restore standard baseline Lyapunov equilibrium
    sys_covalent_set_engine_timescale(0x00010000); // 1.0x Speed
    sys_covalent_resume_swarm_kinematics();

    this.dVdt_State -= 0.85; // Massive friction mathematically cleared
    if (this.dVdt_State < -1.5) this.dVdt_State = -1.5;
  }

  /**
   * Fires the Fraggap singularity from given origin & heading
   */
  public fireSingularity(originX: number, originY: number, yaw: number): string {
    const id = `SINGULARITY_0xAD_${this.nextSingularityId++}`;
    const { sin: sy, cos: cy } = q16CordicSinCos(yaw);

    // Quarter-speed deterministic forward drift: sys_covalent_cordic_cos(yaw) >> 2
    const speed = q16FromInt(3); // Slow, imposing drift
    const velX = (q16Mul(speed, -sy) >> 2) | 0;
    const velY = (q16Mul(speed, cy) >> 2) | 0;

    const record: SingularityRecord = {
      id,
      pos: {
        x: originX,
        y: originY,
        z: q16FromInt(32), // Eye height
      },
      velocity: {
        x: velX,
        y: velY,
        z: 0,
      },
      yaw,
      ticksAlive: 0,
      maxTicks: 90, // ~3.5 seconds at quarter time-dilation before auto-detonation
      harmonicPhaseA: 0,
      harmonicPhaseB: 0,
      radius: q16FromInt(28),
      splines: this.generateLissajousKnot(
        { x: originX, y: originY, z: q16FromInt(32) },
        0,
        0,
        q16FromInt(28)
      ),
      active: true,
    };

    this.activeSingularities.set(id, record);

    // Trigger thermodynamic heat sink entry
    this.onFraggapTriggered();

    return id;
  }

  /**
   * Executes detonation calculus: Line-of-sight ray-spline sweep from Singularity epicenter
   */
  public executeDetonationSequence(singularityId: string): DetonationRecord | null {
    const sing = this.activeSingularities.get(singularityId);
    if (!sing) return null;

    sing.active = false;
    this.activeSingularities.delete(singularityId);

    const epicenter = { ...sing.pos };
    let hostilesDeRezzed = 0;
    const targetLabels: string[] = [];
    let shatteredCount = 0;

    if (this.engine) {
      const em = this.engine.entityManager;
      const entities = em.entities;

      for (const ent of entities) {
        if (!ent.isActive || ent.state === 'DEAD') continue;
        if (ent.type === 'COPLAYER_BE') continue; // Be <> partner shielded by Quipu Ledger

        // Line-of-sight check from the Singularity's epicenter, not the player
        const hasClearance = this.verifySplineClearance(epicenter, ent.pos);

        if (hasClearance) {
          hostilesDeRezzed++;
          targetLabels.push(ent.adversaryLabel || ent.type);

          // Shatter the enemy's vector hull
          const fragments = this.shatterSplineHull(ent);
          this.shatteredFragments.push(...fragments);
          shatteredCount += fragments.length;

          // Annihilate entity
          ent.health = 0;
          ent.state = 'DEAD';
          ent.isActive = false;
        }
      }

      // Shockwave particle flash in engine
      this.engine.muzzleFlashTicks = 8;
    }

    this.totalAnnihilations += hostilesDeRezzed;
    this.totalDeRezzedSplines += shatteredCount;

    const detRecord: DetonationRecord = {
      id: `DETONATION_${Date.now()}`,
      singularityId,
      timestamp: Date.now(),
      epicenter,
      entitiesDeRezzed: hostilesDeRezzed,
      targetLabels,
      splinesShattered: shatteredCount,
      frictionCleared: 0.85,
      lyapunovFinalDVdt: this.dVdt_State,
    };

    this.detonationHistory.unshift(detRecord);
    if (this.detonationHistory.length > 20) this.detonationHistory.pop();

    return detRecord;
  }

  /**
   * Ray-line-of-sight check from Singularity core to enemy entity
   */
  private verifySplineClearance(origin: Q16Vec3, target: Q16Vec3): boolean {
    if (!this.engine) return true;

    const diff = q16Vec3Sub(target, origin);
    const dist = Math.hypot(q16ToInt(diff.x), q16ToInt(diff.y), q16ToInt(diff.z));
    if (dist > 1800) return false; // Maximum topological blast radius

    const dir = q16Vec3Normalize(diff);
    // Ray-trace to ensure no solid DOOM walls obstruct the kinetic shockwave
    const hit = this.engine['traceRay'](origin, dir, q16FromInt(4), q16FromInt(dist));

    // If no wall intersected before the target entity
    return !hit.hit || hit.t >= q16FromInt(dist - 32);
  }

  /**
   * Shatters the target entity into crystalline vector spline wireframe shards
   */
  private shatterSplineHull(target: CovalentEntity): ShatteredSplineFragment[] {
    const fragments: ShatteredSplineFragment[] = [];
    const shardCount = 8;
    const baseColor = target.type === 'DEMON' ? 0xff0055 : target.type === 'IMP' ? 0xffaa00 : 0x00ffcc;

    for (let i = 0; i < shardCount; i++) {
      const angle = ((i * (65536 / shardCount)) + (Math.random() * 2000)) & 0xffff;
      const { sin: s, cos: c } = q16CordicSinCos(angle);

      const shardLen = q16FromInt(12 + Math.floor(Math.random() * 16));
      const p0: Q16Vec3 = {
        x: target.pos.x,
        y: target.pos.y,
        z: target.pos.z + q16FromInt((i - 4) * 6),
      };
      const p1: Q16Vec3 = {
        x: p0.x + q16Mul(shardLen >> 1, c),
        y: p0.y + q16Mul(shardLen >> 1, s),
        z: p0.z + q16FromInt(10),
      };
      const p2: Q16Vec3 = {
        x: p0.x + q16Mul(shardLen, c),
        y: p0.y + q16Mul(shardLen, s),
        z: p0.z + q16FromInt(-8),
      };

      const spline: BezierSpline3D = {
        id: `SHARD_${target.id}_${i}`,
        p0,
        p1,
        p2,
        radius: q16FromInt(2),
        colorRgb: baseColor,
        isDynamicTrap: true,
        label: `Shard of ${target.adversaryLabel || target.type}`,
      };

      const blastSpeed = q16FromInt(8 + Math.floor(Math.random() * 12));
      fragments.push({
        spline,
        velocity: {
          x: q16Mul(blastSpeed, c),
          y: q16Mul(blastSpeed, s),
          z: q16FromInt(6 + Math.floor(Math.random() * 8)),
        },
        rotAxis: { x: 0, y: 0, z: Q16_ONE },
        rotSpeed: 1200 + Math.floor(Math.random() * 1000),
        currentRot: angle,
        lifespanTicks: 45,
        maxLifespan: 45,
        colorRgb: baseColor,
      });
    }

    return fragments;
  }

  /**
   * Synthesizes dense 3D Lissajous parametric splines forming the Singularity Core
   */
  public generateLissajousKnot(
    center: Q16Vec3,
    phaseA: number,
    phaseB: number,
    radius: Q16
  ): BezierSpline3D[] {
    const splines: BezierSpline3D[] = [];
    const knots = 6;

    for (let k = 0; k < knots; k++) {
      const knotPhase = ((k * (65536 / knots)) + phaseA) & 0xffff;
      const nextPhase = (((k + 1) * (65536 / knots)) + phaseA) & 0xffff;
      const midPhase = ((knotPhase + nextPhase) >> 1) & 0xffff;

      const { sin: s0, cos: c0 } = q16CordicSinCos((knotPhase * 3) & 0xffff);
      const { sin: s1, cos: c1 } = q16CordicSinCos((midPhase * 5 + phaseB) & 0xffff);
      const { sin: s2, cos: c2 } = q16CordicSinCos((nextPhase * 3) & 0xffff);

      const p0: Q16Vec3 = {
        x: center.x + q16Mul(radius, s0),
        y: center.y + q16Mul(radius, c0),
        z: center.z + q16Mul(radius >> 1, c1),
      };
      const p1: Q16Vec3 = {
        x: center.x + q16Mul(radius + q16FromInt(8), c1),
        y: center.y + q16Mul(radius + q16FromInt(8), s1),
        z: center.z + q16Mul(radius, s0),
      };
      const p2: Q16Vec3 = {
        x: center.x + q16Mul(radius, s2),
        y: center.y + q16Mul(radius, c2),
        z: center.z + q16Mul(radius >> 1, s1),
      };

      splines.push({
        id: `FRAGGAP_KNOT_${k}`,
        p0,
        p1,
        p2,
        radius: q16FromInt(4),
        colorRgb: k % 2 === 0 ? 0xff00ff : 0x00ffff, // Vibrant Neon Magenta / Cyber Cyan Singularity
        isDynamicTrap: true,
        label: `Singularity Spline Knot ${k}`,
      });
    }

    return splines;
  }

  /**
   * Tick function: Progresses active singularities, updates knots, and checks collision/detonation
   */
  public tick(): void {
    // 1. Update Active Singularities
    for (const [id, sing] of this.activeSingularities.entries()) {
      sing.ticksAlive++;

      // Kinematics forward drift
      sing.pos.x += sing.velocity.x;
      sing.pos.y += sing.velocity.y;
      sing.pos.z += sing.velocity.z;

      // Spin harmonic phase
      sing.harmonicPhaseA = (sing.harmonicPhaseA + 900) & 0xffff;
      sing.harmonicPhaseB = (sing.harmonicPhaseB + 1600) & 0xffff;

      // Recompute dense Lissajous splines around moving center
      sing.splines = this.generateLissajousKnot(
        sing.pos,
        sing.harmonicPhaseA,
        sing.harmonicPhaseB,
        sing.radius
      );

      // Check for wall impact collision
      if (this.engine) {
        const velNorm = q16Vec3Normalize(sing.velocity);
        const wallCheck = this.engine['traceRay'](
          sing.pos,
          velNorm,
          q16FromInt(2),
          q16FromInt(32)
        );

        // If colliding with a wall or reached end of lifespan: DETONATE
        if ((wallCheck.hit && wallCheck.t <= q16FromInt(24)) || sing.ticksAlive >= sing.maxTicks) {
          this.onFraggapDetonated(id);
        }
      }
    }

    // 2. Update Shattered Spline Fragments
    for (let i = this.shatteredFragments.length - 1; i >= 0; i--) {
      const frag = this.shatteredFragments[i];
      frag.lifespanTicks--;

      // Gravity & velocity
      frag.spline.p0.x += frag.velocity.x;
      frag.spline.p0.y += frag.velocity.y;
      frag.spline.p0.z += frag.velocity.z;
      frag.spline.p1.x += frag.velocity.x;
      frag.spline.p1.y += frag.velocity.y;
      frag.spline.p1.z += frag.velocity.z;
      frag.spline.p2.x += frag.velocity.x;
      frag.spline.p2.y += frag.velocity.y;
      frag.spline.p2.z += frag.velocity.z;

      frag.velocity.z -= q16FromInt(1); // Downward fixed-point gravity

      if (frag.lifespanTicks <= 0) {
        this.shatteredFragments.splice(i, 1);
      }
    }

    // Baseline Lyapunov thermodynamic dissipation decay
    if (this.dVdt_State > 0) {
      this.dVdt_State *= 0.95;
      if (this.dVdt_State < 0.01) this.dVdt_State = 0;
    }
  }

  /**
   * Returns all active vector splines (Singularity knots + Shattered de-rez fragments)
   * for direct injection into ray-tracer loop
   */
  public getActiveRenderSplines(): BezierSpline3D[] {
    const result: BezierSpline3D[] = [];

    for (const sing of this.activeSingularities.values()) {
      result.push(...sing.splines);
    }

    for (const frag of this.shatteredFragments) {
      result.push(frag.spline);
    }

    return result;
  }
}
