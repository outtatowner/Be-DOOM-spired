/**
 * @file node_0x9A_covalent_rt_ballistics.ts
 * @brief Organelle 0x9A_COVALENT: Hitscan Ray-Casting & Projectiles
 * @provenance Parent: Zuma_QUIPU & Forge Evolutionary Branch
 * @invariants 1 === 1, Continuous Lyapunov Dissipation (dV/dt <= 0), Zero-Float Ballistics
 */

import {
  Q16,
  Q16Vec3,
  q16FromInt,
  q16ToInt,
  q16Mul,
  q16Div,
  q16Vec3Add,
  q16Vec3Scale,
  q16Vec3Normalize,
  q16CordicSinCos,
} from './q16_cordic';
import { EntityManager, CovalentEntity } from './node_0x98_covalent_rt_entities';

export type WeaponType = 'PISTOL' | 'SHOTGUN' | 'CHAINGUN' | 'ROCKET' | 'PLASMA' | 'FRAGGAP';

export interface CovalentProjectile {
  id: number;
  type: 'ROCKET' | 'PLASMA' | 'FIREBALL' | 'FRAGGAP_SINGULARITY';
  pos: Q16Vec3;
  velocity: Q16Vec3;
  radius: Q16;
  damage: number;
  lifetimeTicks: number;
  isActive: boolean;
  isFromPlayer: boolean;
  color: number;
  singularityId?: string;
}

export interface HitscanResult {
  hit: boolean;
  entityHit?: CovalentEntity;
  distance: Q16;
  hitPoint: Q16Vec3;
}

export class CovalentBallisticsSystem {
  public projectiles: CovalentProjectile[] = [];
  private nextId = 1;
  private entityManager: EntityManager;
  public particleEmissionsEnabled = true; // Can be disabled by CoplayBallisticsOfficiator during shear

  constructor(entityManager: EntityManager) {
    this.entityManager = entityManager;
  }

  /**
   * Reuses the core rendering ray-caster for instant hitscan validation
   */
  public fireHitscan(
    origin: Q16Vec3,
    forward: Q16Vec3,
    damage: number,
    traceRayWallDistance: (origin: Q16Vec3, dir: Q16Vec3) => { dist: Q16; hit: boolean }
  ): HitscanResult {
    // 1. Ray-cast to find closest wall distance
    const wallHit = traceRayWallDistance(origin, forward);
    const maxDistance = wallHit.hit ? wallHit.dist : q16FromInt(2048);

    // 2. Intersect with entities along ray
    const entHit = this.entityManager.intersectRayEntities(
      origin,
      forward,
      q16FromInt(8),
      maxDistance
    );

    if (entHit && entHit.hit) {
      this.entityManager.damageEntity(entHit.entity.id, damage);
      return {
        hit: true,
        entityHit: entHit.entity,
        distance: entHit.t,
        hitPoint: entHit.point,
      };
    }

    return {
      hit: wallHit.hit,
      distance: maxDistance,
      hitPoint: q16Vec3Add(origin, q16Vec3Scale(forward, maxDistance)),
    };
  }

  /**
   * Spawn a kinetic projectile in flight (Rocket or Plasma bolt)
   */
  /**
   * Spawn a kinetic projectile in flight (Rocket, Plasma bolt, or Imp Fireball)
   */
  public spawnProjectile(
    type: 'ROCKET' | 'PLASMA' | 'FIREBALL' | 'FRAGGAP_SINGULARITY',
    origin: Q16Vec3,
    direction: Q16Vec3,
    isFromPlayer: boolean,
    singularityId?: string
  ): CovalentProjectile {
    const speed = type === 'ROCKET' ? q16FromInt(14) : type === 'PLASMA' ? q16FromInt(20) : type === 'FIREBALL' ? q16FromInt(7) : q16FromInt(4);
    const radius = type === 'ROCKET' ? q16FromInt(12) : type === 'PLASMA' ? q16FromInt(8) : type === 'FIREBALL' ? q16FromInt(10) : q16FromInt(28);
    const damage = type === 'ROCKET' ? 100 : type === 'PLASMA' ? 25 : type === 'FIREBALL' ? 20 : 9999;
    // Fiery Orange vs Cyan Plasma vs Glowing Molten Crimson/Gold Fireball vs Neon Magenta Singularity
    const color = type === 'ROCKET' ? 0xffffaa00 : type === 'PLASMA' ? 0xff00ffff : type === 'FIREBALL' ? 0xffff5500 : 0xffff00ff;

    const proj: CovalentProjectile = {
      id: this.nextId++,
      type,
      pos: { ...origin },
      velocity: {
        x: q16Mul(direction.x, speed),
        y: q16Mul(direction.y, speed),
        z: q16Mul(direction.z, speed),
      },
      radius,
      damage,
      lifetimeTicks: type === 'FRAGGAP_SINGULARITY' ? 90 : 180,
      isActive: true,
      isFromPlayer,
      color,
      singularityId,
    };

    this.projectiles.push(proj);
    return proj;
  }

  /**
   * Launch a salvo / volley of projectiles (e.g., test load for Lyapunov shear)
   */
  public spawnVolley(count: number, origin: Q16Vec3, baseDir: Q16Vec3) {
    for (let i = 0; i < count; i++) {
      const angleJitter = ((i - count / 2) * 5 * (65536 / 360)) & 0xffff;
      const { sin: s, cos: c } = q16CordicSinCos(angleJitter);
      const jitteredDir: Q16Vec3 = {
        x: q16Mul(baseDir.x, c) - q16Mul(baseDir.y, s),
        y: q16Mul(baseDir.x, s) + q16Mul(baseDir.y, c),
        z: baseDir.z,
      };
      this.spawnProjectile(i % 2 === 0 ? 'ROCKET' : 'PLASMA', origin, jitteredDir, true);
    }
  }

  /**
   * Update all kinetic payloads in flight
   */
  public updateProjectiles(
    traceRayWallDistance: (origin: Q16Vec3, dir: Q16Vec3) => { dist: Q16; hit: boolean },
    playerPos?: Q16Vec3,
    onPlayerHit?: (damage: number) => void
  ) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (!p.isActive) {
        this.projectiles.splice(i, 1);
        continue;
      }

      p.pos.x += p.velocity.x;
      p.pos.y += p.velocity.y;
      p.pos.z += p.velocity.z;
      p.lifetimeTicks--;

      // Check collision with player for enemy projectiles (Fireballs)
      if (!p.isFromPlayer && playerPos) {
        const dx = q16ToInt(playerPos.x - p.pos.x);
        const dy = q16ToInt(playerPos.y - p.pos.y);
        const dz = q16ToInt(playerPos.z - p.pos.z);
        const dist = Math.hypot(dx, dy, dz);
        if (dist < 30) {
          p.isActive = false;
          onPlayerHit?.(p.damage);
          continue;
        }
      }

      // Check collision with enemies for player projectiles
      if (p.isFromPlayer) {
        for (const ent of this.entityManager.entities) {
          if (!ent.isActive || ent.state === 'DEAD') continue;
          const dx = q16ToInt(ent.pos.x - p.pos.x);
          const dy = q16ToInt(ent.pos.y - p.pos.y);
          const dz = q16ToInt(ent.pos.z - p.pos.z);
          const dist = Math.hypot(dx, dy, dz);

          if (dist < 32) {
            p.isActive = false;
            this.entityManager.damageEntity(ent.id, p.damage);

            // If rocket, cause area splash damage to nearby entities
            if (p.type === 'ROCKET') {
              this.applySplashDamage(p.pos, 80, 150);
            }
            break;
          }
        }
      }

      if (p.lifetimeTicks <= 0) {
        p.isActive = false;
      }
    }
  }

  private applySplashDamage(center: Q16Vec3, splashRadius: number, maxDamage: number) {
    for (const ent of this.entityManager.entities) {
      if (!ent.isActive || ent.state === 'DEAD') continue;
      const dx = q16ToInt(ent.pos.x - center.x);
      const dy = q16ToInt(ent.pos.y - center.y);
      const dist = Math.hypot(dx, dy);

      if (dist < splashRadius) {
        const dmg = Math.round(maxDamage * (1 - dist / splashRadius));
        this.entityManager.damageEntity(ent.id, dmg);
      }
    }
  }

  public getActiveProjectileCount(): number {
    return this.projectiles.filter((p) => p.isActive).length;
  }
}
