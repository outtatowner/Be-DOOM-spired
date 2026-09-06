/**
 * @file node_0x97_covalent_rt_texture_mapper.ts
 * @brief Organelle 0x97_COVALENT: Q16.16 Deterministic Texture Mapping & Procedural DOOM Textures
 * @provenance Parent: Zuma_QUIPU & Forge Evolutionary Branch
 * @invariants 1 === 1, Continuous Lyapunov Dissipation (dV/dt <= 0), Zero-Float Sampling
 */

import { Q16, Q16Vec3, q16ToInt, q16FromInt, Q16_ONE } from './q16_cordic';

export interface CovalentTexture {
  name: string;
  width: number;
  height: number;
  pixels: Uint32Array; // 0xAARRGGBB color data
}

export interface CovalentPbrMaterial {
  name: string;
  width: number;
  height: number;
  albedo: Uint32Array;
  normalX: Int32Array;
  normalY: Int32Array;
  normalZ: Int32Array;
  roughness: Int32Array;
  isPbrActive: boolean;
}

export interface PbrSampleResult {
  color: number;
  normalOffset: Q16Vec3;
  roughness: Q16;
  isPbr: boolean;
}

export class CovalentTextureMapper {
  private textures: Map<string, CovalentTexture> = new Map();
  private pbrMaterials: Map<string, CovalentPbrMaterial> = new Map();
  private pbrEnabled: boolean = true;

  constructor() {
    this.initProceduralDoomTextures();
  }

  public setPbrEnabled(enabled: boolean): void {
    this.pbrEnabled = enabled;
  }

  public isPbrEnabled(): boolean {
    return this.pbrEnabled;
  }

  public registerPbrMaterial(name: string, mat: CovalentPbrMaterial): void {
    this.pbrMaterials.set(name, mat);
  }

  /**
   * Samples high-resolution 1024x1024 PBR Albedo, Normal Perturbation, and Roughness
   */
  public sampleMaterialPBR(texName: string, u: Q16, v: Q16): PbrSampleResult {
    const pbr = this.pbrEnabled ? (this.pbrMaterials.get(texName) || this.pbrMaterials.get('STARTAN3')) : null;

    if (pbr && pbr.isPbrActive) {
      const intU = q16ToInt(u);
      const intV = q16ToInt(v);

      const x = ((intU % pbr.width) + pbr.width) % pbr.width;
      const y = ((intV % pbr.height) + pbr.height) % pbr.height;
      const idx = y * pbr.width + x;

      return {
        color: pbr.albedo[idx],
        normalOffset: {
          x: pbr.normalX[idx],
          y: pbr.normalY[idx],
          z: pbr.normalZ[idx] || Q16_ONE,
        },
        roughness: pbr.roughness[idx],
        isPbr: true,
      };
    }

    // Fallback to legacy 8-bit texture
    const color = this.sampleTextureRGB(texName, u, v);
    return {
      color,
      normalOffset: { x: 0, y: 0, z: Q16_ONE },
      roughness: Math.round(0.8 * Q16_ONE),
      isPbr: false,
    };
  }

  /**
   * Deterministic Ray-to-Texture Sampling in Q16.16
   * Strip fractional bits, wrap coordinates deterministically via modulo
   */
  public sampleTextureRGB(texName: string, u: Q16, v: Q16): number {
    const tex = this.textures.get(texName) || this.textures.get('STARTAN3');
    if (!tex) return 0xff8a7052; // Default brown tech stone

    const intU = q16ToInt(u);
    const intV = q16ToInt(v);

    // Deterministic wrapping
    const x = ((intU % tex.width) + tex.width) % tex.width;
    const y = ((intV % tex.height) + tex.height) % tex.height;

    return tex.pixels[y * tex.width + x];
  }

  private initProceduralDoomTextures() {
    this.textures.set('STARTAN3', this.generateStartan3());
    this.textures.set('COMP2', this.generateComp2());
    this.textures.set('TEKWALL4', this.generateTekWall4());
    this.textures.set('NUKAGE3', this.generateNukage3());
    this.textures.set('STEP4', this.generateStep4());
    this.textures.set('FLOOR4_8', this.generateFloor4_8());
    this.textures.set('CEIL5_1', this.generateCeil5_1());
  }

  /**
   * STARTAN3: Classic DOOM brown stone brick with rivets
   */
  private generateStartan3(): CovalentTexture {
    const w = 64;
    const h = 64;
    const pixels = new Uint32Array(w * h);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const isHorizontalMortar = y % 32 === 0;
        const row = Math.floor(y / 32);
        const isVerticalMortar = (x + row * 16) % 32 === 0;

        if (isHorizontalMortar || isVerticalMortar) {
          pixels[y * w + x] = 0xff382e25; // Dark mortar
        } else {
          // Subtle stone grain + bevel
          const noise = ((x * 17 + y * 31) % 19) - 9;
          const r = Math.min(255, Math.max(0, 0x8a + noise));
          const g = Math.min(255, Math.max(0, 0x70 + noise));
          const b = Math.min(255, Math.max(0, 0x52 + noise));
          pixels[y * w + x] = 0xff000000 | (r << 16) | (g << 8) | b;
        }
      }
    }
    return { name: 'STARTAN3', width: w, height: h, pixels };
  }

  /**
   * COMP2: Computer Terminal with glowing scanlines and status LEDs
   */
  private generateComp2(): CovalentTexture {
    const w = 64;
    const h = 64;
    const pixels = new Uint32Array(w * h);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        // CRT monitor screen in middle
        const isScreen = x >= 12 && x <= 52 && y >= 14 && y <= 46;
        if (isScreen) {
          const scanline = y % 2 === 0 ? 0.8 : 1.0;
          const isText = (x % 8 > 2) && ((y - 14) % 6 > 2) && ((x + y) % 3 !== 0);
          if (isText) {
            pixels[y * w + x] = 0xff00ffcc; // Glowing cyan text
          } else {
            const r = Math.floor(0x10 * scanline);
            const g = Math.floor(0x28 * scanline);
            const b = Math.floor(0x30 * scanline);
            pixels[y * w + x] = 0xff000000 | (r << 16) | (g << 8) | b;
          }
        } else if (y > 50 && (x % 8 === 2 || x % 8 === 3)) {
          // Blinking LED row
          pixels[y * w + x] = (x < 32) ? 0xff00ff55 : 0xffffaa00;
        } else {
          // Dark metallic console frame
          pixels[y * w + x] = 0xff2a2c33;
        }
      }
    }
    return { name: 'COMP2', width: w, height: h, pixels };
  }

  /**
   * TEKWALL4: Industrial Gray Tech Wall with Conduit Pipes
   */
  private generateTekWall4(): CovalentTexture {
    const w = 64;
    const h = 64;
    const pixels = new Uint32Array(w * h);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        // Vertical conduit pipes
        const isPipe = (x >= 8 && x <= 16) || (x >= 48 && x <= 56);
        if (isPipe) {
          const pipeX = x >= 48 ? x - 48 : x - 8;
          const highlight = Math.abs(pipeX - 4) * 12;
          const r = Math.max(0, 0x6e - highlight);
          const g = Math.max(0, 0x75 - highlight);
          const b = Math.max(0, 0x82 - highlight);
          pixels[y * w + x] = 0xff000000 | (r << 16) | (g << 8) | b;
        } else {
          // Metal plate with rivets
          const isRivet = (x % 16 === 2 || x % 16 === 14) && (y % 16 === 2);
          pixels[y * w + x] = isRivet ? 0xffbbbbbb : 0xff474a52;
        }
      }
    }
    return { name: 'TEKWALL4', width: w, height: h, pixels };
  }

  /**
   * NUKAGE3: Radioactive Emerald Toxic Acid Slime
   */
  private generateNukage3(): CovalentTexture {
    const w = 64;
    const h = 64;
    const pixels = new Uint32Array(w * h);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const swirl = Math.sin((x + y) * 0.2) * 15;
        const bubble = ((x * 13 + y * 7) % 43 === 0);
        if (bubble) {
          pixels[y * w + x] = 0xff88ff88; // Bright acid pop
        } else {
          const g = Math.min(255, Math.max(100, Math.floor(180 + swirl)));
          pixels[y * w + x] = 0xff000000 | (0x10 << 16) | (g << 8) | 0x22;
        }
      }
    }
    return { name: 'NUKAGE3', width: w, height: h, pixels };
  }

  /**
   * STEP4: Grate step riser
   */
  private generateStep4(): CovalentTexture {
    const w = 64;
    const h = 64;
    const pixels = new Uint32Array(w * h);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const isStripe = (x + y) % 12 < 4;
        pixels[y * w + x] = isStripe ? 0xffcca000 : 0xff2b2b2b;
      }
    }
    return { name: 'STEP4', width: w, height: h, pixels };
  }

  /**
   * FLOOR4_8: High-roughness metallic structure floor plate with diamond tread & rivets
   */
  private generateFloor4_8(): CovalentTexture {
    const w = 64;
    const h = 64;
    const pixels = new Uint32Array(w * h);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        // Metallic plate grid seam every 32 pixels
        const isSeam = x % 32 === 0 || y % 32 === 0;
        const isRivet = (x % 32 === 2 || x % 32 === 30) && (y % 32 === 2 || y % 32 === 30);
        const tread = ((x + y) % 8 < 2) || ((x - y + 64) % 8 < 2);

        if (isRivet) {
          pixels[y * w + x] = 0xffa0a5ad; // Metallic rivet reflection
        } else if (isSeam) {
          pixels[y * w + x] = 0xff16171a; // Dark recessed steel seam
        } else if (tread) {
          pixels[y * w + x] = 0xff484b54; // Raised grip tread plate
        } else {
          // High-roughness dark gunmetal base
          const noise = ((x * 19 + y * 23) % 11) - 5;
          const shade = Math.min(255, Math.max(0, 0x36 + noise));
          pixels[y * w + x] = 0xff000000 | (shade << 16) | (shade << 8) | (shade + 4);
        }
      }
    }
    return { name: 'FLOOR4_8', width: w, height: h, pixels };
  }

  /**
   * CEIL5_1: Global emissive photon attenuation surface (fluorescent luminaire)
   */
  private generateCeil5_1(): CovalentTexture {
    const w = 64;
    const h = 64;
    const pixels = new Uint32Array(w * h);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        // Center rectangular luminaire tube
        const isTube = x >= 14 && x <= 50 && y >= 10 && y <= 54;
        const isTubeCenter = x >= 20 && x <= 44 && y >= 16 && y <= 48;
        const isFrame = (x === 13 || x === 51) && y >= 9 && y <= 55;

        if (isTubeCenter) {
          pixels[y * w + x] = 0xffffffff; // Pure emissive core
        } else if (isTube) {
          pixels[y * w + x] = 0xffe8f4fc; // Glowing luminescent aura
        } else if (isFrame) {
          pixels[y * w + x] = 0xff202428; // Fixture bezel
        } else {
          // Industrial ceiling baffle tile
          const tile = (x % 16 === 0 || y % 16 === 0);
          pixels[y * w + x] = tile ? 0xff1a1c20 : 0xff2d3036;
        }
      }
    }
    return { name: 'CEIL5_1', width: w, height: h, pixels };
  }
}
