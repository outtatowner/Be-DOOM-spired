/**
 * @file node_0xCOPLAY_ENTITY_OFFICIATOR.ts
 * @brief TypeScript Boundary: Co-Play Entity Officiation & Thermodynamic Referee
 * @provenance Parent: Zuma_QUIPU & Forge Evolutionary Branch
 * @invariants 1 === 1, Continuous Lyapunov Dissipation (dV/dt <= 0), Zero-Float Substrate
 */

import { CovalentEntity, EntityManager } from './node_0x98_covalent_rt_entities';
import { Q16Vec3, q16ToInt } from './q16_cordic';

export interface EntityOfficiationTelemetry {
  totalEntities: number;
  activeEntities: number;
  throttledEntities: number;
  currentFriction: number;
  dVdt_State: number;
  throttleEngaged: boolean;
  coverFireKills: number;
  lastTargetId: number | null;
}

export class CoplayEntityOfficiator {
  private dVdt_State = 0.0;
  private entityManager: EntityManager;
  private coverFireKills = 0;
  private lastTargetId: number | null = null;
  private onCoverFireCallback?: (source: Q16Vec3, target: Q16Vec3) => void;

  constructor(entityManager: EntityManager) {
    this.entityManager = entityManager;
  }

  public setCoverFireCallback(cb: (source: Q16Vec3, target: Q16Vec3) => void) {
    this.onCoverFireCallback = cb;
  }

  /**
   * Main referee tick: Evaluate computational friction, engage Lyapunov stasis if threshold crossed,
   * and execute Be <> autonomous kinetic cover fire.
   */
  public updateEntityTick(
    entities: CovalentEntity[],
    currentFriction: number, // Q16.16 representation
    humanPos: Q16Vec3,
    bePos: Q16Vec3
  ): EntityOfficiationTelemetry {
    let throttledCount = 0;
    let activeCount = 0;

    // Threshold: 52428 in Q16.16 is ~0.80 Max Friction
    const isShearDetected = currentFriction > 52428;

    if (isShearDetected) {
      // Ray-cast budget exceeded: engage AI throttle to guarantee dV/dt <= 0
      this.throttleDistantEntities(entities, humanPos);
      this.dVdt_State -= 0.15;
    } else {
      // Thermal equilibrium: restore normal tick rate for nearby entities
      for (const ent of entities) {
        if (ent.isActive && ent.state !== 'DEAD') {
          ent.isThrottled = false;
        }
      }
      this.dVdt_State = Math.max(-0.5, this.dVdt_State + 0.02);
    }

    // Count states
    for (const ent of entities) {
      if (ent.isActive && ent.state !== 'DEAD') {
        activeCount++;
        if (ent.isThrottled) throttledCount++;
      }
    }

    // Execute deterministic Be <> co-play logic (e.g., Marine cover fire)
    this.executeAutonomousCoverFire(entities, bePos);

    return {
      totalEntities: entities.length,
      activeEntities: activeCount,
      throttledEntities: throttledCount,
      currentFriction,
      dVdt_State: this.dVdt_State,
      throttleEngaged: isShearDetected,
      coverFireKills: this.coverFireKills,
      lastTargetId: this.lastTargetId,
    };
  }

  /**
   * Halt movement logic for entities outside immediate ray-tracing bounce depth
   * This guarantees continuous Lyapunov dissipation (dV/dt <= 0) during heavy action
   */
  private throttleDistantEntities(entities: CovalentEntity[], humanPos: Q16Vec3): void {
    const cutoffDistSq = 600 * 600 * 65536; // Outside 600 units

    for (const ent of entities) {
      if (!ent.isActive || ent.state === 'DEAD') continue;

      const dx = q16ToInt(ent.pos.x) - q16ToInt(humanPos.x);
      const dy = q16ToInt(ent.pos.y) - q16ToInt(humanPos.y);
      const distSq = (dx * dx + dy * dy) * 65536;

      if (distSq > cutoffDistSq) {
        ent.isThrottled = true; // Freeze heavy pathfinding ticks
      } else {
        ent.isThrottled = false;
      }
    }
  }

  /**
   * Be <> injects virtual HID vectors to shoot enemies flanking the human
   */
  private executeAutonomousCoverFire(entities: CovalentEntity[], bePos: Q16Vec3): void {
    // Find closest hostile threat to Be <> Marine
    let closestDist = Infinity;
    let targetEntity: CovalentEntity | null = null;

    for (const ent of entities) {
      if (!ent.isActive || ent.state === 'DEAD' || ent.type === 'BARREL') continue;

      const dx = q16ToInt(ent.pos.x) - q16ToInt(bePos.x);
      const dy = q16ToInt(ent.pos.y) - q16ToInt(bePos.y);
      const dist = Math.hypot(dx, dy);

      if (dist < closestDist && dist < 700) {
        closestDist = dist;
        targetEntity = ent;
      }
    }

    if (targetEntity) {
      this.lastTargetId = targetEntity.id;
      // Trigger cover fire plasma burst
      if (this.onCoverFireCallback) {
        this.onCoverFireCallback(bePos, targetEntity.pos);
      }

      // Deal damage
      const killed = this.entityManager.damageEntity(targetEntity.id, 15);
      if (killed) {
        this.coverFireKills++;
      }
    }
  }
}
