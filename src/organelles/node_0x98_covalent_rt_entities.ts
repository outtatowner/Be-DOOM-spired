/**
 * @file node_0x98_covalent_rt_entities.ts
 * @brief Organelle 0x98_COVALENT: Ray-Traced Sprite Entities (Enemies, Imps, Barrels)
 * @provenance Parent: Zuma_QUIPU & Forge Evolutionary Branch
 * @invariants 1 === 1, Continuous Lyapunov Dissipation (dV/dt <= 0), Zero-Float Substrate
 */

import {
  Q16,
  Q16Vec3,
  Q16_ONE,
  q16FromInt,
  q16ToInt,
  q16Mul,
  q16Div,
  q16Abs,
  q16Vec3Sub,
  q16Vec3Dot,
  q16Vec3Add,
  q16Vec3Scale,
  q16Vec3Normalize,
} from './q16_cordic';

export type EntityType = 'COPLAYER_BE' | 'IMP' | 'ZOMBIEMAN' | 'DEMON' | 'BARREL';
export type AdversarySubtype = 'STALE_PID' | 'CRON_DAEMON' | 'ROOT_KIT' | 'CRYOGENIC_CELL' | 'COPLAYER_BE' | 'STANDARD';
export type EntityState = 'IDLE' | 'CHASE' | 'ATTACK' | 'PAIN' | 'DEAD';

export interface CovalentEntity {
  id: number;
  type: EntityType;
  adversarySubtype: AdversarySubtype;
  adversaryLabel: string;
  state: EntityState;
  pos: Q16Vec3;
  boundingRadius: Q16;
  health: number;
  maxHealth: number;
  isActive: boolean;
  isThrottled: boolean; // Managed by CoplayEntityOfficiator
  animTick: number;
  stutterCounter?: number;
  attackCooldown: number;
  hasLosToPlayer: boolean;
  spritePixels: Uint32Array; // 32x32 billboard sprite
  spriteW: number;
  spriteH: number;
}

export interface SpriteHitResult {
  hit: boolean;
  t: Q16;
  point: Q16Vec3;
  color: number;
  entity: CovalentEntity;
}

export class EntityManager {
  public entities: CovalentEntity[] = [];
  private nextId: number = 1;

  // Callbacks for 3-tier adversarial matrix
  public onZombiemanShoot?: (zombiePos: Q16Vec3, targetPos: Q16Vec3) => void;
  public onImpShootFireball?: (impPos: Q16Vec3, targetPos: Q16Vec3) => void;
  public onDemonMeleePush?: (demonPos: Q16Vec3, pushDelta: Q16Vec3) => void;
  public swarmKinematicsSuspended: boolean = false; // Managed by FraggapThermodynamicArbitrator (Organelle 0xAD)

  constructor() {
    this.initDefaultEntities();
  }

  public initDefaultEntities() {
    this.entities = [];
    this.nextId = 1;

    // Spawn tactical Imps in E1M1 Hangar
    this.spawnEntity('IMP', 1200, -3200, 32);  // Near corridor
    this.spawnEntity('IMP', 1450, -2700, 48);  // Computer room
    this.spawnEntity('ZOMBIEMAN', 1056, -3450, 32); // Near entrance hall pillar
    this.spawnEntity('BARREL', 500, -2900, 24); // Radioactive slime pit barrel
    this.spawnEntity('BARREL', 800, -2800, 24); // Acid bridge barrel
  }

  public clearEntities() {
    this.entities = [];
    this.nextId = 1;
  }

  public clear() {
    this.clearEntities();
  }

  public spawnEntity(type: EntityType, x: number, y: number, z: number): CovalentEntity {
    return this.spawnAdversary(
      type,
      type === 'COPLAYER_BE' ? 'COPLAYER_BE' : 'STANDARD',
      type === 'COPLAYER_BE' ? 'Be <> Sovereign' : `${type} Unit`,
      x,
      y,
      z
    );
  }

  public spawnAdversary(
    type: EntityType,
    adversarySubtype: AdversarySubtype,
    adversaryLabel: string,
    x: number,
    y: number,
    z: number
  ): CovalentEntity {
    const radius = type === 'BARREL' ? q16FromInt(20) : type === 'DEMON' ? q16FromInt(34) : type === 'COPLAYER_BE' ? q16FromInt(26) : q16FromInt(28);
    const health = type === 'COPLAYER_BE' ? 200 : adversarySubtype === 'ROOT_KIT' ? 180 : type === 'DEMON' ? 150 : adversarySubtype === 'CRON_DAEMON' ? 75 : type === 'IMP' ? 60 : adversarySubtype === 'STALE_PID' ? 35 : 25;

    const entity: CovalentEntity = {
      id: this.nextId++,
      type,
      adversarySubtype,
      adversaryLabel,
      state: 'IDLE',
      pos: { x: q16FromInt(x), y: q16FromInt(y), z: q16FromInt(z) },
      boundingRadius: radius,
      health,
      maxHealth: health,
      isActive: true,
      isThrottled: false,
      animTick: Math.floor(Math.random() * 100),
      attackCooldown: Math.floor(Math.random() * 40),
      hasLosToPlayer: false,
      spriteW: 32,
      spriteH: 32,
      spritePixels: this.generateSpriteBitmap(type, 'IDLE', adversarySubtype),
    };

    this.entities.push(entity);
    return entity;
  }

  /**
   * Spawns the authentic Gemini Cloud Datacenter Adversarial Swarm
   */
  public initGeminiCloudSwarm() {
    this.entities = [];
    this.nextId = 1;

    // Stale.PIDs (shambling around the corner of the first server rack!)
    this.spawnAdversary('ZOMBIEMAN', 'STALE_PID', 'Stale.PID [PID_4012]', 970, -3380, 32);
    this.spawnAdversary('ZOMBIEMAN', 'STALE_PID', 'Stale.PID [PID_8099]', 1060, -3250, 32);
    this.spawnAdversary('ZOMBIEMAN', 'STALE_PID', 'Stale.PID [PID_1044]', 1020, -3000, 32);

    // Cron.Daemons (in algorithmic cooling chamber and catwalks)
    this.spawnAdversary('IMP', 'CRON_DAEMON', 'Cron.Daemon [SYS_0x00]', 650, -2550, 48);
    this.spawnAdversary('IMP', 'CRON_DAEMON', 'Cron.Daemon [SYS_0x10]', 800, -2350, 48);
    this.spawnAdversary('IMP', 'CRON_DAEMON', 'Cron.Daemon [SYS_0x20]', 1200, -1600, 48);

    // Root.Kits (in server aisle and kernel panic arena)
    this.spawnAdversary('DEMON', 'ROOT_KIT', 'Root.Kit [SUDO_BRUTE]', 1450, -2350, 32);
    this.spawnAdversary('DEMON', 'ROOT_KIT', 'Root.Kit [RING0_EXP]', 950, -1600, 32);

    // Cryogenic Coolant Cells (Barrels)
    this.spawnAdversary('BARREL', 'CRYOGENIC_CELL', 'Cryo.Cell #01', 570, -2650, 20);
    this.spawnAdversary('BARREL', 'CRYOGENIC_CELL', 'Cryo.Cell #02', 770, -2650, 20);
  }

  /**
   * Spawn a mass horde of entities to demonstrate thermodynamic friction & AI throttling
   */
  public spawnHorde(count = 20) {
    for (let i = 0; i < count; i++) {
      const rx = 1200 + (Math.random() - 0.5) * 800;
      const ry = -3000 + (Math.random() - 0.5) * 800;
      const type = Math.random() > 0.4 ? 'IMP' : 'ZOMBIEMAN';
      this.spawnEntity(type, rx, ry, 36);
    }
  }

  /**
   * Ray-Billboard Intersection in Q16.16 CORDIC
   * Standard DOOM enemies are camera-facing billboard planes.
   */
  public intersectRayEntities(
    rayOrigin: Q16Vec3,
    rayDir: Q16Vec3,
    tMin: Q16,
    tMax: Q16
  ): SpriteHitResult | null {
    let closestHit: SpriteHitResult | null = null;
    let closestT = tMax;

    for (const entity of this.entities) {
      if (!entity.isActive || entity.state === 'DEAD') continue;

      const toEntity = q16Vec3Sub(entity.pos, rayOrigin);

      // Project entity center onto ray
      const tProj = q16Vec3Dot(toEntity, rayDir);
      if (tProj <= tMin || tProj >= closestT) continue;

      // Closest point on ray
      const closePt = q16Vec3Add(rayOrigin, q16Vec3Scale(rayDir, tProj));

      // Vector from entity center to closest point on ray
      const miss = q16Vec3Sub(closePt, entity.pos);

      // Fast fixed-point radius check
      const distSq = q16Vec3Dot(miss, miss);
      const radSq = q16Mul(entity.boundingRadius, entity.boundingRadius);

      if (distSq < radSq) {
        // We hit the billboard bounding sphere! Now evaluate sprite UV transparency
        const rad = entity.boundingRadius;
        // UV normalized to [0, 31]
        const u = Math.floor(((miss.x + rad) / (rad * 2)) * 32);
        const v = Math.floor(((miss.z + rad) / (rad * 2)) * 32);

        if (u >= 0 && u < 32 && v >= 0 && v < 32) {
          const pixel = entity.spritePixels[(31 - v) * 32 + u];
          // Check transparency (magenta key 0xffff00ff or alpha 0)
          if ((pixel & 0xff000000) !== 0 && pixel !== 0xffff00ff) {
            closestT = tProj;
            closestHit = {
              hit: true,
              t: tProj,
              point: closePt,
              color: pixel,
              entity,
            };
          }
        }
      }
    }

    return closestHit;
  }

  /**
   * Update active entities (AI chase towards human, anim frames, 3-tier adversarial matrix)
   */
  public tick(
    humanPos: Q16Vec3,
    bePos: Q16Vec3,
    checkWallLos?: (from: Q16Vec3, to: Q16Vec3) => boolean
  ) {
    for (const ent of this.entities) {
      if (!ent.isActive || ent.state === 'DEAD') continue;
      ent.animTick++;
      if (ent.attackCooldown > 0) ent.attackCooldown--;

      // If swarm kinematics suspended by Fraggap thermodynamic arbitrator, halt pathfinding
      if (this.swarmKinematicsSuspended) continue;

      // If throttled by Lyapunov stasis governor, skip heavy pathfinding physics
      if (ent.isThrottled) continue;

      // Stale.PID intentionally drops animation & pathfinding frames to simulate computational decay
      if (ent.adversarySubtype === 'STALE_PID') {
        if (ent.animTick % 3 === 0) {
          continue; // Frame drop stutter
        }
      }

      const dx = humanPos.x - ent.pos.x;
      const dy = humanPos.y - ent.pos.y;
      const dist = Math.hypot(dx, dy);

      if (ent.type === 'DEMON') {
        // Type 3 (Demon / Pinky / Root.Kit): Aggressive melee pathfinding & close-quarters AABB kinetic push
        const isRootKit = ent.adversarySubtype === 'ROOT_KIT';
        const chaseLimit = isRootKit ? q16FromInt(1400) : q16FromInt(1200);
        const demonSpeed = isRootKit ? q16FromInt(8) : q16FromInt(6); // Rapid predatory sprint

        if (dist > q16FromInt(42) && dist < chaseLimit) {
          ent.state = 'CHASE';
          ent.pos.x += Math.round((dx / dist) * demonSpeed);
          ent.pos.y += Math.round((dy / dist) * demonSpeed);
        } else if (dist <= q16FromInt(42)) {
          ent.state = 'ATTACK';
          // Melee kinetic push testing AABB shear limits
          if (ent.attackCooldown === 0) {
            ent.attackCooldown = isRootKit ? 24 : 30; // Bite interval
            const pushMagnitude = isRootKit ? q16FromInt(12) : q16FromInt(8);
            const pushDelta: Q16Vec3 = {
              x: Math.round((dx / dist) * pushMagnitude),
              y: Math.round((dy / dist) * pushMagnitude),
              z: 0,
            };
            this.onDemonMeleePush?.(ent.pos, pushDelta);
          }
        }
      } else if (ent.type === 'IMP') {
        // Type 2 (Imp / Cron.Daemon): Slow-moving projectile physics with dynamic moving point-light
        const isCron = ent.adversarySubtype === 'CRON_DAEMON';
        const speed = isCron ? q16FromInt(4) : q16FromInt(3);

        if (dist > q16FromInt(120) && dist < q16FromInt(950)) {
          ent.state = 'CHASE';
          ent.pos.x += Math.round((dx / dist) * speed);
          ent.pos.y += Math.round((dy / dist) * speed);
        } else if (dist <= q16FromInt(120)) {
          ent.state = 'ATTACK';
        }

        // Line-of-sight fireball / encrypted payload launch
        if (dist < q16FromInt(850) && ent.attackCooldown === 0) {
          ent.hasLosToPlayer = checkWallLos ? checkWallLos(ent.pos, humanPos) : true;
          if (ent.hasLosToPlayer) {
            ent.attackCooldown = isCron ? 50 : 65; // Fireball / payload interval
            ent.state = 'ATTACK';
            this.onImpShootFireball?.(ent.pos, humanPos);
          }
        }
      } else if (ent.type === 'ZOMBIEMAN') {
        // Type 1 (Zombieman / Stale.PID): Immediate line-of-sight hitscan ray-casting
        if (dist > q16FromInt(140) && dist < q16FromInt(850)) {
          ent.state = 'CHASE';
          const speed = q16FromInt(2);
          ent.pos.x += Math.round((dx / dist) * speed);
          ent.pos.y += Math.round((dy / dist) * speed);
        } else if (dist <= q16FromInt(140)) {
          ent.state = 'ATTACK';
        }

        // Referee hitscan ray-casting
        if (dist < q16FromInt(750) && ent.attackCooldown === 0) {
          ent.hasLosToPlayer = checkWallLos ? checkWallLos(ent.pos, humanPos) : true;
          if (ent.hasLosToPlayer) {
            ent.attackCooldown = 50; // Hitscan burst interval
            ent.state = 'ATTACK';
            this.onZombiemanShoot?.(ent.pos, humanPos);
          }
        }
      }
    }
  }

  /**
   * Apply damage to an entity from plasma beams
   */
  public damageEntity(entityId: number, amount: number): boolean {
    const ent = this.entities.find((e) => e.id === entityId);
    if (!ent || ent.state === 'DEAD') return false;

    ent.health -= amount;
    if (ent.health <= 0) {
      ent.state = 'DEAD';
      ent.isActive = false;
      ent.spritePixels = this.generateSpriteBitmap(ent.type, 'DEAD', ent.adversarySubtype);
      return true; // Eliminated
    } else {
      ent.state = 'PAIN';
      setTimeout(() => {
        if (ent.state === 'PAIN') ent.state = 'CHASE';
      }, 150);
      return false;
    }
  }

  /**
   * Procedural DOOM 32x32 Sprite Generation (Imp, Zombieman, Demon, Barrel, and Gemini Cloud adversaries)
   */
  public generateSpriteBitmap(type: EntityType, state: EntityState, subtype: AdversarySubtype = 'STANDARD'): Uint32Array {
    const pixels = new Uint32Array(32 * 32);
    // Fill transparent (0x00000000)
    pixels.fill(0x00000000);

    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const cx = x - 16;
        const cy = y - 16;

        if (type === 'COPLAYER_BE' || subtype === 'COPLAYER_BE') {
          // Organelle 0xA0: Chrome-visored tactical marine, emissive blue telemetry lines, PBR
          const inHead = (cx * cx + (cy + 7) * (cy + 7)) < 36;
          const inVisor = Math.abs(cx) <= 4 && (cy >= -8 && cy <= -5);
          const inVisorSpecular = (cx === -2 || cx === -1) && cy === -7;
          const inTorso = (cx * cx * 1.5 + (cy - 1) * (cy - 1)) < 110;
          const inShoulderPlates = (Math.abs(cx) >= 8 && Math.abs(cx) <= 12) && (cy >= -4 && cy <= 2);
          const inTelemetryLines =
            ((cy === -2 || cy === 3) && Math.abs(cx) <= 7) ||
            (Math.abs(cx) === 6 && cy >= -1 && cy <= 5) ||
            ((cy === -5 || cy === -8) && Math.abs(cx) <= 4);

          if (inVisorSpecular) {
            pixels[y * 32 + x] = 0xffffffff; // Chrome specular glint
          } else if (inVisor) {
            const spec = Math.min(255, 190 + cx * 12);
            pixels[y * 32 + x] = 0xff000000 | (spec << 16) | ((spec + 30) << 8) | 255; // Chrome reflective visor
          } else if (inTelemetryLines) {
            pixels[y * 32 + x] = 0xff00f0ff; // Emissive blue/cyan telemetry lines
          } else if (inShoulderPlates) {
            pixels[y * 32 + x] = 0xff5a6678; // Slate-chrome pauldrons
          } else if (inHead) {
            pixels[y * 32 + x] = 0xff2f3945; // Titanium alloy combat helmet
          } else if (inTorso) {
            const rib = Math.abs(cx) * 3;
            const shade = Math.max(32, 72 - rib);
            pixels[y * 32 + x] = 0xff000000 | (shade << 16) | ((shade + 8) << 8) | (shade + 22);
          }
        } else if (subtype === 'ROOT_KIT') {
          // Root.Kit: Heavy armored brute-force algorithm with dark metallic server plate armor & glowing red memory bus
          const inTorso = (cx * cx * 1.3 + (cy + 2) * (cy + 2)) < 160;
          const inJaw = (cx * cx * 1.6 + (cy - 4) * (cy - 4)) < 90;
          const inMouthOpen = (state === 'ATTACK') && (Math.abs(cx) < 9 && cy >= -1 && cy <= 7);
          const inTeeth = inMouthOpen && ((y === 16 || y === 22) && (x % 3 === 0));
          const inSpines = (Math.abs(cx) > 11 && Math.abs(cx) < 15 && cy < -4 && cy > -12);
          const inBusLines = (Math.abs(cx) === 4 || Math.abs(cx) === 8) && (cy >= -6 && cy <= 6);

          if (state === 'DEAD') {
            if (cy > 3 && Math.abs(cx) < 15) pixels[y * 32 + x] = 0xff331122; // Neutralized Root.Kit chassis
          } else if (inTeeth) {
            pixels[y * 32 + x] = 0xffe2e8f0; // Chrome hydraulic teeth
          } else if (inBusLines) {
            pixels[y * 32 + x] = 0xffff0055; // Emissive crimson data bus lines
          } else if (inMouthOpen) {
            pixels[y * 32 + x] = 0xff550011; // Dark hydraulic intake
          } else if (inSpines) {
            pixels[y * 32 + x] = 0xff71717a; // Server rack fin spines
          } else if (inJaw) {
            pixels[y * 32 + x] = 0xff27272a; // Armored carbon lower jaw
          } else if (inTorso) {
            const shade = 0x20 + Math.floor(Math.sin(cx * 0.3) * 12);
            pixels[y * 32 + x] = 0xff000000 | (shade << 16) | (shade << 8) | (shade + 10);
          }
        } else if (subtype === 'CRON_DAEMON') {
          // Cron.Daemon: Aggressive background service with dark obsidian body & glowing neon cyan/orange horns
          const inBody = (cx * cx * 1.5 + cy * cy * 0.9) < 140;
          const inHorns = (Math.abs(cx) > 8 && Math.abs(cx) < 14 && cy < -8 && cy > -14);
          const inEyes = (cy === -4 && (cx === -4 || cx === 4));
          const inGlyph = (cy >= -1 && cy <= 3 && Math.abs(cx) <= 3) && ((x + y) % 2 === 0);

          if (state === 'DEAD') {
            if (cy > 4 && Math.abs(cx) < 14) pixels[y * 32 + x] = 0xff1e293b;
          } else if (inGlyph) {
            pixels[y * 32 + x] = 0xff00f0ff; // Glowing cryptographic rune
          } else if (inEyes) {
            pixels[y * 32 + x] = 0xffff5500; // Fiery orange service status eyes
          } else if (inHorns) {
            pixels[y * 32 + x] = 0xff38bdf8; // Neon cyan data horns
          } else if (inBody) {
            const shade = 0x1a + Math.floor(Math.sin(cx * 0.4) * 10);
            pixels[y * 32 + x] = 0xff000000 | (shade << 16) | ((shade + 8) << 8) | (shade + 20);
          }
        } else if (subtype === 'STALE_PID') {
          // Stale.PID: Decaying voxel husk leaking orphaned memory bytes (cyan/magenta glitch pixels)
          const inBody = (cx * cx * 1.6 + cy * cy) < 120;
          const inHelmet = (cx * cx + (cy + 7) * (cy + 7)) < 28;
          const inEyes = (cy === -6 && (cx === -3 || cx === 3));
          const isGlitchDrop = ((x * 13 + y * 17) % 7 === 0); // Computational decay voxel drop
          const isOrphanMemory = ((x * 7 + y * 11) % 13 === 0);

          if (state === 'DEAD') {
            if (cy > 6 && Math.abs(cx) < 12) pixels[y * 32 + x] = 0xff1e2230;
          } else if (isGlitchDrop && inBody) {
            // Voxel dropped!
            pixels[y * 32 + x] = 0x00000000;
          } else if (isOrphanMemory) {
            pixels[y * 32 + x] = (x % 2 === 0) ? 0xff00f0ff : 0xffff00ff; // Orphaned memory leak
          } else if (inEyes) {
            pixels[y * 32 + x] = 0xff00ffff; // Cyan binary glitch eyes
          } else if (inHelmet) {
            pixels[y * 32 + x] = 0xff334155; // Weathered slate server node head
          } else if (inBody) {
            const shade = 0x22 + Math.floor(Math.sin(cx * 0.3) * 12);
            pixels[y * 32 + x] = 0xff000000 | (shade << 16) | ((shade + 10) << 8) | (shade + 24);
          }
        } else if (subtype === 'CRYOGENIC_CELL') {
          // Cryogenic Coolant Canister with frosted cyan liquid nitrogen
          const inCylinder = Math.abs(cx) < 10 && Math.abs(cy) < 13;
          const inCryoBands = inCylinder && (cy === -5 || cy === 5);
          const inFrostTop = cy < -10 && Math.abs(cx) < 8;

          if (inFrostTop) {
            pixels[y * 32 + x] = 0xffe0f7ff; // Frosted cryogenic vapor
          } else if (inCryoBands) {
            pixels[y * 32 + x] = 0xff00e5ff; // Glowing cryogenic band
          } else if (inCylinder) {
            const rib = Math.abs(cx) * 5;
            const b = Math.max(120, 0xff - rib);
            pixels[y * 32 + x] = 0xff000000 | (0x22 << 16) | (0x88 << 8) | b;
          }
        } else if (type === 'DEMON') {
          // Standard Pinky Demon
          const inTorso = (cx * cx * 1.3 + (cy + 2) * (cy + 2)) < 160;
          const inJaw = (cx * cx * 1.6 + (cy - 4) * (cy - 4)) < 90;
          const inMouthOpen = (state === 'ATTACK') && (Math.abs(cx) < 9 && cy >= -1 && cy <= 7);
          const inTeeth = inMouthOpen && ((y === 16 || y === 22) && (x % 3 === 0));
          const inSpines = (Math.abs(cx) > 11 && Math.abs(cx) < 15 && cy < -4 && cy > -12);
          const inEyes = (cy === -7 && (cx === -5 || cx === 5));

          if (state === 'DEAD') {
            if (cy > 3 && Math.abs(cx) < 15) pixels[y * 32 + x] = 0xff8a3350;
          } else if (inTeeth) {
            pixels[y * 32 + x] = 0xffffffff;
          } else if (inMouthOpen) {
            pixels[y * 32 + x] = 0xff440011;
          } else if (inEyes) {
            pixels[y * 32 + x] = 0xffff1100;
          } else if (inSpines) {
            pixels[y * 32 + x] = 0xffece8e8;
          } else if (inJaw) {
            pixels[y * 32 + x] = 0xffc84a6c;
          } else if (inTorso) {
            const shade = 0xdd + Math.floor(Math.sin(cx * 0.3) * 18);
            pixels[y * 32 + x] = 0xff000000 | (shade << 16) | (0x55 << 8) | 0x78;
          }
        } else if (type === 'IMP') {
          // Standard Imp
          const inBody = (cx * cx * 1.5 + cy * cy * 0.9) < 140;
          const inHorns = (Math.abs(cx) > 8 && Math.abs(cx) < 14 && cy < -8 && cy > -14);
          const inEyes = (cy === -4 && (cx === -4 || cx === 4));

          if (state === 'DEAD') {
            if (cy > 4 && Math.abs(cx) < 14) pixels[y * 32 + x] = 0xff5a3822;
          } else if (inEyes) {
            pixels[y * 32 + x] = 0xffff2200;
          } else if (inHorns) {
            pixels[y * 32 + x] = 0xffe0dede;
          } else if (inBody) {
            const shade = 0x6e + Math.floor(Math.sin(cx * 0.4) * 15);
            pixels[y * 32 + x] = 0xff000000 | (shade << 16) | ((shade * 0.7) << 8) | 0x30;
          }
        } else if (type === 'ZOMBIEMAN') {
          // Standard Zombieman
          const inBody = (cx * cx * 1.6 + cy * cy) < 120;
          const inHelmet = (cx * cx + (cy + 7) * (cy + 7)) < 28;
          const inEyes = (cy === -6 && (cx === -3 || cx === 3));

          if (state === 'DEAD') {
            if (cy > 6 && Math.abs(cx) < 12) pixels[y * 32 + x] = 0xff284020;
          } else if (inEyes) {
            pixels[y * 32 + x] = 0xffffdd00;
          } else if (inHelmet) {
            pixels[y * 32 + x] = 0xff405830;
          } else if (inBody) {
            pixels[y * 32 + x] = 0xff325528;
          }
        } else if (type === 'BARREL') {
          // Standard Barrel
          const inCylinder = Math.abs(cx) < 10 && Math.abs(cy) < 13;
          const inHazardBands = inCylinder && (cy === -5 || cy === 5);
          const inSlimeTop = cy < -10 && Math.abs(cx) < 8;

          if (inSlimeTop) {
            pixels[y * 32 + x] = 0xff00ff55;
          } else if (inHazardBands) {
            pixels[y * 32 + x] = 0xffffcc00;
          } else if (inCylinder) {
            const rib = Math.abs(cx) * 5;
            const g = Math.max(0, 0x5a - rib);
            pixels[y * 32 + x] = 0xff000000 | (0x33 << 16) | (g << 8) | 0x33;
          }
        }
      }
    }

    return pixels;
  }
}
