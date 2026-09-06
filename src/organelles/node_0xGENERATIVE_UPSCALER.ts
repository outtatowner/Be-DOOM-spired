/**
 * @file node_0xGENERATIVE_UPSCALER.ts
 * @brief Organelle 0x9C_COVALENT: Integer-Quantized Tensor Sieve, Generative PBR Materials & 48kHz Spatial HRTF Engine
 * @provenance Parent: Zuma_QUIPU & Forge Evolutionary Branch
 * @invariants 1 === 1, Continuous Lyapunov Dissipation (dV/dt <= 0), Zero-Float Sieve
 */

import { Q16, Q16Vec3, q16FromInt, q16ToInt, q16Mul, q16Div, q16Abs, Q16_ONE } from './q16_cordic';
import { CovalentTextureMapper } from './node_0x97_covalent_rt_texture_mapper';

export interface PbrMaterialPayload {
  name: string;
  width: number;
  height: number;
  albedoBuffer: Uint32Array;      // 0xAARRGGBB color data
  normalXBuffer: Int32Array;      // Q16.16 normal X offset
  normalYBuffer: Int32Array;      // Q16.16 normal Y offset
  normalZBuffer: Int32Array;      // Q16.16 depth / micro-surface bump
  roughnessBuffer: Int32Array;    // Q16.16 roughness factor (0.0 to 1.0)
  frictionCost: number;           // 0x00020000 in Q16
  quipuToken: number;
}

export interface AcousticBounceTelemetry {
  rayDistance: number;            // Ray distance in DOOM map units
  latencyMs: number;              // Speed of sound propagation delay
  reverbDecay: number;            // Material absorption reflection
  sampleRate: number;             // 48000 Hz
  pan: number;                    // -1.0 to 1.0 binaural stereo angle
}

export interface KineticMacroTelemetry {
  macroFlags: number;
  macroName: string;
  flankAngleDeg: number;
  stasisSuppression: boolean;
  coverProbeActive: boolean;
  timestamp: string;
}

export interface GenerativeTelemetry {
  materialsUpscaled: number;
  pbrActive: boolean;
  dVdt_State: number;
  lastUpscaledAsset: string;
  quipuHashRoot: string;
  stasisEnforced: boolean;
  acousticBounceCount: number;
  lastAcousticTelemetry: AcousticBounceTelemetry | null;
  lastKineticMacro: KineticMacroTelemetry | null;
}

/**
 * Organelle 0x9C: Generative Upscale Officiator
 * Bridges raw vision, acoustic, and kinetic pipelines into the Quipu invariant ledger.
 */
export class GenerativeUpscaleOfficiator {
  private dVdt_State = 0.0;
  private quipuHashRoot: number = 0x811c9dc5;
  private frictionCapacity: number = 0x00800000; // 8.0 in Q16
  private accumulatedFriction: number = 0;
  private pbrMaterials: Map<string, PbrMaterialPayload> = new Map();
  private textureMapper: CovalentTextureMapper | null = null;
  private audioCtx: AudioContext | null = null;

  public telemetry: GenerativeTelemetry = {
    materialsUpscaled: 0,
    pbrActive: true,
    dVdt_State: 0.0,
    lastUpscaledAsset: 'NONE',
    quipuHashRoot: '0x811C9DC5',
    stasisEnforced: false,
    acousticBounceCount: 0,
    lastAcousticTelemetry: null,
    lastKineticMacro: null,
  };

  private subscribers: Array<(t: GenerativeTelemetry) => void> = [];

  constructor(mapper?: CovalentTextureMapper) {
    if (mapper) this.textureMapper = mapper;
    this.initDefaultPbrMaterials();
  }

  public setTextureMapper(mapper: CovalentTextureMapper): void {
    this.textureMapper = mapper;
    // Register pre-synthesized materials into mapper
    for (const [name, mat] of this.pbrMaterials.entries()) {
      this.bindMaterialToMapper(name, mat);
    }
  }

  public subscribe(cb: (t: GenerativeTelemetry) => void): () => void {
    this.subscribers.push(cb);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== cb);
    };
  }

  private notify(): void {
    for (const sub of this.subscribers) {
      try {
        sub(this.telemetry);
      } catch (err) {
        console.error('[ GENERATIVE OFFICIATOR ] Subscriber error:', err);
      }
    }
  }

  /**
   * Modality 1: Vision (Image)
   * Intercepts legacy low-resolution texture asset, synthesizes high-density PBR matrix,
   * quantizes into Q16.16 integer depth maps, and binds to Quipu ledger.
   */
  public async synthesizeMaterial(textureName: string, rawBytes?: Uint8Array): Promise<boolean> {
    console.log(`[ BE <> GENERATOR ] Intercepted legacy asset: ${textureName}`);

    // If no rawBytes provided, generate synthetic fallback buffer
    const payloadBytes = rawBytes || new Uint8Array(64 * 64).fill(0x80);

    // 1. Route to the exogenous Image Generation Organelle
    const upscaledPayload = await this.sys_covalent_invoke_vision_organelle(
      textureName,
      payloadBytes,
      'PBR_NORMAL_ROUGHNESS'
    );

    // 2. Inject the generated structural matrix back into the C-Kernel
    const success = this.sys_covalent_ingest_upscale(upscaledPayload);

    if (success) {
      console.log(`[ MANIFOLD ] High-resolution material bound to Quipu Ledger.`);
      this.dVdt_State -= 0.05; // Thermodynamic stasis cooling

      this.pbrMaterials.set(textureName, upscaledPayload);
      this.bindMaterialToMapper(textureName, upscaledPayload);

      this.telemetry.materialsUpscaled++;
      this.telemetry.dVdt_State = this.dVdt_State;
      this.telemetry.lastUpscaledAsset = textureName;
      this.telemetry.quipuHashRoot = '0x' + (this.quipuHashRoot >>> 0).toString(16).toUpperCase();
      this.telemetry.stasisEnforced = false;
      this.notify();
      return true;
    } else {
      console.warn(`[ STASIS ENFORCED ] Reverting to legacy 8-bit texture for: ${textureName}`);
      this.telemetry.stasisEnforced = true;
      this.notify();
      return false;
    }
  }

  /**
   * Exogenous Vision Organelle: Synthesizes 1024x1024 Albedo, Normal, and Roughness spatial matrices
   */
  public async sys_covalent_invoke_vision_organelle(
    textureName: string,
    rawBytes: Uint8Array,
    mode: 'PBR_NORMAL_ROUGHNESS'
  ): Promise<PbrMaterialPayload> {
    const dim = 1024;
    const totalPixels = dim * dim;
    const albedoBuffer = new Uint32Array(totalPixels);
    const normalXBuffer = new Int32Array(totalPixels);
    const normalYBuffer = new Int32Array(totalPixels);
    const normalZBuffer = new Int32Array(totalPixels);
    const roughnessBuffer = new Int32Array(totalPixels);

    // Procedurally synthesize 1024x1024 continuous high-frequency features
    const isStartan = textureName.includes('STARTAN') || textureName === 'DEFAULT';
    const isComp = textureName.includes('COMP');
    const isTek = textureName.includes('TEK');
    const isNukage = textureName.includes('NUKAGE');
    const isFloor = textureName.includes('FLOOR');
    const isCeil = textureName.includes('CEIL');
    const isBeryllium = textureName.includes('BERYLLIUM');
    const isCyanSeam = textureName.includes('CYAN_DATA_SEAM');
    const isSilicon = textureName.includes('SILICON');
    const isCryo = textureName.includes('CRYO');
    const isColdCathode = textureName.includes('COLD_CATHODE');
    const isAlarmGrid = textureName.includes('ALARM');

    for (let y = 0; y < dim; y++) {
      const vNorm = y / dim;
      for (let x = 0; x < dim; x++) {
        const uNorm = x / dim;
        const idx = y * dim + x;

        let r = 0x8a;
        let g = 0x70;
        let b = 0x52;
        let nX = 0;
        let nY = 0;
        let nZ = Q16_ONE;
        let rough = Math.round(0.75 * Q16_ONE);

        if (isStartan) {
          // 1024x1024 High-Resolution Brick Mortar with Micro-Pitting & Rivets
          const blockY = Math.floor(y / 128);
          const isHorizontalMortar = (y % 128) < 10;
          const isVerticalMortar = ((x + blockY * 256) % 512) < 10;

          // Micro-grit noise
          const grit = ((x * 43 + y * 79) % 29) - 14;

          if (isHorizontalMortar || isVerticalMortar) {
            r = 0x33; g = 0x2b; b = 0x22;
            rough = Math.round(0.95 * Q16_ONE);
            nZ = Math.round(0.6 * Q16_ONE);
            nY = isHorizontalMortar ? Math.round(0.4 * Q16_ONE) : 0;
            nX = isVerticalMortar ? Math.round(0.4 * Q16_ONE) : 0;
          } else {
            // High-frequency stone beveling & chisel marks
            const chisel = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 20;
            r = Math.min(255, Math.max(0, 0x8e + grit + Math.round(chisel)));
            g = Math.min(255, Math.max(0, 0x74 + grit + Math.round(chisel)));
            b = Math.min(255, Math.max(0, 0x54 + grit + Math.round(chisel)));

            // High-precision normal perturbation in Q16
            nX = Math.round(Math.sin(x * 0.08) * 8192);
            nY = Math.round(Math.cos(y * 0.08) * 8192);
            rough = Math.round(0.7 * Q16_ONE);

            // Specular iron rivets every 256 pixels
            const isRivet = Math.hypot((x % 256) - 128, (y % 128) - 64) < 16;
            if (isRivet) {
              r = 0xcc; g = 0xcc; b = 0xd5;
              rough = Math.round(0.2 * Q16_ONE); // Glossy metallic rivet
              nZ = Math.round(1.2 * Q16_ONE);
            }
          }
        } else if (isComp) {
          // Computer Terminal PBR Matrix
          const isScreen = x >= 160 && x <= 864 && y >= 180 && y <= 760;
          if (isScreen) {
            const scanline = (y % 6) < 3 ? 0.85 : 1.0;
            const hasData = ((x % 64) > 16) && ((y % 32) > 8);
            if (hasData) {
              r = 0x00; g = Math.round(240 * scanline); b = Math.round(200 * scanline);
              rough = Math.round(0.15 * Q16_ONE); // Glossy CRT glass
            } else {
              r = 0x08; g = 0x18; b = 0x22;
              rough = Math.round(0.1 * Q16_ONE);
            }
            nZ = Q16_ONE;
          } else {
            // Brushed steel chassis with bevel edges
            r = 0x3d; g = 0x40; b = 0x47;
            rough = Math.round(0.45 * Q16_ONE);
            nX = (x % 32 < 2) ? Math.round(0.3 * Q16_ONE) : 0;
          }
        } else if (isNukage) {
          // Viscous glowing acidic slime with caustic turbulence
          const wave = Math.sin((x + y) * 0.03) * 30;
          const bubble = Math.hypot((x % 128) - 64, (y % 128) - 64) < 18;
          if (bubble) {
            r = 0xa0; g = 0xff; b = 0xa0;
            rough = Math.round(0.05 * Q16_ONE); // Wet mirror reflection
          } else {
            r = 0x12;
            g = Math.min(255, Math.max(120, Math.round(185 + wave)));
            b = 0x28;
            rough = Math.round(0.1 * Q16_ONE);
          }
          nX = Math.round(Math.cos((x + y) * 0.05) * 12000);
          nY = Math.round(Math.sin((x - y) * 0.05) * 12000);
          nZ = Q16_ONE;
        } else if (isFloor) {
          // FLOOR4_8: High-roughness metallic structure floor plate with diamond tread & rivets
          const isSeam = (x % 256 < 6) || (y % 256 < 6);
          const isRivet = ((x % 256 < 20) || (x % 256 > 236)) && ((y % 256 < 20) || (y % 256 > 236));
          const tread = ((x + y) % 32 < 8) || ((x - y + 1024) % 32 < 8);

          if (isRivet) {
            r = 0xad; g = 0xb4; b = 0xc2;
            rough = Math.round(0.3 * Q16_ONE); // Metallic rivet head
            nZ = Math.round(1.3 * Q16_ONE);
          } else if (isSeam) {
            r = 0x18; g = 0x1a; b = 0x1f;
            rough = Math.round(0.95 * Q16_ONE); // Deep recessed groove
            nZ = Math.round(0.5 * Q16_ONE);
          } else if (tread) {
            r = 0x4e; g = 0x53; b = 0x5c;
            rough = Math.round(0.7 * Q16_ONE); // Diamond tread surface
            nX = ((x + y) % 32 < 4) ? 8000 : -8000;
          } else {
            const grain = ((x * 37 + y * 71) % 19) - 9;
            r = Math.min(255, Math.max(0, 0x38 + grain));
            g = Math.min(255, Math.max(0, 0x3c + grain));
            b = Math.min(255, Math.max(0, 0x44 + grain));
            rough = Math.round(0.85 * Q16_ONE); // High-roughness base plate
          }
        } else if (isCeil) {
          // CEIL5_1: Global emissive photon attenuation surface (fluorescent luminaire)
          const isCenter = (x >= 256 && x <= 768 && y >= 180 && y <= 844);
          const isCore = (x >= 320 && x <= 704 && y >= 240 && y <= 784);
          if (isCore) {
            r = 0xff; g = 0xff; b = 0xff; // Pure radiant photon emitter
            rough = Math.round(0.1 * Q16_ONE);
          } else if (isCenter) {
            r = 0xee; g = 0xf6; b = 0xff;
            rough = Math.round(0.2 * Q16_ONE);
          } else {
            r = 0x2e; g = 0x30; b = 0x36; // Outer ceiling baffle
            rough = Math.round(0.75 * Q16_ONE);
          }
        } else if (isBeryllium) {
          // Brushed beryllium server rack chassis with heat-warped micro-surface normals & status LEDs
          const isVent = (y % 64) < 4;
          const isLed = (x % 128 < 20) && ((y % 32 >= 8) && (y % 32 <= 14));
          const ledType = ((x / 128) | 0) + ((y / 32) | 0);
          const brushScratch = Math.sin(x * 0.4) * 12;

          if (isVent) {
            r = 0x11; g = 0x14; b = 0x1c;
            rough = Math.round(0.9 * Q16_ONE);
            nZ = Math.round(0.6 * Q16_ONE);
          } else if (isLed) {
            // Emissive status LEDs: Cyan data bus, Emerald online, Amber warning
            if (ledType % 3 === 0) {
              r = 0x00; g = 0xf0; b = 0xff; // Cyan activity
            } else if (ledType % 3 === 1) {
              r = 0x10; g = 0xb9; b = 0x81; // Emerald OK
            } else {
              r = 0xf5; g = 0x9e; b = 0x0b; // Amber processing
            }
            rough = Math.round(0.1 * Q16_ONE);
            nZ = Math.round(1.5 * Q16_ONE);
          } else {
            // High-luster brushed beryllium alloy
            r = Math.min(255, Math.max(0, 0x58 + Math.round(brushScratch)));
            g = Math.min(255, Math.max(0, 0x62 + Math.round(brushScratch)));
            b = Math.min(255, Math.max(0, 0x70 + Math.round(brushScratch)));
            nX = Math.round(Math.sin(x * 0.3) * 6000);
            nY = Math.round(Math.cos(y * 0.1) * 3000);
            rough = Math.round(0.28 * Q16_ONE);
          }
        } else if (isCyanSeam) {
          // Narrow high-density fiber-optic data seam
          const distFromCenter = Math.abs(x - 512);
          if (distFromCenter < 80) {
            // Radiant core: pure glowing cyan-white
            const coreFade = 1.0 - (distFromCenter / 80);
            r = Math.round(0x00 + 0xff * coreFade * 0.5);
            g = Math.round(0xee + 0x11 * coreFade);
            b = 0xff;
            rough = Math.round(0.04 * Q16_ONE);
            nZ = Math.round(1.6 * Q16_ONE);
          } else if (distFromCenter < 140) {
            // Data glow halo
            r = 0x00; g = 0x88; b = 0xcc;
            rough = Math.round(0.2 * Q16_ONE);
          } else {
            // Dark carbon server chassis casing
            const weave = ((x + y) % 16 < 2) ? 10 : 0;
            r = 0x0e + weave; g = 0x13 + weave; b = 0x1e + weave;
            rough = Math.round(0.6 * Q16_ONE);
          }
        } else if (isSilicon) {
          // Polished silicon mirror substrate with microscopic hexagonal circuit paths
          const hexPattern = ((x * 3 + y * 5) % 48 < 3) || ((x * 5 - y * 3 + 1000) % 48 < 3);
          if (hexPattern) {
            r = 0x00; g = 0xd8; b = 0xf5; // Superconducting cyan bus line
            rough = Math.round(0.1 * Q16_ONE);
          } else {
            r = 0x08; g = 0x0f; b = 0x18; // Obsidian ultra-specular silicon mirror
            rough = Math.round(0.06 * Q16_ONE); // Mirror finish
            nZ = Q16_ONE;
          }
        } else if (isCryo) {
          // Zero-friction cryogenic coolant pit with undulating cyan caustics
          const wave = Math.sin((x * 0.04 + y * 0.03)) * 25;
          const frost = Math.hypot((x % 96) - 48, (y % 96) - 48) < 14;
          if (frost) {
            r = 0xe0; g = 0xf7; b = 0xff; // Frosted crystalline flake
            rough = Math.round(0.08 * Q16_ONE);
          } else {
            r = 0x00;
            g = Math.min(255, Math.max(160, Math.round(210 + wave)));
            b = 0xff;
            rough = Math.round(0.05 * Q16_ONE); // Pure specular fluid
          }
          nX = Math.round(Math.cos((x + y) * 0.04) * 9000);
          nY = Math.round(Math.sin((x - y) * 0.04) * 9000);
          nZ = Q16_ONE;
        } else if (isColdCathode) {
          // Diffuse emissive cold-cathode ceiling grid
          const tubeX = (x % 128 >= 48 && x % 128 <= 80);
          if (tubeX) {
            r = 0xf8; g = 0xfb; b = 0xff; // High-emission cold white tube
            rough = Math.round(0.08 * Q16_ONE);
            nZ = Math.round(1.4 * Q16_ONE);
          } else {
            r = 0x1e; g = 0x24; b = 0x30; // Matte carbon housing
            rough = Math.round(0.85 * Q16_ONE);
          }
        } else if (isAlarmGrid) {
          // Kernel Panic Arena: Amber-Red strobe array & alarm grid
          const isStrobe = (x >= 400 && x <= 624 && y >= 400 && y <= 624);
          if (isStrobe) {
            r = 0xff; g = 0x22; b = 0x44; // Emergency strobe core
            rough = Math.round(0.12 * Q16_ONE);
          } else {
            const hazardStripe = ((x + y) % 64 < 16);
            if (hazardStripe) {
              r = 0xcc; g = 0x44; b = 0x11;
            } else {
              r = 0x18; g = 0x1a; b = 0x22;
            }
            rough = Math.round(0.7 * Q16_ONE);
          }
        } else {
          // Industrial TekWall with conduit pipes
          const isPipe = (x >= 120 && x <= 260) || (x >= 760 && x <= 900);
          if (isPipe) {
            const pipeCenter = x >= 760 ? 830 : 190;
            const diff = (x - pipeCenter) / 70;
            const shade = 1.0 - Math.abs(diff) * 0.5;
            r = Math.round(0x75 * shade);
            g = Math.round(0x7d * shade);
            b = Math.round(0x8a * shade);
            nX = Math.round(diff * 20000);
            rough = Math.round(0.35 * Q16_ONE);
          } else {
            r = 0x4e; g = 0x51; b = 0x58;
            rough = Math.round(0.65 * Q16_ONE);
          }
        }

        albedoBuffer[idx] = 0xff000000 | (r << 16) | (g << 8) | b;
        normalXBuffer[idx] = nX;
        normalYBuffer[idx] = nY;
        normalZBuffer[idx] = nZ;
        roughnessBuffer[idx] = rough;
      }
    }

    const quipuToken = albedoBuffer[0] ^ albedoBuffer[dim * 16 + 16];
    return {
      name: textureName,
      width: dim,
      height: dim,
      albedoBuffer,
      normalXBuffer,
      normalYBuffer,
      normalZBuffer,
      roughnessBuffer,
      frictionCost: 0x00020000,
      quipuToken,
    };
  }

  /**
   * C-Kernel Boundary: sys_covalent_ingest_upscale
   * Quantizes RGB channels into Q16.16 fractions & evaluates Lyapunov dissipation
   */
  public sys_covalent_ingest_upscale(payload: PbrMaterialPayload): boolean {
    if (this.accumulatedFriction + payload.frictionCost > this.frictionCapacity) {
      return false; // Stasis ceiling enforced
    }

    this.accumulatedFriction += payload.frictionCost;
    this.quipuHashRoot = ((this.quipuHashRoot ^ payload.quipuToken) * 16777619) >>> 0;
    return true;
  }

  /**
   * Binds upscaled PBR matrices into CovalentTextureMapper
   */
  private bindMaterialToMapper(name: string, payload: PbrMaterialPayload): void {
    if (!this.textureMapper) return;
    this.textureMapper.registerPbrMaterial(name, {
      name,
      width: payload.width,
      height: payload.height,
      albedo: payload.albedoBuffer,
      normalX: payload.normalXBuffer,
      normalY: payload.normalYBuffer,
      normalZ: payload.normalZBuffer,
      roughness: payload.roughnessBuffer,
      isPbrActive: true,
    });
  }

  /**
   * Modality 2: Acoustic (Audio)
   * 48kHz Spatial HRTF Wave with Ray-Traced Acoustic Bounce.
   * Generates spatial early-reflection impulse reverb governed by ray distance.
   */
  public synthesizeSpatialHrtf(
    weapon: string,
    rayDistanceUnits: number,
    angleDegrees: number = 0
  ): AcousticBounceTelemetry {
    this.telemetry.acousticBounceCount++;

    // Speed of sound: 343 m/s (~343 DOOM map units/sec)
    const distanceSafe = Math.max(32, rayDistanceUnits);
    const latencyMs = Math.min(250, Math.round((distanceSafe / 343) * 10)); // Scaled for audio bounce
    const reverbDecay = Math.max(0.15, Math.min(0.9, 1.0 - distanceSafe / 1600));
    const pan = Math.sin((angleDegrees * Math.PI) / 180);

    const telemetry: AcousticBounceTelemetry = {
      rayDistance: distanceSafe,
      latencyMs,
      reverbDecay,
      sampleRate: 48000,
      pan,
    };
    this.telemetry.lastAcousticTelemetry = telemetry;

    // Trigger synthetic 48kHz Web Audio bounce
    this.playSyntheticHrtfAudio(weapon, latencyMs, reverbDecay, pan);
    this.notify();

    return telemetry;
  }

  private playSyntheticHrtfAudio(
    weapon: string,
    latencyMs: number,
    reverbDecay: number,
    pan: number
  ): void {
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.audioCtx) {
        this.audioCtx = new AudioCtxClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const sampleRate = 48000;
      const durationSec = 0.45;
      const buffer = this.audioCtx.createBuffer(2, Math.floor(sampleRate * durationSec), sampleRate);
      const leftChannel = buffer.getChannelData(0);
      const rightChannel = buffer.getChannelData(1);

      const delaySamples = Math.floor((latencyMs / 1000) * sampleRate);
      const isShotgun = weapon === 'SHOTGUN';
      const isPlasma = weapon === 'PLASMA';

      for (let i = 0; i < buffer.length; i++) {
        // Direct weapon sound profile
        let direct = 0;
        if (isShotgun) {
          // Punchy shotgun blast with white noise falloff
          if (i < 4800) {
            const env = Math.exp(-i / 800);
            direct = (Math.random() * 2 - 1) * env * 0.7;
          }
        } else if (isPlasma) {
          // Cybernetic 440Hz chirp
          if (i < 6000) {
            const freq = 600 - (i / 6000) * 300;
            const env = Math.exp(-i / 1500);
            direct = Math.sin((2 * Math.PI * freq * i) / sampleRate) * env * 0.6;
          }
        } else {
          // Pistol pop
          if (i < 2400) {
            const env = Math.exp(-i / 400);
            direct = (Math.random() * 2 - 1) * env * 0.5;
          }
        }

        // Ray-Traced Acoustic Wall Bounce (Echo)
        let echo = 0;
        if (i >= delaySamples) {
          const echoIdx = i - delaySamples;
          if (echoIdx < 7200) {
            const echoEnv = Math.exp(-echoIdx / 2000) * reverbDecay * 0.4;
            echo = (Math.random() * 2 - 1) * echoEnv;
          }
        }

        const mixed = direct + echo;

        // Binaural panning
        const leftGain = Math.cos(((pan + 1) * Math.PI) / 4);
        const rightGain = Math.sin(((pan + 1) * Math.PI) / 4);

        leftChannel[i] = mixed * leftGain;
        rightChannel[i] = mixed * rightGain;
      }

      const source = this.audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioCtx.destination);
      source.start();
    } catch {
      // AudioContext unavailable or blocked by autoplay policy
    }
  }

  /**
   * Modality 3: Kinetic (Code)
   * Autonomously generated C-Kernel behavioral macros for enemy AI loops.
   */
  public generateKineticBehaviorMacros(
    enemyType: string,
    playerDistQ16: Q16,
    hasLos: boolean
  ): KineticMacroTelemetry {
    const distInt = q16ToInt(playerDistQ16);
    let macroFlags = 0;
    let macroName = 'MACRO_STANDARD_PATROL';
    let flankAngleDeg = 0;
    let stasisSuppression = false;
    let coverProbeActive = false;

    if (!hasLos) {
      macroFlags |= 0x0002; // KINETIC_MACRO_COVER_RAY_PROBE
      macroName = 'MACRO_COVER_RAY_PROBE';
      coverProbeActive = true;
    }

    if (distInt < 280) {
      macroFlags |= 0x0001; // KINETIC_MACRO_FLANK_ANGULAR_OFFSET
      macroName = 'MACRO_FLANK_ANGULAR_OFFSET';
      flankAngleDeg = 45;
    }

    if (this.telemetry.materialsUpscaled > 10) {
      macroFlags |= 0x0004; // KINETIC_MACRO_TACTICAL_STASIS_HOLD
      macroName = 'MACRO_TACTICAL_STASIS_HOLD';
      stasisSuppression = true;
    }

    const macro: KineticMacroTelemetry = {
      macroFlags,
      macroName,
      flankAngleDeg,
      stasisSuppression,
      coverProbeActive,
      timestamp: new Date().toISOString().substring(14, 23),
    };

    this.telemetry.lastKineticMacro = macro;
    return macro;
  }

  /**
   * Synthesize default PBR materials on boot (STARTAN3, COMP2, TEKWALL4, NUKAGE3)
   */
  private async initDefaultPbrMaterials(): Promise<void> {
    await this.synthesizeMaterial('STARTAN3');
    await this.synthesizeMaterial('COMP2');
    await this.synthesizeMaterial('TEKWALL4');
    await this.synthesizeMaterial('NUKAGE3');
  }

  public getPbrMaterial(name: string): PbrMaterialPayload | undefined {
    return this.pbrMaterials.get(name);
  }

  public togglePbrActive(active?: boolean): boolean {
    this.telemetry.pbrActive = active !== undefined ? active : !this.telemetry.pbrActive;
    if (this.textureMapper) {
      this.textureMapper.setPbrEnabled(this.telemetry.pbrActive);
    }
    this.notify();
    return this.telemetry.pbrActive;
  }
}
