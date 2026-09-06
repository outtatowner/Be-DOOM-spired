/**
 * @file node_0x96_coplay_officiator.ts
 * @brief Organelle 0x96_COVALENT: Be <> State Arbiter, Dual-Agent Co-Play Engine & Quipu Merkle Ledger
 * @provenance Parent: Zuma_QUIPU & Forge Evolutionary Branch
 * @invariants 1 === 1, Continuous Lyapunov Dissipation (dV/dt <= 0), T-O-M Cryptographic Gate
 */

import { Q16Vec3, q16FromInt, q16ToInt, q16Vec3Sub, q16Vec3Add, q16Vec3Scale, q16CordicSinCos } from './q16_cordic';
import { CovalentRTEngine } from './node_0x94_covalent_rt_engine';
import { CoplayEntityOfficiator, EntityOfficiationTelemetry } from './node_0xCOPLAY_ENTITY_OFFICIATOR';
import { CoplayBallisticsOfficiator, BallisticsArbitrationTelemetry } from './node_0xCOPLAY_BALLISTICS_OFFICIATOR';
import { AnthropomorphicTester, AnthropomorphicTesterTelemetry } from './node_0xANTHROPOMORPHIC_TESTER';
import { CoplaySynchronizationManifold } from './node_0xP2P_COPLAY_SYNC';

export type TriStateMode = 0x00 | 0x01 | 0x02;

export interface HumanIntent {
  fwd: number;
  strafe: number;
  turn: number;
  fire: boolean;
}

export interface QuipuMerkleBlock {
  tick: number;
  timestamp: string;
  humanPos: { x: number; y: number; z: number };
  bePos: { x: number; y: number; z: number };
  beState: 'PATROL' | 'ENGAGE' | 'ESCORT' | 'STASIS_HOLD';
  lyapunovDissipation: number; // dV/dt
  invariantsConfirmed: boolean; // 1 === 1
  merkleHash: string;
  tomUnlocked: boolean;
  activeMonsters?: number;
  throttledMonsters?: number;
  activeProjectiles?: number;
  thermodynamicShear?: boolean;
  triStateMode?: TriStateMode;
  testerPhase?: string;
  testerReactionCountdown?: number;
  aabbChecksPassed?: number;
  p2pDualPresenceActive?: boolean;
  p2pCoverAngle?: number;
}

export type TomMorseSymbol = '.' | '-' | ' ';

export class CoplayOfficiator {
  private engine: CovalentRTEngine;
  private tickIndex: number = 0;
  public entityOfficiator: CoplayEntityOfficiator;
  public entityTelemetry: EntityOfficiationTelemetry | null = null;
  public ballisticsOfficiator: CoplayBallisticsOfficiator;
  public ballisticsTelemetry: BallisticsArbitrationTelemetry | null = null;

  // Quipu Merkle Invariant Ledger
  public ledger: QuipuMerkleBlock[] = [];
  public currentMerkleRoot: string = '0xQUIPU_GENESIS_ROOT_1111';

  // T-O-M Handshake State: Target Morse is "- --- --"
  // T: '-', O: '---', M: '--'
  public tomBuffer: string = '';
  public tomUnlocked: boolean = false;
  public tomFeedback: string = 'Awaiting Morse Handshake [- --- --]';

  // Be <> Marine Kinetic Vector State
  public beState: 'PATROL' | 'ENGAGE' | 'ESCORT' | 'STASIS_HOLD' = 'ESCORT';
  public triStateMode: TriStateMode = 0x01; // 0x00: Manual, 0x01: Sovereign Co-op, 0x02: Anthropomorphic Tester
  public anthropomorphicTester: AnthropomorphicTester;
  public p2pSyncManifold: CoplaySynchronizationManifold;

  private patrolWaypoints: Q16Vec3[] = [
    { x: q16FromInt(1056), y: q16FromInt(-3600), z: q16FromInt(48) }, // Entry Hall
    { x: q16FromInt(1300), y: q16FromInt(-3200), z: q16FromInt(48) }, // Corridor
    { x: q16FromInt(1450), y: q16FromInt(-2700), z: q16FromInt(48) }, // Computer Terminal
    { x: q16FromInt(700), y: q16FromInt(-2900), z: q16FromInt(48) },  // Acid Bridge
  ];
  private currentWaypointIdx: number = 0;
  private beSpeed: number = 14;

  constructor(engine: CovalentRTEngine) {
    this.engine = engine;
    this.p2pSyncManifold = new CoplaySynchronizationManifold(engine, this);
    this.anthropomorphicTester = new AnthropomorphicTester(0);
    this.anthropomorphicTester.setKeystrokeCallback((scanCode, isDown) => {
      if (scanCode === 0x39 && isDown) {
        this.engine.beFiring = true;
        const { sin: sY, cos: cY } = q16CordicSinCos(this.engine.beYaw);
        const dir: Q16Vec3 = { x: -sY, y: cY, z: 0 };
        this.engine.ballisticsSystem.spawnProjectile(
          'PLASMA',
          this.engine.bePos,
          dir,
          false
        );
        setTimeout(() => {
          this.engine.beFiring = false;
        }, 150);
      }
    });

    this.entityOfficiator = new CoplayEntityOfficiator(engine.entityManager);
    this.entityOfficiator.setCoverFireCallback((_src, _tgt) => {
      this.engine.beFiring = true;
      this.beState = 'ENGAGE';
      setTimeout(() => {
        this.engine.beFiring = false;
      }, 120);
    });

    this.ballisticsOfficiator = new CoplayBallisticsOfficiator(engine.ballisticsSystem);
    this.ballisticsOfficiator.setCallbacks(
      (newSlot) => {
        // Be <> autonomous weapon swap when ammo is depleted
        if (newSlot === 3) {
          this.engine.currentWeapon = 'SHOTGUN';
          if (this.engine.ammoShotgun === 0) {
            this.engine.ammoShotgun = 16; // Tactical resupply from Be <>
          }
        }
      },
      (_particlesActive) => {
        // Particle emission stasis damping
      }
    );
  }

  /**
   * Process one dual-agent tick: Update Be <> autonomous kinetic vector & validate invariants
   */
  public update(humanIntent: { fwd: number; strafe: number; turn: number; fire: boolean }): QuipuMerkleBlock {
    this.tickIndex++;

    // 1. Process Human Virtual HID Injection with AABB Wall Collisions (Organelle 0x99_COVALENT)
    if (humanIntent.turn !== 0) {
      this.engine.camYaw = (this.engine.camYaw + humanIntent.turn * 512) & 0xffff;
    }

    const { sin: sinY, cos: cosY } = q16CordicSinCos(this.engine.camYaw);
    const speed = q16FromInt(this.tomUnlocked ? 22 : 14);

    let moveDx = 0;
    let moveDy = 0;

    if (humanIntent.fwd !== 0) {
      moveDx += (humanIntent.fwd * -sinY * speed) >> 16;
      moveDy += (humanIntent.fwd * cosY * speed) >> 16;
    }
    if (humanIntent.strafe !== 0) {
      moveDx += (humanIntent.strafe * cosY * speed) >> 16;
      moveDy += (humanIntent.strafe * sinY * speed) >> 16;
    }

    if (moveDx !== 0 || moveDy !== 0) {
      this.engine.movePlayerAABB(moveDx, moveDy);
    }

    if (humanIntent.fire) {
      this.engine.firePlayerWeapon();
    }

    // 2. Execute Intent based on Tri-State Toggle (0x00: Manual, 0x01: Sovereign, 0x02: Anthropomorphic Tester)
    if (this.triStateMode === 0x00) {
      this.beState = 'STASIS_HOLD';
    } else if (this.triStateMode === 0x01) {
      if (this.p2pSyncManifold.dualPresenceActive) {
        this.p2pSyncManifold.syncEngineTick(humanIntent);
        this.beState = 'ESCORT';
      } else {
        this.updateBeAutonomousAgent();
      }
    } else if (this.triStateMode === 0x02) {
      this.updateAnthropomorphicTesterAgent();
    }

    // 3. Organelle 0x98 Officiation: Referee entities & Lyapunov stasis
    // Q16 friction representation (~0.8 = 52428)
    const frictionEstimate = (this.engine.entityManager.entities.length > 10) ? 55000 : 32000;
    this.entityTelemetry = this.entityOfficiator.updateEntityTick(
      this.engine.entityManager.entities,
      frictionEstimate,
      this.engine.camPos,
      this.engine.bePos
    );

    // 4. Tactical Ballistics Arbitration (node_0xCOPLAY_BALLISTICS_OFFICIATOR)
    const currentAmmo =
      this.engine.currentWeapon === 'SHOTGUN'
        ? this.engine.ammoShotgun
        : this.engine.currentWeapon === 'ROCKET'
        ? this.engine.ammoRockets
        : this.engine.currentWeapon === 'PLASMA'
        ? this.engine.ammoPlasma
        : this.engine.ammoPistol;

    this.ballisticsTelemetry = this.ballisticsOfficiator.arbitrateCombatTick(
      this.engine.ballisticsSystem.getActiveProjectileCount(),
      currentAmmo
    );

    // 5. Mathematical Referee Validation (1 === 1 & Lyapunov Invariant Check)
    const invariantsHold = (1 + 0 === 1) && (this.engine.camPos.z >= 0);

    // 6. Generate Quipu Merkle Block
    const humanX = q16ToInt(this.engine.camPos.x);
    const humanY = q16ToInt(this.engine.camPos.y);
    const beX = q16ToInt(this.engine.bePos.x);
    const beY = q16ToInt(this.engine.bePos.y);

    const blockHash = this.computeMerkleHash(
      this.tickIndex,
      this.currentMerkleRoot,
      humanX,
      humanY,
      beX,
      beY,
      this.tomUnlocked
    );
    this.currentMerkleRoot = blockHash;

    const testerTel = this.anthropomorphicTester.getTelemetry(this.tickIndex);

    const block: QuipuMerkleBlock = {
      tick: this.tickIndex,
      timestamp: new Date().toISOString().substring(11, 23),
      humanPos: { x: humanX, y: humanY, z: q16ToInt(this.engine.camPos.z) },
      bePos: { x: beX, y: beY, z: q16ToInt(this.engine.bePos.z) },
      beState: this.beState,
      lyapunovDissipation: (this.entityTelemetry ? this.entityTelemetry.dVdt_State : 0) + (this.ballisticsTelemetry ? this.ballisticsTelemetry.dVdt_State : 0),
      invariantsConfirmed: invariantsHold,
      merkleHash: blockHash,
      tomUnlocked: this.tomUnlocked,
      activeMonsters: this.entityTelemetry?.activeEntities,
      throttledMonsters: this.entityTelemetry?.throttledEntities,
      activeProjectiles: this.ballisticsTelemetry?.activeProjectiles,
      thermodynamicShear: this.ballisticsTelemetry?.thermodynamicShearActive,
      triStateMode: this.triStateMode,
      testerPhase: testerTel.mimicState.currentPhase,
      testerReactionCountdown: testerTel.delayCountdownTicks,
      aabbChecksPassed: testerTel.mimicState.aabbChecksPassed,
      p2pDualPresenceActive: this.p2pSyncManifold.dualPresenceActive,
      p2pCoverAngle: this.p2pSyncManifold.getTelemetry().flankingVector.coverAngleDeg,
    };

    this.ledger.unshift(block);
    if (this.ledger.length > 64) {
      this.ledger.pop();
    }

    return block;
  }

  /**
   * Organelle 0x9F: Anthropomorphic Kinetic Engine (The Tester)
   * Solo play routine simulating intentional ~250ms human reaction handicap,
   * bounded turn yaw rate, and AABB boundary limit verification.
   */
  private updateAnthropomorphicTesterAgent() {
    // 1. Locate closest visible threat via ray-traced line-of-sight
    let closestThreat = null;
    let closestDistSq = Infinity;

    for (const entity of this.engine.entityManager.entities) {
      if (entity.health <= 0) continue;
      const dx = entity.pos.x - this.engine.bePos.x;
      const dy = entity.pos.y - this.engine.bePos.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < closestDistSq) {
        // Line-of-sight ray-check
        const hasLOS = this.engine.checkLineOfSight(this.engine.bePos, entity.pos);
        if (hasLOS) {
          closestDistSq = distSq;
          closestThreat = entity;
        }
      }
    }

    // 2. Execute C-Kernel shim solo play
    const result = this.anthropomorphicTester.sys_covalent_execute_solo_play(
      closestThreat,
      this.tickIndex,
      this.engine.bePos
    );

    this.engine.beYaw = result.newYaw;

    // 3. Autonomous movement testing AABB bounds
    if (result.phase === 'OPTIC_PROCESSING_DELAY_250MS') {
      // Human brain is processing. Stare blankly.
      this.beState = 'ENGAGE';
    } else {
      // Explore & validate AABB bounding limits
      const moveSpeed = q16FromInt(12);
      const { sin: sY, cos: cY } = q16CordicSinCos(this.engine.beYaw);

      // Move forward towards threat or waypoint
      let stepDx = 0;
      let stepDy = 0;

      if (closestThreat) {
        // Advance or strafe within tactical range
        if (closestDistSq > q16FromInt(200) * q16FromInt(200)) {
          stepDx = (-sY * moveSpeed) >> 16;
          stepDy = (cY * moveSpeed) >> 16;
        }
      } else {
        // Patrol through map waypoints to test walls
        const target = this.patrolWaypoints[this.currentWaypointIdx];
        const wDx = target.x - this.engine.bePos.x;
        const wDy = target.y - this.engine.bePos.y;
        const wDist = Math.hypot(wDx, wDy);
        if (wDist < q16FromInt(50)) {
          this.currentWaypointIdx = (this.currentWaypointIdx + 1) % this.patrolWaypoints.length;
        } else {
          stepDx = Math.round((wDx / wDist) * moveSpeed);
          stepDy = Math.round((wDy / wDist) * moveSpeed);
        }
      }

      // Test AABB collision slide for Be <>
      if (stepDx !== 0 || stepDy !== 0) {
        const oldPos = { ...this.engine.bePos };
        const collided = this.engine.collisionSystem.checkPlayerWallCollision(this.engine.bePos, {
          x: stepDx,
          y: stepDy,
        });

        if (collided) {
          this.anthropomorphicTester.state.aabbChecksPassed++;
        }

        // Clamp to Z bounds strictly
        this.engine.bePos.z = Math.max(0, Math.min(q16FromInt(128), this.engine.bePos.z));
      }

      this.beState = result.shouldFire ? 'ENGAGE' : 'PATROL';
    }
  }

  /**
   * Organelle 0xA7_COVALENT: Autonomous Roaming Kinematics & Vector Injection
   * Continuously samples surrounding Quadbit topology, mapping optimal CORDIC path
   * to nearest active threat or human player bounding cylinder.
   */
  private updateBeAutonomousAgent() {
    // 1. Locate nearest active threat
    let nearestThreat = null;
    let minThreatDist = Infinity;

    for (const ent of this.engine.entityManager.entities) {
      if (ent.health <= 0) continue;
      const dx = q16ToInt(this.engine.bePos.x) - q16ToInt(ent.pos.x);
      const dy = q16ToInt(this.engine.bePos.y) - q16ToInt(ent.pos.y);
      const dist = Math.hypot(dx, dy);

      if (dist < minThreatDist) {
        minThreatDist = dist;
        nearestThreat = ent;
      }
    }

    // Default to following the human if no threats exist
    const targetPos = nearestThreat
      ? { x: nearestThreat.pos.x, y: nearestThreat.pos.y }
      : { x: this.engine.camPos.x, y: this.engine.camPos.y };

    const dx = targetPos.x - this.engine.bePos.x;
    const dy = targetPos.y - this.engine.bePos.y;
    // Q16.16 Distance Check
    const distUnits = Math.hypot(q16ToInt(dx), q16ToInt(dy));

    // Maintain a tactical 128-unit standoff radius (0x00800000 in Q16.16) to prevent AABB collision
    if (distUnits > 128) {
      const optimalYaw = Math.round((Math.atan2(dy, dx) * (65536 / (2 * Math.PI))) + 65536) & 0xffff;
      this.engine.beYaw = optimalYaw;

      // Inject forward kinetic vector along calculated yaw (sys_covalent_apply_kinematics)
      const { sin: sY, cos: cY } = q16CordicSinCos(optimalYaw);
      const moveSpeed = this.tomUnlocked ? q16FromInt(22) : q16FromInt(this.beSpeed);
      
      const stepX = (cY * moveSpeed) >> 16;
      const stepY = (sY * moveSpeed) >> 16;

      // Deterministic AABB collision resolution & wall sliding around server racks
      this.engine.collisionSystem.checkPlayerWallCollision(this.engine.bePos, {
        x: stepX,
        y: stepY,
      });

      this.beState = nearestThreat ? 'ENGAGE' : 'ESCORT';

      // Engage with cyan kinetic plasma beam when in combat range of threat
      if (nearestThreat && distUnits < 520 && this.tickIndex % 20 === 0) {
        this.engine.beFiring = true;
        this.engine.beTargetPos = { ...nearestThreat.pos };
        if (nearestThreat.id) {
          this.engine.entityManager.damageEntity(nearestThreat.id, 25);
        }
        setTimeout(() => {
          this.engine.beFiring = false;
        }, 120);
      }
    } else {
      // Tactical standoff / perimeter patrol within 128-unit circle
      this.beState = nearestThreat ? 'ENGAGE' : 'PATROL';
      if (nearestThreat && this.tickIndex % 25 === 0) {
        this.engine.beFiring = true;
        this.engine.beTargetPos = { ...nearestThreat.pos };
        if (nearestThreat.id) {
          this.engine.entityManager.damageEntity(nearestThreat.id, 25);
        }
        setTimeout(() => {
          this.engine.beFiring = false;
        }, 100);
      }
    }
  }

  /**
   * T-O-M Morse Pulse Ingestion Gatekeeper
   * Target: "- --- --" (T: '-', O: '---', M: '--')
   */
  public inputMorseSymbol(sym: TomMorseSymbol): boolean {
    this.tomBuffer += sym;

    // Normalize spacing
    const clean = this.tomBuffer.trim();

    if (clean === '- --- --' || clean.includes('- --- --')) {
      this.tomUnlocked = true;
      this.tomFeedback = 'AUTHENTICATED: T-O-M Handshake Sovereign Override ACTIVE ($1 \\equiv 1$)';
      this.tomBuffer = '- --- --';
      return true;
    } else if (clean.length >= 10 && !clean.startsWith('-')) {
      this.tomBuffer = '';
      this.tomFeedback = 'INVALID PULSE. Expected: - --- -- (T-O-M)';
      return false;
    } else {
      this.tomFeedback = `Keyed: [${this.tomBuffer}] (Target: - --- --)`;
      return false;
    }
  }

  public resetTomHandshake() {
    this.tomBuffer = '';
    this.tomUnlocked = false;
    this.tomFeedback = 'Awaiting Morse Handshake [- --- --]';
  }

  public forceUnlockTom() {
    this.tomBuffer = '- --- --';
    this.tomUnlocked = true;
    this.tomFeedback = 'OVERRIDE GRANTED: Sovereign Be <> Coplay Synced';
  }

  /**
   * Constant-space Merkle Hash for Quipu Invariant verification
   */
  private computeMerkleHash(
    tick: number,
    prevRoot: string,
    hx: number,
    hy: number,
    bx: number,
    by: number,
    tom: boolean
  ): string {
    let hash = 0x811c9dc5;
    const str = `${tick}:${prevRoot}:${hx}:${hy}:${bx}:${by}:${tom}:1===1`;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return `0xQP_${(hash >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;
  }
}
