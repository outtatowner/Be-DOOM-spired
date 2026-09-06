/**
 * @file node_0x95_covalent_doom_wad_parser.ts
 * @brief Organelle 0x95_COVALENT: WAD Binary Lump Ingestion & Q16.16 DOOM E1M1 Architecture
 * @provenance Parent: Zuma_QUIPU
 * @invariants 1 === 1, Continuous Lyapunov Dissipation (dV/dt <= 0), Constant-Space Merkle Binding
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
  Q16_ONE,
} from './q16_cordic';

export interface DoomVertex {
  x: number;
  y: number;
}

export interface DoomLinedef {
  v1: number;
  v2: number;
  flags: number;
  special: number;
  tag: number;
  sidenum: [number, number]; // front, back (-1 if none)
}

export interface DoomSidedef {
  textureOffset: { x: number; y: number };
  upperTexture: string;
  lowerTexture: string;
  middleTexture: string;
  sector: number;
}

export interface DoomSector {
  floorHeight: number;
  ceilingHeight: number;
  floorFlat: string;
  ceilingFlat: string;
  lightLevel: number;
  special: number;
  tag: number;
}

export interface DoomThing {
  x: number;
  y: number;
  angle: number;
  type: number; // 1 = Player 1, 2 = Player 2 (Be <>), 2035 = Barrel, 2018 = Armor, etc.
  flags: number;
}

export interface RTWallQuad {
  id: number;
  v0: Q16Vec3; // Bottom-Left
  v1: Q16Vec3; // Bottom-Right
  v2: Q16Vec3; // Top-Right
  v3: Q16Vec3; // Top-Left
  normal: Q16Vec3;
  color: number;
  roughness: number; // 0 to 1
  isReflective: boolean;
  sectorId: number;
  tag: string;
}

export interface RTSectorPlane {
  id: number;
  height: Q16;
  minX: Q16;
  maxX: Q16;
  minY: Q16;
  maxY: Q16;
  isCeiling: boolean;
  color: number;
  isSlimeHazard: boolean;
  isCryogenicCoolant?: boolean;
  isSiliconMirror?: boolean;
  sectorId: number;
}

export interface RTLight {
  id: number;
  pos: Q16Vec3;
  color: number;
  radius: Q16;
  intensity: Q16;
  pulsing: boolean;
  label: string;
}

export interface RTDoomMap {
  name: string;
  lumpsDetected: string[];
  vertices: DoomVertex[];
  linedefs: DoomLinedef[];
  sidedefs: DoomSidedef[];
  sectors: DoomSector[];
  things: DoomThing[];
  quads: RTWallQuad[];
  planes: RTSectorPlane[];
  lights: RTLight[];
  playerSpawn: Q16Vec3;
  playerAngle: number;
  beAgentSpawn: Q16Vec3;
  beAgentAngle: number;
}

/**
 * Binary WAD parser for standard DOOM IWAD/PWAD buffers
 */
export function parseBinaryWad(buffer: ArrayBuffer, targetMap = 'E1M1'): RTDoomMap | null {
  const view = new DataView(buffer);
  if (buffer.byteLength < 12) return null;

  const sig = String.fromCharCode(
    view.getUint8(0),
    view.getUint8(1),
    view.getUint8(2),
    view.getUint8(3)
  );

  if (sig !== 'IWAD' && sig !== 'PWAD') {
    return null;
  }

  const numLumps = view.getInt32(4, true);
  const infoTableOfs = view.getInt32(8, true);

  if (infoTableOfs + numLumps * 16 > buffer.byteLength) return null;

  const lumps: { name: string; pos: number; size: number }[] = [];
  let mapIdx = -1;

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
    lumps.push({ name, pos: filepos, size });
    if (name.toUpperCase() === targetMap.toUpperCase() || name.toUpperCase() === 'MAP01') {
      mapIdx = i;
    }
  }

  if (mapIdx === -1) {
    // If specific map not found, fallback to canonical built-in E1M1
    return buildCanonicalE1M1();
  }

  // Parse extracted lumps
  const detected: string[] = [];
  const vertices: DoomVertex[] = [];
  const linedefs: DoomLinedef[] = [];
  const sidedefs: DoomSidedef[] = [];
  const sectors: DoomSector[] = [];
  const things: DoomThing[] = [];

  for (let offset = 1; offset <= 10 && mapIdx + offset < lumps.length; offset++) {
    const lump = lumps[mapIdx + offset];
    const name = lump.name.toUpperCase();
    detected.push(name);

    if (name === 'VERTEXES') {
      const count = lump.size / 4;
      for (let v = 0; v < count; v++) {
        const vPos = lump.pos + v * 4;
        vertices.push({
          x: view.getInt16(vPos, true),
          y: view.getInt16(vPos + 2, true),
        });
      }
    } else if (name === 'LINEDEFS') {
      const count = lump.size / 14;
      for (let l = 0; l < count; l++) {
        const lPos = lump.pos + l * 14;
        linedefs.push({
          v1: view.getUint16(lPos, true),
          v2: view.getUint16(lPos + 2, true),
          flags: view.getUint16(lPos + 4, true),
          special: view.getInt16(lPos + 6, true),
          tag: view.getInt16(lPos + 8, true),
          sidenum: [
            view.getUint16(lPos + 10, true) === 0xffff ? -1 : view.getUint16(lPos + 10, true),
            view.getUint16(lPos + 12, true) === 0xffff ? -1 : view.getUint16(lPos + 12, true),
          ],
        });
      }
    } else if (name === 'SIDEDEFS') {
      const count = lump.size / 30;
      for (let s = 0; s < count; s++) {
        const sPos = lump.pos + s * 30;
        sidedefs.push({
          textureOffset: {
            x: view.getInt16(sPos, true),
            y: view.getInt16(sPos + 2, true),
          },
          upperTexture: readString(view, sPos + 4, 8),
          lowerTexture: readString(view, sPos + 12, 8),
          middleTexture: readString(view, sPos + 20, 8),
          sector: view.getUint16(sPos + 28, true),
        });
      }
    } else if (name === 'SECTORS') {
      const count = lump.size / 26;
      for (let sec = 0; sec < count; sec++) {
        const secPos = lump.pos + sec * 26;
        sectors.push({
          floorHeight: view.getInt16(secPos, true),
          ceilingHeight: view.getInt16(secPos + 2, true),
          floorFlat: readString(view, secPos + 4, 8),
          ceilingFlat: readString(view, secPos + 12, 8),
          lightLevel: view.getInt16(secPos + 20, true),
          special: view.getInt16(secPos + 22, true),
          tag: view.getInt16(secPos + 24, true),
        });
      }
    } else if (name === 'THINGS') {
      const count = lump.size / 10;
      for (let t = 0; t < count; t++) {
        const tPos = lump.pos + t * 10;
        things.push({
          x: view.getInt16(tPos, true),
          y: view.getInt16(tPos + 2, true),
          angle: view.getInt16(tPos + 4, true),
          type: view.getInt16(tPos + 6, true),
          flags: view.getUint16(tPos + 8, true),
        });
      }
    }
  }

  return convertMapToRTGeometry(targetMap, detected, vertices, linedefs, sidedefs, sectors, things);
}

function readString(view: DataView, offset: number, maxLen: number): string {
  let str = '';
  for (let i = 0; i < maxLen; i++) {
    const code = view.getUint8(offset + i);
    if (code === 0) break;
    str += String.fromCharCode(code);
  }
  return str;
}

/**
 * Converts Doom 2D topological structures into ray-testable 3D Quads and Planes
 */
export function convertMapToRTGeometry(
  name: string,
  lumpsDetected: string[],
  vertices: DoomVertex[],
  linedefs: DoomLinedef[],
  sidedefs: DoomSidedef[],
  sectors: DoomSector[],
  things: DoomThing[]
): RTDoomMap {
  const quads: RTWallQuad[] = [];
  const planes: RTSectorPlane[] = [];
  const lights: RTLight[] = [];

  let playerSpawn = q16Vec3FromInt(1056, -3616, 48);
  let playerAngle = 90;
  let beAgentSpawn = q16Vec3FromInt(1120, -3616, 48);
  let beAgentAngle = 90;

  // Process Things
  for (const t of things) {
    if (t.type === 1) {
      playerSpawn = q16Vec3FromInt(t.x, t.y, 48);
      playerAngle = t.angle;
    } else if (t.type === 2 || t.type === 3) {
      beAgentSpawn = q16Vec3FromInt(t.x, t.y, 48);
      beAgentAngle = t.angle;
    } else if (t.type === 2035) {
      // Radioactive Toxic Slime Barrel -> Add Green Dynamic Point Light!
      lights.push({
        id: lights.length,
        pos: q16Vec3FromInt(t.x, t.y, 32),
        color: 0x00ff66,
        radius: q16FromInt(480),
        intensity: Q16_ONE,
        pulsing: true,
        label: `Toxic Slime Barrel #${lights.length}`,
      });
    } else if (t.type === 2018 || t.type === 2019) {
      // Armor / Health Bonus -> Blue or Green pedestal light
      lights.push({
        id: lights.length,
        pos: q16Vec3FromInt(t.x, t.y, 24),
        color: 0x00e5ff,
        radius: q16FromInt(320),
        intensity: Q16_ONE,
        pulsing: true,
        label: `Cyber Shield Font #${lights.length}`,
      });
    }
  }

  // Process Linedefs to Quads
  let quadId = 0;
  for (const line of linedefs) {
    if (line.v1 >= vertices.length || line.v2 >= vertices.length) continue;
    const vt1 = vertices[line.v1];
    const vt2 = vertices[line.v2];

    const x1 = q16FromInt(vt1.x);
    const y1 = q16FromInt(vt1.y);
    const x2 = q16FromInt(vt2.x);
    const y2 = q16FromInt(vt2.y);

    // Compute 2D perpendicular normal
    const dx = vt2.x - vt1.x;
    const dy = vt2.y - vt1.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = Math.round((dy / len) * 65536);
    const ny = Math.round((-dx / len) * 65536);
    const normal = q16Vec3(nx, ny, 0);

    // Front Side
    if (line.sidenum[0] >= 0 && line.sidenum[0] < sidedefs.length) {
      const sideFront = sidedefs[line.sidenum[0]];
      if (sideFront.sector < sectors.length) {
        const secFront = sectors[sideFront.sector];

        if (line.sidenum[1] < 0) {
          // Solid 1-sided Wall
          const zFloor = q16FromInt(secFront.floorHeight);
          const zCeil = q16FromInt(secFront.ceilingHeight);

          // Authentic DOOM color palette logic based on texture
          let color = 0x8a7052; // STARTAN classic brown tech wall
          let roughness = 0.6;
          let isReflective = false;

          if (sideFront.middleTexture.includes('BERYLLIUM') || sideFront.middleTexture.includes('RACK')) {
            color = 0x222e3d; // Brushed Beryllium Server Rack Chassis
            roughness = 0.35;
            isReflective = true;
          } else if (sideFront.middleTexture.includes('CYAN') || sideFront.middleTexture.includes('SEAM')) {
            color = 0x00f0ff; // Emissive Cyan Data Stream
            roughness = 0.2;
            isReflective = true;
          } else if (sideFront.middleTexture.includes('ALARM')) {
            color = 0xdd2233; // Emissive Red Kernel Panic Warning Grid
            roughness = 0.3;
            isReflective = true;
          } else if (sideFront.middleTexture.includes('COMP') || sideFront.middleTexture.includes('TEKG')) {
            color = 0x3d707c; // Cyan Tech Computer Terminal
            isReflective = true;
          } else if (sideFront.middleTexture.includes('BRONZE') || sideFront.middleTexture.includes('BROWN')) {
            color = 0x6e4e37; // Bronze
          } else if (sideFront.middleTexture.includes('LITE')) {
            color = 0xffeebb; // Wall Light fixture
          }

          quads.push({
            id: quadId++,
            v0: q16Vec3(x1, y1, zFloor),
            v1: q16Vec3(x2, y2, zFloor),
            v2: q16Vec3(x2, y2, zCeil),
            v3: q16Vec3(x1, y1, zCeil),
            normal,
            color,
            roughness,
            isReflective,
            sectorId: sideFront.sector,
            tag: sideFront.middleTexture || 'SOLID_WALL',
          });
        } else if (line.sidenum[1] < sidedefs.length) {
          // 2-sided Portal (Ledges, Steps, Window openings)
          const sideBack = sidedefs[line.sidenum[1]];
          if (sideBack.sector < sectors.length) {
            const secBack = sectors[sideBack.sector];

            // Lower Step Wall
            if (secFront.floorHeight > secBack.floorHeight) {
              quads.push({
                id: quadId++,
                v0: q16Vec3(x1, y1, q16FromInt(secBack.floorHeight)),
                v1: q16Vec3(x2, y2, q16FromInt(secBack.floorHeight)),
                v2: q16Vec3(x2, y2, q16FromInt(secFront.floorHeight)),
                v3: q16Vec3(x1, y1, q16FromInt(secFront.floorHeight)),
                normal,
                color: 0x4a4a52, // Step step riser
                roughness: 0.8,
                isReflective: false,
                sectorId: sideFront.sector,
                tag: 'STEP_LOWER',
              });
            }

            // Upper Ceiling Drop
            if (secFront.ceilingHeight < secBack.ceilingHeight) {
              quads.push({
                id: quadId++,
                v0: q16Vec3(x1, y1, q16FromInt(secFront.ceilingHeight)),
                v1: q16Vec3(x2, y2, q16FromInt(secFront.ceilingHeight)),
                v2: q16Vec3(x2, y2, q16FromInt(secBack.ceilingHeight)),
                v3: q16Vec3(x1, y1, q16FromInt(secBack.ceilingHeight)),
                normal,
                color: 0x5a5560, // Ceiling drop
                roughness: 0.7,
                isReflective: false,
                sectorId: sideFront.sector,
                tag: 'STEP_UPPER',
              });
            }
          }
        }
      }
    }
  }

  // Process Sector Floor & Ceiling Planes
  let planeId = 0;
  for (let s = 0; s < sectors.length; s++) {
    const sec = sectors[s];
    const isSlime = sec.special === 7 || sec.special === 16 || sec.floorFlat.includes('NUKAGE') || sec.floorFlat.includes('SLIME');
    const isCryo = sec.special === 9 || sec.floorFlat.includes('CRYO');
    const isSilicon = sec.floorFlat.includes('SILICON');
    const isCyanSeam = sec.floorFlat.includes('CYAN');

    let floorColor = 0x44413c;
    if (isSlime) floorColor = 0x00bb33;
    else if (isCryo) floorColor = 0x00e5ff;
    else if (isSilicon) floorColor = 0x080f1a; // Polished Silicon Specular Plane
    else if (isCyanSeam) floorColor = 0x00f0ff;
    else if (sec.floorFlat.includes('CEIL')) floorColor = 0x3b3f46;

    // Floor Plane
    planes.push({
      id: planeId++,
      height: q16FromInt(sec.floorHeight),
      minX: q16FromInt(-5000),
      maxX: q16FromInt(5000),
      minY: q16FromInt(-5000),
      maxY: q16FromInt(5000),
      isCeiling: false,
      color: floorColor,
      isSlimeHazard: isSlime,
      isCryogenicCoolant: isCryo,
      isSiliconMirror: isSilicon,
      sectorId: s,
    });

    let ceilColor = 0x22242a;
    if (sec.ceilingFlat.includes('F_SKY')) ceilColor = 0x112233;
    else if (sec.ceilingFlat.includes('COLD_CATHODE')) ceilColor = 0xc8f0ff; // Cold-Cathode Grid
    else if (sec.ceilingFlat.includes('ALARM')) ceilColor = 0x660a14; // Alert Grid

    // Ceiling Plane
    planes.push({
      id: planeId++,
      height: q16FromInt(sec.ceilingHeight),
      minX: q16FromInt(-5000),
      maxX: q16FromInt(5000),
      minY: q16FromInt(-5000),
      maxY: q16FromInt(5000),
      isCeiling: true,
      color: ceilColor,
      isSlimeHazard: false,
      sectorId: s,
    });
  }

  // Always inject key atmospheric dynamic ray-tracing lights if none found
  if (lights.length === 0) {
    lights.push(
      {
        id: 0,
        pos: q16Vec3FromInt(1056, -3400, 96),
        color: 0xffa834, // Warm Hangar halogen lamp
        radius: q16FromInt(950),
        intensity: Q16_ONE,
        pulsing: false,
        label: 'Hangar Central Halogen',
      },
      {
        id: 1,
        pos: q16Vec3FromInt(500, -2900, 24),
        color: 0x00ff55, // Emerald toxic slime radiation
        radius: q16FromInt(720),
        intensity: Q16_ONE,
        pulsing: true,
        label: 'Toxic Nukage Pit Radiation',
      },
      {
        id: 2,
        pos: q16Vec3FromInt(1400, -3200, 64),
        color: 0x33b5e5, // Tech computer mainframe glow
        radius: q16FromInt(650),
        intensity: Q16_ONE,
        pulsing: true,
        label: 'Mainframe CRT Terminal Glow',
      }
    );
  }

  return {
    name,
    lumpsDetected,
    vertices,
    linedefs,
    sidedefs,
    sectors,
    things,
    quads,
    planes,
    lights,
    playerSpawn,
    playerAngle,
    beAgentSpawn,
    beAgentAngle,
  };
}

/**
 * Autonomous benchmark: Authentic reconstructed DOOM E1M1: "Hangar"
 * Contains the entrance hall, octagonal pillar, toxic slime pit with zig-zag bridge,
 * computer terminal control room, and exit stairs.
 */
export function buildCanonicalE1M1(): RTDoomMap {
  const vertices: DoomVertex[] = [
    // Entrance hall (Sector 0: Floor 0, Ceil 128)
    { x: 960, y: -3800 },   // 0
    { x: 1200, y: -3800 },  // 1
    { x: 1200, y: -3400 },  // 2
    { x: 960, y: -3400 },   // 3

    // Octagonal pillar in Entrance Hall
    { x: 1040, y: -3640 },  // 4
    { x: 1120, y: -3640 },  // 5
    { x: 1160, y: -3600 },  // 6
    { x: 1160, y: -3520 },  // 7
    { x: 1120, y: -3480 },  // 8
    { x: 1040, y: -3480 },  // 9
    { x: 1000, y: -3520 },  // 10
    { x: 1000, y: -3600 },  // 11

    // Corridor leading to Toxic Slime Pit
    { x: 1200, y: -3400 },  // 12 (= 2)
    { x: 1400, y: -3400 },  // 13
    { x: 1400, y: -3100 },  // 14
    { x: 1200, y: -3100 },  // 15

    // Toxic Slime Acid Pit (Sector 2: Floor -24, Ceil 144)
    { x: 400, y: -3200 },   // 16
    { x: 960, y: -3200 },   // 17
    { x: 960, y: -2600 },   // 18
    { x: 400, y: -2600 },   // 19

    // Zig-Zag Bridge across Acid Pit (Floor 0)
    { x: 550, y: -3200 },   // 20
    { x: 650, y: -3200 },   // 21
    { x: 750, y: -2900 },   // 22
    { x: 850, y: -2900 },   // 23
    { x: 750, y: -2600 },   // 24
    { x: 650, y: -2600 },   // 25

    // Computer Room (Sector 3: Floor 24, Ceil 112)
    { x: 1200, y: -3100 },  // 26
    { x: 1600, y: -3100 },  // 27
    { x: 1600, y: -2500 },  // 28
    { x: 1200, y: -2500 },  // 29

    // Courtyard outer window wall (Sector 4: Floor -32, Ceil 200 sky)
    { x: 200, y: -2600 },   // 30
    { x: 960, y: -2400 },   // 31
    { x: 200, y: -2400 },   // 32
  ];

  const sectors: DoomSector[] = [
    // 0: Entrance Hall
    { floorHeight: 0, ceilingHeight: 128, floorFlat: 'FLOOR4_8', ceilingFlat: 'CEIL3_5', lightLevel: 160, special: 0, tag: 0 },
    // 1: Corridor
    { floorHeight: 0, ceilingHeight: 112, floorFlat: 'FLAT14', ceilingFlat: 'TLITE6_4', lightLevel: 192, special: 0, tag: 0 },
    // 2: Toxic Slime Acid Pit
    { floorHeight: -24, ceilingHeight: 144, floorFlat: 'NUKAGE3', ceilingFlat: 'CEIL3_5', lightLevel: 144, special: 7, tag: 0 },
    // 3: Computer Terminal Room
    { floorHeight: 24, ceilingHeight: 112, floorFlat: 'COMP01', ceilingFlat: 'CEIL1_1', lightLevel: 176, special: 0, tag: 0 },
    // 4: Courtyard Overlook
    { floorHeight: -32, ceilingHeight: 220, floorFlat: 'GRASS1', ceilingFlat: 'F_SKY1', lightLevel: 240, special: 0, tag: 0 },
  ];

  const sidedefs: DoomSidedef[] = [
    { textureOffset: { x: 0, y: 0 }, upperTexture: '-', lowerTexture: '-', middleTexture: 'STARTAN3', sector: 0 },
    { textureOffset: { x: 0, y: 0 }, upperTexture: '-', lowerTexture: '-', middleTexture: 'COMP2', sector: 3 },
    { textureOffset: { x: 0, y: 0 }, upperTexture: '-', lowerTexture: '-', middleTexture: 'TEKWALL4', sector: 1 },
    { textureOffset: { x: 0, y: 0 }, upperTexture: '-', lowerTexture: '-', middleTexture: 'STEP4', sector: 2 },
  ];

  const linedefs: DoomLinedef[] = [
    // Entrance Hall Bounds
    { v1: 0, v2: 1, flags: 1, special: 0, tag: 0, sidenum: [0, -1] },
    { v1: 1, v2: 2, flags: 1, special: 0, tag: 0, sidenum: [0, -1] },
    { v1: 3, v2: 0, flags: 1, special: 0, tag: 0, sidenum: [0, -1] },

    // Central Pillar (8 faces)
    { v1: 4, v2: 5, flags: 1, special: 0, tag: 0, sidenum: [0, -1] },
    { v1: 5, v2: 6, flags: 1, special: 0, tag: 0, sidenum: [0, -1] },
    { v1: 6, v2: 7, flags: 1, special: 0, tag: 0, sidenum: [0, -1] },
    { v1: 7, v2: 8, flags: 1, special: 0, tag: 0, sidenum: [0, -1] },
    { v1: 8, v2: 9, flags: 1, special: 0, tag: 0, sidenum: [0, -1] },
    { v1: 9, v2: 10, flags: 1, special: 0, tag: 0, sidenum: [0, -1] },
    { v1: 10, v2: 11, flags: 1, special: 0, tag: 0, sidenum: [0, -1] },
    { v1: 11, v2: 4, flags: 1, special: 0, tag: 0, sidenum: [0, -1] },

    // Corridor to Computer Room
    { v1: 13, v2: 14, flags: 1, special: 0, tag: 0, sidenum: [2, -1] },
    { v1: 14, v2: 15, flags: 1, special: 0, tag: 0, sidenum: [2, -1] },

    // Computer Room
    { v1: 26, v2: 27, flags: 1, special: 0, tag: 0, sidenum: [1, -1] },
    { v1: 27, v2: 28, flags: 1, special: 0, tag: 0, sidenum: [1, -1] },
    { v1: 28, v2: 29, flags: 1, special: 0, tag: 0, sidenum: [1, -1] },
    { v1: 29, v2: 26, flags: 1, special: 0, tag: 0, sidenum: [1, -1] },

    // Acid Pit Wall Perimeters
    { v1: 16, v2: 17, flags: 1, special: 0, tag: 0, sidenum: [3, -1] },
    { v1: 17, v2: 18, flags: 1, special: 0, tag: 0, sidenum: [3, -1] },
    { v1: 18, v2: 19, flags: 1, special: 0, tag: 0, sidenum: [3, -1] },
    { v1: 19, v2: 16, flags: 1, special: 0, tag: 0, sidenum: [3, -1] },

    // Zig-Zag Bridge Ledges
    { v1: 20, v2: 22, flags: 1, special: 0, tag: 0, sidenum: [3, -1] },
    { v1: 22, v2: 24, flags: 1, special: 0, tag: 0, sidenum: [3, -1] },
    { v1: 21, v2: 23, flags: 1, special: 0, tag: 0, sidenum: [3, -1] },
    { v1: 23, v2: 25, flags: 1, special: 0, tag: 0, sidenum: [3, -1] },
  ];

  const things: DoomThing[] = [
    { x: 1056, y: -3680, angle: 90, type: 1, flags: 7 },    // Player 1 Marine Spawn
    { x: 1120, y: -3680, angle: 90, type: 2, flags: 7 },    // Be <> Co-Play Agent Spawn
    { x: 500, y: -2900, angle: 0, type: 2035, flags: 7 },   // Toxic Slime Barrel
    { x: 800, y: -2800, angle: 0, type: 2035, flags: 7 },   // Toxic Slime Barrel
    { x: 1400, y: -2800, angle: 180, type: 2018, flags: 7 }, // Armor Bonus in Computer Room
    { x: 1450, y: -2800, angle: 180, type: 2019, flags: 7 }, // Supercharge Soul Sphere
  ];

  const detected = ['VERTEXES', 'LINEDEFS', 'SIDEDEFS', 'SECTORS', 'THINGS'];
  return convertMapToRTGeometry('E1M1: HANGAR', detected, vertices, linedefs, sidedefs, sectors, things);
}

/**
 * Organelle 0xA8_COVALENT: THE GEMINI CLOUD (Datacenter Manifold)
 * High-density fiber-optic corridors, monolithic server racks, polished silicon floor,
 * zero-friction cryogenic coolant pits, and heavy "kernel panic" strike arena.
 */
export function buildGeminiCloudDatacenter(): RTDoomMap {
  const vertices: DoomVertex[] = [
    // Primary Ingestion Buffer (Sector 0)
    { x: 850, y: -4000 },  // 0
    { x: 1200, y: -4000 }, // 1
    { x: 1200, y: -3450 }, // 2
    { x: 850, y: -3450 },  // 3

    // Monolithic Server Rack A (Ingestion West Wall)
    { x: 870, y: -3850 },  // 4
    { x: 910, y: -3850 },  // 5
    { x: 910, y: -3600 },  // 6
    { x: 870, y: -3600 },  // 7

    // Monolithic Server Rack B (Ingestion East Wall)
    { x: 1140, y: -3850 }, // 8
    { x: 1180, y: -3850 }, // 9
    { x: 1180, y: -3600 }, // 10
    { x: 1140, y: -3600 }, // 11

    // Narrow Fiber-Optic Bifurcation Corridor (Sector 1)
    { x: 970, y: -3450 },  // 12
    { x: 1080, y: -3450 }, // 13
    { x: 1080, y: -2900 }, // 14
    { x: 970, y: -2900 },  // 15

    // West Chamber: Algorithmic Cooling Chamber Catwalk (Sector 2)
    { x: 450, y: -2900 },  // 16
    { x: 970, y: -2900 },  // 17
    { x: 970, y: -2200 },  // 18
    { x: 450, y: -2200 },  // 19

    // Sunken Cryogenic Coolant Pit (Sector 3: Floor -28, Zero Friction)
    { x: 550, y: -2800 },  // 20
    { x: 870, y: -2800 },  // 21
    { x: 870, y: -2300 },  // 22
    { x: 550, y: -2300 },  // 23

    // East Chamber: Monolithic Server Rack Aisle (Sector 4)
    { x: 1080, y: -2900 }, // 24
    { x: 1650, y: -2900 }, // 25
    { x: 1650, y: -2200 }, // 26
    { x: 1080, y: -2200 }, // 27

    // Server Monolith C
    { x: 1200, y: -2700 }, // 28
    { x: 1260, y: -2700 }, // 29
    { x: 1260, y: -2400 }, // 30
    { x: 1200, y: -2400 }, // 31

    // Server Monolith D
    { x: 1400, y: -2700 }, // 32
    { x: 1460, y: -2700 }, // 33
    { x: 1460, y: -2400 }, // 34
    { x: 1400, y: -2400 }, // 35

    // Central "Kernel Panic" Strike Arena (Sector 5: Floor +16, Ceil 200)
    { x: 750, y: -2200 },  // 36
    { x: 1350, y: -2200 }, // 37
    { x: 1350, y: -1400 }, // 38
    { x: 750, y: -1400 },  // 39

    // Central Quantum Processor Core (Sector 6: Floor +32)
    { x: 1000, y: -1850 }, // 40
    { x: 1100, y: -1850 }, // 41
    { x: 1100, y: -1750 }, // 42
    { x: 1000, y: -1750 }, // 43
  ];

  const sectors: DoomSector[] = [
    // 0: Primary Ingestion Buffer (Polished Silicon floor, Cold-Cathode grid)
    { floorHeight: 0, ceilingHeight: 144, floorFlat: 'SILICON_MIRROR', ceilingFlat: 'COLD_CATHODE', lightLevel: 220, special: 0, tag: 0 },
    // 1: Fiber-Optic Bifurcation Corridor (Pulsing Cyan Seams)
    { floorHeight: 0, ceilingHeight: 120, floorFlat: 'CYAN_DATA_SEAM', ceilingFlat: 'COLD_CATHODE', lightLevel: 210, special: 0, tag: 0 },
    // 2: Algorithmic Cooling Chamber Catwalk
    { floorHeight: 0, ceilingHeight: 160, floorFlat: 'BERYLLIUM_TILE', ceilingFlat: 'COLD_CATHODE', lightLevel: 200, special: 0, tag: 0 },
    // 3: Zero-Friction Cryogenic Coolant Pit
    { floorHeight: -28, ceilingHeight: 160, floorFlat: 'CRYO_COOLANT', ceilingFlat: 'COLD_CATHODE', lightLevel: 250, special: 9, tag: 0 },
    // 4: Monolithic Server Rack Aisle
    { floorHeight: 0, ceilingHeight: 136, floorFlat: 'BERYLLIUM_TILE', ceilingFlat: 'COLD_CATHODE', lightLevel: 195, special: 0, tag: 0 },
    // 5: High-Density "Kernel Panic" Strike Arena
    { floorHeight: 16, ceilingHeight: 200, floorFlat: 'SILICON_HEX', ceilingFlat: 'ALARM_GRID', lightLevel: 255, special: 0, tag: 0 },
    // 6: Central Quantum Processor Core (Tiered Podium)
    { floorHeight: 32, ceilingHeight: 200, floorFlat: 'CYAN_DATA_SEAM', ceilingFlat: 'ALARM_GRID', lightLevel: 255, special: 0, tag: 0 },
  ];

  const sidedefs: DoomSidedef[] = [
    { textureOffset: { x: 0, y: 0 }, upperTexture: '-', lowerTexture: '-', middleTexture: 'BERYLLIUM_RACK', sector: 0 },
    { textureOffset: { x: 0, y: 0 }, upperTexture: '-', lowerTexture: '-', middleTexture: 'CYAN_DATA_SEAM', sector: 1 },
    { textureOffset: { x: 0, y: 0 }, upperTexture: '-', lowerTexture: '-', middleTexture: 'BERYLLIUM_RACK', sector: 2 },
    { textureOffset: { x: 0, y: 0 }, upperTexture: '-', lowerTexture: '-', middleTexture: 'CRYO_STEP', sector: 3 },
    { textureOffset: { x: 0, y: 0 }, upperTexture: '-', lowerTexture: '-', middleTexture: 'BERYLLIUM_RACK', sector: 4 },
    { textureOffset: { x: 0, y: 0 }, upperTexture: '-', lowerTexture: '-', middleTexture: 'ALARM_GRID', sector: 5 },
    { textureOffset: { x: 0, y: 0 }, upperTexture: '-', lowerTexture: '-', middleTexture: 'CYAN_DATA_SEAM', sector: 6 },
  ];

  const linedefs: DoomLinedef[] = [
    // Primary Ingestion Buffer Outer Walls
    { v1: 0, v2: 1, flags: 1, special: 0, tag: 0, sidenum: [0, -1] },
    { v1: 1, v2: 13, flags: 1, special: 0, tag: 0, sidenum: [0, -1] },
    { v1: 12, v2: 3, flags: 1, special: 0, tag: 0, sidenum: [0, -1] },
    { v1: 3, v2: 0, flags: 1, special: 0, tag: 0, sidenum: [0, -1] },

    // Server Rack A (Ingestion West)
    { v1: 4, v2: 5, flags: 1, special: 0, tag: 0, sidenum: [0, -1] },
    { v1: 5, v2: 6, flags: 1, special: 0, tag: 0, sidenum: [0, -1] },
    { v1: 6, v2: 7, flags: 1, special: 0, tag: 0, sidenum: [0, -1] },
    { v1: 7, v2: 4, flags: 1, special: 0, tag: 0, sidenum: [0, -1] },

    // Server Rack B (Ingestion East)
    { v1: 8, v2: 9, flags: 1, special: 0, tag: 0, sidenum: [0, -1] },
    { v1: 9, v2: 10, flags: 1, special: 0, tag: 0, sidenum: [0, -1] },
    { v1: 10, v2: 11, flags: 1, special: 0, tag: 0, sidenum: [0, -1] },
    { v1: 11, v2: 8, flags: 1, special: 0, tag: 0, sidenum: [0, -1] },

    // Fiber-Optic Bifurcation Walls
    { v1: 12, v2: 15, flags: 1, special: 0, tag: 0, sidenum: [1, -1] },
    { v1: 13, v2: 14, flags: 1, special: 0, tag: 0, sidenum: [1, -1] },

    // West Algorithmic Cooling Chamber Catwalk Bounds
    { v1: 16, v2: 19, flags: 1, special: 0, tag: 0, sidenum: [2, -1] },
    { v1: 19, v2: 36, flags: 1, special: 0, tag: 0, sidenum: [2, -1] },
    { v1: 16, v2: 15, flags: 1, special: 0, tag: 0, sidenum: [2, -1] },

    // Sunken Cryogenic Coolant Pit Step Riser (Sector 2 -> Sector 3)
    { v1: 20, v2: 21, flags: 1, special: 0, tag: 0, sidenum: [3, 2] },
    { v1: 21, v2: 22, flags: 1, special: 0, tag: 0, sidenum: [3, 2] },
    { v1: 22, v2: 23, flags: 1, special: 0, tag: 0, sidenum: [3, 2] },
    { v1: 23, v2: 20, flags: 1, special: 0, tag: 0, sidenum: [3, 2] },

    // East Server Aisle Bounds
    { v1: 14, v2: 25, flags: 1, special: 0, tag: 0, sidenum: [4, -1] },
    { v1: 25, v2: 26, flags: 1, special: 0, tag: 0, sidenum: [4, -1] },
    { v1: 26, v2: 37, flags: 1, special: 0, tag: 0, sidenum: [4, -1] },

    // Server Monolith C
    { v1: 28, v2: 29, flags: 1, special: 0, tag: 0, sidenum: [4, -1] },
    { v1: 29, v2: 30, flags: 1, special: 0, tag: 0, sidenum: [4, -1] },
    { v1: 30, v2: 31, flags: 1, special: 0, tag: 0, sidenum: [4, -1] },
    { v1: 31, v2: 28, flags: 1, special: 0, tag: 0, sidenum: [4, -1] },

    // Server Monolith D
    { v1: 32, v2: 33, flags: 1, special: 0, tag: 0, sidenum: [4, -1] },
    { v1: 33, v2: 34, flags: 1, special: 0, tag: 0, sidenum: [4, -1] },
    { v1: 34, v2: 35, flags: 1, special: 0, tag: 0, sidenum: [4, -1] },
    { v1: 35, v2: 32, flags: 1, special: 0, tag: 0, sidenum: [4, -1] },

    // Kernel Panic Strike Arena Outer Perimeter
    { v1: 36, v2: 39, flags: 1, special: 0, tag: 0, sidenum: [5, -1] },
    { v1: 39, v2: 38, flags: 1, special: 0, tag: 0, sidenum: [5, -1] },
    { v1: 38, v2: 37, flags: 1, special: 0, tag: 0, sidenum: [5, -1] },

    // Central Quantum Processor Core Riser (Sector 5 -> Sector 6)
    { v1: 40, v2: 41, flags: 1, special: 0, tag: 0, sidenum: [6, 5] },
    { v1: 41, v2: 42, flags: 1, special: 0, tag: 0, sidenum: [6, 5] },
    { v1: 42, v2: 43, flags: 1, special: 0, tag: 0, sidenum: [6, 5] },
    { v1: 43, v2: 40, flags: 1, special: 0, tag: 0, sidenum: [6, 5] },
  ];

  const things: DoomThing[] = [
    // Player 1 Marine Spawn (in primary ingestion buffer)
    { x: 1024, y: -3800, angle: 90, type: 1, flags: 7 },
    // Be <> Co-Play Avatar Spawn (standing directly to player's left!)
    { x: 940, y: -3800, angle: 90, type: 2, flags: 7 },

    // Stale.PIDs (shambling around the corner of the first server rack!)
    { x: 970, y: -3380, angle: 270, type: 3004, flags: 7 },
    { x: 1060, y: -3250, angle: 270, type: 3004, flags: 7 },
    { x: 1020, y: -3000, angle: 270, type: 3004, flags: 7 },

    // Cron.Daemons (in algorithmic cooling chamber and catwalks)
    { x: 650, y: -2550, angle: 0, type: 3001, flags: 7 },
    { x: 800, y: -2350, angle: 315, type: 3001, flags: 7 },
    { x: 1200, y: -1600, angle: 270, type: 3001, flags: 7 },

    // Root.Kits (in server aisle and kernel panic arena)
    { x: 1450, y: -2350, angle: 180, type: 3002, flags: 7 },
    { x: 950, y: -1600, angle: 270, type: 3002, flags: 7 },

    // Cryogenic Coolant Cells (Barrels)
    { x: 570, y: -2650, angle: 0, type: 2035, flags: 7 },
    { x: 770, y: -2650, angle: 0, type: 2035, flags: 7 },

    // Soul Sphere Data Node
    { x: 1050, y: -1800, angle: 0, type: 2019, flags: 7 },
  ];

  const detected = ['VERTEXES', 'LINEDEFS', 'SIDEDEFS', 'SECTORS', 'THINGS'];
  const map = convertMapToRTGeometry('THE GEMINI CLOUD: DATACENTER', detected, vertices, linedefs, sidedefs, sectors, things);

  // Custom Atmospheric Ray-Traced Lights for The Gemini Cloud
  map.lights = [
    {
      id: 0,
      pos: q16Vec3FromInt(1024, -3750, 110),
      color: 0x00f0ff, // Cyan Cold-Cathode Ingestion Grid
      radius: q16FromInt(850),
      intensity: Q16_ONE,
      pulsing: false,
      label: 'Cold-Cathode Ingestion Fixture',
    },
    {
      id: 1,
      pos: q16Vec3FromInt(1025, -3150, 80),
      color: 0xffffff, // Hyper-white fiber-optic seam bounce
      radius: q16FromInt(720),
      intensity: Q16_ONE,
      pulsing: false,
      label: 'Hyper-White Fiber Seam Bounce',
    },
    {
      id: 2,
      pos: q16Vec3FromInt(710, -2550, 40),
      color: 0x00e5ff, // Frosted Cryogenic Coolant Luminescence
      radius: q16FromInt(880),
      intensity: Q16_ONE,
      pulsing: true,
      label: 'Cryogenic Pit Specular Core',
    },
    {
      id: 3,
      pos: q16Vec3FromInt(1350, -2550, 80),
      color: 0x38bdf8, // Server Rack Blade Data Glow
      radius: q16FromInt(680),
      intensity: Q16_ONE,
      pulsing: false,
      label: 'Beryllium Monolith Blade Array',
    },
    {
      id: 4,
      pos: q16Vec3FromInt(1050, -1800, 140),
      color: 0xff3344, // Kernel Panic Amber-Red Alert Strobe
      radius: q16FromInt(1050),
      intensity: Q16_ONE,
      pulsing: true,
      label: 'Kernel Panic Core Alert Strobe',
    },
  ];

  return map;
}

