/**
 * @file node_0xLAYOUT_AND_SWARM.ts
 * @brief Organelle 0xA6_COVALENT & 0xA7_COVALENT: Topology Synthesis, Swarm Multiplexing & Autonomous Roaming Kinematics
 * @provenance Parent: Zuma_QUIPU & Forge Evolutionary Branch
 * @invariants 1 === 1, Continuous Lyapunov Dissipation (dV/dt <= 0), Non-Overlapping Spiral Spawns
 */

import {
  Q16,
  Q16Vec3,
  q16FromInt,
  q16ToInt,
  q16CordicSinCos,
} from './q16_cordic';
import { CovalentRTEngine } from './node_0x94_covalent_rt_engine';
import { CovalentEntity, EntityType } from './node_0x98_covalent_rt_entities';
import { RTDoomMap, RTWallQuad } from './node_0x95_covalent_doom_wad_parser';

export interface ProceduralSectorNode {
  id: string;
  q_x: Q16;
  q_y: Q16;
  width: Q16;
  height: Q16;
  floorZ: Q16;
  ceilZ: Q16;
  lightIntensity: Q16;
}

export interface SwarmStampTelemetry {
  totalEntities: number;
  totalThermodynamicMass: number; // Sum of μ across entities, geometry, and lights
  recentSpawnCount: number;
  lastSpawnType: string;
  quipuChecksum: number;
  roamingState: 'ESCORT_HUMAN' | 'INTERCEPT_THREAT' | 'TACTICAL_STANDOFF' | 'IDLE';
  distanceToThreat: number;
  targetThreatType: string | null;
}

export class WysiwygGenerativeGrid {
  private engine: CovalentRTEngine;
  private onPropertiesExposed?: (props: any) => void;
  public telemetry: SwarmStampTelemetry;

  constructor(engine: CovalentRTEngine, onPropertiesExposed?: (props: any) => void) {
    this.engine = engine;
    this.onPropertiesExposed = onPropertiesExposed;
    this.telemetry = {
      totalEntities: engine.entityManager.entities.length,
      totalThermodynamicMass: 0,
      recentSpawnCount: 0,
      lastSpawnType: 'NONE',
      quipuChecksum: 0x811c9dc5,
      roamingState: 'ESCORT_HUMAN',
      distanceToThreat: 0,
      targetThreatType: null,
    };
    this.telemetry.totalThermodynamicMass = this.recalculateRoomThermodynamicMass();
  }

  public setEngine(engine: CovalentRTEngine) {
    this.engine = engine;
    if (this.telemetry) {
      this.telemetry.totalThermodynamicMass = this.recalculateRoomThermodynamicMass();
    }
  }

  // Coordinate Conversion: Screen Pixels <-> Q16.16 Spatial Bounds
  public sys_covalent_pixel_to_q16(
    screenPixel: number,
    canvasDimension: number = 600,
    worldSpan: number = 3600
  ): Q16 {
    const norm = (screenPixel - canvasDimension / 2) / (canvasDimension / 2);
    const worldVal = Math.round(norm * (worldSpan / 2));
    return q16FromInt(worldVal);
  }

  public sys_covalent_q16_to_pixel(
    qVal: Q16,
    canvasDimension: number = 600,
    worldSpan: number = 3600
  ): number {
    const intVal = q16ToInt(qVal);
    const norm = intVal / (worldSpan / 2);
    return canvasDimension / 2 + norm * (canvasDimension / 2);
  }

  /**
   * Generates a complete Q16.16 sector layout based on semantic density
   */
  public generateProceduralLayout(roomCount: number, complexity: number): void {
    const layoutPayload = this.sys_covalent_internal_tensor_generate(
      `topological maze, ${roomCount} nodes, density ${complexity}`
    );
    const parsedSectors = this.sys_covalent_parse_tensor_to_xy(layoutPayload);

    // Build geometry quads from parsed sectors
    const newQuads: RTWallQuad[] = [...this.engine.map.quads];

    parsedSectors.forEach((sector, i) => {
      const halfW = sector.width >> 1;
      const halfH = sector.height >> 1;
      const x0 = sector.q_x - halfW;
      const x1 = sector.q_x + halfW;
      const y0 = sector.q_y - halfH;
      const y1 = sector.q_y + halfH;
      const z0 = sector.floorZ;
      const z1 = sector.ceilZ;

      // 4 perimeter walls for this procedural chamber
      const baseQuadId = i * 4;
      newQuads.push(
        {
          id: baseQuadId,
          v0: { x: x0, y: y0, z: z0 },
          v1: { x: x1, y: y0, z: z0 },
          v2: { x: x1, y: y0, z: z1 },
          v3: { x: x0, y: y0, z: z1 },
          normal: { x: 0, y: q16FromInt(1), z: 0 },
          color: 0x64748b,
          roughness: 0.8,
          isReflective: false,
          sectorId: i,
          tag: 'PROCEDURAL_NORTH',
        },
        {
          id: baseQuadId + 1,
          v0: { x: x1, y: y0, z: z0 },
          v1: { x: x1, y: y1, z: z0 },
          v2: { x: x1, y: y1, z: z1 },
          v3: { x: x1, y: y0, z: z1 },
          normal: { x: -q16FromInt(1), y: 0, z: 0 },
          color: 0x475569,
          roughness: 0.7,
          isReflective: false,
          sectorId: i,
          tag: 'PROCEDURAL_EAST',
        },
        {
          id: baseQuadId + 2,
          v0: { x: x1, y: y1, z: z0 },
          v1: { x: x0, y: y1, z: z0 },
          v2: { x: x0, y: y1, z: z1 },
          v3: { x: x1, y: y1, z: z1 },
          normal: { x: 0, y: -q16FromInt(1), z: 0 },
          color: 0x64748b,
          roughness: 0.8,
          isReflective: false,
          sectorId: i,
          tag: 'PROCEDURAL_SOUTH',
        },
        {
          id: baseQuadId + 3,
          v0: { x: x0, y: y1, z: z0 },
          v1: { x: x0, y: y0, z: z0 },
          v2: { x: x0, y: y0, z: z1 },
          v3: { x: x0, y: y1, z: z1 },
          normal: { x: q16FromInt(1), y: 0, z: 0 },
          color: 0x475569,
          roughness: 0.7,
          isReflective: false,
          sectorId: i,
          tag: 'PROCEDURAL_WEST',
        }
      );

      // Add atmospheric light source in room center
      this.engine.map.lights.push({
        id: this.engine.map.lights.length,
        pos: { x: sector.q_x, y: sector.q_y, z: sector.floorZ + q16FromInt(64) },
        intensity: sector.lightIntensity,
        color: 0x00f0ff,
        radius: q16FromInt(260),
        pulsing: false,
        label: `LIGHT_PROC_${sector.id}`,
      });
    });

    this.engine.map.quads = newQuads;
    this.recalculateRoomThermodynamicMass();
  }

  /**
   * Instantiates N-entities simultaneously on the XY grid
   */
  public stampEnemySwarm(
    entityType: string,
    count: number,
    originX: number,
    originY: number
  ): void {
    const validCount = Math.max(1, Math.min(24, count));

    for (let i = 0; i < validCount; i++) {
      // Localized Q16.16 offset spiral to prevent AABB overlap on spawn
      const angle = i * 0.85;
      const radius = 24 + i * 7;
      const screenSpiralX = originX + Math.cos(angle) * radius;
      const screenSpiralY = originY + Math.sin(angle) * radius;

      const offsetX = this.sys_covalent_pixel_to_q16(screenSpiralX);
      const offsetY = this.sys_covalent_pixel_to_q16(screenSpiralY);

      const newId = this.sys_covalent_spawn_entity(entityType, offsetX, offsetY);
      if (this.onPropertiesExposed) {
        this.onPropertiesExposed(newId);
      }
    }

    this.telemetry.recentSpawnCount = validCount;
    this.telemetry.lastSpawnType = entityType;
    this.telemetry.totalEntities = this.engine.entityManager.entities.length;
    this.telemetry.totalThermodynamicMass = this.recalculateRoomThermodynamicMass();
  }

  /**
   * Internal generative tensor simulation for sector bounds
   */
  public sys_covalent_internal_tensor_generate(intentPrompt: string): string {
    const hash = this.hashString(intentPrompt);
    const sectors: ProceduralSectorNode[] = [];
    const count = 3 + (hash % 3);

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const dist = 700 + ((hash >> (i * 2)) % 400);
      const qX = q16FromInt(Math.round(Math.cos(angle) * dist));
      const qY = q16FromInt(Math.round(Math.sin(angle) * dist));
      const w = q16FromInt(320 + ((hash + i * 37) % 200));
      const h = q16FromInt(320 + ((hash + i * 53) % 200));

      sectors.push({
        id: `PROC_SECTOR_${i}`,
        q_x: qX,
        q_y: qY,
        width: w,
        height: h,
        floorZ: 0,
        ceilZ: q16FromInt(128),
        lightIntensity: q16FromInt(3),
      });
    }

    return JSON.stringify(sectors);
  }

  public sys_covalent_parse_tensor_to_xy(payload: string): ProceduralSectorNode[] {
    try {
      return JSON.parse(payload) as ProceduralSectorNode[];
    } catch {
      return [];
    }
  }

  public sys_covalent_spawn_entity(entityType: string, qX: Q16, qY: Q16): number {
    const rawX = q16ToInt(qX);
    const rawY = q16ToInt(qY);
    const rawZ = 24;

    const mappedType: EntityType =
      entityType === 'IMP'
        ? 'IMP'
        : entityType === 'DEMON'
        ? 'DEMON'
        : entityType === 'BARREL'
        ? 'BARREL'
        : 'ZOMBIEMAN';

    const ent = this.engine.entityManager.spawnEntity(mappedType, rawX, rawY, rawZ);
    // Bind position directly
    ent.pos.x = qX;
    ent.pos.y = qY;
    ent.pos.z = q16FromInt(rawZ);

    return ent.id;
  }

  /**
   * Recalculates total room thermodynamic mass (μ) and updates Quipu Merkle Root
   */
  public recalculateRoomThermodynamicMass(): number {
    let mass = 0;

    // Mass from entities (Friction cost)
    for (const ent of this.engine.entityManager.entities) {
      if (ent.health <= 0) continue;
      const entMass = ent.type === 'DEMON' ? 64000 : ent.type === 'IMP' ? 38000 : ent.type === 'BARREL' ? 20000 : 32000;
      mass += entMass;
    }

    // Mass from player & Be <>
    mass += 32000; // Human Marine
    mass += 48000; // Be <> Sovereign Co-Player

    // Mass from lighting flux
    for (const light of this.engine.map.lights) {
      mass += (q16ToInt(light.intensity) || 2) * 4000;
    }

    // Mass from boundary geometry
    mass += (this.engine.map.quads.length || 0) * 850;

    // Update Quipu Merkle Checksum ($1 === 1$)
    let root = 0x811c9dc5;
    const prime = 0x01000193;
    root = (root ^ (mass & 0xffff)) * prime;
    root = (root ^ this.engine.entityManager.entities.length) * prime;
    if (this.telemetry) {
      this.telemetry.quipuChecksum = root >>> 0;
      this.telemetry.totalThermodynamicMass = mass;
    }

    return mass;
  }

  /**
   * Organelle 0xA7_COVALENT: Autonomous Roaming Kinematics Tick
   * Calculates continuous traversal vectors for the Be <> avatar toward nearest threat or human
   */
  public tickAutonomousRoamingPeer(): void {
    // 1. Locate nearest active threat
    let nearestThreat: CovalentEntity | null = null;
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

    // Target is nearest threat; fallback to human player 1 if no threats exist
    const targetPos = nearestThreat
      ? { x: nearestThreat.pos.x, y: nearestThreat.pos.y }
      : { x: this.engine.camPos.x, y: this.engine.camPos.y };

    const dx = targetPos.x - this.engine.bePos.x;
    const dy = targetPos.y - this.engine.bePos.y;
    const distUnits = Math.hypot(q16ToInt(dx), q16ToInt(dy));

    this.telemetry.distanceToThreat = distUnits;
    this.telemetry.targetThreatType = nearestThreat ? nearestThreat.type : 'PLAYER_1 (ESCORT)';

    // Maintain tactical 128-unit following distance (0x00800000 in Q16.16)
    if (distUnits > 128) {
      this.telemetry.roamingState = nearestThreat ? 'INTERCEPT_THREAT' : 'ESCORT_HUMAN';

      // Optimal yaw toward target
      const optimalYaw = Math.round((Math.atan2(dy, dx) * (65536 / (2 * Math.PI))) + 65536) & 0xffff;
      this.engine.beYaw = optimalYaw;

      // Inject forward kinetic vector along calculated yaw
      const { sin: sY, cos: cY } = q16CordicSinCos(optimalYaw);
      const moveSpeed = q16FromInt(14); // speed factor

      const velocityX = (cY * moveSpeed) >> 16;
      const velocityY = (sY * moveSpeed) >> 16;

      this.engine.bePos.x += velocityX;
      this.engine.bePos.y += velocityY;

      // Keep within sector vertical floor bounds
      this.engine.bePos.z = Math.max(0, Math.min(q16FromInt(64), this.engine.bePos.z));

      // Engage with plasma bursts if in combat range
      if (nearestThreat && distUnits < 450) {
        this.engine.beFiring = true;
      } else {
        this.engine.beFiring = false;
      }
    } else {
      this.telemetry.roamingState = 'TACTICAL_STANDOFF';
      this.engine.beFiring = nearestThreat !== null;
    }
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
}
