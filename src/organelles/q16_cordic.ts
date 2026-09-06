/**
 * @file q16_cordic.ts
 * @brief Zero-Float Q16.16 Fixed-Point & CORDIC Bit-Shift Vector Math
 * @provenance Parent: Zuma_QUIPU & Forge Evolutionary Branch
 * @invariants 1 === 1, Zero IEEE-754 Float Math in Core Kernel, Deterministic Cross-Platform
 */

export const Q16_SHIFT = 16;
export const Q16_ONE = 1 << Q16_SHIFT; // 65536
export const Q16_HALF = 1 << (Q16_SHIFT - 1); // 32768
export const Q16_ZERO = 0;

export type Q16 = number; // 32-bit signed integer representation

export function q16FromInt(i: number): Q16 {
  return (i << Q16_SHIFT) | 0;
}

export function q16ToInt(q: Q16): number {
  return (q >> Q16_SHIFT) | 0;
}

export function q16Mul(a: Q16, b: Q16): Q16 {
  // Use BigInt for 64-bit precision multiplication to prevent 32-bit overflow
  const res = (BigInt(a | 0) * BigInt(b | 0)) >> 16n;
  return Number(BigInt.asIntN(32, res));
}

export function q16Div(a: Q16, b: Q16): Q16 {
  if (b === 0) return a > 0 ? 0x7FFFFFFF : -0x80000000;
  const res = (BigInt(a | 0) << 16n) / BigInt(b | 0);
  return Number(BigInt.asIntN(32, res));
}

export function q16Abs(a: Q16): Q16 {
  return a < 0 ? -a : a;
}

export function q16Clamp(val: Q16, min: Q16, max: Q16): Q16 {
  if (val < min) return min;
  if (val > max) return max;
  return val;
}

export interface Q16Vec3 {
  x: Q16;
  y: Q16;
  z: Q16;
}

export function q16Vec3(x: Q16, y: Q16, z: Q16): Q16Vec3 {
  return { x: x | 0, y: y | 0, z: z | 0 };
}

export function q16Vec3FromInt(x: number, y: number, z: number): Q16Vec3 {
  return {
    x: q16FromInt(x),
    y: q16FromInt(y),
    z: q16FromInt(z),
  };
}

export function q16Vec3Add(a: Q16Vec3, b: Q16Vec3): Q16Vec3 {
  return {
    x: (a.x + b.x) | 0,
    y: (a.y + b.y) | 0,
    z: (a.z + b.z) | 0,
  };
}

export function q16Vec3Sub(a: Q16Vec3, b: Q16Vec3): Q16Vec3 {
  return {
    x: (a.x - b.x) | 0,
    y: (a.y - b.y) | 0,
    z: (a.z - b.z) | 0,
  };
}

export function q16Vec3Dot(a: Q16Vec3, b: Q16Vec3): Q16 {
  return (q16Mul(a.x, b.x) + q16Mul(a.y, b.y) + q16Mul(a.z, b.z)) | 0;
}

export function q16Vec3Scale(v: Q16Vec3, s: Q16): Q16Vec3 {
  return {
    x: q16Mul(v.x, s),
    y: q16Mul(v.y, s),
    z: q16Mul(v.z, s),
  };
}

export function q16Vec3Cross(a: Q16Vec3, b: Q16Vec3): Q16Vec3 {
  return {
    x: (q16Mul(a.y, b.z) - q16Mul(a.z, b.y)) | 0,
    y: (q16Mul(a.z, b.x) - q16Mul(a.x, b.z)) | 0,
    z: (q16Mul(a.x, b.y) - q16Mul(a.y, b.x)) | 0,
  };
}

export function q16Sqrt(val: Q16): Q16 {
  if (val <= 0) return 0;
  // Integer Newton-Raphson on 64-bit shifted value
  let x = BigInt(val) << 16n;
  let root = 0n;
  let bit = 1n << 62n;

  while (bit > x) {
    bit >>= 2n;
  }
  while (bit !== 0n) {
    if (x >= root + bit) {
      x -= root + bit;
      root = (root >> 1n) + bit;
    } else {
      root >>= 1n;
    }
    bit >>= 2n;
  }
  return Number(root);
}

export function q16Vec3Normalize(v: Q16Vec3): Q16Vec3 {
  const lenSq = q16Vec3Dot(v, v);
  if (lenSq <= 0) return { x: 0, y: Q16_ONE, z: 0 };
  const len = q16Sqrt(lenSq);
  if (len <= 0) return { x: 0, y: Q16_ONE, z: 0 };
  return {
    x: q16Div(v.x, len),
    y: q16Div(v.y, len),
    z: q16Div(v.z, len),
  };
}

/* CORDIC Fixed-Point Angle Table: atan(2^-i) in Q16 angle units (where 360 deg = 65536) */
const CORDIC_ANGLES = new Int32Array([
  8192, // 45 deg
  4836, // 26.565 deg
  2555, // 14.036 deg
  1297, // 7.125 deg
  651,  // 3.576 deg
  326,
  163,
  81,
  41,
  20,
  10,
  5,
  3,
  1,
  1,
  0
]);

const CORDIC_K = 39797; // 0.607252935 * 65536 in Q16

/**
 * Deterministic CORDIC Sin/Cos computation
 * @param angle Integer angle where 65536 = 360 degrees (0xFFFF = 1 full revolution)
 */
export function q16CordicSinCos(angle: number): { sin: Q16; cos: Q16 } {
  // Normalize angle to [-16384, 16384] (i.e. -90 to 90 degrees) with quadrant flipping
  let a = (angle & 0xFFFF);
  let quadrant = (a >> 14) & 3;
  let reducedAngle = a & 0x3FFF; // 0 to 90 deg

  let x = CORDIC_K;
  let y = 0;
  let z = reducedAngle;

  for (let i = 0; i < 14; i++) {
    const xShift = x >> i;
    const yShift = y >> i;
    if (z >= 0) {
      x = (x - yShift) | 0;
      y = (y + xShift) | 0;
      z = (z - CORDIC_ANGLES[i]) | 0;
    } else {
      x = (x + yShift) | 0;
      y = (y - xShift) | 0;
      z = (z + CORDIC_ANGLES[i]) | 0;
    }
  }

  // Quadrant mapping
  switch (quadrant) {
    case 0: // 0 to 90
      return { sin: y, cos: x };
    case 1: // 90 to 180
      return { sin: x, cos: -y };
    case 2: // 180 to 270
      return { sin: -y, cos: -x };
    case 3: // 270 to 360
      return { sin: -x, cos: y };
    default:
      return { sin: y, cos: x };
  }
}
