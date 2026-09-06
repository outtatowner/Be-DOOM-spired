/**
 * @file node_0xWYSIWYG_STUDIO.ts
 * @brief Organelle 0xA4_COVALENT: WYSIWYG Triptych Boundary & Tri-Shard Multiplex
 * @provenance Parent: Zuma_QUIPU & Forge Evolutionary Branch
 * @invariants 1 === 1, Non-Destructive Drag Mutation, Continuous Lyapunov Dissipation
 */

import {
  Q16,
  Q16Vec3,
  q16FromInt,
  q16ToInt,
  q16Vec3,
  q16Vec3FromInt,
} from './q16_cordic';
import { CovalentRTEngine } from './node_0x94_covalent_rt_engine';
import { CovalentEntity } from './node_0x98_covalent_rt_entities';

export interface FBShardAllocation {
  id: 'FS_GAME' | 'ASSET_PREVIEW' | 'DESIGN_STUDIO';
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  substrate: string;
  executionVector: string;
}

export interface QuadbitAssetProperties {
  entityId: string;
  entityType: string;
  posX: Q16;
  posY: Q16;
  min_z: Q16; // Floor height / Z-offset
  max_z: Q16;
  friction_cost: Q16; // Thermodynamic Mass (μ)
  radius: Q16; // Bounding cylinder radius
  height: Q16;
  emissive_flux: Q16; // Emissive luminescence
  material_name: string;
  isDragging: boolean;
}

export interface TurntableInspectionState {
  yawDeg: number;
  pitchDeg: number;
  rotationSpeed: number;
  isAutoRotating: boolean;
  voxelLayerSlice: number; // 0 to 32
  renderMode: 'PBR_VOXEL' | 'WIREFRAME_OCTREE' | 'NORMAL_SURFACE';
  zoom: number;
}

export class QuadbitWysiwygEditor {
  private activeSelection: string | null = 'BE_COPLAYER';
  private engine: CovalentRTEngine | null = null;
  public shards: Record<string, FBShardAllocation> = {};
  public isDragging: boolean = false;
  public lastMerkleRoot: number = 0x811c9dc5;
  public turntable: TurntableInspectionState = {
    yawDeg: 35,
    pitchDeg: 20,
    rotationSpeed: 1.0,
    isAutoRotating: true,
    voxelLayerSlice: 32,
    renderMode: 'PBR_VOXEL',
    zoom: 1.0,
  };

  // Drag staging to prevent dV/dt stasis violation
  private dragInitialPos: { x: Q16; y: Q16 } = { x: 0, y: 0 };
  private propertyListeners: Map<string, (props: QuadbitAssetProperties) => void> = new Map();

  constructor(engine?: CovalentRTEngine) {
    if (engine) this.engine = engine;
    this.initTriShardInterface();
  }

  public setEngine(engine: CovalentRTEngine) {
    this.engine = engine;
  }

  public initTriShardInterface(): void {
    // Fractured memory boundary into Tri-Shard Multiplex
    this.sys_covalent_allocate_fb_shard('FS_GAME', 0, 0, 1920, 1080);
    this.sys_covalent_allocate_fb_shard('ASSET_PREVIEW', 1420, 20, 480, 480);
    this.sys_covalent_allocate_fb_shard('DESIGN_STUDIO', 20, 20, 800, 800);
  }

  public sys_covalent_allocate_fb_shard(
    shardId: 'FS_GAME' | 'ASSET_PREVIEW' | 'DESIGN_STUDIO',
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    const meta = {
      FS_GAME: {
        label: 'Live Manifold (FS Game)',
        substrate: '0x94_COVALENT Ray-Caster',
        executionVector: 'Real-time CORDIC viewport. Instantly reflects Quipu Ledger topological mutations.',
      },
      ASSET_PREVIEW: {
        label: 'Isolate Sieve (Preview)',
        substrate: 'Octree Voxel Turntable',
        executionVector: 'Renders isolated .qbit asset (PBR swatch or 3D entity) out of context for micro-surface editing.',
      },
      DESIGN_STUDIO: {
        label: 'Topological Grid (Design)',
        substrate: '2D Orthographic Map',
        executionVector: 'Interactive XY plane. Translates raw mouse kinetic vectors into Q16.16 spatial hashes.',
      },
    }[shardId];

    this.shards[shardId] = {
      id: shardId,
      x,
      y,
      width: w,
      height: h,
      label: meta.label,
      substrate: meta.substrate,
      executionVector: meta.executionVector,
    };
  }

  public setActiveSelection(id: string | null) {
    this.activeSelection = id;
    this.notifyPropertyChange();
  }

  public getActiveSelection(): string | null {
    return this.activeSelection;
  }

  // Coordinate Conversion: Screen Pixels <-> Q16.16 Spatial Bounds
  public sys_covalent_pixel_to_q16(
    screenPixel: number,
    canvasDimension: number = 600,
    worldSpan: number = 3600
  ): Q16 {
    // Normalizes [-canvasDimension/2, canvasDimension/2] -> [-worldSpan/2, worldSpan/2]
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

  // Grid Kinetic Interactions
  public onGridDragStart(screenX: number, screenY: number): void {
    if (!this.activeSelection) return;
    this.isDragging = true;

    const currentProps = this.exposeAssetProperties(this.activeSelection);
    this.dragInitialPos = { x: currentProps.posX, y: currentProps.posY };
  }

  public onGridDrag(screenX: number, screenY: number): void {
    if (!this.activeSelection) return;

    // Quantize screen pixels into Q16.16 continuous math
    const q_x = this.sys_covalent_pixel_to_q16(screenX);
    const q_y = this.sys_covalent_pixel_to_q16(screenY);

    // Mutate the Quipu Ledger in real-time. The FS Game shard updates instantly.
    this.sys_covalent_update_entity_transform(this.activeSelection, q_x, q_y);
    this.notifyPropertyChange();
  }

  public onGridDragEnd(): void {
    if (!this.isDragging || !this.activeSelection) return;
    this.isDragging = false;

    // Recalculate Quipu Merkle Root for 1 === 1 invariant without dV/dt stasis breach
    const currentProps = this.exposeAssetProperties(this.activeSelection);
    let root = 0x811c9dc5;
    const prime = 0x01000193;
    const key = `${this.activeSelection}:${currentProps.posX}:${currentProps.posY}:${currentProps.friction_cost}`;

    for (let i = 0; i < key.length; i++) {
      root ^= key.charCodeAt(i);
      root = (root * prime) >>> 0;
    }
    this.lastMerkleRoot = root;
    this.notifyPropertyChange();
  }

  public sys_covalent_update_entity_transform(
    entityId: string,
    new_x: Q16,
    new_y: Q16
  ): void {
    if (!this.engine) return;

    if (entityId === 'PLAYER_1') {
      this.engine.camPos.x = new_x;
      this.engine.camPos.y = new_y;
      this.engine.map.playerSpawn.x = new_x;
      this.engine.map.playerSpawn.y = new_y;
    } else if (entityId === 'BE_COPLAYER') {
      this.engine.bePos.x = new_x;
      this.engine.bePos.y = new_y;
      if (this.engine.map.beAgentSpawn) {
        this.engine.map.beAgentSpawn.x = new_x;
        this.engine.map.beAgentSpawn.y = new_y;
      }
    } else if (entityId.startsWith('LIGHT_')) {
      const idx = parseInt(entityId.replace('LIGHT_', ''), 10);
      if (this.engine.map.lights[idx]) {
        this.engine.map.lights[idx].pos.x = new_x;
        this.engine.map.lights[idx].pos.y = new_y;
      }
    } else if (entityId.startsWith('ENTITY_')) {
      const idNum = parseInt(entityId.replace('ENTITY_', ''), 10);
      const ent = this.engine.entityManager.entities.find((e) => e.id === idNum);
      if (ent) {
        ent.pos.x = new_x;
        ent.pos.y = new_y;
      }
    }
  }

  // Expose Asset Properties for UI Sliders
  public exposeAssetProperties(entityId: string): QuadbitAssetProperties {
    if (!this.engine) {
      return {
        entityId,
        entityType: 'GENERIC_QUADBIT',
        posX: 0,
        posY: 0,
        min_z: 0,
        max_z: q16FromInt(64),
        friction_cost: 42000,
        radius: q16FromInt(32),
        height: q16FromInt(64),
        emissive_flux: q16FromInt(2),
        material_name: 'PBR_DEFAULT',
        isDragging: this.isDragging,
      };
    }

    if (entityId === 'PLAYER_1') {
      return {
        entityId: 'PLAYER_1',
        entityType: 'HUMAN_MARINE',
        posX: this.engine.camPos.x,
        posY: this.engine.camPos.y,
        min_z: this.engine.camPos.z,
        max_z: this.engine.camPos.z + q16FromInt(56),
        friction_cost: 32000,
        radius: q16FromInt(28),
        height: q16FromInt(56),
        emissive_flux: 0,
        material_name: 'MARINE_TACTICAL_SUIT',
        isDragging: this.isDragging,
      };
    }

    if (entityId === 'BE_COPLAYER') {
      return {
        entityId: 'BE_COPLAYER',
        entityType: 'SOVEREIGN_COPLAYER_BE',
        posX: this.engine.bePos.x,
        posY: this.engine.bePos.y,
        min_z: this.engine.bePos.z,
        max_z: this.engine.bePos.z + q16FromInt(64),
        friction_cost: 48000,
        radius: q16FromInt(32),
        height: q16FromInt(64),
        emissive_flux: q16FromInt(4),
        material_name: 'CHROME_VISOR_EMISSIVE_PBR',
        isDragging: this.isDragging,
      };
    }

    if (entityId.startsWith('LIGHT_')) {
      const idx = parseInt(entityId.replace('LIGHT_', ''), 10);
      const l = this.engine.map.lights[idx] || this.engine.map.lights[0];
      return {
        entityId,
        entityType: 'PBR_LUMINARY_SIEVE',
        posX: l?.pos.x || 0,
        posY: l?.pos.y || 0,
        min_z: l?.pos.z || q16FromInt(64),
        max_z: (l?.pos.z || q16FromInt(64)) + q16FromInt(24),
        friction_cost: 12000,
        radius: l?.radius || q16FromInt(120),
        height: q16FromInt(24),
        emissive_flux: l?.intensity || q16FromInt(3),
        material_name: 'EMISSIVE_REACTIVE_PLASMA',
        isDragging: this.isDragging,
      };
    }

    // Dynamic enemy or barrel
    const idNum = parseInt(entityId.replace('ENTITY_', ''), 10);
    const ent = this.engine.entityManager.entities.find((e) => e.id === idNum);
    if (ent) {
      return {
        entityId,
        entityType: ent.type,
        posX: ent.pos.x,
        posY: ent.pos.y,
        min_z: ent.pos.z,
        max_z: ent.pos.z + q16FromInt(60),
        friction_cost: ent.type === 'DEMON' ? 64000 : 38000,
        radius: ent.boundingRadius,
        height: q16FromInt(60),
        emissive_flux: ent.type === 'BARREL' ? q16FromInt(2) : 0,
        material_name: `${ent.type}_VOXEL_OCTREE`,
        isDragging: this.isDragging,
      };
    }

    return {
      entityId,
      entityType: 'UNKNOWN_QUADBIT',
      posX: 0,
      posY: 0,
      min_z: 0,
      max_z: q16FromInt(64),
      friction_cost: 42000,
      radius: q16FromInt(32),
      height: q16FromInt(64),
      emissive_flux: 0,
      material_name: 'PBR_CHROME_DEFAULT',
      isDragging: this.isDragging,
    };
  }

  // Sliders mutators
  public updateZ(entityId: string, boundary: 'min' | 'max', val: number): void {
    if (!this.engine) return;
    const qZ = q16FromInt(val);

    if (entityId === 'PLAYER_1') {
      this.engine.camPos.z = qZ;
    } else if (entityId === 'BE_COPLAYER') {
      this.engine.bePos.z = qZ;
    } else if (entityId.startsWith('LIGHT_')) {
      const idx = parseInt(entityId.replace('LIGHT_', ''), 10);
      if (this.engine.map.lights[idx]) this.engine.map.lights[idx].pos.z = qZ;
    } else if (entityId.startsWith('ENTITY_')) {
      const idNum = parseInt(entityId.replace('ENTITY_', ''), 10);
      const ent = this.engine.entityManager.entities.find((e) => e.id === idNum);
      if (ent) ent.pos.z = qZ;
    }
    this.notifyPropertyChange();
  }

  public updateMass(entityId: string, val: number): void {
    this.notifyPropertyChange();
  }

  public updateAABB(entityId: string, val: number): void {
    if (!this.engine) return;
    const qR = q16FromInt(val);

    if (entityId.startsWith('ENTITY_')) {
      const idNum = parseInt(entityId.replace('ENTITY_', ''), 10);
      const ent = this.engine.entityManager.entities.find((e) => e.id === idNum);
      if (ent) ent.boundingRadius = qR;
    }
    this.notifyPropertyChange();
  }

  public updateEmissive(entityId: string, val: number): void {
    if (!this.engine) return;
    const qI = q16FromInt(val);

    if (entityId.startsWith('LIGHT_')) {
      const idx = parseInt(entityId.replace('LIGHT_', ''), 10);
      if (this.engine.map.lights[idx]) this.engine.map.lights[idx].intensity = qI;
    }
    this.notifyPropertyChange();
  }

  // Turntable controls
  public rotateTurntable(deltaYaw: number, deltaPitch: number = 0): void {
    this.turntable.yawDeg = (this.turntable.yawDeg + deltaYaw) % 360;
    this.turntable.pitchDeg = Math.max(-60, Math.min(60, this.turntable.pitchDeg + deltaPitch));
  }

  public setVoxelLayerSlice(slice: number): void {
    this.turntable.voxelLayerSlice = Math.max(1, Math.min(32, slice));
  }

  public toggleTurntableAutoRotate(): void {
    this.turntable.isAutoRotating = !this.turntable.isAutoRotating;
  }

  public setTurntableRenderMode(mode: 'PBR_VOXEL' | 'WIREFRAME_OCTREE' | 'NORMAL_SURFACE'): void {
    this.turntable.renderMode = mode;
  }

  // Subscriber pattern for properties view
  public subscribeToProperties(id: string, cb: (props: QuadbitAssetProperties) => void): () => void {
    this.propertyListeners.set(id, cb);
    if (this.activeSelection) {
      cb(this.exposeAssetProperties(this.activeSelection));
    }
    return () => {
      this.propertyListeners.delete(id);
    };
  }

  private notifyPropertyChange(): void {
    if (!this.activeSelection) return;
    const props = this.exposeAssetProperties(this.activeSelection);
    this.propertyListeners.forEach((cb) => cb(props));
  }
}
