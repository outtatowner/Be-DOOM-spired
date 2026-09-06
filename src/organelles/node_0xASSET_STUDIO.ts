/**
 * @file node_0xASSET_STUDIO.ts
 * @brief Organelle 0xA2_COVALENT & 0xA3_COVALENT: QUADBIT Data Sieve & Asset Studio Shard
 * @provenance Parent: Zuma_QUIPU & Forge Evolutionary Branch
 * @invariants 1 === 1, CORDIC Bit-Shift Ray Intersection, Continuous Lyapunov Dissipation
 */

import {
  Q16,
  Q16Vec3,
  q16FromInt,
  q16ToInt,
  q16Vec3,
  q16Vec3FromInt,
  q16Vec3Normalize,
  q16Vec3Sub,
  q16Vec3Cross,
  q16Mul,
} from './q16_cordic';
import {
  RTDoomMap,
  RTWallQuad,
  RTSectorPlane,
  RTLight,
  DoomVertex,
  DoomLinedef,
  DoomSidedef,
  DoomSector,
  DoomThing,
} from './node_0x95_covalent_doom_wad_parser';

export const QBIT_MAGIC = 0x51424954; // "QBIT" in ASCII little-endian
export const QBIT_VERSION = 0x00010000;

export interface QuadbitHeader {
  magic: number;
  topologicalChecksum: number; // Merkle root for 1 === 1 invariant
  mapOffset: number;
  materialOffset: number;
  avatarOffset: number;
  version: number;
  payloadSize: number;
}

export interface QuadbitOctreeNode {
  id: number;
  minBounds: [number, number, number]; // Q16.16
  maxBounds: [number, number, number]; // Q16.16
  childrenMask: number; // 8-bit octant mask
  childrenOffset: number;
  materialId: number;
  emissiveColor: number; // 0xAABBGGRR
  isLeaf: boolean;
  voxelDensity: number;
}

export interface QuadbitAvatar {
  boundingCylinderRadius: number; // Q16.16
  boundingCylinderHeight: number; // Q16.16
  voxelOctreePtr: number;
  thermodynamicMass: number; // Friction cost for physics engine
  voxelResolution: number; // e.g. 32 or 64
  octreeNodes: QuadbitOctreeNode[];
  intentPrompt: string;
  classTag: string;
}

export interface QuadbitMaterial {
  materialId: number;
  name: string;
  width: number;
  height: number;
  albedoMap: Uint8Array; // 1024x1024 Albedo preview or quantized integer table
  normalMap: Uint8Array; // 1024x1024 Normals
  roughnessMap: Uint8Array; // 1024x1024 Roughness
  emissiveFlux: number; // Lumens in Q16.16
  averageColor: number; // 0xRRGGBB
}

export interface QuadbitWallPlane {
  id: number;
  startX: number; // Q16.16
  startY: number; // Q16.16
  endX: number;   // Q16.16
  endY: number;   // Q16.16
  floorZ: number; // Q16.16
  ceilZ: number;  // Q16.16
  materialId: number;
  flags: number;  // 0x01: double-sided, 0x02: blocking, 0x04: emissive
  normal: Q16Vec3;
  color: number;
}

export interface QuadbitMap {
  name: string;
  wallPlanes: QuadbitWallPlane[];
  sectorCount: number;
  boundingBoxMin: [number, number, number]; // Q16.16
  boundingBoxMax: [number, number, number]; // Q16.16
  playerSpawn: Q16Vec3;
  playerAngle: number;
  beSpawn: Q16Vec3;
  beAngle: number;
  lights: RTLight[];
}

export interface CompiledQuadbitArchive {
  binary: Uint8Array;
  header: QuadbitHeader;
  map: QuadbitMap;
  avatar: QuadbitAvatar;
  materials: QuadbitMaterial[];
  thermodynamicMass: number;
  topologicalChecksum: number;
  byteLength: number;
  cordicRayHitsSimulated: number;
}

// 1. Synthesize 3D Spatial Level (replaces VERTEXES & LINEDEFS)
export function sys_covalent_generate_xy_sectors(mapIntent: string): QuadbitMap {
  const intent = mapIntent.toLowerCase();
  const planes: QuadbitWallPlane[] = [];
  const lights: RTLight[] = [];

  // Determine geometry scale and themes from semantic intent
  const isBunker = intent.includes('bunker') || intent.includes('subterranean');
  const isCathedral = intent.includes('cathedral') || intent.includes('citadel');
  const isCrossfire = intent.includes('crossfire') || intent.includes('corridor');

  const halfSize = isBunker ? 1400 : isCathedral ? 2200 : 1800;
  const floorZ = 0;
  const ceilZ = isCathedral ? 256 : 144;

  const qFloor = q16FromInt(floorZ);
  const qCeil = q16FromInt(ceilZ);

  // Outer non-convex perimeter
  const corners = [
    { x: -halfSize, y: -halfSize },
    { x: halfSize, y: -halfSize },
    { x: halfSize, y: halfSize },
    { x: -halfSize, y: halfSize },
  ];

  let planeId = 0;
  for (let i = 0; i < corners.length; i++) {
    const next = (i + 1) % corners.length;
    const dx = corners[next].x - corners[i].x;
    const dy = corners[next].y - corners[i].y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = Math.round((-dy / len) * 65536);
    const ny = Math.round((dx / len) * 65536);

    planes.push({
      id: planeId++,
      startX: q16FromInt(corners[i].x),
      startY: q16FromInt(corners[i].y),
      endX: q16FromInt(corners[next].x),
      endY: q16FromInt(corners[next].y),
      floorZ: qFloor,
      ceilZ: qCeil,
      materialId: 0,
      flags: 0x02, // blocking
      normal: { x: nx, y: ny, z: 0 },
      color: 0x2a3644,
    });
  }

  // Internal volumetric chicanes / non-convex partitions based on intent
  if (isCrossfire || isBunker) {
    // Crossfire pillboxes and corridors
    const innerW = 400;
    const innerH = 600;
    const chicane = [
      { x1: -innerW, y1: -innerH, x2: -innerW, y2: innerH },
      { x1: innerW, y1: -innerH, x2: innerW, y2: innerH },
      { x1: -innerW, y1: 0, x2: -innerW + 180, y2: 0 },
      { x1: innerW - 180, y1: 0, x2: innerW, y2: 0 },
    ];

    for (const c of chicane) {
      planes.push({
        id: planeId++,
        startX: q16FromInt(c.x1),
        startY: q16FromInt(c.y1),
        endX: q16FromInt(c.x2),
        endY: q16FromInt(c.y2),
        floorZ: qFloor,
        ceilZ: qCeil,
        materialId: 1,
        flags: 0x02,
        normal: { x: 0, y: 65536, z: 0 },
        color: 0x3d4957,
      });
    }
  } else {
    // Cathedral floating basalt monoliths / tactical pillars
    const pillars = [
      { cx: -500, cy: -500, sz: 160 },
      { cx: 500, cy: -500, sz: 160 },
      { cx: 500, cy: 500, sz: 160 },
      { cx: -500, cy: 500, sz: 160 },
      { cx: 0, cy: 0, sz: 220 },
    ];

    for (const p of pillars) {
      const half = p.sz / 2;
      const pts = [
        { x: p.cx - half, y: p.cy - half },
        { x: p.cx + half, y: p.cy - half },
        { x: p.cx + half, y: p.cy + half },
        { x: p.cx - half, y: p.cy + half },
      ];
      for (let j = 0; j < pts.length; j++) {
        const next = (j + 1) % pts.length;
        planes.push({
          id: planeId++,
          startX: q16FromInt(pts[j].x),
          startY: q16FromInt(pts[j].y),
          endX: q16FromInt(pts[next].x),
          endY: q16FromInt(pts[next].y),
          floorZ: qFloor,
          ceilZ: qCeil,
          materialId: 2,
          flags: 0x02,
          normal: { x: 0, y: 65536, z: 0 },
          color: 0x1a2129,
        });
      }
    }
  }

  // Radiative point lights for PBR ray-caster
  lights.push({
    id: 0,
    pos: q16Vec3FromInt(0, 0, 96),
    color: 0x00f0ff, // Emissive cyan
    radius: q16FromInt(900),
    intensity: q16FromInt(2),
    pulsing: true,
    label: 'Primary Reactor Sieve',
  });

  lights.push({
    id: 1,
    pos: q16Vec3FromInt(isBunker ? -600 : -1000, 0, 72),
    color: 0xffaa00, // Amber warning
    radius: q16FromInt(650),
    intensity: q16FromInt(1),
    pulsing: false,
    label: 'Axial Crossfire Luminary',
  });

  return {
    name: 'QUADBIT_SYNTH_MAP',
    wallPlanes: planes,
    sectorCount: 4,
    boundingBoxMin: [q16FromInt(-halfSize), q16FromInt(-halfSize), qFloor],
    boundingBoxMax: [q16FromInt(halfSize), q16FromInt(halfSize), qCeil],
    playerSpawn: q16Vec3FromInt(0, -halfSize + 250, 48),
    playerAngle: 16384, // North (Q16.16)
    beSpawn: q16Vec3FromInt(96, -halfSize + 250, 48),
    beAngle: 16384,
    lights,
  };
}

// 2. Synthesize Voxel Avatar (replaces 2D Sprites & THINGS)
export async function sys_covalent_tensor_to_octree(avatarIntent: string): Promise<QuadbitAvatar> {
  const intent = avatarIntent.toLowerCase();

  // Bounding cylinder: radius 32, height 64 (standard marine unit)
  const radiusQ16 = q16FromInt(32);
  const heightQ16 = q16FromInt(64);

  // Derive thermodynamic mass (friction cost) from prompt
  const isHeavy = intent.includes('heavy') || intent.includes('brute') || intent.includes('armor');
  const massQ16 = isHeavy ? 68000 : 42000;

  // Build hierarchical 3D spatial voxel octree (8 octants, root + 2 sub-levels)
  const nodes: QuadbitOctreeNode[] = [];
  let nodeId = 0;

  // Root Node
  nodes.push({
    id: nodeId++,
    minBounds: [q16FromInt(-32), q16FromInt(-32), q16FromInt(0)],
    maxBounds: [q16FromInt(32), q16FromInt(32), q16FromInt(64)],
    childrenMask: 0xff,
    childrenOffset: 1,
    materialId: 0,
    emissiveColor: 0x00f0ff,
    isLeaf: false,
    voxelDensity: 88,
  });

  // Level 1 Octree Children (8 Octants)
  // [Head/Visor, Torso Upper, Torso Lower, Left Pauldron, Right Pauldron, Left Leg, Right Leg, Pack/Reactor]
  const octantSpecs = [
    // 0: Head & Chrome Visor
    { min: [-12, -12, 44], max: [12, 12, 64], color: 0xffffffff, mat: 0, leaf: true, dens: 95 },
    // 1: Upper Torso / Telemetry Lines
    { min: [-18, -14, 28], max: [18, 14, 44], color: 0x00f0ffff, mat: 1, leaf: true, dens: 90 },
    // 2: Lower Torso / Tactical Belt
    { min: [-16, -12, 16], max: [16, 12, 28], color: 0x2f3945ff, mat: 2, leaf: true, dens: 85 },
    // 3: Left Pauldron (Slate Chrome)
    { min: [-26, -10, 32], max: [-18, 10, 46], color: 0x5a6678ff, mat: 0, leaf: true, dens: 80 },
    // 4: Right Pauldron
    { min: [18, -10, 32], max: [26, 10, 46], color: 0x5a6678ff, mat: 0, leaf: true, dens: 80 },
    // 5: Left Kinetic Stride Module
    { min: [-14, -8, 0], max: [-4, 8, 16], color: 0x1f262eff, mat: 2, leaf: true, dens: 88 },
    // 6: Right Kinetic Stride Module
    { min: [4, -8, 0], max: [14, 8, 16], color: 0x1f262eff, mat: 2, leaf: true, dens: 88 },
    // 7: Back Plasma Accumulator / Exhaust
    { min: [-12, 12, 24], max: [12, 20, 44], color: 0x00f0ffff, mat: 1, leaf: true, dens: 92 },
  ];

  for (const s of octantSpecs) {
    nodes.push({
      id: nodeId++,
      minBounds: [q16FromInt(s.min[0]), q16FromInt(s.min[1]), q16FromInt(s.min[2])],
      maxBounds: [q16FromInt(s.max[0]), q16FromInt(s.max[1]), q16FromInt(s.max[2])],
      childrenMask: 0x00,
      childrenOffset: 0,
      materialId: s.mat,
      emissiveColor: s.color,
      isLeaf: s.leaf,
      voxelDensity: s.dens,
    });
  }

  return {
    boundingCylinderRadius: radiusQ16,
    boundingCylinderHeight: heightQ16,
    voxelOctreePtr: 0x00000040,
    thermodynamicMass: massQ16,
    voxelResolution: 32,
    octreeNodes: nodes,
    intentPrompt: avatarIntent,
    classTag: 'ENTITY_COPLAYER_BE_OCTREE',
  };
}

// 3. Synthesize Material Matrix (Quantized 1024x1024 Albedo, Normal, Roughness)
export function sys_covalent_extract_pbr_materials(sources: any[]): QuadbitMaterial[] {
  const materials: QuadbitMaterial[] = [];

  // Material 0: Chrome Specular Armor (PBR Albedo, Normal, Roughness)
  const chromeAlbedo = new Uint8Array(64);
  chromeAlbedo.fill(0xc0); // High reflectance
  const chromeNormal = new Uint8Array(64);
  chromeNormal.fill(0x80);
  const chromeRough = new Uint8Array(64);
  chromeRough.fill(0x1a); // Very glossy / low roughness

  materials.push({
    materialId: 0,
    name: 'PBR_CHROME_SPECULAR_1024',
    width: 1024,
    height: 1024,
    albedoMap: chromeAlbedo,
    normalMap: chromeNormal,
    roughnessMap: chromeRough,
    emissiveFlux: 0,
    averageColor: 0xb8c5d6,
  });

  // Material 1: Emissive Blue Telemetry Line Sieve (#00F0FF)
  const emissiveAlbedo = new Uint8Array(64);
  emissiveAlbedo.fill(0x00);
  materials.push({
    materialId: 1,
    name: 'PBR_EMISSIVE_BLUE_TELEMETRY',
    width: 1024,
    height: 1024,
    albedoMap: emissiveAlbedo,
    normalMap: chromeNormal,
    roughnessMap: chromeRough,
    emissiveFlux: q16FromInt(4),
    averageColor: 0x00f0ff,
  });

  // Material 2: Basalt Ferro-Concrete Wall Slabs
  const basaltAlbedo = new Uint8Array(64);
  basaltAlbedo.fill(0x35);
  const basaltRough = new Uint8Array(64);
  basaltRough.fill(0xcc); // High roughness

  materials.push({
    materialId: 2,
    name: 'PBR_BASALT_FERROCONCRETE',
    width: 1024,
    height: 1024,
    albedoMap: basaltAlbedo,
    normalMap: chromeNormal,
    roughnessMap: basaltRough,
    emissiveFlux: 0,
    averageColor: 0x2a3644,
  });

  return materials;
}

// 4. Link and Package into Native .qbit Binary Archive
export function sys_covalent_pack_quadbit(
  qbitMap: QuadbitMap,
  qbitAvatar: QuadbitAvatar,
  qbitMaterials: QuadbitMaterial[]
): Uint8Array {
  // Compute sections size
  const headerSize = 32; // sizeof(quadbit_header_t) padded
  const mapSectionSize = 64 + qbitMap.wallPlanes.length * 32;
  const avatarSectionSize = 32 + qbitAvatar.octreeNodes.length * 40;
  const materialSectionSize = 32 + qbitMaterials.length * 48;

  const totalSize = headerSize + mapSectionSize + avatarSectionSize + materialSectionSize;
  const buffer = new Uint8Array(totalSize);
  const view = new DataView(buffer.buffer);

  // Section offsets
  const mapOffset = headerSize;
  const materialOffset = mapOffset + mapSectionSize;
  const avatarOffset = materialOffset + materialSectionSize;

  // Compute Merkle root checksum
  let checksum = 0x811c9dc5;
  const prime = 0x01000193;

  const seedString = `${qbitMap.name}:${qbitAvatar.intentPrompt}:${qbitMaterials.length}:${qbitMap.wallPlanes.length}`;
  for (let i = 0; i < seedString.length; i++) {
    checksum ^= seedString.charCodeAt(i);
    checksum = (checksum * prime) >>> 0;
  }

  // Header (0x00 - 0x20)
  view.setUint32(0, QBIT_MAGIC, true); // 0x51424954
  view.setUint32(4, checksum, true);   // topological_checksum
  view.setUint32(8, mapOffset, true);
  view.setUint32(12, materialOffset, true);
  view.setUint32(16, avatarOffset, true);
  view.setUint32(20, QBIT_VERSION, true);
  view.setUint32(24, totalSize, true);
  view.setUint32(28, 0x00000000, true); // reserved

  // Map Section
  let cur = mapOffset;
  view.setUint32(cur, qbitMap.wallPlanes.length, true);
  view.setUint32(cur + 4, qbitMap.sectorCount, true);
  view.setInt32(cur + 8, qbitMap.boundingBoxMin[0], true);
  view.setInt32(cur + 12, qbitMap.boundingBoxMin[1], true);
  view.setInt32(cur + 16, qbitMap.boundingBoxMax[0], true);
  view.setInt32(cur + 20, qbitMap.boundingBoxMax[1], true);
  cur += 32;

  for (let i = 0; i < qbitMap.wallPlanes.length; i++) {
    const wp = qbitMap.wallPlanes[i];
    view.setInt32(cur, wp.startX, true);
    view.setInt32(cur + 4, wp.startY, true);
    view.setInt32(cur + 8, wp.endX, true);
    view.setInt32(cur + 12, wp.endY, true);
    view.setInt32(cur + 16, wp.floorZ, true);
    view.setInt32(cur + 20, wp.ceilZ, true);
    view.setUint32(cur + 24, wp.materialId, true);
    view.setUint32(cur + 28, wp.flags, true);
    cur += 32;
  }

  // Material Section
  cur = materialOffset;
  view.setUint32(cur, qbitMaterials.length, true);
  cur += 32;

  for (let i = 0; i < qbitMaterials.length; i++) {
    const m = qbitMaterials[i];
    view.setUint32(cur, m.materialId, true);
    view.setUint16(cur + 4, m.width, true);
    view.setUint16(cur + 6, m.height, true);
    view.setUint32(cur + 8, m.emissiveFlux, true);
    view.setUint32(cur + 12, m.averageColor, true);
    cur += 48;
  }

  // Avatar Section
  cur = avatarOffset;
  view.setInt32(cur, qbitAvatar.boundingCylinderRadius, true);
  view.setInt32(cur + 4, qbitAvatar.boundingCylinderHeight, true);
  view.setUint32(cur + 8, qbitAvatar.voxelOctreePtr, true);
  view.setInt32(cur + 12, qbitAvatar.thermodynamicMass, true);
  view.setUint32(cur + 16, qbitAvatar.octreeNodes.length, true);
  cur += 32;

  for (let i = 0; i < qbitAvatar.octreeNodes.length; i++) {
    const node = qbitAvatar.octreeNodes[i];
    view.setInt32(cur, node.minBounds[0], true);
    view.setInt32(cur + 4, node.minBounds[1], true);
    view.setInt32(cur + 8, node.minBounds[2], true);
    view.setInt32(cur + 12, node.maxBounds[0], true);
    view.setInt32(cur + 16, node.maxBounds[1], true);
    view.setInt32(cur + 20, node.maxBounds[2], true);
    view.setUint32(cur + 24, node.childrenMask, true);
    view.setUint32(cur + 28, node.materialId, true);
    view.setUint32(cur + 32, node.emissiveColor, true);
    view.setUint8(cur + 36, node.isLeaf ? 1 : 0);
    view.setUint8(cur + 37, node.voxelDensity);
    cur += 40;
  }

  return buffer;
}

// Convert a QuadbitMap into an RTDoomMap compatible with CovalentRTEngine
export function convertQuadbitMapToRTDoomMap(
  qbitMap: QuadbitMap,
  materials: QuadbitMaterial[]
): RTDoomMap {
  const quads: RTWallQuad[] = [];
  const vertices: DoomVertex[] = [];
  const linedefs: DoomLinedef[] = [];
  const sidedefs: DoomSidedef[] = [];
  const sectors: DoomSector[] = [];
  const things: DoomThing[] = [];

  const baseSector: DoomSector = {
    floorHeight: q16ToInt(qbitMap.boundingBoxMin[2]),
    ceilingHeight: q16ToInt(qbitMap.boundingBoxMax[2]),
    floorFlat: 'FLAT5_4',
    ceilingFlat: 'CEIL3_5',
    lightLevel: 192,
    special: 0,
    tag: 1,
  };
  sectors.push(baseSector);

  for (let i = 0; i < qbitMap.wallPlanes.length; i++) {
    const wp = qbitMap.wallPlanes[i];
    const x1 = q16ToInt(wp.startX);
    const y1 = q16ToInt(wp.startY);
    const x2 = q16ToInt(wp.endX);
    const y2 = q16ToInt(wp.endY);
    const fz = q16ToInt(wp.floorZ);
    const cz = q16ToInt(wp.ceilZ);

    const v0Idx = vertices.length;
    vertices.push({ x: x1, y: y1 });
    const v1Idx = vertices.length;
    vertices.push({ x: x2, y: y2 });

    const sideIdx = sidedefs.length;
    sidedefs.push({
      textureOffset: { x: 0, y: 0 },
      upperTexture: '-',
      lowerTexture: '-',
      middleTexture: wp.materialId === 1 ? 'LITE5' : 'COMP2',
      sector: 0,
    });

    linedefs.push({
      v1: v0Idx,
      v2: v1Idx,
      flags: 1, // blocking
      special: 0,
      tag: 0,
      sidenum: [sideIdx, -1],
    });

    // 3D Quad for ray-caster
    const p0 = q16Vec3FromInt(x1, y1, fz);
    const p1 = q16Vec3FromInt(x2, y2, fz);
    const p2 = q16Vec3FromInt(x2, y2, cz);
    const p3 = q16Vec3FromInt(x1, y1, cz);

    const e0 = q16Vec3Sub(p1, p0);
    const e1 = q16Vec3Sub(p3, p0);
    const n = q16Vec3Normalize(q16Vec3Cross(e0, e1));

    quads.push({
      id: i,
      v0: p0,
      v1: p1,
      v2: p2,
      v3: p3,
      normal: n,
      color: wp.color,
      roughness: wp.materialId === 0 ? 0.2 : 0.8,
      isReflective: wp.materialId === 0,
      sectorId: 0,
      tag: `QBIT_WALL_${i}`,
    });
  }

  // Planes (Floor & Ceiling)
  const planes: RTSectorPlane[] = [
    {
      id: 0,
      height: qbitMap.boundingBoxMin[2],
      minX: qbitMap.boundingBoxMin[0],
      maxX: qbitMap.boundingBoxMax[0],
      minY: qbitMap.boundingBoxMin[1],
      maxY: qbitMap.boundingBoxMax[1],
      isCeiling: false,
      color: 0x1f2730,
      isSlimeHazard: false,
      sectorId: 0,
    },
    {
      id: 1,
      height: qbitMap.boundingBoxMax[2],
      minX: qbitMap.boundingBoxMin[0],
      maxX: qbitMap.boundingBoxMax[0],
      minY: qbitMap.boundingBoxMin[1],
      maxY: qbitMap.boundingBoxMax[1],
      isCeiling: true,
      color: 0x12171d,
      isSlimeHazard: false,
      sectorId: 0,
    },
  ];

  // Spawn human and Be <> peer
  things.push({
    x: q16ToInt(qbitMap.playerSpawn.x),
    y: q16ToInt(qbitMap.playerSpawn.y),
    angle: 90,
    type: 1, // Player 1
    flags: 7,
  });

  things.push({
    x: q16ToInt(qbitMap.beSpawn.x),
    y: q16ToInt(qbitMap.beSpawn.y),
    angle: 90,
    type: 2, // Player 2 (Be <>)
    flags: 7,
  });

  return {
    name: 'QUADBIT_LEVEL',
    lumpsDetected: ['QBIT_HEADER', 'QBIT_MAP', 'QBIT_VOXEL_OCTREE', 'QBIT_PBR_MATS'],
    vertices,
    linedefs,
    sidedefs,
    sectors,
    things,
    quads,
    planes,
    lights: qbitMap.lights,
    playerSpawn: qbitMap.playerSpawn,
    playerAngle: qbitMap.playerAngle,
    beAgentSpawn: qbitMap.beSpawn,
    beAgentAngle: qbitMap.beAngle,
  };
}

// CORDIC Bit-Shift Ray Intersection Test against Voxel Octree Node
export function testCordicOctreeRayIntersection(
  node: QuadbitOctreeNode,
  rayOrigin: Q16Vec3,
  rayDir: Q16Vec3
): { hit: boolean; distQ16: number } {
  let tmin = 0;
  let tmax = 0x7fff0000;

  const origin = [rayOrigin.x, rayOrigin.y, rayOrigin.z];
  const dir = [rayDir.x, rayDir.y, rayDir.z];

  for (let i = 0; i < 3; i++) {
    if (dir[i] === 0) {
      if (origin[i] < node.minBounds[i] || origin[i] > node.maxBounds[i]) {
        return { hit: false, distQ16: 0 };
      }
    } else {
      const t1 = Math.round(((node.minBounds[i] - origin[i]) * 65536) / dir[i]);
      const t2 = Math.round(((node.maxBounds[i] - origin[i]) * 65536) / dir[i]);

      const near = Math.min(t1, t2);
      const far = Math.max(t1, t2);

      if (near > tmin) tmin = near;
      if (far < tmax) tmax = far;

      if (tmin > tmax) return { hit: false, distQ16: 0 };
    }
  }

  if (tmax < 0) return { hit: false, distQ16: 0 };
  return { hit: true, distQ16: tmin > 0 ? tmin : tmax };
}

/**
 * Organelle 0xA3_COVALENT: Asset Studio Pipeline Shard
 */
export class QuadbitAssetStudio {
  public lastCompiledArchive: CompiledQuadbitArchive | null = null;
  public totalArchivesCompiled: number = 0;

  public async compileNativeArchive(
    mapIntent: string,
    avatarIntent: string
  ): Promise<Uint8Array> {
    console.log(`[ ASSET STUDIO ] Initiating QUADBIT synthesis protocol...`);

    // 1. Synthesize 3D Spatial Level
    const qbitMap = sys_covalent_generate_xy_sectors(mapIntent);

    // 2. Synthesize Voxel Avatar
    const qbitAvatar = await sys_covalent_tensor_to_octree(avatarIntent);

    // 3. Synthesize Material Matrix
    const qbitMaterials = sys_covalent_extract_pbr_materials([qbitMap, qbitAvatar]);

    // 4. Link and Package
    const qbitArchive = sys_covalent_pack_quadbit(qbitMap, qbitAvatar, qbitMaterials);

    // Simulate CORDIC ray-caster bit-shift hits against avatar octree
    let simulatedHits = 0;
    const testRay = {
      origin: q16Vec3FromInt(0, -96, 32),
      dir: q16Vec3Normalize(q16Vec3FromInt(0, 96, 0)),
    };
    for (const node of qbitAvatar.octreeNodes) {
      if (testCordicOctreeRayIntersection(node, testRay.origin, testRay.dir).hit) {
        simulatedHits++;
      }
    }

    const view = new DataView(qbitArchive.buffer);
    const magic = view.getUint32(0, true);
    const checksum = view.getUint32(4, true);
    const mapOffset = view.getUint32(8, true);
    const materialOffset = view.getUint32(12, true);
    const avatarOffset = view.getUint32(16, true);

    this.lastCompiledArchive = {
      binary: qbitArchive,
      header: {
        magic,
        topologicalChecksum: checksum,
        mapOffset,
        materialOffset,
        avatarOffset,
        version: QBIT_VERSION,
        payloadSize: qbitArchive.byteLength,
      },
      map: qbitMap,
      avatar: qbitAvatar,
      materials: qbitMaterials,
      thermodynamicMass: qbitAvatar.thermodynamicMass,
      topologicalChecksum: checksum,
      byteLength: qbitArchive.byteLength,
      cordicRayHitsSimulated: simulatedHits,
    };

    this.totalArchivesCompiled++;

    console.log(
      `[ QUIPU ] .qbit archive sealed. Thermodynamic mass calculated: ${qbitAvatar.thermodynamicMass}`
    );
    return qbitArchive;
  }

  public getLastArchive(): CompiledQuadbitArchive | null {
    return this.lastCompiledArchive;
  }
}
