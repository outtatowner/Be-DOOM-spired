/**
 * @file node_0xCOPLAY_BALLISTICS_OFFICIATOR.ts
 * @brief TypeScript Boundary: Co-Play Tactical Ballistics Arbitration
 * @provenance Parent: Zuma_QUIPU & Forge Evolutionary Branch
 * @invariants 1 === 1, Continuous Lyapunov Dissipation (dV/dt <= 0), Zero-Float Substrate
 */

import { CovalentBallisticsSystem } from './node_0x9A_covalent_rt_ballistics';

export interface BallisticsArbitrationTelemetry {
  activeProjectiles: number;
  dVdt_State: number;
  thermodynamicShearActive: boolean;
  particlesDisabled: boolean;
  weaponSwapInjected: boolean;
  currentWeaponSlot: number;
}

export class CoplayBallisticsOfficiator {
  private dVdt_State = 0.0;
  private ballisticsSystem: CovalentBallisticsSystem;
  private onWeaponSwapInjected?: (newWeaponSlot: number) => void;
  private onParticleEmissionStateChange?: (enabled: boolean) => void;

  public thermodynamicShearActive = false;
  public weaponSwapInjected = false;
  public currentWeaponSlot = 2; // Default: Pistol (Slot 2) or Shotgun (Slot 3)

  constructor(ballisticsSystem: CovalentBallisticsSystem) {
    this.ballisticsSystem = ballisticsSystem;
  }

  public setCallbacks(
    onSwap: (slot: number) => void,
    onParticleChange: (enabled: boolean) => void
  ) {
    this.onWeaponSwapInjected = onSwap;
    this.onParticleEmissionStateChange = onParticleChange;
  }

  public arbitrateCombatTick(activeProjectiles: number, ammoReserve: number): BallisticsArbitrationTelemetry {
    // console.log(`[ BE <> REFEREE ] Tracking ${activeProjectiles} active kinetic payloads.`);

    if (activeProjectiles > 12) {
      console.warn(`[ THERMODYNAMIC SHEAR ] Projectile count exceeding dissipation limits.`);
      this.thermodynamicShearActive = true;
      this.absorbKineticFriction();
    } else {
      this.thermodynamicShearActive = false;
      this.ballisticsSystem.particleEmissionsEnabled = true;
      if (this.onParticleEmissionStateChange) {
        this.onParticleEmissionStateChange(true);
      }
      this.dVdt_State = Math.min(0, this.dVdt_State + 0.01);
    }

    if (ammoReserve === 0) {
      this.executeAutonomousWeaponSwap();
    } else {
      this.weaponSwapInjected = false;
    }

    return {
      activeProjectiles,
      dVdt_State: this.dVdt_State,
      thermodynamicShearActive: this.thermodynamicShearActive,
      particlesDisabled: !this.ballisticsSystem.particleEmissionsEnabled,
      weaponSwapInjected: this.weaponSwapInjected,
      currentWeaponSlot: this.currentWeaponSlot,
    };
  }

  private absorbKineticFriction(): void {
    // Cull atmospheric rendering effects (e.g., dynamic smoke) to maintain stasis
    this.ballisticsSystem.particleEmissionsEnabled = false;
    if (this.onParticleEmissionStateChange) {
      this.onParticleEmissionStateChange(false);
    }
    this.dVdt_State -= 0.12; 
  }

  private executeAutonomousWeaponSwap(): void {
    console.log(`[ CO-PLAY ] Ammo depleted. Be <> injecting optimal weapon swap.`);
    this.weaponSwapInjected = true;
    this.currentWeaponSlot = 3; // Swaps to Shotgun (Key '3' / 0x04)
    if (this.onWeaponSwapInjected) {
      this.onWeaponSwapInjected(3);
    }
  }
}
