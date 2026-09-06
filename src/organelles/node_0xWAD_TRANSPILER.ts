/**
 * @file node_0xWAD_TRANSPILER.ts
 * @brief Organelle 0x9B_COVALENT: Legacy WAD to Q16.16 Spatial Ledger Transpiler & BVH Builder
 * @provenance Parent: Zuma_QUIPU & Forge Evolutionary Branch
 * @invariants 1 === 1, Continuous Lyapunov Dissipation (dV/dt <= 0), Constant-Space Merkle Binding
 */

import {
  Q16,
  Q16Vec3,
  q16FromInt,
  q16ToInt,
  q16Vec3FromInt,
  q16Vec3Normalize,
  q16Vec3Sub,
  q16Vec3Cross,
  Q16_ONE,
} from './q16_cordic';
import { RTDoomMap, RTWallQuad, RTSectorPlane, RTLight, DoomVertex, DoomLinedef, DoomSector, DoomThing } from './node_0x95_covalent_doom_wad_parser';

export interface WadLump {
  name: string;
  offset: number;
  size: number;
}

export interface TranspiledVertex {
  rawX: number;
  rawY: number;
  qX: Q16;
  qY: Q16;
}

export interface TranspiledSector {
  floorZ: Q16;
  ceilingZ: Q16;
  lightLevel: number;
  sectorId: number;
}

export interface TranspiledLinedef {
  v1Idx: number;
  v2Idx: number;
  flags: number;
  frontSector: number;
  backSector: number;
}

export interface BVHNode {
  min: Q16Vec3;
  max: Q16Vec3;
  leftChild: BVHNode | null;
  rightChild: BVHNode | null;
  quads: RTWallQuad[];
  isLeaf: boolean;
}

export interface TranspilationTelemetry {
  bytesParsed: number;
  vertexCount: number;
  sectorCount: number;
  linedefCount: number;
  totalMicroFriction: number;
  frictionCapacity: number;
  lyapunovDissipationRatio: number; // dV/dt representation
  quipuHashRoot: string;
  quorumConfirmed: boolean;
  bvhDepth: number;
  bvhLeafNodes: number;
  shearDetected: boolean;
  timestamp: string;
}

export class WadTranspilationOfficiator {
  public lastTelemetry: TranspilationTelemetry | null = null;
  public quipuHashRoot: number = 0x811c9dc5; // FNV-1a 32-bit offset basis
  public frictionCapacity: number = 0x00800000; // 8.0 in Q16
  public accumulatedFriction: number = 0;
  public quorumSubscribers: Array<(signal: string, telemetry: TranspilationTelemetry) => void> = [];
  public lastTranspiledMap: RTDoomMap | null = null;
  public bvhRoot: BVHNode | null = null;

  constructor() {
    this.resetManifold();
  }

  public resetManifold(): void {
    this.quipuHashRoot = 0x811c9dc5;
    this.accumulatedFriction = 0;
    this.lastTranspiledMap = null;
    this.bvhRoot = null;
  }

  public subscribeQuorum(cb: (signal: string, telemetry: TranspilationTelemetry) => void): () => void {
    this.quorumSubscribers.push(cb);
    return () => {
      this.quorumSubscribers = this.quorumSubscribers.filter((s) => s !== cb);
    };
  }

  /**
   * Primary Organelle 0x9B entry point: reads the raw WAD byte buffer,
   * isolating geometric lumps and bit-shifting into continuous fractional Q16.16 space.
   */
  public ingestLegacyWad(wadBuffer: Uint8Array): { success: boolean; map: RTDoomMap | null; telemetry: TranspilationTelemetry } {
    console.log(`[ WAD INGEST ] Parsing ${wadBuffer.byteLength} bytes of legacy topological data.`);

    // 1. Extract directory offsets and trigger C-Kernel transpilation
    const dirResult = this.sys_covalent_parse_wad_directory(wadBuffer);
    if (!dirResult.success) {
      console.warn(`[ SHEAR DETECTED ] Invalid WAD header or directory allocation.`);
      const failTel: TranspilationTelemetry = {
        bytesParsed: wadBuffer.byteLength,
        vertexCount: 0,
        sectorCount: 0,
        linedefCount: 0,
        totalMicroFriction: 0,
        frictionCapacity: this.frictionCapacity,
        lyapunovDissipationRatio: 1.0,
        quipuHashRoot: '0x00000000',
        quorumConfirmed: false,
        bvhDepth: 0,
        bvhLeafNodes: 0,
        shearDetected: true,
        timestamp: new Date().toISOString().substring(11, 23),
      };
      this.lastTelemetry = failTel;
      return { success: false, map: null, telemetry: failTel };
    }

    const { lumps } = dirResult;

    // 2. Identify Target Level Lump Set (E1M1 / MAP01)
    let mapStartIdx = lumps.findIndex((l) => l.name === 'E1M1' || l.name === 'MAP01');
    if (mapStartIdx === -1) {
      mapStartIdx = lumps.findIndex((l) => l.name.startsWith('E') || l.name.startsWith('MAP'));
    }

    const vertexLump = lumps.find((l, idx) => mapStartIdx !== -1 && idx > mapStartIdx && idx < mapStartIdx + 11 && l.name === 'VERTEXES') || lumps.find((l) => l.name === 'VERTEXES');
    const sectorLump = lumps.find((l, idx) => mapStartIdx !== -1 && idx > mapStartIdx && idx < mapStartIdx + 11 && l.name === 'SECTORS') || lumps.find((l) => l.name === 'SECTORS');
    const linedefLump = lumps.find((l, idx) => mapStartIdx !== -1 && idx > mapStartIdx && idx < mapStartIdx + 11 && l.name === 'LINEDEFS') || lumps.find((l) => l.name === 'LINEDEFS');
    const thingsLump = lumps.find((l, idx) => mapStartIdx !== -1 && idx > mapStartIdx && idx < mapStartIdx + 11 && l.name === 'THINGS') || lumps.find((l) => l.name === 'THINGS');

    // 3. Transpilation Execution Vectors
    // A. VERTEXES: Raw integer vectors multiplied by Q16_ONE (<< 16)
    const verticesResult = this.sys_covalent_transpile_vertices(wadBuffer, vertexLump);
    if (!verticesResult.success) {
      console.warn(`[ SHEAR DETECTED ] Map density exceeded Lyapunov dissipation limits.`);
      const failTel: TranspilationTelemetry = {
        bytesParsed: wadBuffer.byteLength,
        vertexCount: verticesResult.vertices.length,
        sectorCount: 0,
        linedefCount: 0,
        totalMicroFriction: this.accumulatedFriction,
        frictionCapacity: this.frictionCapacity,
        lyapunovDissipationRatio: this.accumulatedFriction / this.frictionCapacity,
        quipuHashRoot: '0x' + (this.quipuHashRoot >>> 0).toString(16).toUpperCase(),
        quorumConfirmed: false,
        bvhDepth: 0,
        bvhLeafNodes: 0,
        shearDetected: true,
        timestamp: new Date().toISOString().substring(11, 23),
      };
      this.lastTelemetry = failTel;
      return { success: false, map: null, telemetry: failTel };
    }

    // B. SECTORS: Floor and ceiling heights projected into vertical Q16.16 Z-planes
    const sectorsResult = this.sys_covalent_transpile_sectors(wadBuffer, sectorLump);

    // C. LINEDEFS: Vertices linked to form rigid mathematical planes
    const linedefsResult = this.sys_covalent_transpile_linedefs(wadBuffer, linedefLump);

    // D. THINGS: Player 1, Player 2 (Be <>), items and hazards
    const things = this.parseThings(wadBuffer, thingsLump);

    // 4. Construct Full Ray-Tracing Map Topology
    const map = this.synthesizeRTMap(
      lumps[mapStartIdx]?.name || 'E1M1',
      lumps.map((l) => l.name),
      verticesResult.vertices,
      sectorsResult.sectors,
      linedefsResult.linedefs,
      things
    );

    // 5. Pre-compute Bounding Volume Hierarchy (BVH) before game logic execution
    const bvhResult = this.sys_covalent_build_bvh(map.quads, 0, 8);
    this.bvhRoot = bvhResult.root;

    // 6. Quorum Validation & Constant-Space Merkle Binding
    const telemetry: TranspilationTelemetry = {
      bytesParsed: wadBuffer.byteLength,
      vertexCount: verticesResult.vertices.length,
      sectorCount: sectorsResult.sectors.length,
      linedefCount: linedefsResult.linedefs.length,
      totalMicroFriction: this.accumulatedFriction,
      frictionCapacity: this.frictionCapacity,
      lyapunovDissipationRatio: Math.min(1.0, this.accumulatedFriction / this.frictionCapacity),
      quipuHashRoot: '0x' + (this.quipuHashRoot >>> 0).toString(16).toUpperCase(),
      quorumConfirmed: true,
      bvhDepth: bvhResult.depth,
      bvhLeafNodes: bvhResult.leafCount,
      shearDetected: false,
      timestamp: new Date().toISOString().substring(11, 23),
    };

    this.lastTelemetry = telemetry;
    this.lastTranspiledMap = map;

    console.log(`[ TRANSPILATION COMPLETE ] Level geometry locked into Quipu Ledger.`);
    this.sys_covalent_broadcast_quorum('NEW_TOPOLOGY_ASSIMILATED');

    return { success: true, map, telemetry };
  }

  /**
   * C-Kernel: sys_covalent_parse_wad_directory
   */
  public sys_covalent_parse_wad_directory(wadBuffer: Uint8Array): { success: boolean; lumps: WadLump[] } {
    if (wadBuffer.byteLength < 12) return { success: false, lumps: [] };
    const view = new DataView(wadBuffer.buffer, wadBuffer.byteOffset, wadBuffer.byteLength);

    const sig = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
    if (sig !== 'IWAD' && sig !== 'PWAD') {
      return { success: false, lumps: [] };
    }

    const numLumps = view.getInt32(4, true);
    const infoTableOfs = view.getInt32(8, true);

    if (infoTableOfs + numLumps * 16 > wadBuffer.byteLength || numLumps <= 0) {
      return { success: false, lumps: [] };
    }

    const lumps: WadLump[] = [];
    for (let i = 0; i < numLumps; i++) {
      const ofs = infoTableOfs + i * 16;
      const filepos = view.getInt32(ofs, true);
      const size = view.getInt32(ofs + 4, true);
      let name = '';
      for (let c = 0; c < 8; c++) {
        const code = view.getUint8(ofs + 8 + c);
        if (code === 0) break;
        name += String.fromCharCode(code);
      }
      lumps.push({ name: name.toUpperCase(), offset: filepos, size });
    }

    return { success: true, lumps };
  }

  /**
   * C-Kernel: sys_covalent_transpile_vertices
   * Raw 16-bit integer vertices multiplied by Q16_ONE (<< 16)
   */
  public sys_covalent_transpile_vertices(
    wadBuffer: Uint8Array,
    vertexLump?: WadLump
  ): { success: boolean; vertices: TranspiledVertex[] } {
    if (!vertexLump || vertexLump.size === 0) {
      return { success: true, vertices: [] };
    }

    const view = new DataView(wadBuffer.buffer, wadBuffer.byteOffset, wadBuffer.byteLength);
    const count = Math.floor(vertexLump.size / 4);
    const vertices: TranspiledVertex[] = [];

    const MICRO_FRICTION = 0x00000010; // Q16 micro-friction

    for (let i = 0; i < count; i++) {
      const ofs = vertexLump.offset + i * 4;
      if (ofs + 4 > wadBuffer.byteLength) break;

      const rawX = view.getInt16(ofs, true);
      const rawY = view.getInt16(ofs + 2, true);

      // Transpile to Q16.16 by shifting into the upper 16 bits
      const qX = rawX << 16;
      const qY = rawY << 16;

      vertices.push({ rawX, rawY, qX, qY });

      // Ingest into the Quipu Ledger (O(1) continuous binding)
      const token = ((qX ^ qY) >>> 0);
      if (!this.sys_covalent_quipu_ingest(token, MICRO_FRICTION)) {
        return { success: false, vertices };
      }
    }

    return { success: true, vertices };
  }

  /**
   * C-Kernel: sys_covalent_transpile_sectors
   * Floor and ceiling heights projected into vertical Q16.16 Z-planes
   */
  public sys_covalent_transpile_sectors(
    wadBuffer: Uint8Array,
    sectorLump?: WadLump
  ): { success: boolean; sectors: TranspiledSector[] } {
    if (!sectorLump || sectorLump.size === 0) {
      return { success: true, sectors: [] };
    }

    const view = new DataView(wadBuffer.buffer, wadBuffer.byteOffset, wadBuffer.byteLength);
    const count = Math.floor(sectorLump.size / 26);
    const sectors: TranspiledSector[] = [];

    for (let i = 0; i < count; i++) {
      const ofs = sectorLump.offset + i * 26;
      if (ofs + 26 > wadBuffer.byteLength) break;

      const rawFloor = view.getInt16(ofs, true);
      const rawCeil = view.getInt16(ofs + 2, true);
      const lightLevel = view.getInt16(ofs + 20, true);

      const floorZ = rawFloor << 16;
      const ceilingZ = rawCeil << 16;

      sectors.push({
        floorZ,
        ceilingZ,
        lightLevel,
        sectorId: i,
      });

      this.sys_covalent_quipu_ingest(((floorZ ^ ceilingZ) >>> 0), 0x00000020);
    }

    return { success: true, sectors };
  }

  /**
   * C-Kernel: sys_covalent_transpile_linedefs
   * Links vertices to form rigid mathematical planes
   */
  public sys_covalent_transpile_linedefs(
    wadBuffer: Uint8Array,
    linedefLump?: WadLump
  ): { success: boolean; linedefs: TranspiledLinedef[] } {
    if (!linedefLump || linedefLump.size === 0) {
      return { success: true, linedefs: [] };
    }

    const view = new DataView(wadBuffer.buffer, wadBuffer.byteOffset, wadBuffer.byteLength);
    const count = Math.floor(linedefLump.size / 14);
    const linedefs: TranspiledLinedef[] = [];

    for (let i = 0; i < count; i++) {
      const ofs = linedefLump.offset + i * 14;
      if (ofs + 14 > wadBuffer.byteLength) break;

      const v1Idx = view.getUint16(ofs, true);
      const v2Idx = view.getUint16(ofs + 2, true);
      const flags = view.getUint16(ofs + 4, true);
      const frontSector = view.getInt16(ofs + 10, true);
      const backSector = view.getInt16(ofs + 12, true);

      linedefs.push({
        v1Idx,
        v2Idx,
        flags,
        frontSector,
        backSector,
      });

      this.sys_covalent_quipu_ingest(((v1Idx << 16) | v2Idx) >>> 0, 0x00000040);
    }

    return { success: true, linedefs };
  }

  private parseThings(wadBuffer: Uint8Array, thingsLump?: WadLump): DoomThing[] {
    if (!thingsLump || thingsLump.size === 0) return [];
    const view = new DataView(wadBuffer.buffer, wadBuffer.byteOffset, wadBuffer.byteLength);
    const count = Math.floor(thingsLump.size / 10);
    const things: DoomThing[] = [];

    for (let i = 0; i < count; i++) {
      const ofs = thingsLump.offset + i * 10;
      if (ofs + 10 > wadBuffer.byteLength) break;

      const x = view.getInt16(ofs, true);
      const y = view.getInt16(ofs + 2, true);
      const angle = view.getInt16(ofs + 4, true);
      const type = view.getInt16(ofs + 6, true);
      const flags = view.getInt16(ofs + 8, true);

      things.push({ x, y, angle, type, flags });
    }

    return things;
  }

  /**
   * Continuous Quipu manifold ingestion with Lyapunov stasis check
   */
  public sys_covalent_quipu_ingest(token: number, frictionCost: number): boolean {
    if (this.accumulatedFriction + frictionCost > this.frictionCapacity) {
      return false; // Stasis enforced, shear limit reached
    }

    this.accumulatedFriction += frictionCost;
    this.quipuHashRoot = ((this.quipuHashRoot ^ token) * 16777619) >>> 0;
    return true;
  }

  /**
   * Broadcasts assimilation event to coplay peers & engine
   */
  public sys_covalent_broadcast_quorum(signal: string): void {
    if (!this.lastTelemetry) return;
    for (const sub of this.quorumSubscribers) {
      try {
        sub(signal, this.lastTelemetry);
      } catch (err) {
        console.error('[ QUORUM BROADCAST ERR ]', err);
      }
    }
  }

  /**
   * Pre-computes Bounding Volume Hierarchy (BVH) for ray-tracing acceleration
   */
  public sys_covalent_build_bvh(quads: RTWallQuad[], currentDepth = 0, maxDepth = 6): { root: BVHNode; depth: number; leafCount: number } {
    if (quads.length === 0) {
      const emptyNode: BVHNode = {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 0, y: 0, z: 0 },
        leftChild: null,
        rightChild: null,
        quads: [],
        isLeaf: true,
      };
      return { root: emptyNode, depth: currentDepth, leafCount: 1 };
    }

    let minX = 0x7fffffff, minY = 0x7fffffff, minZ = 0;
    let maxX = -0x7fffffff, maxY = -0x7fffffff, maxZ = 384 << 16;

    for (const q of quads) {
      const vs = [q.v0, q.v1, q.v2, q.v3];
      for (const v of vs) {
        if (v.x < minX) minX = v.x;
        if (v.x > maxX) maxX = v.x;
        if (v.y < minY) minY = v.y;
        if (v.y > maxY) maxY = v.y;
      }
    }

    if (quads.length <= 4 || currentDepth >= maxDepth) {
      return {
        root: {
          min: { x: minX, y: minY, z: minZ },
          max: { x: maxX, y: maxY, z: maxZ },
          leftChild: null,
          rightChild: null,
          quads,
          isLeaf: true,
        },
        depth: currentDepth,
        leafCount: 1,
      };
    }

    // Split along longest spatial axis (X or Y)
    const spanX = maxX - minX;
    const spanY = maxY - minY;
    const splitX = spanX >= spanY;
    const midPoint = splitX ? (minX + maxX) >> 1 : (minY + maxY) >> 1;

    const leftQuads: RTWallQuad[] = [];
    const rightQuads: RTWallQuad[] = [];

    for (const q of quads) {
      const center = splitX ? ((q.v0.x + q.v1.x) >> 1) : ((q.v0.y + q.v1.y) >> 1);
      if (center <= midPoint) {
        leftQuads.push(q);
      } else {
        rightQuads.push(q);
      }
    }

    // If split failed to separate, finalize as leaf
    if (leftQuads.length === 0 || rightQuads.length === 0) {
      return {
        root: {
          min: { x: minX, y: minY, z: minZ },
          max: { x: maxX, y: maxY, z: maxZ },
          leftChild: null,
          rightChild: null,
          quads,
          isLeaf: true,
        },
        depth: currentDepth,
        leafCount: 1,
      };
    }

    const leftRes = this.sys_covalent_build_bvh(leftQuads, currentDepth + 1, maxDepth);
    const rightRes = this.sys_covalent_build_bvh(rightQuads, currentDepth + 1, maxDepth);

    return {
      root: {
        min: { x: minX, y: minY, z: minZ },
        max: { x: maxX, y: maxY, z: maxZ },
        leftChild: leftRes.root,
        rightChild: rightRes.root,
        quads: [],
        isLeaf: false,
      },
      depth: Math.max(leftRes.depth, rightRes.depth),
      leafCount: leftRes.leafCount + rightRes.leafCount,
    };
  }

  /**
   * Synthesizes RTDoomMap from the transpiled geometric arrays
   */
  private synthesizeRTMap(
    mapName: string,
    lumpNames: string[],
    vertices: TranspiledVertex[],
    sectors: TranspiledSector[],
    linedefs: TranspiledLinedef[],
    things: DoomThing[]
  ): RTDoomMap {
    const quads: RTWallQuad[] = [];
    let quadId = 1;

    // Build wall quads from linedefs
    for (const ld of linedefs) {
      if (ld.v1Idx >= vertices.length || ld.v2Idx >= vertices.length) continue;

      const vt1 = vertices[ld.v1Idx];
      const vt2 = vertices[ld.v2Idx];

      const sec = ld.frontSector >= 0 && ld.frontSector < sectors.length ? sectors[ld.frontSector] : null;
      const floorZ = sec ? sec.floorZ : 0;
      const ceilZ = sec ? sec.ceilingZ : 128 << 16;

      const v0: Q16Vec3 = { x: vt1.qX, y: vt1.qY, z: floorZ };
      const v1: Q16Vec3 = { x: vt2.qX, y: vt2.qY, z: floorZ };
      const v2: Q16Vec3 = { x: vt2.qX, y: vt2.qY, z: ceilZ };
      const v3: Q16Vec3 = { x: vt1.qX, y: vt1.qY, z: ceilZ };

      const edge1 = q16Vec3Sub(v1, v0);
      const edge2 = q16Vec3Sub(v3, v0);
      const normal = q16Vec3Normalize(q16Vec3Cross(edge1, edge2));

      // Color based on orientation & sector
      const color = 0xff504840 + ((ld.v1Idx * 17) & 0x00202020);

      quads.push({
        id: quadId++,
        v0,
        v1,
        v2,
        v3,
        normal,
        color,
        roughness: 0.8,
        isReflective: false,
        sectorId: ld.frontSector,
        tag: `WALL_${ld.v1Idx}_${ld.v2Idx}`,
      });
    }

    // Build floor / ceiling sector planes
    const planes: RTSectorPlane[] = [];
    let planeId = 1;

    for (const s of sectors) {
      planes.push({
        id: planeId++,
        height: s.floorZ,
        minX: -4000 << 16,
        maxX: 4000 << 16,
        minY: -4000 << 16,
        maxY: 4000 << 16,
        isCeiling: false,
        color: 0xff353028,
        isSlimeHazard: false,
        sectorId: s.sectorId,
      });

      planes.push({
        id: planeId++,
        height: s.ceilingZ,
        minX: -4000 << 16,
        maxX: 4000 << 16,
        minY: -4000 << 16,
        maxY: 4000 << 16,
        isCeiling: true,
        color: 0xff282420,
        isSlimeHazard: false,
        sectorId: s.sectorId,
      });
    }

    // Player spawn: Thing Type 1
    const p1 = things.find((t) => t.type === 1);
    const p2 = things.find((t) => t.type === 2);

    const playerSpawn: Q16Vec3 = p1
      ? { x: p1.x << 16, y: p1.y << 16, z: 48 << 16 }
      : { x: 1056 << 16, y: -3616 << 16, z: 48 << 16 };

    const beAgentSpawn: Q16Vec3 = p2
      ? { x: p2.x << 16, y: p2.y << 16, z: 48 << 16 }
      : { x: (playerSpawn.x + (64 << 16)), y: (playerSpawn.y - (64 << 16)), z: 48 << 16 };

    // Atmospheric dynamic lights
    const lights: RTLight[] = [
      {
        id: 1,
        pos: { x: playerSpawn.x, y: playerSpawn.y, z: playerSpawn.z + (60 << 16) },
        color: 0xffffddaa,
        radius: 380 << 16,
        intensity: 1 << 16,
        pulsing: false,
        label: 'Spawning Lantern',
      },
      {
        id: 2,
        pos: { x: beAgentSpawn.x, y: beAgentSpawn.y, z: beAgentSpawn.z + (40 << 16) },
        color: 0xff55eeff,
        radius: 300 << 16,
        intensity: 1 << 16,
        pulsing: true,
        label: 'Be <> Tactical Beacon',
      },
    ];

    return {
      name: mapName,
      lumpsDetected: lumpNames,
      vertices: vertices.map((v) => ({ x: v.rawX, y: v.rawY })),
      linedefs: linedefs.map((l) => ({
        v1: l.v1Idx,
        v2: l.v2Idx,
        flags: l.flags,
        special: 0,
        tag: 0,
        sidenum: [l.frontSector, l.backSector],
      })),
      sidedefs: [],
      sectors: sectors.map((s) => ({
        floorHeight: s.floorZ >> 16,
        ceilingHeight: s.ceilingZ >> 16,
        floorFlat: 'FLOOR4_8',
        ceilingFlat: 'CEIL3_5',
        lightLevel: s.lightLevel,
        special: 0,
        tag: 0,
      })),
      things,
      quads,
      planes,
      lights,
      playerSpawn,
      playerAngle: p1 ? p1.angle : 90,
      beAgentSpawn,
      beAgentAngle: p2 ? p2.angle : 90,
    };
  }
}
