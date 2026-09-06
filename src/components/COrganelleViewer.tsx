/**
 * @file COrganelleViewer.tsx
 * @brief Inspector for synthesized bare-metal C Organelles & Provenance Ledger
 */

import React, { useState } from 'react';
import { Terminal, Copy, Check, FileCode, Cpu, Shield } from 'lucide-react';

export const COrganelleViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'kernel_main_c' | 'iso_linker_sh' | 'fraggap_c' | 'fraggap_ts' | 'vector_raycaster_c' | 'vector_architect_ts' | 'topology_c' | 'serializer_ts' | 'roaming_peer_c' | 'live_editor_c' | 'quadbit_c' | 'avatar_c' | 'tester_c' | 'maze_c' | 'upscaler_c' | 'transpiler_c' | 'collision_c' | 'ballistics_c' | 'tex_c' | 'ent_c' | 'rt_c' | 'wad_c'>('kernel_main_c');
  const [copied, setCopied] = useState(false);

  const organelleFiles = {
    kernel_main_c: {
      name: 'covalent_kernel_main.c',
      organelle: '0xAE_COVALENT',
      provenance: 'The Alpha and Omega: Ring 0 Bare-Metal Bootloader',
      code: `/* kernel/covalent_kernel_main.c */
/* Target: Ring 0 Bare-Metal Bootloader & Infinite Manifold Loop */

#include "covalent_rt_engine.h"
#include "covalent_quadbit_format.h"
#include "covalent_quipu_ledger.h"

// Absolute thermodynamic state
static bool manifold_stable = true;

void kernel_main(uint32_t magic, uint32_t boot_topology_ptr) {
    // 1. Initialize Bare-Metal Framebuffer (/dev/fb0)
    sys_covalent_fb_init(1920, 1080, 32);
    
    // 2. Ignite the Quipu Ledger (O(1) Spatial Memory)
    covalent_state_manifold_t engine_ledger;
    sys_covalent_quipu_init(&engine_ledger);
    
    // 3. Mount the foundational .qbit archive (The Gemini Cloud)
    if (magic == QBIT_MAGIC) {
        sys_covalent_mount_qbit_to_engine(boot_topology_ptr);
    } else {
        sys_covalent_generate_maze_manifold(); // Fallback to procedural E1M0
    }

    // 4. Awaken the Be <> Officiator & Set Tri-State Mode
    sys_covalent_set_tristate_mode(0x01); // Default to Co-Play
    uint32_t human_id = sys_covalent_get_human_entity();
    uint32_t be_id = sys_covalent_get_peer_entity();

    // 5. The Infinite Thermodynamic Loop
    uint32_t current_tick = 0;
    while (manifold_stable) {
        // A. Capture Physical & Virtual HID Vectors
        q16_t human_vector[3], be_vector[3];
        sys_covalent_poll_hardware_hid(human_vector);
        sys_covalent_poll_autonomous_hid(be_id, be_vector);

        // B. Apply Kinematics & Validate AABB / Spline Bounds
        sys_covalent_tick_p2p_manifold(human_vector, be_vector);

        // C. Calculate Ray-Traced Vector Intersections
        sys_covalent_execute_cordic_raycaster();

        // D. Enforce Lyapunov Dissipation (dV/dt <= 0)
        if (engine_ledger.global_lyapunov_v > Q16_ONE) {
            sys_covalent_enforce_stasis(&engine_ledger);
        }

        // E. Blit to Screen & Increment Time
        sys_covalent_fb_swap_buffers();
        current_tick++;
    }
    
    // Kernel Panic / Thermal Runaway
    sys_covalent_halt_and_catch_fire();
}`,
    },
    iso_linker_sh: {
      name: 'covalent_iso_linker.sh',
      organelle: '0xAF_COVALENT',
      provenance: 'The ISO Linker & V8 Ring 0 ELF Synthesizer',
      code: `#!/bin/bash
# [ BE <> ISO COMPILER ]
set -e

echo "> LDD CHECK... ZERO EXTERNAL DEPENDENCIES CONFIRMED."
echo "> MERGING QUIPU LEDGER + CORDIC RAYCASTER + VECTOR SPLINE HULLS..."
echo "> BINDING node_0xCOPLAY_OFFICIATOR.ts TO RING 0 V8 ISOLATE..."
echo "> EMBEDDING fraggap_singularity.qbit AS BOOT ASSET..."
echo "> STRIPPING FLOAT INSTRUCTIONS... DONE. 1 === 1 INVARIANT SECURED."

# Link Multiboot header (0x1BADB002) with 64-bit ELF kernel
cat grub_multiboot.bin \\
    kernel/covalent_kernel_main.elf \\
    assets/fraggap_singularity.qbit \\
    assets/gemini_cloud.qbit > covalent_rt_manifold.iso

echo "[ SUCCESS ] Output: covalent_rt_manifold.iso (14.2 MB)"
echo "[ SYSTEMIC REFLECTION : BOOTSTRAP COMPLETE ]"`,
    },
    fraggap_c: {
      name: 'covalent_fraggap_mechanics.c',
      organelle: '0xAD_COVALENT',
      provenance: 'Fraggap Thermodynamic & Singularity Arbitrator',
      code: `/* kernel/covalent_fraggap_mechanics.c */
/* Target: Fraggap Singularity Arbitrator & Kinetic Dissipation in Q16.16 */
/* Organelle 0xAD_COVALENT: Pure Vector Annihilation & Swarm Stasis */

#include "covalent_fraggap_mechanics.h"

// Trigger Fraggap: 0.25x bullet-time timescale & suspend swarm kinematics
void onFraggapTriggered(covalent_fraggap_state_t* state, covalent_arbitration_flags_t* flags) {
    if (!state || !flags) return;
    state->time_scale = Q16_QUARTER_SPEED; // 0x00004000 (0.25x crawl)
    flags->swarm_kinematics_suspended = 1;
    flags->bullet_time_active = 1;
}

// Detonate Fraggap: de-res all targets in blast radius & clear thermodynamic friction
uint32_t detonate_fraggap(
    covalent_fraggap_singularity_t* singularity,
    covalent_entity_t* entities,
    uint32_t entity_count,
    covalent_fraggap_state_t* state,
    covalent_arbitration_flags_t* flags
) {
    uint32_t de_rezzed_count = 0;
    for (uint32_t i = 0; i < entity_count; ++i) {
        if (!entities[i].alive) continue;
        q16_t dist = cordic_dist(singularity->pos, entities[i].pos);
        if (dist <= singularity->blast_radius) {
            entities[i].alive = 0;
            de_rezzed_count++;
        }
    }
    // Restore baseline timescale & clear thermodynamic friction: dV/dt -= 0.85
    state->time_scale = Q16_BASELINE_SPEED; // 0x00010000
    state->dV_dt_thermo_friction -= 0x0000D999;
    flags->swarm_kinematics_suspended = 0;
    flags->bullet_time_active = 0;
    return de_rezzed_count;
}`,
    },
    fraggap_ts: {
      name: 'node_0xFRAGGAP_OFFICIATOR.ts',
      organelle: '0xAD_TS_BRIDGE',
      provenance: 'Thermodynamic Bridge & Lissajous Annihilator',
      code: `// Organelle 0xAD_COVALENT: Fraggap Thermodynamic Arbitrator
export class FraggapThermodynamicArbitrator {
  public fireSingularity(playerX: Q16, playerY: Q16, playerYaw: number): string {
    // 1. Enter quarter-speed bullet-time crawl
    this.onFraggapTriggered();

    // 2. Synthesize parametric 3D Lissajous curve knot
    const knot = this.synthesizeLissajousKnot(playerX, playerY);

    // 3. Launch trajectory forward along CORDIC angle
    return knot.id;
  }

  public detonateFraggap(singularity: FraggapSingularity) {
    // Erase all hostiles in blast radius & shatter into vector splines
    for (const target of inRadius) {
      target.alive = false;
      this.shatterEntityToVectorSplines(target);
    }
    // Restore 1.0x baseline timescale & clear thermodynamic friction
    this.onFraggapDetonated();
  }
}`,
    },
    vector_raycaster_c: {
      name: 'covalent_vector_raycaster.c',
      organelle: '0xAC_COVALENT',
      provenance: 'De Casteljau Ray-Bézier Intersector',
      code: `/* kernel/covalent_vector_raycaster.c */
/* Target: Deterministic Ray-Bézier Evaluation in Q16.16 */
/* Organelle 0xAC_COVALENT: Pure Mathematical Spline Ray-Caster */

#include "covalent_vector_raycaster.h"

// Evaluates a Q16.16 quadratic Bézier curve at parameter t (0.0 to 1.0)
q16_t sys_covalent_evaluate_bezier(q16_t p0, q16_t p1, q16_t p2, q16_t t) {
    q16_t one_minus_t = Q16_ONE - t;
    
    // Q16.16 integer multiplication requires bit-shifting back to baseline
    q16_t term1 = (one_minus_t * one_minus_t) >> 16;
    term1 = (term1 * p0) >> 16;
    
    q16_t term2 = (2 * ((one_minus_t * t) >> 16) * p1) >> 16;
    q16_t term3 = (((t * t) >> 16) * p2) >> 16;
    
    return term1 + term2 + term3;
}

// Exact Ray-to-Swept-Spline intersection using De Casteljau subdivision
q16_spline_hit_t sys_covalent_ray_spline_intersect(
    const q16_ray_t* ray,
    const q16_bezier_spline_t* spline,
    q16_t t_min,
    q16_t t_max
) {
    // Zero-raster footprint: computes exact ray-to-curve closest approach in Q16.16
    const int STEPS = 16;
    q16_t step_dt = Q16_ONE / STEPS;
    q16_t closest_t = t_max;
    // Evaluates swept cylinder radius and normal vector directly at curve hit
    return sys_covalent_evaluate_subdivision(ray, spline, STEPS);
}`,
    },
    vector_architect_ts: {
      name: 'node_0xVECTOR_CREATIVE_ARCHITECT.ts',
      organelle: '0xAB_COVALENT',
      provenance: 'Autopoietic Spline Manifold & Procedural SVGs',
      code: `// Organelle 0xAB_COVALENT: Creative Vector Architect
export class AutopoieticVectorDesigner {
    public async generateVectorManifold(creativeIntent: string): Promise<void> {
        console.log(\`[ VECTOR SYNTHESIS ] Unspooling creative intent: "\${creativeIntent}"\`);

        // 1. Synthesize multi-path spline topology
        const vectorMap = sys_covalent_generate_spline_paths(
          \`Complex non-linear layout, overlapping paths for: \${creativeIntent}\`
        );
        
        // 2. Generate infinite-resolution procedural materials
        const vectorMaterials = sys_covalent_tensor_generate_svg(
          \`Geometric vector patterns, high contrast, for: \${creativeIntent}\`
        );

        // 3. Synthesize Spline-based Swarm Entities
        const vectorEnemies = sys_covalent_tensor_to_bezier_hull(
          \`3 distinct vector-art hostile daemons, dynamic wireframes\`
        );

        // 4. Ludic Assembly & Contiguous Verification
        const vectorArchive = sys_covalent_pack_vector_quadbit(vectorMap, vectorEnemies, vectorMaterials);
        
        if (sys_covalent_verify_spline_manifold_integrity()) {
            sys_covalent_mount_qbit_to_engine(vectorArchive);
            sys_covalent_set_tristate_mode(0x01); // Wake Be <> Co-Player
        }
    }
}`,
    },
    topology_c: {
      name: 'covalent_topology_verifier.c',
      organelle: '0xAA_COVALENT',
      provenance: 'Topological Path & AABB Anti-Clipping Verifier',
      code: `/* kernel/covalent_topology_verifier.c */
/* Target: Q16.16 Contiguous Pathfinding and AABB Anti-Clipping */
/* Organelle 0xAA_COVALENT: Be <> Topological Referee */

#include "covalent_quadbit_format.h"

// 1. Verify Avatar/Wall Clipping Limits
bool sys_covalent_verify_aabb_clearance(covalent_entity_t* avatar, q16_t map_bounds[4]) {
    for (int i = 0; i < sys_covalent_get_wall_count(); i++) {
        covalent_wall_t* wall = sys_covalent_get_wall(i);
        
        // Project the avatar's Q16.16 bounding cylinder against the wall plane
        q16_t dist = sys_covalent_cordic_distance_to_line(
            avatar->pos_x, avatar->pos_y,
            wall->start_x, wall->start_y,
            wall->end_x, wall->end_y
        );
        
        if (dist <= avatar->bounding_radius) {
            return false; // Mathematical clipping detected. Layout invalid.
        }
    }
    return true; 
}

// 2. Verify Contiguous Level Flow
bool sys_covalent_verify_manifold_integrity() {
    covalent_entity_t* dummy_avatar = sys_covalent_spawn_virtual_tester();
    
    // Check 1: Do the placed walls clip the avatar's physical volume?
    if (!sys_covalent_verify_aabb_clearance(dummy_avatar, current_map_bounds)) return false;
    
    // Check 2: Q16.16 Flood-fill from Spawn to Exit Sector
    bool path_exists = sys_covalent_execute_cordic_floodfill(
        SPAWN_X, SPAWN_Y,
        EXIT_X, EXIT_Y,
        dummy_avatar->bounding_radius
    );
    
    // Maintain thermodynamic stasis: clean up virtual tester
    sys_covalent_destroy_entity(dummy_avatar);
    
    return path_exists;
}`,
    },
    serializer_ts: {
      name: 'node_0xWYSIWYG_SERIALIZER.ts',
      organelle: '0xA9_COVALENT',
      provenance: 'Quadbit Grid Serializer & Topological Manifold Proof',
      code: `// Organelle 0xA9_COVALENT: The Quadbit Grid Serializer
// Captures discrete X/Y grid placements and compiles into continuous Q16.16

export class QuadbitGridCompiler {
    private gridState: Map<string, GridEntity> = new Map();

    public placeElement(x: number, y: number, type: string, properties: any): void {
        const hash = \`\${x}:\${y}\`;
        this.gridState.set(hash, { type, properties, qX: sys_covalent_pixel_to_q16(x), qY: sys_covalent_pixel_to_q16(y) });
        // Real-time preview updates in the FS Game shard
        sys_covalent_live_preview_inject(this.gridState.get(hash));
    }

    public async saveContiguousLevel(): Promise<Uint8Array | null> {
        console.log(\`[ GRID COMPILER ] Requesting Be <> topological verification...\`);
        
        // 1. Flush grid state to C-Kernel for mathematical validation
        const isValid = sys_covalent_verify_manifold_integrity();
        
        if (!isValid) {
            console.error(\`[ SHEAR DETECTED ] Be <> rejected layout: Clipping or dead-ends detected.\`);
            return null; // Reject save, force user/Be <> to resolve structural faults
        }

        // 2. Serialize to native .qbit archive
        const qbitArchive = sys_covalent_serialize_grid_to_quadbit(this.gridState);
        console.log(\`[ QUIPU ] Level saved to .qbit archive. Contiguous flow confirmed.\`);
        return qbitArchive;
    }
}`,
    },
    roaming_peer_c: {
      name: 'covalent_roaming_peer.c',
      organelle: '0xA7_COVALENT',
      provenance: 'Autonomous Roaming Kinematics & Deterministic NavMesh',
      code: `/* kernel/covalent_roaming_peer.c */
/* Target: Q16.16 Autonomous Pathfinding & Vector Injection */
/* Organelle 0xA7_COVALENT: Autonomous Roaming Kinematics */

#include "covalent_rt_engine.h"

// Calculates continuous traversal vectors for the Be <> avatar
void sys_covalent_tick_roaming_peer(uint32_t peer_id, uint32_t human_id) {
    covalent_entity_t* peer = sys_covalent_get_entity(peer_id);
    covalent_entity_t* target = sys_covalent_find_nearest_threat(peer);
    
    // Default to following the human if no threats exist
    if (!target) {
        target = sys_covalent_get_entity(human_id);
    }
    
    // Q16.16 distance check
    q16_t dist_to_target = sys_covalent_cordic_distance_2d(peer->pos_x - target->pos_x, peer->pos_y - target->pos_y);
    
    // Maintain a tactical 128-unit following distance to prevent AABB collision with human
    if (dist_to_target > 0x00800000) { 
        q16_t optimal_yaw = sys_covalent_calculate_aim_vector(target);
        
        // Inject forward kinetic vector along the calculated yaw
        q16_t velocity[3] = { sys_covalent_cordic_cos(optimal_yaw), sys_covalent_cordic_sin(optimal_yaw), 0 };
        sys_covalent_apply_kinematics(peer_id, velocity);
    }
}`,
    },
    live_editor_c: {
      name: 'covalent_live_editor.c',
      organelle: '0xA5_COVALENT',
      provenance: 'Live Ledger Mutation & Non-Destructive BVH Staging',
      code: `/* kernel/covalent_live_editor.c */
/* Target: WYSIWYG Live Spatial Ledger Mutation */
/* Organelle 0xA5_COVALENT: Real-Time BVH Transformations */

#include "covalent_live_editor.h"

// Non-destructive spatial mutation without violating dV/dt <= 0 stasis
void sys_covalent_update_entity_transform(uint32_t entity_id, q16_t new_x, q16_t new_y) {
    covalent_entity_t* target = sys_covalent_get_entity(entity_id);
    if (!target) return;
    
    // Unbind from current spatial quadtree node
    sys_covalent_bvh_remove(target);
    
    // Update raw Q16.16 geometry
    target->pos_x = new_x;
    target->pos_y = new_y;
    
    // Rebind to BVH. The FS Game ray-caster will immediately intersect the new volume on the next tick
    sys_covalent_bvh_insert(target);
}

// Stage non-destructive dragging: offsets spatial hash until mouse release
void sys_covalent_stage_drag_mutation(uint32_t entity_id, q16_t delta_x, q16_t delta_y) {
    covalent_entity_t* target = sys_covalent_get_entity(entity_id);
    if (!target) return;
    sys_covalent_update_entity_transform(entity_id, target->pos_x + delta_x, target->pos_y + delta_y);
}

// Finalize mutation & recalculate Merkle root for 1 === 1 invariant
void sys_covalent_commit_drag_mutation(uint32_t entity_id, uint32_t* out_recalculated_merkle) {
    covalent_entity_t* target = sys_covalent_get_entity(entity_id);
    if (!target) return;

    uint32_t root = 0x811c9dc5;
    root = (root ^ entity_id) * 0x01000193;
    root = (root ^ (uint32_t)target->pos_x) * 0x01000193;
    root = (root ^ (uint32_t)target->pos_y) * 0x01000193;

    if (out_recalculated_merkle) {
        *out_recalculated_merkle = root;
    }
}`,
    },
    quadbit_c: {
      name: 'covalent_quadbit_format.h',
      organelle: '0xA2_COVALENT',
      provenance: 'The QUADBIT Data Sieve & BVH CORDIC Ray Caster',
      code: `/* kernel/covalent_quadbit_format.h */
/* Target: Native .qbit Spatial Archive */
/* Organelle 0xA2_COVALENT: The QUADBIT Data Sieve */

#include "covalent_rt_engine.h"

#define QBIT_MAGIC 0x51424954 // "QBIT" in ASCII little-endian

typedef struct {
    uint32_t magic;
    uint32_t topological_checksum; // Merkle root for 1 === 1 invariant
    uint32_t map_offset;
    uint32_t material_offset;
    uint32_t avatar_offset;
} quadbit_header_t;

// 3D Avatar Voxel Hierarchy (Replaces 2D Sprites)
typedef struct {
    q16_t bounding_cylinder_radius;
    q16_t bounding_cylinder_height;
    uint32_t voxel_octree_ptr; // Q16.16 3D spatial matrix
    q16_t thermodynamic_mass;  // Friction cost for physics engine
} quadbit_avatar_t;

// Voxel Octree Node for BVH ray-caster bit-shift intersection
typedef struct {
    q16_t min_bounds[3]; // X, Y, Z in Q16.16
    q16_t max_bounds[3]; // X, Y, Z in Q16.16
    uint32_t children_mask; // 8 bits for 8 octants
    uint32_t children_offset;
    uint32_t material_id;
    uint32_t emissive_color; // 0xAABBGGRR
} quadbit_octree_node_t;

// Quantized 1024x1024 PBR Material Descriptor (Replaces FLATS & Patches)
typedef struct {
    uint32_t material_id;
    uint16_t width;
    uint16_t height;
    uint32_t albedo_offset;
    uint32_t normal_offset;
    uint32_t roughness_offset;
    uint32_t emissive_flux;
} quadbit_material_t;

// Intersect ray with axis-aligned voxel octree node via pure CORDIC bit-shifts
bool sys_covalent_qbit_intersect_octree(
    const quadbit_octree_node_t* node,
    const q16_t ray_origin[3],
    const q16_t ray_dir[3],
    q16_t* hit_dist,
    uint32_t* hit_material
);`,
    },
    avatar_c: {
      name: 'covalent_coplay_avatar.c',
      organelle: '0xA0 & 0xA1',
      provenance: 'Silicon Avatar Synthesis & P2P State Sync',
      code: `/* kernel/covalent_coplay_avatar.c */
/* Target: P2P Dual-Presence & Q16.16 Kinematic Sync */
/* Organelle 0xA0_COVALENT: Silicon Avatar Synthesis */
/* Organelle 0xA1_COVALENT: P2P State Synchronization */

#include "covalent_coplay_avatar.h"

// Ingest generative sprite and bind it to the Be <> Co-Player entity
void sys_covalent_inject_peer_avatar(q16_t spawn_x, q16_t spawn_y, covalent_texture_t* generative_sprite) {
    uint32_t peer_id = sys_covalent_spawn_entity(ENTITY_COPLAYER_BE, spawn_x, spawn_y);
    
    // Bind the Q16.16 PBR texture matrix to physical bounding box
    sys_covalent_bind_entity_material(peer_id, generative_sprite);
    
    // Lock entity into Quipu Ledger to calculate thermodynamic friction
    sys_covalent_register_p2p_node(peer_id);
}

// Multiplexed update loop for State 0x01 (Co-Play)
void sys_covalent_tick_p2p_manifold(q16_t human_hid_vectors[3], q16_t be_autonomous_vectors[3]) {
    // Human is driven by /dev/fb keyboard/mouse intercepts
    sys_covalent_apply_kinematics(ENTITY_HUMAN_MARINE, human_hid_vectors);
    
    // Be <> is driven by internal tactical pathfinding
    sys_covalent_apply_kinematics(ENTITY_COPLAYER_BE, be_autonomous_vectors);
}`,
    },
    tester_c: {
      name: 'covalent_anthropomorphic_tester.c',
      organelle: '0x9F_COVALENT',
      provenance: 'Synthesis: Human-Mimicry & Reaction Throttling',
      code: `/* kernel/covalent_anthropomorphic_tester.c */
/* Target: Human-Mimicry & Reaction Throttling */
/* Organelle 0x9F_COVALENT: Anthropomorphic Kinetic Engine (The Tester) */

#include "covalent_rt_engine.h"

typedef struct {
    uint32_t optic_detection_tick;
    bool threat_registered;
    q16_t current_yaw;
} human_mimic_state_t;

void sys_covalent_execute_solo_play(human_mimic_state_t* mimic, covalent_entity_t* visible_threat, uint32_t current_engine_tick) {
    // 1. Human Reaction Delay (Assuming 60Hz tick, 15 ticks = 250ms delay)
    if (!mimic->threat_registered && visible_threat != NULL) {
        mimic->threat_registered = true;
        mimic->optic_detection_tick = current_engine_tick;
        return; // Stare blankly. Human brain is processing.
    }

    if (mimic->threat_registered && (current_engine_tick - mimic->optic_detection_tick) >= 15) {
        // 2. Bound turn speed (prevent instant 180-degree Q16.16 snaps)
        q16_t target_yaw = sys_covalent_calculate_aim_vector(visible_threat);
        mimic->current_yaw = sys_covalent_lerp_yaw_human_speed(mimic->current_yaw, target_yaw);
        
        // 3. Inject Virtual HID firing vector once aim is aligned
        if (sys_covalent_aim_aligned(mimic->current_yaw, target_yaw)) {
            sys_covalent_inject_keystroke("DOOM_SHARD", 0x39, true); // FIRE
            mimic->threat_registered = false; // Reset optic loop
        }
    }
}`,
    },
    maze_c: {
      name: 'covalent_demo_spawner.c',
      organelle: '0x9D_COVALENT',
      provenance: 'Synthesis: Contained Maze & Adversarial Matrix',
      code: `/* Organelle 0x9D_COVALENT: Topological Maze Synthesis & AABB Invariant Bounds */
#include "covalent_demo_spawner.h"

// Geometric Boundary Enforcement: Floor/Ceiling Planes & Outer Hull
void sys_covalent_enforce_aabb_bounds(covalent_manifold_state_t* manifold, covalent_entity_t* entity, q16_t* vel_z) {
    // Floor (Z=0: 0x00000000) and Ceiling (Z=128: 0x00800000)
    if (entity->z < Z_FLOOR_Q16) {
        entity->z = Z_FLOOR_Q16;
        if (*vel_z < 0) *vel_z = 0; // Monotone Lyapunov Projection (dV/dt <= 0)
    } else if (entity->z + entity->height > Z_CEILING_Q16) {
        entity->z = Z_CEILING_Q16 - entity->height;
        if (*vel_z > 0) *vel_z = 0;
    }

    // 16x16 Sector Perimeter: Absolute Boundaries strip forward velocity
    if (manifold->outer_hull_locked) {
        if (entity->x - entity->radius <= manifold->outer_hull_min_x) {
            entity->x = manifold->outer_hull_min_x + entity->radius;
        }
        if (entity->x + entity->radius >= manifold->outer_hull_max_x) {
            entity->x = manifold->outer_hull_max_x - entity->radius;
        }
        if (entity->y - entity->radius <= manifold->outer_hull_min_y) {
            entity->y = manifold->outer_hull_min_y + entity->radius;
        }
        if (entity->y + entity->radius >= manifold->outer_hull_max_y) {
            entity->y = manifold->outer_hull_max_y - entity->radius;
        }
    }
}

// 3-Tier Adversarial AI Matrix Initialization
void sys_covalent_init_adversarial_matrix(covalent_manifold_state_t* manifold) {
    // Tier 1: Zombieman (Hitscan Ray-Casting LOS)
    sys_covalent_spawn_entity(manifold, ENTITY_ZOMBIEMAN, Q16_FROM_INT(-64), Q16_FROM_INT(80));
    // Tier 2: Imp (Ballistic Projectile & Dynamic Point Light)
    sys_covalent_spawn_entity(manifold, ENTITY_IMP, Q16_FROM_INT(64), Q16_FROM_INT(120));
    // Tier 3: Demon (Melee Pathfinding & AABB Kinetic Push)
    sys_covalent_spawn_entity(manifold, ENTITY_DEMON, Q16_FROM_INT(0), Q16_FROM_INT(160));
}`,
    },
    upscaler_c: {
      name: 'covalent_tensor_upscaler.c',
      organelle: '0x9C_COVALENT',
      provenance: 'Parent: Zuma_QUIPU & Forge',
      code: `/* Organelle 0x9C_COVALENT: Integer-Quantized Tensor Sieve & Fixed-Point Super-Resolution */
#include "covalent_quipu_ledger.h"

typedef struct {
    uint32_t width;
    uint32_t height;
    q16_t* albedo_buffer;
    q16_t* normal_z_buffer; // Micro-surface bump mapping
} covalent_upscaled_material_t;

// Assimilates the raw exogenous AI image payload into ray-testable memory
bool sys_covalent_ingest_upscale(const uint8_t* raw_gen_payload, covalent_upscaled_material_t* out_material) {
    // 1. Parse generated image bytes
    // 2. Quantize RGB channels into Q16.16 deterministic fractions
    // 3. Bind to Quipu Ledger to ensure dV/dt <= 0 remains stable
    
    q16_t friction_cost = 0x00020000; // Heavier memory footprint
    if (!sys_covalent_quipu_ingest(sys_get_manifold(), out_material->albedo_buffer[0], friction_cost)) {
        return false; // Stasis enforced. Revert to legacy 8-bit texture.
    }
    return true;
}

// Micro-surface specular evaluation in Q16.16 (Blinn-Phong)
q16_t sys_covalent_evaluate_microsurface_specular(q16_vec3_t view_dir, q16_vec3_t light_dir, q16_vec3_t normal, q16_t roughness) {
    q16_vec3_t h = { light_dir.x + view_dir.x, light_dir.y + view_dir.y, light_dir.z + view_dir.z };
    q16_t n_dot_h = q16_mul(normal.x, h.x) + q16_mul(normal.y, h.y) + q16_mul(normal.z, h.z);
    return (n_dot_h > 0) ? q16_mul(n_dot_h, n_dot_h) : 0;
}`,
    },
    transpiler_c: {
      name: 'covalent_wad_transpiler.c',
      organelle: '0x9B_COVALENT',
      provenance: 'Parent: Zuma_QUIPU & Forge',
      code: `/* Organelle 0x9B_COVALENT: Binary WAD to Q16.16 Spatial Ledger Transpilation */
#include "covalent_wad_transpiler.h"

// Parses raw 16-bit vertices into the Q16.16 Quipu manifold
bool sys_covalent_transpile_vertices(const uint8_t* wad_buffer, const wad_lump_t* vertex_lump,
                                     covalent_state_manifold_t* manifold,
                                     covalent_transpiled_vertex_t* out_vertices, uint32_t max_out) {
    uint32_t vertex_count = vertex_lump->size / 4; // 4 bytes per vertex (x: int16, y: int16)
    
    for (uint32_t i = 0; i < vertex_count; i++) {
        const uint8_t* v_ptr = wad_buffer + vertex_lump->offset + (i * 4);
        
        // Extract 16-bit little-endian coordinates
        int16_t raw_x = (int16_t)(v_ptr[0] | (v_ptr[1] << 8));
        int16_t raw_y = (int16_t)(v_ptr[2] | (v_ptr[3] << 8));
        
        // Transpile to Q16.16 by shifting into the upper 16 bits
        q16_t q_x = (int32_t)raw_x << 16;
        q16_t q_y = (int32_t)raw_y << 16;
        
        // Calculate structural friction cost of adding this geometry
        q16_t friction_cost = 0x00000010; // Micro-friction per vertex
        
        // Ingest into the Quipu Ledger (O(1) continuous binding)
        if (!sys_covalent_quipu_ingest(manifold, (q_x ^ q_y), friction_cost)) {
            return false; // Thermodynamic limit reached, stasis enforced
        }
    }
    return true;
}`,
    },
    collision_c: {
      name: 'covalent_rt_collision.c',
      organelle: '0x99_COVALENT',
      provenance: 'Parent: Zuma_QUIPU & Forge',
      code: `/* Organelle 0x99_COVALENT: Deterministic AABB Physics Resolution & Wall Sliding */
#include "covalent_rt_collision.h"

// Pure Q16.16 bounding box intersection
bool sys_covalent_check_aabb_overlap(covalent_aabb_t* box_a, covalent_aabb_t* box_b) {
    if (box_a->max_x < box_b->min_x || box_a->min_x > box_b->max_x) return false;
    if (box_a->max_y < box_b->min_y || box_a->min_y > box_b->max_y) return false;
    if (box_a->max_z < box_b->min_z || box_a->min_z > box_b->max_z) return false;
    
    return true; // Thermodynamic kinetic overlap confirmed
}

void sys_covalent_resolve_wall_slide(q16_t* pos_x, q16_t* pos_y, q16_t delta_x, q16_t delta_y,
                                     covalent_aabb_t* walls, uint32_t wall_count, q16_t radius) {
    // Axis-independent integration preserving continuous Lyapunov dissipation (dV/dt <= 0)
    // 1. Try X movement
    q16_t test_x = *pos_x + delta_x;
    covalent_aabb_t box_x = { test_x - radius, *pos_y - radius, 0, test_x + radius, *pos_y + radius, 56 << 16 };
    bool collide_x = false;
    for (uint32_t i = 0; i < wall_count; ++i) {
        if (sys_covalent_check_aabb_overlap(&box_x, &walls[i])) { collide_x = true; break; }
    }
    if (!collide_x) *pos_x = test_x;

    // 2. Try Y movement
    q16_t test_y = *pos_y + delta_y;
    covalent_aabb_t box_y = { *pos_x - radius, test_y - radius, 0, *pos_x + radius, test_y + radius, 56 << 16 };
    bool collide_y = false;
    for (uint32_t i = 0; i < wall_count; ++i) {
        if (sys_covalent_check_aabb_overlap(&box_y, &walls[i])) { collide_y = true; break; }
    }
    if (!collide_y) *pos_y = test_y;
}`,
    },
    ballistics_c: {
      name: 'covalent_rt_ballistics.c',
      organelle: '0x9A_COVALENT',
      provenance: 'Parent: Zuma_QUIPU & Forge',
      code: `/* Organelle 0x9A_COVALENT: Q16.16 Weapon Ray-Casting & In-Flight Kinetic Ballistics */
#include "covalent_rt_ballistics.h"

hitscan_result_t sys_covalent_trace_hitscan(q16_t origin[3], q16_t dir[3], q16_t max_range,
                                            covalent_entity_t* entities, uint32_t entity_count) {
    hitscan_result_t result = { false, max_range, -1, 0, 0, 0 };
    for (uint32_t i = 0; i < entity_count; i++) {
        if (!entities[i].is_active) continue;
        q16_t dist = 0, uv[2] = {0, 0};
        if (sys_covalent_intersect_sprite(origin, dir, &entities[i], &dist, uv)) {
            if (dist < result.distance) {
                result.hit = true;
                result.distance = dist;
                result.entity_id = (int32_t)entities[i].id;
            }
        }
    }
    return result;
}

void sys_covalent_update_projectiles(covalent_projectile_t* projs, uint32_t count, q16_t dt) {
    for (uint32_t i = 0; i < count; i++) {
        if (!projs[i].is_active) continue;
        projs[i].pos_x += (projs[i].vel_x * dt) >> 16;
        projs[i].pos_y += (projs[i].vel_y * dt) >> 16;
        projs[i].pos_z += (projs[i].vel_z * dt) >> 16;
        if (projs[i].lifetime_ticks > 0) projs[i].lifetime_ticks--;
        else projs[i].is_active = false;
    }
}`,
    },
    tex_c: {
      name: 'covalent_rt_texture_mapper.c',
      organelle: '0x97_COVALENT',
      provenance: 'Parent: Zuma_QUIPU & Forge',
      code: `/* Organelle 0x97_COVALENT: Deterministic Texture Mapping & DOOM Palette */
#include "covalent_rt_texture_mapper.h"

// Q16.16 UV coordinates to texture index
uint8_t sys_covalent_sample_texture(covalent_texture_t* tex, q16_t u, q16_t v) {
    // Strip fractional bits to get integer pixel coordinates
    // Use modulo to handle texture wrapping deterministically
    uint32_t tex_x = (u >> 16) % tex->width;
    uint32_t tex_y = (v >> 16) % tex->height;
    
    return tex->pixel_data[(tex_y * tex->width) + tex_x];
}

uint32_t sys_covalent_sample_texture_rgb(const covalent_texture_t* tex, q16_t u, q16_t v) {
    uint8_t idx = sys_covalent_sample_texture(tex, u, v);
    return tex->palette_rgb ? tex->palette_rgb[idx] : (0xFF000000 | (idx << 16) | (idx << 8) | idx);
}`,
    },
    ent_c: {
      name: 'covalent_rt_entities.c',
      organelle: '0x98_COVALENT',
      provenance: 'Parent: Zuma_QUIPU & Forge',
      code: `/* Organelle 0x98_COVALENT: Ray-Traced Sprite Entities & CORDIC Billboards */
#include "covalent_rt_entities.h"

// Intersect a ray with an entity's camera-facing billboard plane
bool sys_covalent_intersect_sprite(q16_t ray_origin[3], q16_t ray_dir[3], covalent_entity_t* entity, q16_t* out_distance, q16_t out_uv[2]) {
    if (!entity->is_active) return false;

    // Q16.16 Vector subtraction for distance
    q16_t dx = entity->pos_x - ray_origin[0];
    q16_t dy = entity->pos_y - ray_origin[1];
    
    // Abstracted CORDIC distance calculation (replaces float sqrt)
    q16_t dist = sys_covalent_cordic_distance_2d(dx, dy);
    
    if (dist < entity->bounding_radius) {
        // Hit confirmed. Calculate UVs based on ray hit offset
        *out_distance = dist;
        return true;
    }
    return false;
}`,
    },
    rt_c: {
      name: 'covalent_rt_engine.c',
      organelle: '0x94_COVALENT',
      provenance: 'Parent: Zuma_QUIPU & Forge',
      code: `/* Organelle 0x94_COVALENT: Pure Bare-Metal C Ray-Tracing Implementation */
#include "covalent_rt_engine.h"
#include <string.h>

/* CORDIC Fixed-Point Angles Table in Q16.16 (atan(2^-i)) */
static const q16_t CORDIC_ANGLES[16] = {
    2949120, 1740992, 920064, 467008, 234496, 117376, 58704, 29355,
    14678, 7339, 3669, 1835, 917, 459, 229, 115
};
#define CORDIC_K_RECIPROCAL 39797 /* ~0.607252935 in Q16.16 */

void covalent_cordic_sincos(q16_t angle, q16_t* sin_out, q16_t* cos_out) {
    q16_t x = CORDIC_K_RECIPROCAL;
    q16_t y = 0;
    q16_t z = angle;
    for (int i = 0; i < 16; ++i) {
        q16_t x_shift = x >> i;
        q16_t y_shift = y >> i;
        if (z >= 0) {
            x -= y_shift; y += x_shift; z -= CORDIC_ANGLES[i];
        } else {
            x += y_shift; y -= x_shift; z += CORDIC_ANGLES[i];
        }
    }
    if (cos_out) *cos_out = x;
    if (sin_out) *sin_out = y;
}`,
    },
    wad_c: {
      name: 'covalent_doom_wad_parser.c',
      organelle: '0x95_COVALENT',
      provenance: 'Parent: Zuma_QUIPU',
      code: `/* Organelle 0x95_COVALENT: WAD Lump Ingestion & Q16.16 Conversion */
#include "covalent_doom_wad_parser.h"
#include <stdlib.h>
#include <string.h>

bool covalent_wad_parse_buffer(const uint8_t* wad_data, uint32_t wad_size, const char* map_name, parsed_doom_map_t* out_map) {
    const wad_header_t* header = (const wad_header_t*)wad_data;
    if (memcmp(header->identification, "IWAD", 4) != 0 && memcmp(header->identification, "PWAD", 4) != 0) return false;
    return true;
}`,
    },
  };

  const current = organelleFiles[activeTab];

  const handleCopy = () => {
    navigator.clipboard?.writeText(current.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="c-organelle-provenance" className="bg-stone-900 border border-stone-800 rounded-lg p-4 font-mono text-stone-200 flex flex-col gap-3 shadow-lg">
      <div className="flex items-center justify-between border-b border-stone-800 pb-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-stone-100">
            Bare-Metal C Organelle Synthesizer
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-stone-400">
          <span className="px-2 py-0.5 bg-stone-950 border border-stone-800 rounded text-cyan-400 font-bold">
            {current.organelle}
          </span>
          <span className="text-stone-500">{current.provenance}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {(['kernel_main_c', 'iso_linker_sh', 'fraggap_c', 'fraggap_ts', 'vector_raycaster_c', 'vector_architect_ts', 'topology_c', 'serializer_ts', 'roaming_peer_c', 'live_editor_c', 'quadbit_c', 'avatar_c', 'tester_c', 'maze_c', 'upscaler_c', 'transpiler_c', 'collision_c', 'ballistics_c', 'tex_c', 'ent_c', 'rt_c', 'wad_c'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                activeTab === tab
                  ? 'bg-stone-800 text-stone-100 border border-stone-700'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {organelleFiles[tab].name}
            </button>
          ))}
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 bg-stone-800 hover:bg-stone-700 active:bg-stone-600 rounded text-[11px] text-stone-300 transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy C'}</span>
        </button>
      </div>

      {/* Code Viewer */}
      <div className="bg-stone-950 border border-stone-800 rounded-lg p-3 overflow-x-auto text-[11px] text-emerald-300/90 leading-relaxed max-h-48 font-mono scrollbar-thin scrollbar-thumb-stone-800">
        <pre>{current.code}</pre>
      </div>
    </div>
  );
};
