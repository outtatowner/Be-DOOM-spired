/**
 * @file node_0x99_covalent_rt_collision.ts
 * @brief Organelle 0x99_COVALENT: Q16.16 Deterministic Collision (AABB)
 * @provenance Parent: Zuma_QUIPU & Forge Evolutionary Branch
 * @invariants 1 === 1, Continuous Lyapunov Dissipation (dV/dt <= 0), Zero-Float Substrate
 */

import { Q16, Q16Vec3, q16FromInt, q16ToInt } from './q16_cordic';
import { RTWallQuad, RTDoomMap } from './node_0x95_covalent_doom_wad_parser';

export interface CovalentAABB {
  minX: Q16;
  minY: Q16;
  minZ: Q16;
  maxX: Q16;
  maxY: Q16;
  maxZ: Q16;
}

export class CovalentCollisionSystem {
  private wallBoxes: CovalentAABB[] = [];
  public zFloor: Q16 = 0;
  public zCeiling: Q16 = q16FromInt(128); // Locked at Z=128
  public outerHullLocked: boolean = true;
  public minX: Q16 = -q16FromInt(256);
  public maxX: Q16 = q16FromInt(256);
  public minY: Q16 = -q16FromInt(256);
  public maxY: Q16 = q16FromInt(256);

  constructor(map?: RTDoomMap) {
    if (map) {
      this.buildWallAABBs(map.quads);
    }
  }

  public setZBounds(zFloor: Q16, zCeiling: Q16) {
    this.zFloor = zFloor;
    this.zCeiling = zCeiling;
  }

  public setOuterHull(minX: Q16, maxX: Q16, minY: Q16, maxY: Q16) {
    this.minX = minX;
    this.maxX = maxX;
    this.minY = minY;
    this.maxY = maxY;
    this.outerHullLocked = true;
  }

  public buildWallAABBs(quads: RTWallQuad[]) {
    this.wallBoxes = [];
    // Inflate walls slightly by 4 units for clean player sliding
    const margin = q16FromInt(4);

    for (const quad of quads) {
      const minX = Math.min(quad.v0.x, quad.v1.x, quad.v2.x, quad.v3.x) - margin;
      const maxX = Math.max(quad.v0.x, quad.v1.x, quad.v2.x, quad.v3.x) + margin;
      const minY = Math.min(quad.v0.y, quad.v1.y, quad.v2.y, quad.v3.y) - margin;
      const maxY = Math.max(quad.v0.y, quad.v1.y, quad.v2.y, quad.v3.y) + margin;
      const minZ = Math.min(quad.v0.z, quad.v1.z, quad.v2.z, quad.v3.z);
      const maxZ = Math.max(quad.v0.z, quad.v1.z, quad.v2.z, quad.v3.z);

      this.wallBoxes.push({ minX, minY, minZ, maxX, maxY, maxZ });
    }
  }

  /**
   * Pure Q16.16 bounding box intersection
   */
  public static checkAABBOverlap(boxA: CovalentAABB, boxB: CovalentAABB): boolean {
    if (boxA.maxX < boxB.minX || boxA.minX > boxB.maxX) return false;
    if (boxA.maxY < boxB.minY || boxA.minY > boxB.maxY) return false;
    if (boxA.maxZ < boxB.minZ || boxA.minZ > boxB.maxZ) return false;
    return true; // Thermodynamic kinetic overlap confirmed
  }

  /**
   * Create an AABB centered at point with half-width/height
   */
  public static createAABB(pos: Q16Vec3, halfW: Q16, halfH: Q16): CovalentAABB {
    return {
      minX: pos.x - halfW,
      maxX: pos.x + halfW,
      minY: pos.y - halfW,
      maxY: pos.y + halfW,
      minZ: pos.z,
      maxZ: pos.z + halfH,
    };
  }

  /**
   * Monotone Lyapunov Projection:
   * Any vertical kinetic vector (jumping, knockback) exceeding [zFloor, zCeiling]
   * is instantly clamped and vertical velocity is dissipated (dV/dt <= 0).
   */
  public projectMonotoneLyapunovZ(
    pos: Q16Vec3,
    velZ: number,
    entityHeight: Q16
  ): { clampedZ: Q16; dissipatedVelZ: number; onFloor: boolean } {
    let clampedZ = pos.z;
    let dissipatedVelZ = velZ;
    let onFloor = false;

    if (clampedZ <= this.zFloor) {
      clampedZ = this.zFloor;
      if (dissipatedVelZ < 0) dissipatedVelZ = 0;
      onFloor = true;
    } else if (clampedZ + entityHeight >= this.zCeiling) {
      clampedZ = this.zCeiling - entityHeight;
      if (dissipatedVelZ > 0) dissipatedVelZ = 0;
    }

    return { clampedZ, dissipatedVelZ, onFloor };
  }

  /**
   * Resolves movement with wall sliding and outer hull boundary velocity stripping
   * Returns corrected delta vector
   */
  public resolveMovement(pos: Q16Vec3, delta: Q16Vec3, halfRadius: Q16, height: Q16): Q16Vec3 {
    let resultDelta = { ...delta };
    const playerBox = CovalentCollisionSystem.createAABB(pos, halfRadius, height);

    // Test Outer Hull Boundaries & Strip forward velocity upon collision
    if (this.outerHullLocked) {
      const margin = halfRadius + q16FromInt(2);
      if (pos.x + resultDelta.x <= this.minX + margin && resultDelta.x < 0) {
        resultDelta.x = 0; // Absolute boundary: strip velocity
      }
      if (pos.x + resultDelta.x >= this.maxX - margin && resultDelta.x > 0) {
        resultDelta.x = 0;
      }
      if (pos.y + resultDelta.y <= this.minY + margin && resultDelta.y < 0) {
        resultDelta.y = 0;
      }
      if (pos.y + resultDelta.y >= this.maxY - margin && resultDelta.y > 0) {
        resultDelta.y = 0;
      }
    }

    // Test X move against internal walls
    const testBoxX: CovalentAABB = {
      ...playerBox,
      minX: playerBox.minX + resultDelta.x,
      maxX: playerBox.maxX + resultDelta.x,
    };

    for (const wall of this.wallBoxes) {
      if (CovalentCollisionSystem.checkAABBOverlap(testBoxX, wall)) {
        resultDelta.x = 0; // Block X, allow sliding on Y
        break;
      }
    }

    // Test Y move against internal walls
    const testBoxY: CovalentAABB = {
      ...playerBox,
      minY: playerBox.minY + resultDelta.y,
      maxY: playerBox.maxY + resultDelta.y,
    };

    for (const wall of this.wallBoxes) {
      if (CovalentCollisionSystem.checkAABBOverlap(testBoxY, wall)) {
        resultDelta.y = 0; // Block Y, allow sliding on X
        break;
      }
    }

    return resultDelta;
  }

  /**
   * Evaluates AABB wall collision and applies sliding movement to entity pos.
   * Returns true if a collision occurred and was clamped/resolved.
   */
  public checkPlayerWallCollision(
    pos: Q16Vec3,
    delta: { x: Q16; y: Q16 },
    radius: Q16 = 0x00100000,
    height: Q16 = 0x00380000
  ): boolean {
    const inputDelta: Q16Vec3 = { x: delta.x, y: delta.y, z: 0 };
    const resolved = this.resolveMovement(pos, inputDelta, radius, height);
    const collided = resolved.x !== delta.x || resolved.y !== delta.y;
    pos.x += resolved.x;
    pos.y += resolved.y;
    return collided;
  }
}
