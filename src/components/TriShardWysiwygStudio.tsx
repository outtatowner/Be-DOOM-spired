/**
 * @file TriShardWysiwygStudio.tsx
 * @brief Organelle 0xA4_COVALENT & 0xA5_COVALENT: WYSIWYG Triptych Boundary & Tri-Shard Multiplex
 * @provenance Parent: Zuma_QUIPU & Forge Evolutionary Branch
 * @invariants 1 === 1, Non-Destructive Spatial Drag Mutations, Continuous Lyapunov Dissipation
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  QuadbitWysiwygEditor,
  QuadbitAssetProperties,
} from '../organelles/node_0xWYSIWYG_STUDIO';
import {
  WysiwygGenerativeGrid,
  SwarmStampTelemetry,
} from '../organelles/node_0xLAYOUT_AND_SWARM';
import {
  QuadbitGridCompiler,
  TopologicalVerificationReport,
  GridEntity,
} from '../organelles/node_0xWYSIWYG_SERIALIZER';
import { CovalentRTEngine, EngineTelemetry } from '../organelles/node_0x94_covalent_rt_engine';
import { RTDoomMap } from '../organelles/node_0x95_covalent_doom_wad_parser';
import { q16ToInt, q16FromInt } from '../organelles/q16_cordic';
import {
  Layers,
  Move,
  RotateCw,
  Eye,
  Sliders,
  Shield,
  Activity,
  Cpu,
  Binary,
  Radio,
  Maximize2,
  Minimize2,
  Box,
  Compass,
  Zap,
  Flame,
  Check,
  Sparkles,
  Grid,
  Crosshair,
  Footprints,
  Target,
  RefreshCw,
} from 'lucide-react';

interface TriShardProps {
  engine: CovalentRTEngine;
  currentMap: RTDoomMap;
  onMapMutated?: () => void;
}

export const TriShardWysiwygStudio: React.FC<TriShardProps> = ({
  engine,
  currentMap,
  onMapMutated,
}) => {
  const editor = useMemo(() => new QuadbitWysiwygEditor(engine), [engine]);

  const [selectedEntity, setSelectedEntity] = useState<string>('BE_COPLAYER');
  const [properties, setProperties] = useState<QuadbitAssetProperties>(() =>
    editor.exposeAssetProperties('BE_COPLAYER')
  );
  const [activeShard, setActiveShard] = useState<'ALL' | 'FS_GAME' | 'ASSET_PREVIEW' | 'DESIGN_STUDIO'>('ALL');
  const [merkleHash, setMerkleHash] = useState<number>(editor.lastMerkleRoot);
  const [isDragging, setIsDragging] = useState(false);

  // Organelle 0xA6 & 0xA7 Generative Grid & Autonomous Roaming State
  const generativeGrid = useMemo(
    () => new WysiwygGenerativeGrid(engine, (id) => handleSelect(`ENTITY_${id}`)),
    [engine]
  );
  const [studioTool, setStudioTool] = useState<'DRAG_TRANSFORM' | 'SWARM_STAMP' | 'TOPOLOGY_MAZE' | 'QBIT_COMPILER'>('DRAG_TRANSFORM');
  const [stampType, setStampType] = useState<'IMP' | 'DEMON' | 'ZOMBIEMAN' | 'BARREL'>('IMP');
  const [stampCount, setStampCount] = useState<number>(4);
  const [roomCount, setRoomCount] = useState<number>(4);
  const [complexity, setComplexity] = useState<number>(6);
  const [mouseGridPos, setMouseGridPos] = useState<{ x: number; y: number } | null>(null);
  const [swarmTelemetry, setSwarmTelemetry] = useState<SwarmStampTelemetry>(() => generativeGrid.telemetry);

  // Organelle 0xA9 & 0xAA Quadbit Grid Compiler & Topological Referee State
  const gridCompiler = useMemo(() => new QuadbitGridCompiler(engine), [engine]);
  const [qbitElement, setQbitElement] = useState<GridEntity['type']>('WALL');
  const [qbitReport, setQbitReport] = useState<TopologicalVerificationReport>(() => gridCompiler.verifyTopology());
  const [qbitSaveStatus, setQbitSaveStatus] = useState<string | null>(null);
  const [isCompilingQbit, setIsCompilingQbit] = useState<boolean>(false);

  // Turntable animation ref
  const turntableCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Synchronize properties on selection change
  const handleSelect = (id: string) => {
    setSelectedEntity(id);
    editor.setActiveSelection(id);
    setProperties(editor.exposeAssetProperties(id));
  };

  useEffect(() => {
    editor.setEngine(engine);
    handleSelect('BE_COPLAYER');
  }, [engine]);

  // Turntable Canvas Render Loop
  useEffect(() => {
    let animId: number;
    let localYaw = editor.turntable.yawDeg;

    const renderTurntable = () => {
      const canvas = turntableCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#0a0d12';
      ctx.fillRect(0, 0, w, h);

      if (editor.turntable.isAutoRotating) {
        localYaw = (localYaw + editor.turntable.rotationSpeed) % 360;
        editor.turntable.yawDeg = localYaw;
      }

      const radYaw = (localYaw * Math.PI) / 180;
      const radPitch = (editor.turntable.pitchDeg * Math.PI) / 180;
      const cx = w / 2;
      const cy = h / 2 + 20;

      // Draw Turntable Base Platform (Disk Grid)
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 90, 110, 38, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#334155';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 90, 70, 24, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Draw Voxel Octree / Asset Wireframe Bounding Cylinder
      const r = q16ToInt(properties.radius) || 32;
      const rScale = r * 1.6;
      const hScale = (q16ToInt(properties.height) || 64) * 1.8;

      ctx.strokeStyle = '#06b6d4'; // Cyan
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      // Cylinder top and bottom ellipses
      ctx.beginPath();
      ctx.ellipse(cx, cy - hScale / 2, rScale, rScale * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx, cy + hScale / 2, rScale, rScale * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw 3D Voxel Cubes along Octree Nodes
      const voxelCount = Math.min(editor.turntable.voxelLayerSlice, 32);
      const mode = editor.turntable.renderMode;

      for (let i = 0; i < voxelCount; i++) {
        const angleOffset = (i / voxelCount) * Math.PI * 2 + radYaw;
        const dist = (i % 3 + 1) * 14;
        const zOffset = ((i / voxelCount) - 0.5) * hScale;

        const vx = cx + Math.cos(angleOffset) * dist;
        const vy = cy + zOffset + Math.sin(angleOffset) * (dist * 0.35) * Math.cos(radPitch);
        const sz = 12 + (i % 2) * 4;

        if (mode === 'WIREFRAME_OCTREE') {
          ctx.strokeStyle = '#38bdf8';
          ctx.strokeRect(vx - sz / 2, vy - sz / 2, sz, sz);
        } else if (mode === 'NORMAL_SURFACE') {
          ctx.fillStyle = `rgb(${Math.round(128 + Math.cos(angleOffset) * 120)}, ${Math.round(
            128 + Math.sin(angleOffset) * 120
          )}, 220)`;
          ctx.fillRect(vx - sz / 2, vy - sz / 2, sz, sz);
        } else {
          // PBR Voxel with Emissive Highlight
          const isEmissive = i % 4 === 0;
          ctx.fillStyle = isEmissive ? '#00f0ff' : '#475569';
          ctx.fillRect(vx - sz / 2, vy - sz / 2, sz, sz);
          ctx.strokeStyle = isEmissive ? '#67e8f9' : '#1e293b';
          ctx.strokeRect(vx - sz / 2, vy - sz / 2, sz, sz);
        }
      }

      // Emissive core telemetry pulse
      const pulse = Math.sin(Date.now() / 250) * 0.2 + 0.8;
      ctx.fillStyle = `rgba(0, 240, 255, ${0.15 * pulse})`;
      ctx.beginPath();
      ctx.arc(cx, cy - 10, rScale * pulse, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(renderTurntable);
    };

    renderTurntable();
    return () => cancelAnimationFrame(animId);
  }, [properties, editor.turntable]);

  // Topological Grid Canvas (2D Orthographic Map) Render
  const renderGrid = useCallback(() => {
    const canvas = gridCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#080a0f';
    ctx.fillRect(0, 0, w, h);

    // Organelle 0xA9 & 0xAA: Discrete Rigid Quadbit Matrix Mode
    if (studioTool === 'QBIT_COMPILER') {
      const gridSize = 16;
      const cs = w / gridSize;

      // Draw Grid Matrix Background Cells
      for (let gy = 0; gy < gridSize; gy++) {
        for (let gx = 0; gx < gridSize; gx++) {
          const px = gx * cs;
          const py = gy * cs;

          // Subtle checkerboard pattern
          ctx.fillStyle = (gx + gy) % 2 === 0 ? '#0b0f17' : '#080c12';
          ctx.fillRect(px, py, cs, cs);

          ctx.strokeStyle = '#141d2b';
          ctx.lineWidth = 1;
          ctx.strokeRect(px, py, cs, cs);
        }
      }

      // Draw Placed Discrete Elements
      const elements = gridCompiler.getAllElements();
      for (const elem of elements) {
        const px = elem.x * cs;
        const py = elem.y * cs;

        if (elem.type === 'WALL') {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(px + 1, py + 1, cs - 2, cs - 2);
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(px + 1, py + 1, cs - 2, cs - 2);
          // Stone masonry bevel
          ctx.strokeStyle = '#64748b';
          ctx.beginPath();
          ctx.moveTo(px + 3, py + cs - 3);
          ctx.lineTo(px + 3, py + 3);
          ctx.lineTo(px + cs - 3, py + 3);
          ctx.stroke();

          ctx.fillStyle = '#94a3b8';
          ctx.font = '8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('WALL', px + cs / 2, py + cs / 2 + 3);
        } else if (elem.type === 'DOOR') {
          ctx.fillStyle = '#083344';
          ctx.fillRect(px + 1, py + 1, cs - 2, cs - 2);
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(px + 1, py + 1, cs - 2, cs - 2);
          // Portal hatch line
          ctx.strokeStyle = '#22d3ee';
          ctx.beginPath();
          ctx.moveTo(px + cs / 2, py + 2);
          ctx.lineTo(px + cs / 2, py + cs - 2);
          ctx.stroke();

          ctx.fillStyle = '#67e8f9';
          ctx.font = '8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('DOOR', px + cs / 2, py + cs / 2 + 3);
        } else if (elem.type === 'CHEST') {
          ctx.fillStyle = '#451a03';
          ctx.fillRect(px + 1, py + 1, cs - 2, cs - 2);
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(px + 1, py + 1, cs - 2, cs - 2);
          // Gold lock gem
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(px + cs / 2, py + cs / 2, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fde68a';
          ctx.font = '7px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('CHEST', px + cs / 2, py + cs - 4);
        } else if (elem.type === 'DAEMON') {
          ctx.fillStyle = '#450a0a';
          ctx.fillRect(px + 1, py + 1, cs - 2, cs - 2);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(px + 1, py + 1, cs - 2, cs - 2);
          // Threat core
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.arc(px + cs / 2, py + cs / 2, 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fca5a5';
          ctx.font = '7px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('DEMON', px + cs / 2, py + cs - 4);
        } else if (elem.type === 'SPAWN') {
          ctx.fillStyle = '#172554';
          ctx.fillRect(px + 1, py + 1, cs - 2, cs - 2);
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.strokeRect(px + 1, py + 1, cs - 2, cs - 2);
          // Spawn beacon rings
          ctx.fillStyle = '#60a5fa';
          ctx.beginPath();
          ctx.arc(px + cs / 2, py + cs / 2, 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#bfdbfe';
          ctx.font = '7px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('SPAWN', px + cs / 2, py + cs - 4);
        } else if (elem.type === 'EXIT') {
          ctx.fillStyle = '#022c22';
          ctx.fillRect(px + 1, py + 1, cs - 2, cs - 2);
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 2;
          ctx.strokeRect(px + 1, py + 1, cs - 2, cs - 2);
          // Exit sanctum vortex
          ctx.fillStyle = '#34d399';
          ctx.beginPath();
          ctx.arc(px + cs / 2, py + cs / 2, 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#a7f3d0';
          ctx.font = '7px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('EXIT', px + cs / 2, py + cs - 4);
        }
      }

      // Mouse Hover Tile Preview
      if (mouseGridPos) {
        const hx = Math.floor((mouseGridPos.x / w) * gridSize);
        const hy = Math.floor((mouseGridPos.y / h) * gridSize);
        if (hx >= 0 && hx < gridSize && hy >= 0 && hy < gridSize) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.setLineDash([2, 2]);
          ctx.strokeRect(hx * cs + 2, hy * cs + 2, cs - 4, cs - 4);
          ctx.setLineDash([]);
          ctx.fillStyle = '#38bdf822';
          ctx.fillRect(hx * cs + 2, hy * cs + 2, cs - 4, cs - 4);
        }
      }

      // Discrete Matrix Overlay Header
      ctx.fillStyle = '#020617ee';
      ctx.fillRect(6, 6, 320, 24);
      ctx.strokeStyle = qbitReport?.isValid ? '#10b981' : '#ef4444';
      ctx.lineWidth = 1;
      ctx.strokeRect(6, 6, 320, 24);

      ctx.fillStyle = qbitReport?.isValid ? '#34d399' : '#f87171';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(
        qbitReport?.isValid
          ? 'BE <> REFEREE: CONTIGUOUS & CLIPPING-FREE (1 ≡ 1)'
          : 'BE <> REFEREE: SHEAR DETECTED - PATH BROKEN',
        12,
        22
      );

      return;
    }

    // Subtle coordinate grid lines
    ctx.strokeStyle = '#141b24';
    ctx.lineWidth = 1;
    const gridStep = 40;
    for (let x = 0; x <= w; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Origin crosshairs
    ctx.strokeStyle = '#222f3e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    // Draw Map Wall Geometry
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    for (const q of engine.map.quads) {
      const px0 = editor.sys_covalent_q16_to_pixel(q.v0.x, w);
      const py0 = editor.sys_covalent_q16_to_pixel(q.v0.y, h);
      const px1 = editor.sys_covalent_q16_to_pixel(q.v1.x, w);
      const py1 = editor.sys_covalent_q16_to_pixel(q.v1.y, h);
      ctx.beginPath();
      ctx.moveTo(px0, py0);
      ctx.lineTo(px1, py1);
      ctx.stroke();
    }

    // Draw Map Lights
    for (let i = 0; i < engine.map.lights.length; i++) {
      const l = engine.map.lights[i];
      const lx = editor.sys_covalent_q16_to_pixel(l.pos.x, w);
      const ly = editor.sys_covalent_q16_to_pixel(l.pos.y, h);
      const isSel = selectedEntity === `LIGHT_${i}`;

      ctx.fillStyle = isSel ? '#f59e0b' : '#ca8a04';
      ctx.beginPath();
      ctx.arc(lx, ly, isSel ? 7 : 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.stroke();
    }

    // Draw Entities (Imps, Zombiemen, Demons, Barrels)
    for (const ent of engine.entityManager.entities) {
      const ex = editor.sys_covalent_q16_to_pixel(ent.pos.x, w);
      const ey = editor.sys_covalent_q16_to_pixel(ent.pos.y, h);
      const isSel = selectedEntity === `ENTITY_${ent.id}`;

      ctx.fillStyle = ent.type === 'BARREL' ? '#10b981' : ent.type === 'DEMON' ? '#ef4444' : '#f97316';
      ctx.beginPath();
      ctx.arc(ex, ey, isSel ? 9 : 6, 0, Math.PI * 2);
      ctx.fill();
      if (isSel) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // Draw Human Marine (Player 1)
    const px = editor.sys_covalent_q16_to_pixel(engine.camPos.x, w);
    const py = editor.sys_covalent_q16_to_pixel(engine.camPos.y, h);
    const isPlayerSel = selectedEntity === 'PLAYER_1';

    ctx.fillStyle = isPlayerSel ? '#60a5fa' : '#3b82f6';
    ctx.beginPath();
    ctx.arc(px, py, isPlayerSel ? 10 : 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Player Direction Vector
    const pAngle = (engine.camYaw * Math.PI) / 32768;
    ctx.strokeStyle = '#60a5fa';
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + Math.cos(pAngle) * 20, py + Math.sin(pAngle) * 20);
    ctx.stroke();

    // Organelle 0xA7: 128-Unit Tactical Standoff Circle around Human Player 1
    // 128 units mapped into canvas pixel radius
    const standoffPx = (128 / 1800) * (w / 2);
    ctx.strokeStyle = '#38bdf855';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(px, py, Math.max(16, standoffPx), 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Be <> Sovereign Co-Player
    const bx = editor.sys_covalent_q16_to_pixel(engine.bePos.x, w);
    const by = editor.sys_covalent_q16_to_pixel(engine.bePos.y, h);
    const isBeSel = selectedEntity === 'BE_COPLAYER';

    ctx.fillStyle = isBeSel ? '#22d3ee' : '#06b6d4';
    ctx.beginPath();
    ctx.arc(bx, by, isBeSel ? 10 : 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a5f3fc';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Be Direction Vector
    const bAngle = (engine.beYaw * Math.PI) / 32768;
    ctx.strokeStyle = '#22d3ee';
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + Math.cos(bAngle) * 20, by + Math.sin(bAngle) * 20);
    ctx.stroke();

    // Organelle 0xA7: Autonomous Roaming Kinematics Traversal Aim Vector
    let nearestThreatEnt = null;
    let minTDist = Infinity;
    for (const ent of engine.entityManager.entities) {
      if (ent.health <= 0) continue;
      const edx = q16ToInt(engine.bePos.x) - q16ToInt(ent.pos.x);
      const edy = q16ToInt(engine.bePos.y) - q16ToInt(ent.pos.y);
      const edist = Math.hypot(edx, edy);
      if (edist < minTDist) {
        minTDist = edist;
        nearestThreatEnt = ent;
      }
    }
    const targetScreenX = nearestThreatEnt
      ? editor.sys_covalent_q16_to_pixel(nearestThreatEnt.pos.x, w)
      : px;
    const targetScreenY = nearestThreatEnt
      ? editor.sys_covalent_q16_to_pixel(nearestThreatEnt.pos.y, h)
      : py;

    ctx.strokeStyle = nearestThreatEnt ? '#ef444499' : '#38bdf866';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(targetScreenX, targetScreenY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Organelle 0xA6: Swarm Stamp Tool Hover Spiral Preview
    if (studioTool === 'SWARM_STAMP' && mouseGridPos) {
      ctx.strokeStyle = '#f59e0b';
      ctx.fillStyle = '#f59e0b33';
      for (let i = 0; i < stampCount; i++) {
        const ang = i * 0.85;
        const rad = 24 + i * 7;
        const spX = mouseGridPos.x + Math.cos(ang) * rad;
        const spY = mouseGridPos.y + Math.sin(ang) * rad;
        ctx.beginPath();
        ctx.arc(spX, spY, 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fill();
      }
    }

    // Selection Halo for active entity
    let selX = bx;
    let selY = by;
    if (selectedEntity === 'PLAYER_1') {
      selX = px; selY = py;
    } else if (selectedEntity.startsWith('LIGHT_')) {
      const idx = parseInt(selectedEntity.replace('LIGHT_', ''), 10);
      const l = engine.map.lights[idx];
      if (l) {
        selX = editor.sys_covalent_q16_to_pixel(l.pos.x, w);
        selY = editor.sys_covalent_q16_to_pixel(l.pos.y, h);
      }
    } else if (selectedEntity.startsWith('ENTITY_')) {
      const idNum = parseInt(selectedEntity.replace('ENTITY_', ''), 10);
      const ent = engine.entityManager.entities.find((e) => e.id === idNum);
      if (ent) {
        selX = editor.sys_covalent_q16_to_pixel(ent.pos.x, w);
        selY = editor.sys_covalent_q16_to_pixel(ent.pos.y, h);
      }
    }

    ctx.strokeStyle = isDragging ? '#f59e0b' : '#00f0ff';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(selX, selY, 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [engine, selectedEntity, isDragging, editor, studioTool, mouseGridPos, stampCount]);

  useEffect(() => {
    renderGrid();
  }, [renderGrid, properties]);

  // Periodic Telemetry Synchronization
  useEffect(() => {
    const timer = setInterval(() => {
      setSwarmTelemetry({ ...generativeGrid.telemetry });
      renderGrid();
    }, 200);
    return () => clearInterval(timer);
  }, [generativeGrid, renderGrid]);

  // Mouse kinetic drag & swarm stamping event listeners on 2D topological grid
  const handleGridMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = gridCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Organelle 0xA9 & 0xAA: Discrete Rigid Quadbit Compiler Tool
    if (studioTool === 'QBIT_COMPILER') {
      const w = canvas.width;
      const h = canvas.height;
      const gx = Math.floor((x / w) * 16);
      const gy = Math.floor((y / h) * 16);

      if (gx >= 0 && gx < 16 && gy >= 0 && gy < 16) {
        const existing = gridCompiler.getElement(gx, gy);
        if (existing && existing.type === qbitElement) {
          gridCompiler.removeElement(gx, gy);
        } else {
          gridCompiler.placeElement(gx, gy, qbitElement);
        }

        const report = gridCompiler.verifyTopology();
        setQbitReport(report);
        setMerkleHash(report.topologicalMerkleRoot);
        setQbitSaveStatus(null);
        renderGrid();
      }
      return;
    }

    // Organelle 0xA6: Swarm Stamp Tool
    if (studioTool === 'SWARM_STAMP') {
      generativeGrid.stampEnemySwarm(stampType, stampCount, x, y);
      setSwarmTelemetry({ ...generativeGrid.telemetry });
      setMerkleHash(generativeGrid.telemetry.quipuChecksum);
      renderGrid();
      onMapMutated?.();
      return;
    }

    // Check hit on entities or select closest
    const w = canvas.width;
    const h = canvas.height;

    // Test Player 1
    const px = editor.sys_covalent_q16_to_pixel(engine.camPos.x, w);
    const py = editor.sys_covalent_q16_to_pixel(engine.camPos.y, h);
    if (Math.hypot(x - px, y - py) < 18) {
      handleSelect('PLAYER_1');
      setIsDragging(true);
      editor.onGridDragStart(x, y);
      return;
    }

    // Test Be <> Co-Player
    const bx = editor.sys_covalent_q16_to_pixel(engine.bePos.x, w);
    const by = editor.sys_covalent_q16_to_pixel(engine.bePos.y, h);
    if (Math.hypot(x - bx, y - by) < 18) {
      handleSelect('BE_COPLAYER');
      setIsDragging(true);
      editor.onGridDragStart(x, y);
      return;
    }

    // Test Lights
    for (let i = 0; i < engine.map.lights.length; i++) {
      const l = engine.map.lights[i];
      const lx = editor.sys_covalent_q16_to_pixel(l.pos.x, w);
      const ly = editor.sys_covalent_q16_to_pixel(l.pos.y, h);
      if (Math.hypot(x - lx, y - ly) < 14) {
        handleSelect(`LIGHT_${i}`);
        setIsDragging(true);
        editor.onGridDragStart(x, y);
        return;
      }
    }

    // Test dynamic entities
    for (const ent of engine.entityManager.entities) {
      const ex = editor.sys_covalent_q16_to_pixel(ent.pos.x, w);
      const ey = editor.sys_covalent_q16_to_pixel(ent.pos.y, h);
      if (Math.hypot(x - ex, y - ey) < 14) {
        handleSelect(`ENTITY_${ent.id}`);
        setIsDragging(true);
        editor.onGridDragStart(x, y);
        return;
      }
    }

    // Default drag active selection directly to click location
    setIsDragging(true);
    editor.onGridDrag(x, y);
    setProperties(editor.exposeAssetProperties(selectedEntity));
    renderGrid();
  };

  const handleGridMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = gridCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMouseGridPos({ x, y });

    if (studioTool === 'SWARM_STAMP' || studioTool === 'QBIT_COMPILER') {
      renderGrid();
      return;
    }

    if (!isDragging) return;

    // Continuous non-destructive spatial mutation in C-Kernel
    editor.onGridDrag(x, y);
    setProperties(editor.exposeAssetProperties(selectedEntity));
    renderGrid();
  };

  const handleGridMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      editor.onGridDragEnd();
      setMerkleHash(editor.lastMerkleRoot);
      setProperties(editor.exposeAssetProperties(selectedEntity));
      onMapMutated?.();
    }
  };

  // Property Slider handlers
  const handleZChange = (val: number) => {
    editor.updateZ(selectedEntity, 'min', val);
    setProperties(editor.exposeAssetProperties(selectedEntity));
    renderGrid();
  };

  const handleMassChange = (val: number) => {
    editor.updateMass(selectedEntity, val);
    setProperties(editor.exposeAssetProperties(selectedEntity));
  };

  const handleRadiusChange = (val: number) => {
    editor.updateAABB(selectedEntity, val);
    setProperties(editor.exposeAssetProperties(selectedEntity));
    renderGrid();
  };

  const handleEmissiveChange = (val: number) => {
    editor.updateEmissive(selectedEntity, val);
    setProperties(editor.exposeAssetProperties(selectedEntity));
  };

  return (
    <section
      id="tri-shard-studio"
      className="bg-stone-900/90 border border-stone-800 rounded-xl p-4 md:p-5 flex flex-col gap-4 font-mono shadow-2xl relative overflow-hidden"
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-950 border border-cyan-700/60 flex items-center justify-center text-cyan-400 shadow-inner">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm md:text-base font-black tracking-wider text-stone-100 uppercase">
                ORGANELLE 0xA4, 0xA5, 0xA6 &amp; 0xA7 // WYSIWYG &amp; SWARM MULTIPLEX
              </h2>
              <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded font-bold">
                TRI-SHARD MULTIPLEX
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Simultaneous Design, Preview &amp; Execution &bull; Swarm Spiral Stamping &bull; Procedural Maze Synthesis &bull; Autonomous Roaming Kinematics
            </p>
          </div>
        </div>

        {/* Multiplex Status Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-2 py-1 bg-stone-950 border border-stone-800 rounded text-stone-300 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>/dev/fb [3 SHARDS]</span>
          </div>
          <div className="px-2 py-1 bg-stone-950 border border-amber-900/60 rounded text-amber-300 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>MASS: {swarmTelemetry.totalThermodynamicMass.toLocaleString()} &mu;</span>
          </div>
          <div className="px-2 py-1 bg-stone-950 border border-stone-800 rounded text-stone-300 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>MERKLE: 0x{merkleHash.toString(16).toUpperCase()}</span>
          </div>
          <div className="px-2 py-1 bg-cyan-950/60 border border-cyan-800/80 rounded text-cyan-300 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span>ROAM: {swarmTelemetry.roamingState}</span>
          </div>
        </div>
      </div>

      {/* Shard Filter / Focus Selector */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-2">
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setActiveShard('ALL')}
            className={`px-2.5 py-1 rounded font-bold transition-all ${
              activeShard === 'ALL' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            TRIPTYCH SPLIT (3-SHARD)
          </button>
          <button
            onClick={() => setActiveShard('DESIGN_STUDIO')}
            className={`px-2.5 py-1 rounded font-bold transition-all ${
              activeShard === 'DESIGN_STUDIO' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            TOPOLOGICAL GRID (XY DESIGN)
          </button>
          <button
            onClick={() => setActiveShard('ASSET_PREVIEW')}
            className={`px-2.5 py-1 rounded font-bold transition-all ${
              activeShard === 'ASSET_PREVIEW' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            OCTREE VOXEL TURNTABLE (PREVIEW)
          </button>
          <button
            onClick={() => setActiveShard('FS_GAME')}
            className={`px-2.5 py-1 rounded font-bold transition-all ${
              activeShard === 'FS_GAME' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            LIVE MANIFOLD (FS GAME)
          </button>
        </div>

        {/* Selected Node Pill */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-stone-500 text-[11px]">ACTIVE NODE:</span>
          <span className="px-2 py-0.5 bg-stone-950 border border-stone-700 text-amber-300 rounded font-bold">
            {selectedEntity}
          </span>
          {isDragging && (
            <span className="text-[10px] px-1.5 py-0.5 bg-amber-950 text-amber-300 border border-amber-700 rounded animate-pulse">
              MUTATING BVH...
            </span>
          )}
        </div>
      </div>

      {/* Main Tri-Shard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* SHARD 1: Topological Grid (Design) 2D Orthographic Map */}
        {(activeShard === 'ALL' || activeShard === 'DESIGN_STUDIO') && (
          <div
            className={`${
              activeShard === 'ALL' ? 'lg:col-span-6' : 'lg:col-span-8'
            } bg-stone-950 p-3 rounded-lg border border-stone-800 flex flex-col gap-2.5`}
          >
            <div className="flex items-center justify-between text-xs border-b border-stone-800 pb-1.5">
              <span className="font-bold text-stone-200 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                TOPOLOGICAL GRID // 2D ORTHOGRAPHIC XY MAP
              </span>
              <span className="text-[10px] text-stone-500">
                [20, 20, 800, 800] &bull; Q16.16 Quantized
              </span>
            </div>

            {/* Organelle 0xA6 Tool Selection Bar */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-stone-900 rounded border border-stone-800 text-xs">
              <span className="text-[10px] text-stone-400 font-bold px-1 uppercase">Tool:</span>
              <button
                onClick={() => setStudioTool('DRAG_TRANSFORM')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition-all ${
                  studioTool === 'DRAG_TRANSFORM'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-600'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Move className="w-3 h-3" /> Kinetic Drag
              </button>
              <button
                onClick={() => setStudioTool('SWARM_STAMP')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition-all ${
                  studioTool === 'SWARM_STAMP'
                    ? 'bg-amber-950 text-amber-300 border border-amber-600'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Crosshair className="w-3 h-3" /> Swarm Stamp (0xA6)
              </button>
              <button
                onClick={() => setStudioTool('TOPOLOGY_MAZE')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition-all ${
                  studioTool === 'TOPOLOGY_MAZE'
                    ? 'bg-purple-950 text-purple-300 border border-purple-600'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Grid className="w-3 h-3" /> Maze Synthesis (0xA6)
              </button>
              <button
                onClick={() => {
                  setStudioTool('QBIT_COMPILER');
                  const report = gridCompiler.verifyTopology();
                  setQbitReport(report);
                  setMerkleHash(report.topologicalMerkleRoot);
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition-all ${
                  studioTool === 'QBIT_COMPILER'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500 shadow'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Shield className="w-3 h-3 text-emerald-400" /> .qbit Compiler &amp; Be &lt;&gt; (0xA9/0xAA)
              </button>
            </div>

            {/* Sub-tool panels */}
            {studioTool === 'SWARM_STAMP' && (
              <div className="p-2 bg-amber-950/20 border border-amber-800/40 rounded flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-amber-300 font-bold">TYPE:</span>
                  {(['IMP', 'DEMON', 'ZOMBIEMAN', 'BARREL'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setStampType(t)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        stampType === t
                          ? 'bg-amber-500 text-stone-950'
                          : 'bg-stone-900 text-stone-300 hover:bg-stone-800'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-amber-300 font-bold">COUNT:</span>
                  {([1, 4, 8, 16] as const).map((n) => (
                    <button
                      key={n}
                      onClick={() => setStampCount(n)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        stampCount === n
                          ? 'bg-amber-500 text-stone-950'
                          : 'bg-stone-900 text-stone-300 hover:bg-stone-800'
                      }`}
                    >
                      x{n}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-stone-400">
                  Click grid to stamp {stampCount}x {stampType} with spiral offsets
                </span>
              </div>
            )}

            {studioTool === 'TOPOLOGY_MAZE' && (
              <div className="p-2 bg-purple-950/20 border border-purple-800/40 rounded flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-purple-300 font-bold">ROOMS: {roomCount}</span>
                  <input
                    type="range"
                    min={2}
                    max={10}
                    value={roomCount}
                    onChange={(e) => setRoomCount(parseInt(e.target.value, 10))}
                    className="w-16 accent-purple-500 h-1 bg-stone-800 rounded cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-purple-300 font-bold">COMPLEXITY: {complexity}</span>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={complexity}
                    onChange={(e) => setComplexity(parseInt(e.target.value, 10))}
                    className="w-16 accent-purple-500 h-1 bg-stone-800 rounded cursor-pointer"
                  />
                </div>
                <button
                  onClick={() => {
                    generativeGrid.generateProceduralLayout(roomCount, complexity);
                    setSwarmTelemetry({ ...generativeGrid.telemetry });
                    setMerkleHash(generativeGrid.telemetry.quipuChecksum);
                    renderGrid();
                    onMapMutated?.();
                  }}
                  className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold text-[11px] flex items-center gap-1 shadow transition-all"
                >
                  <Sparkles className="w-3 h-3" /> Synthesize Sectors
                </button>
              </div>
            )}

            {/* Organelle 0xA9 & 0xAA: Rigid .qbit Compiler & Be <> Topological Referee */}
            {studioTool === 'QBIT_COMPILER' && (
              <div className="p-3 bg-stone-900/90 border border-emerald-900/40 rounded-lg flex flex-col gap-2.5 text-xs shadow-inner">
                {/* Element Palette & Compiler Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-stone-400 font-bold uppercase">Element:</span>
                    {(['WALL', 'DOOR', 'CHEST', 'DAEMON', 'SPAWN', 'EXIT'] as const).map((elem) => (
                      <button
                        key={elem}
                        onClick={() => setQbitElement(elem)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all flex items-center gap-1 ${
                          qbitElement === elem
                            ? 'bg-emerald-500 text-stone-950 font-black shadow'
                            : 'bg-stone-950 text-stone-300 border border-stone-800 hover:bg-stone-800'
                        }`}
                      >
                        {elem === 'WALL' && <Box className="w-3 h-3 text-stone-400" />}
                        {elem === 'DOOR' && <Layers className="w-3 h-3 text-cyan-400" />}
                        {elem === 'CHEST' && <Sparkles className="w-3 h-3 text-amber-400" />}
                        {elem === 'DAEMON' && <Flame className="w-3 h-3 text-red-400" />}
                        {elem === 'SPAWN' && <Crosshair className="w-3 h-3 text-blue-400" />}
                        {elem === 'EXIT' && <Check className="w-3 h-3 text-emerald-400" />}
                        <span>{elem}</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => {
                        gridCompiler.seedDefaultPlayableLayout();
                        const report = gridCompiler.verifyTopology();
                        setQbitReport(report);
                        setMerkleHash(report.topologicalMerkleRoot);
                        setQbitSaveStatus('Reset to verified contiguous seed');
                        renderGrid();
                      }}
                      className="px-2 py-1 bg-stone-950 hover:bg-stone-800 border border-stone-800 rounded text-[10px] text-stone-300 font-bold flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>

                    <button
                      onClick={() => {
                        const compiledMap = gridCompiler.compileToRTMap('QBIT_ACTIVE_LEVEL');
                        engine.setMap(compiledMap);
                        onMapMutated?.();
                        setQbitSaveStatus('Live ray-tracer updated with compiled map!');
                      }}
                      className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-stone-950 rounded font-bold text-[10px] flex items-center gap-1 shadow"
                    >
                      <Zap className="w-3 h-3" />
                      <span>Test in Engine</span>
                    </button>

                    <button
                      onClick={async () => {
                        setIsCompilingQbit(true);
                        const archive = await gridCompiler.saveContiguousLevel();
                        setIsCompilingQbit(false);
                        if (!archive) {
                          setQbitSaveStatus('REJECTED: Be <> detected topological shear or clipping faults.');
                          return;
                        }
                        const blob = new Blob([archive], { type: 'application/octet-stream' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `level_topologically_proven_0x${qbitReport.topologicalMerkleRoot.toString(16)}.qbit`;
                        a.click();
                        URL.revokeObjectURL(url);
                        setQbitSaveStatus(`SEALED: .qbit binary exported (${archive.byteLength} B). Merkle: 0x${qbitReport.topologicalMerkleRoot.toString(16).toUpperCase()}`);
                      }}
                      disabled={isCompilingQbit || !qbitReport?.isValid}
                      className={`px-2.5 py-1 rounded font-bold text-[10px] flex items-center gap-1 shadow transition-all ${
                        qbitReport?.isValid
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-stone-950 cursor-pointer'
                          : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                      }`}
                    >
                      <Shield className="w-3 h-3" />
                      <span>{isCompilingQbit ? 'Verifying...' : 'Seal & Save .qbit'}</span>
                    </button>
                  </div>
                </div>

                {/* Be <> Topological Referee Proof Status Card */}
                <div
                  className={`p-2 rounded border flex flex-col gap-1 transition-colors ${
                    qbitReport?.isValid
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-red-950/20 border-red-500/40 text-red-300'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {qbitReport?.isValid ? (
                        <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <Flame className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      )}
                      <span className="font-bold text-[11px] uppercase tracking-wide">
                        {qbitReport?.isValid
                          ? 'Be <> Topological Referee: Proven Contiguous (1 ≡ 1)'
                          : 'Be <> Topological Referee: Shear Detected (Compilation Blocked)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[10px] font-mono">
                      <span>Clearance: <strong>{qbitReport?.minClearanceUnits} u</strong></span>
                      <span>Reachable: <strong>{qbitReport?.reachableNodes} / {qbitReport?.totalNodes}</strong></span>
                      <span>Merkle: <strong>0x{qbitReport?.topologicalMerkleRoot.toString(16).toUpperCase()}</strong></span>
                    </div>
                  </div>

                  {qbitReport && qbitReport.shearFaults.length > 0 && (
                    <div className="bg-stone-950/80 p-1.5 rounded border border-red-900/40 text-[10px] text-red-400 flex flex-col gap-0.5 mt-0.5">
                      <div className="font-bold text-stone-300">Shear Invariant Faults:</div>
                      {qbitReport.shearFaults.map((fault, idx) => (
                        <div key={idx} className="flex items-start gap-1">
                          <span className="text-red-500">&bull;</span>
                          <span>{fault}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {qbitSaveStatus && (
                    <div className="text-[10px] font-bold text-cyan-300 mt-0.5">
                      {qbitSaveStatus}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="relative w-full aspect-square max-h-[380px] bg-stone-950 rounded border border-stone-800 overflow-hidden flex items-center justify-center">
              <canvas
                ref={gridCanvasRef}
                width={500}
                height={500}
                onMouseDown={handleGridMouseDown}
                onMouseMove={handleGridMouseMove}
                onMouseUp={handleGridMouseUp}
                onMouseLeave={handleGridMouseUp}
                className="w-full h-full object-contain cursor-crosshair"
              />
              <div className="absolute bottom-2 left-2 text-[10px] text-stone-500 bg-stone-900/80 px-2 py-0.5 rounded border border-stone-800 pointer-events-none">
                {studioTool === 'QBIT_COMPILER'
                  ? '[0xA9 RIGID .QBIT MATRIX] Click cells to toggle/place elements • Continuous AABB & path verification active'
                  : studioTool === 'SWARM_STAMP'
                  ? `[SWARM STAMP ACTIVE] Click to stamp ${stampCount}x ${stampType}`
                  : 'Click/drag entities: Player, Be <>, Enemies, Lights (128-unit standoff circle)'}
              </div>
            </div>

            {/* Organelle 0xA7 Autonomous Roaming Kinematics Telemetry Strip */}
            <div className="p-2 bg-cyan-950/20 border border-cyan-800/40 rounded flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-bold text-cyan-300 text-[11px]">0xA7 ROAMING KINEMATICS:</span>
                <span className="px-1.5 py-0.5 bg-stone-900 border border-cyan-800/60 rounded text-[10px] text-cyan-200 font-bold">
                  {swarmTelemetry.roamingState}
                </span>
                <span className="text-[10px] text-stone-400">
                  Target: <strong className="text-stone-200">{swarmTelemetry.targetThreatType || 'HUMAN_PLAYER_1'}</strong> &bull; Dist: <strong className="text-stone-200">{Math.round(swarmTelemetry.distanceToThreat)}u</strong> (Standoff: 128u)
                </span>
              </div>
              <button
                onClick={() => {
                  generativeGrid.tickAutonomousRoamingPeer();
                  setSwarmTelemetry({ ...generativeGrid.telemetry });
                  renderGrid();
                }}
                className="px-2 py-0.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 rounded text-[10px] font-bold flex items-center gap-1 transition-all"
              >
                <RefreshCw className="w-2.5 h-2.5" /> Tick Peer AI
              </button>
            </div>

            {/* Quick Entity Picker Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-stone-500 font-bold uppercase">Select:</span>
              <button
                onClick={() => handleSelect('BE_COPLAYER')}
                className={`text-[10px] px-2 py-0.5 rounded border font-bold transition-all ${
                  selectedEntity === 'BE_COPLAYER'
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-600'
                    : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
                }`}
              >
                Be &lt;&gt; Co-Player
              </button>
              <button
                onClick={() => handleSelect('PLAYER_1')}
                className={`text-[10px] px-2 py-0.5 rounded border font-bold transition-all ${
                  selectedEntity === 'PLAYER_1'
                    ? 'bg-blue-950 text-blue-300 border-blue-600'
                    : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
                }`}
              >
                Human (Player 1)
              </button>
              {engine.map.lights.slice(0, 3).map((_, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(`LIGHT_${i}`)}
                  className={`text-[10px] px-2 py-0.5 rounded border font-bold transition-all ${
                    selectedEntity === `LIGHT_${i}`
                      ? 'bg-amber-950 text-amber-300 border-amber-600'
                      : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
                  }`}
                >
                  Light #{i}
                </button>
              ))}
              {engine.entityManager.entities.slice(0, 3).map((e) => (
                <button
                  key={e.id}
                  onClick={() => handleSelect(`ENTITY_${e.id}`)}
                  className={`text-[10px] px-2 py-0.5 rounded border font-bold transition-all ${
                    selectedEntity === `ENTITY_${e.id}`
                      ? 'bg-red-950 text-red-300 border-red-600'
                      : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
                  }`}
                >
                  {e.type} #{e.id}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SHARD 2: Isolate Sieve (Preview) Octree Voxel Turntable */}
        {(activeShard === 'ALL' || activeShard === 'ASSET_PREVIEW') && (
          <div
            className={`${
              activeShard === 'ALL' ? 'lg:col-span-6' : 'lg:col-span-6'
            } bg-stone-950 p-3 rounded-lg border border-stone-800 flex flex-col gap-2.5`}
          >
            <div className="flex items-center justify-between text-xs border-b border-stone-800 pb-1.5">
              <span className="font-bold text-stone-200 flex items-center gap-1.5">
                <Box className="w-3.5 h-3.5 text-amber-400" />
                ISOLATE SIEVE // OCTREE VOXEL TURNTABLE
              </span>
              <span className="text-[10px] text-stone-500">
                [1420, 20, 480, 480] &bull; PBR Micro-Surface
              </span>
            </div>

            <div className="relative w-full aspect-square max-h-[260px] bg-[#0a0d12] rounded border border-stone-800 overflow-hidden flex items-center justify-center">
              <canvas
                ref={turntableCanvasRef}
                width={360}
                height={260}
                className="w-full h-full object-contain"
              />
              <div className="absolute top-2 right-2 flex items-center gap-1.5">
                <button
                  onClick={() => editor.toggleTurntableAutoRotate()}
                  className="px-2 py-0.5 bg-stone-900/80 hover:bg-stone-800 border border-stone-700 text-stone-300 rounded text-[10px] font-bold"
                >
                  {editor.turntable.isAutoRotating ? 'PAUSE ROTATE' : 'RESUME ROTATE'}
                </button>
              </div>
            </div>

            {/* Turntable Controls */}
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <button
                onClick={() => editor.setTurntableRenderMode('PBR_VOXEL')}
                className={`py-1 px-2 rounded border font-bold text-center ${
                  editor.turntable.renderMode === 'PBR_VOXEL'
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                    : 'bg-stone-900 text-stone-400 border-stone-800'
                }`}
              >
                PBR VOXELS
              </button>
              <button
                onClick={() => editor.setTurntableRenderMode('WIREFRAME_OCTREE')}
                className={`py-1 px-2 rounded border font-bold text-center ${
                  editor.turntable.renderMode === 'WIREFRAME_OCTREE'
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                    : 'bg-stone-900 text-stone-400 border-stone-800'
                }`}
              >
                OCTREE BVH
              </button>
              <button
                onClick={() => editor.setTurntableRenderMode('NORMAL_SURFACE')}
                className={`py-1 px-2 rounded border font-bold text-center ${
                  editor.turntable.renderMode === 'NORMAL_SURFACE'
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                    : 'bg-stone-900 text-stone-400 border-stone-800'
                }`}
              >
                NORMALS
              </button>
            </div>

            {/* Voxel Layer Slice Depth Slider */}
            <div className="flex flex-col gap-1 text-[11px]">
              <div className="flex justify-between text-stone-400">
                <span>Voxel Depth Slice (Micro-Surface):</span>
                <span className="text-cyan-300 font-bold">{editor.turntable.voxelLayerSlice} / 32</span>
              </div>
              <input
                type="range"
                min="1"
                max="32"
                value={editor.turntable.voxelLayerSlice}
                onChange={(e) => editor.setVoxelLayerSlice(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-500 h-1 bg-stone-800 rounded"
              />
            </div>
          </div>
        )}

        {/* SHARD 3 / Properties: Absolute Engine Constraint Sliders */}
        <div className="lg:col-span-12 bg-stone-950 p-4 rounded-lg border border-stone-800 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs border-b border-stone-800 pb-2">
            <span className="font-bold text-stone-200 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              EXPOSE ASSET PROPERTIES &amp; ENGINE CONSTRAINTS // {selectedEntity}
            </span>
            <span className="text-[10px] text-stone-400">
              Coordinates: [{q16ToInt(properties.posX)}, {q16ToInt(properties.posY)}] Q16.16
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            {/* Slider 1: Z-Height (Floor) */}
            <div className="bg-stone-900/80 p-2.5 rounded border border-stone-800 flex flex-col gap-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-stone-400">Z-Height (Floor):</span>
                <span className="text-cyan-300 font-bold">{q16ToInt(properties.min_z)} Units</span>
              </div>
              <input
                type="range"
                min="0"
                max="128"
                value={q16ToInt(properties.min_z)}
                onChange={(e) => handleZChange(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-500 h-1 bg-stone-800 rounded"
              />
              <span className="text-[10px] text-stone-500">Vertical bounding floor plane</span>
            </div>

            {/* Slider 2: Thermodynamic Mass */}
            <div className="bg-stone-900/80 p-2.5 rounded border border-stone-800 flex flex-col gap-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-stone-400">Thermodynamic Mass:</span>
                <span className="text-amber-300 font-bold">{properties.friction_cost} μ</span>
              </div>
              <input
                type="range"
                min="10000"
                max="80000"
                step="2000"
                value={properties.friction_cost}
                onChange={(e) => handleMassChange(parseInt(e.target.value, 10))}
                className="w-full accent-amber-500 h-1 bg-stone-800 rounded"
              />
              <span className="text-[10px] text-stone-500">Friction cost for physics engine</span>
            </div>

            {/* Slider 3: Bounding Radius */}
            <div className="bg-stone-900/80 p-2.5 rounded border border-stone-800 flex flex-col gap-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-stone-400">Bounding Radius:</span>
                <span className="text-emerald-300 font-bold">{q16ToInt(properties.radius)} R</span>
              </div>
              <input
                type="range"
                min="8"
                max="64"
                value={q16ToInt(properties.radius)}
                onChange={(e) => handleRadiusChange(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500 h-1 bg-stone-800 rounded"
              />
              <span className="text-[10px] text-stone-500">AABB cylinder collision envelope</span>
            </div>

            {/* Slider 4: Emissive Flux / Luminance */}
            <div className="bg-stone-900/80 p-2.5 rounded border border-stone-800 flex flex-col gap-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-stone-400">Emissive Flux:</span>
                <span className="text-cyan-300 font-bold">{q16ToInt(properties.emissive_flux)} Lumens</span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                value={q16ToInt(properties.emissive_flux)}
                onChange={(e) => handleEmissiveChange(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-500 h-1 bg-stone-800 rounded"
              />
              <span className="text-[10px] text-stone-500">PBR ray-cast radiative power</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
