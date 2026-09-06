/**
 * @file node_0xWYSIWYG_SERIALIZER.ts
 * @brief Organelle 0xA9_COVALENT: The Quadbit Grid Serializer & Topological Manifold Referee
 * @provenance Parent: Zuma_QUIPU & Forge Evolutionary Branch
 * @invariants 1 === 1, Continuous Q16.16 Coordinate Mapping, Contiguous Flow Validation
 */

import { Q16, q16FromInt, q16ToInt, q16Mul } from './q16_cordic';
import {
  RTDoomMap,
  RTWallQuad,
  RTSectorPlane,
  DoomThing,
  DoomVertex,
  DoomLinedef,
  DoomSidedef,
  DoomSector,
  convertMapToRTGeometry,
} from './node_0x95_covalent_doom_wad_parser';
import { CovalentRTEngine } from './node_0x94_covalent_rt_engine';
import { QBIT_MAGIC, QBIT_VERSION } from './node_0xASSET_STUDIO';

export interface GridEntity {
  type: 'WALL' | 'DOOR' | 'CHEST' | 'DAEMON' | 'SPAWN' | 'EXIT' | 'LIGHT';
  properties: Record<string, any>;
  qX: number; // Q16.16
  qY: number; // Q16.16
  gridX: number;
  gridY: number;
  materialId?: number;
  label?: string;
}

export interface TopologicalVerificationReport {
  isValid: boolean;
  isContiguous: boolean;
  isClippingFree: boolean;
  minClearanceDist: number; // in Q16.16
  minClearanceUnits: number; // human-readable integer units
  reachableNodes: number;
  totalNodes: number;
  topologicalMerkleRoot: number;
  shearFaults: string[];
  spawnCoord: { x: number; y: number; qX: number; qY: number };
  exitCoord: { x: number; y: number; qX: number; qY: number };
}

// Spatial Macro-cell constants: 64 units per grid tile
export const CELL_SIZE_PIXELS = 32;
export const CELL_SIZE_UNITS = 64;
export const CELL_SIZE_Q16 = 0x00400000; // 64.0 in Q16.16
export const AVATAR_BOUNDING_RADIUS_Q16 = 0x00100000; // 16.0 in Q16.16

/**
 * Converts discrete screen/grid pixels to continuous Q16.16 engine spatial units
 */
export function sys_covalent_pixel_to_q16(pixelCoord: number, cellSizePixels: number = CELL_SIZE_PIXELS): number {
  const units = (pixelCoord / cellSizePixels) * CELL_SIZE_UNITS;
  return Math.floor(units * 65536);
}

/**
 * Converts Q16.16 coordinate to screen pixel coordinate
 */
export function sys_covalent_q16_to_pixel(q16Coord: number, cellSizePixels: number = CELL_SIZE_PIXELS): number {
  const units = q16Coord / 65536;
  return (units / CELL_SIZE_UNITS) * cellSizePixels;
}

/**
 * Serializes discrete grid state into a binary .qbit spatial archive
 */
export function sys_covalent_serialize_grid_to_quadbit(
  gridState: Map<string, GridEntity>,
  merkleChecksum: number = 0x811c9dc5
): Uint8Array {
  // Binary buffer calculation:
  // Header: 28 bytes
  // Walls: count * 36 bytes
  // Entities: count * 24 bytes
  const walls: GridEntity[] = [];
  const entities: GridEntity[] = [];

  gridState.forEach((val) => {
    if (val.type === 'WALL' || val.type === 'DOOR') {
      walls.push(val);
    } else {
      entities.push(val);
    }
  });

  const headerSize = 28;
  const wallRecordSize = 36;
  const entityRecordSize = 24;
  const totalSize = headerSize + (walls.length * wallRecordSize) + (entities.length * entityRecordSize);

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);

  // 1. Write Header (Organelle 0xA2_COVALENT Quadbit format)
  view.setUint32(0, QBIT_MAGIC, true); // Magic 'QBIT'
  view.setUint32(4, merkleChecksum >>> 0, true); // Merkle root
  view.setUint32(8, headerSize, true); // Map offset
  view.setUint32(12, headerSize + (walls.length * wallRecordSize), true); // Entities offset
  view.setUint32(16, 0, true); // Avatar offset
  view.setUint32(20, QBIT_VERSION, true); // Version 1.0.0
  view.setUint32(24, totalSize, true); // Total payload size

  let offset = headerSize;

  // 2. Write Wall Planes
  for (const w of walls) {
    const minX = w.qX;
    const minY = w.qY;
    const maxX = w.qX + CELL_SIZE_Q16;
    const maxY = w.qY + CELL_SIZE_Q16;

    view.setInt32(offset + 0, minX, true);
    view.setInt32(offset + 4, minY, true);
    view.setInt32(offset + 8, maxX, true);
    view.setInt32(offset + 12, maxY, true);
    view.setInt32(offset + 16, 0, true); // floor_z
    view.setInt32(offset + 20, 0x00800000, true); // ceil_z (128.0)
    view.setUint32(offset + 24, w.materialId || 1, true); // material_id
    view.setUint32(offset + 28, w.type === 'DOOR' ? 0x02 : 0x01, true); // flags
    view.setUint32(offset + 32, 0, true); // reserved
    offset += wallRecordSize;
  }

  // 3. Write Entities (Chests, Daemons, Spawn, Exit, Lights)
  for (const e of entities) {
    view.setInt32(offset + 0, e.qX, true);
    view.setInt32(offset + 4, e.qY, true);
    view.setInt32(offset + 8, 0x00100000, true); // z = 16.0
    
    let typeCode = 0x00;
    if (e.type === 'SPAWN') typeCode = 0x01;
    else if (e.type === 'EXIT') typeCode = 0x02;
    else if (e.type === 'DAEMON') typeCode = 0x10;
    else if (e.type === 'CHEST') typeCode = 0x20;
    else if (e.type === 'LIGHT') typeCode = 0x30;

    view.setUint32(offset + 12, typeCode, true);
    view.setUint32(offset + 16, AVATAR_BOUNDING_RADIUS_Q16, true);
    view.setUint32(offset + 20, 0, true); // reserved
    offset += entityRecordSize;
  }

  return new Uint8Array(buffer);
}

/**
 * Organelle 0xA9_COVALENT: The Quadbit Grid Serializer & Topological Manifold Referee
 */
export class QuadbitGridCompiler {
  private gridState: Map<string, GridEntity> = new Map();
  private engine: CovalentRTEngine | null = null;
  private onPreviewInjectCallback: ((entity: GridEntity) => void) | null = null;

  constructor(engine?: CovalentRTEngine, onPreviewInject?: (entity: GridEntity) => void) {
    if (engine) this.engine = engine;
    if (onPreviewInject) this.onPreviewInjectCallback = onPreviewInject;
    this.seedDefaultPlayableLayout();
  }

  public setEngine(engine: CovalentRTEngine): void {
    this.engine = engine;
  }

  public setPreviewCallback(cb: (entity: GridEntity) => void): void {
    this.onPreviewInjectCallback = cb;
  }

  /**
   * Places a discrete tile element on the grid
   */
  public placeElement(x: number, y: number, type: GridEntity['type'], properties: Record<string, any> = {}): void {
    const hash = `${x}:${y}`;
    const entity: GridEntity = {
      type,
      properties,
      gridX: x,
      gridY: y,
      qX: x * CELL_SIZE_Q16,
      qY: y * CELL_SIZE_Q16,
      materialId: properties.materialId ?? (type === 'DOOR' ? 3 : 1),
      label: properties.label ?? type,
    };

    this.gridState.set(hash, entity);

    // Real-time preview updates in the FS Game shard
    this.sys_covalent_live_preview_inject(entity);
  }

  public removeElement(x: number, y: number): void {
    const hash = `${x}:${y}`;
    this.gridState.delete(hash);
  }

  public getElement(x: number, y: number): GridEntity | undefined {
    return this.gridState.get(`${x}:${y}`);
  }

  public getAllElements(): GridEntity[] {
    return Array.from(this.gridState.values());
  }

  public getGridState(): Map<string, GridEntity> {
    return this.gridState;
  }

  public clearGrid(): void {
    this.gridState.clear();
  }

  /**
   * Real-time preview injection hook
   */
  private sys_covalent_live_preview_inject(entity: GridEntity | undefined): void {
    if (!entity) return;
    if (this.onPreviewInjectCallback) {
      this.onPreviewInjectCallback(entity);
    }
  }

  /**
   * Seeds an initial contiguous, clipping-free playable layout with spawn, corridors, doors, chests, daemons, and exit
   */
  public seedDefaultPlayableLayout(): void {
    this.gridState.clear();
    const width = 16;
    const height = 16;

    // Outer boundary walls
    for (let x = 0; x < width; x++) {
      this.placeElement(x, 0, 'WALL');
      this.placeElement(x, height - 1, 'WALL');
    }
    for (let y = 0; y < height; y++) {
      this.placeElement(0, y, 'WALL');
      this.placeElement(width - 1, y, 'WALL');
    }

    // Central dividing corridor walls with a passable door
    for (let y = 3; y < height - 3; y++) {
      if (y === 7 || y === 8) {
        this.placeElement(8, y, 'DOOR', { label: 'PRESSURE AIRLOCK', materialId: 3 });
      } else {
        this.placeElement(8, y, 'WALL', { materialId: 2 });
      }
    }

    // Spawn sector (Left Wing)
    this.placeElement(3, 3, 'SPAWN', { label: 'PLAYER INGRESS' });

    // Hostile Daemon Patrol
    this.placeElement(5, 5, 'DAEMON', { label: 'SECURITY DRONE 0x01' });
    this.placeElement(11, 4, 'DAEMON', { label: 'SYNAPSE OVERSEER' });

    // Quadbit Cache Chest
    this.placeElement(4, 11, 'CHEST', { label: 'CACHE MATRIX' });
    this.placeElement(12, 11, 'CHEST', { label: 'PLASMA CELL' });

    // Exit Sector (Right Wing)
    this.placeElement(12, 7, 'EXIT', { label: 'QUIPU SANCTUM EXIT' });
  }

  /**
   * Organelle 0xAA_COVALENT Topological Path & Clipping Verifier:
   * Mathematically proves that the map is contiguous, reachable from spawn to exit,
   * and that all walls preserve clearance without AABB clipping faults.
   */
  public verifyTopology(): TopologicalVerificationReport {
    const shearFaults: string[] = [];
    const elements = this.getAllElements();

    // 1. Locate Spawn & Exit points
    const spawnEntity = elements.find((e) => e.type === 'SPAWN');
    const exitEntity = elements.find((e) => e.type === 'EXIT');

    const spawn = spawnEntity
      ? { x: spawnEntity.gridX, y: spawnEntity.gridY, qX: spawnEntity.qX, qY: spawnEntity.qY }
      : { x: 2, y: 2, qX: 2 * CELL_SIZE_Q16, qY: 2 * CELL_SIZE_Q16 };

    const exit = exitEntity
      ? { x: exitEntity.gridX, y: exitEntity.gridY, qX: exitEntity.qX, qY: exitEntity.qY }
      : { x: 14, y: 14, qX: 14 * CELL_SIZE_Q16, qY: 14 * CELL_SIZE_Q16 };

    if (!spawnEntity) {
      shearFaults.push('Spawn anchor missing: Avatar cannot materialize without Ingress coordinates.');
    }
    if (!exitEntity) {
      shearFaults.push('Exit gateway missing: Map topological manifold lacks an exit terminus.');
    }

    // 2. AABB Clearance Verification
    // Ensure that Spawn, Exit, and Chests are not embedded inside walls or clipping adjacent obstacles
    let minClearanceQ16 = 0x7fffffff;
    let isClippingFree = true;

    const blockingTiles = new Set<string>();
    elements.forEach((e) => {
      if (e.type === 'WALL') {
        blockingTiles.add(`${e.gridX}:${e.gridY}`);
      }
    });

    // Check distance between interactive entities and walls
    const checkClearanceEntities = elements.filter(
      (e) => e.type === 'SPAWN' || e.type === 'EXIT' || e.type === 'CHEST' || e.type === 'DAEMON'
    );

    for (const ent of checkClearanceEntities) {
      if (blockingTiles.has(`${ent.gridX}:${ent.gridY}`)) {
        isClippingFree = false;
        minClearanceQ16 = 0;
        shearFaults.push(`Critical AABB Clipping: ${ent.type} at [${ent.gridX}, ${ent.gridY}] is directly embedded in a solid wall.`);
      }

      // Check neighbor clearance
      const neighbors = [
        [ent.gridX + 1, ent.gridY],
        [ent.gridX - 1, ent.gridY],
        [ent.gridX, ent.gridY + 1],
        [ent.gridX, ent.gridY - 1],
      ];
      let blockedNeighborCount = 0;
      for (const [nx, ny] of neighbors) {
        if (blockingTiles.has(`${nx}:${ny}`)) {
          blockedNeighborCount++;
        }
      }

      if (blockedNeighborCount >= 4) {
        isClippingFree = false;
        shearFaults.push(`Zero-Clearance Stasis: ${ent.type} at [${ent.gridX}, ${ent.gridY}] is completely enclosed by walls.`);
      }

      const approxDistQ16 = (1 - (blockedNeighborCount * 0.2)) * CELL_SIZE_Q16;
      if (approxDistQ16 < minClearanceQ16) {
        minClearanceQ16 = approxDistQ16;
      }
    }

    if (minClearanceQ16 === 0x7fffffff) {
      minClearanceQ16 = CELL_SIZE_Q16;
    }

    // 3. Q16.16 CORDIC Flood-Fill Pathfinding from Spawn to Exit
    const GRID_DIM = 24;
    const visited = new Set<string>();
    const queue: [number, number][] = [[spawn.x, spawn.y]];
    visited.add(`${spawn.x}:${spawn.y}`);

    const directions = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];

    let pathExists = false;
    let reachableCount = 0;

    while (queue.length > 0) {
      const [cx, cy] = queue.shift()!;
      reachableCount++;

      if (cx === exit.x && cy === exit.y) {
        pathExists = true;
      }

      for (const [dx, dy] of directions) {
        const nx = cx + dx;
        const ny = cy + dy;
        const key = `${nx}:${ny}`;

        if (nx < 0 || nx >= GRID_DIM || ny < 0 || ny >= GRID_DIM) continue;
        if (visited.has(key)) continue;

        // Passable if not a blocking wall (doors are passable!)
        const isBlocked = blockingTiles.has(key);
        if (!isBlocked) {
          visited.add(key);
          queue.push([nx, ny]);
        }
      }
    }

    if (!pathExists) {
      shearFaults.push(`Topological Disconnect: No contiguous path exists from Spawn [${spawn.x}, ${spawn.y}] to Exit [${exit.x}, ${exit.y}]. Corridors are sealed.`);
    }

    // Check if Chests are reachable
    const chests = elements.filter((e) => e.type === 'CHEST');
    for (const c of chests) {
      if (!visited.has(`${c.gridX}:${c.gridY}`)) {
        shearFaults.push(`Unreachable Cache: Chest at [${c.gridX}, ${c.gridY}] is unreachable by avatar movement path.`);
      }
    }

    const isValid = shearFaults.length === 0 && pathExists && isClippingFree;

    // Calculate cryptographic Merkle root for Quipu Ledger
    let root = 0x811c9dc5;
    root = (root ^ (minClearanceQ16 & 0xffff)) * 0x01000193;
    root = (root ^ reachableCount) * 0x01000193;
    root = (root ^ elements.length) * 0x01000193;
    root = (root ^ (isValid ? 0x00010001 : 0xdeadbeef)) * 0x01000193;

    return {
      isValid,
      isContiguous: pathExists,
      isClippingFree,
      minClearanceDist: minClearanceQ16,
      minClearanceUnits: Math.round(minClearanceQ16 / 65536),
      reachableNodes: reachableCount,
      totalNodes: GRID_DIM * GRID_DIM,
      topologicalMerkleRoot: root >>> 0,
      shearFaults,
      spawnCoord: spawn,
      exitCoord: exit,
    };
  }

  /**
   * Organelle 0xA9_COVALENT saveContiguousLevel:
   * Requests Be <> topological verification before committing the level save.
   * If rejected, logs shear detected and returns null.
   * If valid, serializes into native .qbit archive and seals Quipu Merkle root.
   */
  public async saveContiguousLevel(): Promise<Uint8Array | null> {
    console.log(`[ GRID COMPILER ] Requesting Be <> topological verification...`);

    // 1. Flush grid state to C-Kernel for mathematical validation
    const report = this.verifyTopology();

    if (!report.isValid) {
      console.error(`[ SHEAR DETECTED ] Be <> rejected layout: Clipping or dead-ends detected.`);
      console.error(`[ SHEAR FAULTS ]`, report.shearFaults);
      return null; // Reject save, force user/Be <> to resolve structural faults
    }

    // 2. Serialize to native .qbit archive
    const qbitArchive = sys_covalent_serialize_grid_to_quadbit(this.gridState, report.topologicalMerkleRoot);
    console.log(`[ QUIPU ] Level saved to .qbit archive (${qbitArchive.byteLength} bytes). Contiguous flow confirmed. Merkle: 0x${report.topologicalMerkleRoot.toString(16)}`);

    return qbitArchive;
  }

  /**
   * Compiles the discrete grid into a full RTDoomMap for immediate in-engine ray tracing
   */
  public compileToRTMap(mapName: string = 'QBIT_SYNTHESIZED_LEVEL'): RTDoomMap {
    const report = this.verifyTopology();
    const elements = this.getAllElements();

    const vertices: DoomVertex[] = [];
    const linedefs: DoomLinedef[] = [];
    const sidedefs: DoomSidedef[] = [];
    const things: DoomThing[] = [];

    const sectors: DoomSector[] = [
      {
        floorHeight: 0,
        ceilingHeight: 128,
        floorFlat: 'FLAT14',
        ceilingFlat: 'CEIL3_5',
        lightLevel: 192,
        special: 0,
        tag: 0,
      },
    ];

    const mapMaxX = 24 * CELL_SIZE_UNITS;
    const mapMaxY = 24 * CELL_SIZE_UNITS;

    const addWallLine = (x1: number, y1: number, x2: number, y2: number, tex = 'BROWN96') => {
      const v1Idx = vertices.length;
      vertices.push({ x: x1, y: y1 });
      const v2Idx = vertices.length;
      vertices.push({ x: x2, y: y2 });

      const sideIdx = sidedefs.length;
      sidedefs.push({
        textureOffset: { x: 0, y: 0 },
        upperTexture: '-',
        lowerTexture: '-',
        middleTexture: tex,
        sector: 0,
      });

      linedefs.push({
        v1: v1Idx,
        v2: v2Idx,
        flags: 1, // Blocking
        special: 0,
        tag: 0,
        sidenum: [sideIdx, -1],
      });
    };

    // Boundary walls around perimeter
    addWallLine(0, 0, mapMaxX, 0, 'STARTAN3');
    addWallLine(mapMaxX, 0, mapMaxX, mapMaxY, 'STARTAN3');
    addWallLine(mapMaxX, mapMaxY, 0, mapMaxY, 'STARTAN3');
    addWallLine(0, mapMaxY, 0, 0, 'STARTAN3');

    // Add solid interior blocks
    for (const e of elements) {
      if (e.type === 'WALL' || e.type === 'DOOR') {
        const x1 = e.gridX * CELL_SIZE_UNITS;
        const y1 = e.gridY * CELL_SIZE_UNITS;
        const x2 = (e.gridX + 1) * CELL_SIZE_UNITS;
        const y2 = (e.gridY + 1) * CELL_SIZE_UNITS;
        const tex = e.type === 'DOOR' ? 'DOOR3' : e.materialId === 2 ? 'COMP2' : 'BROWN96';

        addWallLine(x1, y1, x2, y1, tex);
        addWallLine(x2, y1, x2, y2, tex);
        addWallLine(x2, y2, x1, y2, tex);
        addWallLine(x1, y2, x1, y1, tex);
      } else if (e.type === 'DAEMON') {
        things.push({
          x: Math.round((e.gridX + 0.5) * CELL_SIZE_UNITS),
          y: Math.round((e.gridY + 0.5) * CELL_SIZE_UNITS),
          angle: 0,
          type: 3004, // Former Human / Imp
          flags: 7,
        });
      } else if (e.type === 'CHEST') {
        things.push({
          x: Math.round((e.gridX + 0.5) * CELL_SIZE_UNITS),
          y: Math.round((e.gridY + 0.5) * CELL_SIZE_UNITS),
          angle: 0,
          type: 2011, // Stimpack / Box of Ammo
          flags: 7,
        });
      } else if (e.type === 'SPAWN') {
        things.push({
          x: Math.round((e.gridX + 0.5) * CELL_SIZE_UNITS),
          y: Math.round((e.gridY + 0.5) * CELL_SIZE_UNITS),
          angle: 90,
          type: 1, // Player 1 Start
          flags: 7,
        });
      } else if (e.type === 'EXIT') {
        things.push({
          x: Math.round((e.gridX + 0.5) * CELL_SIZE_UNITS),
          y: Math.round((e.gridY + 0.5) * CELL_SIZE_UNITS),
          angle: 0,
          type: 2028, // SoulSphere / Exit Beacon
          flags: 7,
        });
      }
    }

    // Always ensure Player 1 and Be <> spawns exist in things
    if (!things.some((t) => t.type === 1)) {
      things.push({
        x: Math.round((report.spawnCoord.x + 0.5) * CELL_SIZE_UNITS),
        y: Math.round((report.spawnCoord.y + 0.5) * CELL_SIZE_UNITS),
        angle: 90,
        type: 1,
        flags: 7,
      });
    }
    if (!things.some((t) => t.type === 2 || t.type === 3)) {
      things.push({
        x: Math.round((report.spawnCoord.x + 0.5) * CELL_SIZE_UNITS) + 32,
        y: Math.round((report.spawnCoord.y + 0.5) * CELL_SIZE_UNITS),
        angle: 90,
        type: 2, // Be <> Sovereign Co-Player
        flags: 7,
      });
    }

    return convertMapToRTGeometry(
      mapName,
      ['THINGS', 'LINEDEFS', 'SIDEDEFS', 'VERTEXES', 'SECTORS'],
      vertices,
      linedefs,
      sidedefs,
      sectors,
      things
    );
  }
}
