/**
 * @file covalent_demo_spawner.h
 * @brief Organelle 0x9D_COVALENT: Topological Maze Synthesis & Strict AABB Boundary Invariants
 * @provenance Parent: Zuma_QUIPU & Forge Evolutionary Branch
 * @invariants 1 === 1, Zero-Float Substrate, Monotone Lyapunov Projection (dV/dt <= 0)
 */

#ifndef COVALENT_DEMO_SPAWNER_H
#define COVALENT_DEMO_SPAWNER_H

#include "covalent_rt_engine.h"
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/* 3-Tier Adversarial Entity Identifiers */
#define ENTITY_ZOMBIEMAN 1  /* Hitscan ray-casting, immediate LOS referee calculation */
#define ENTITY_IMP       2  /* Projectile physics, moving point-light source */
#define ENTITY_DEMON     3  /* Melee pathfinding, close-quarters AABB kinetic push */

/* Generative PBR Material Tokens */
#define TEX_STARTAN_PBR  0x9C01  /* 1024x1024 Albedo/Normal/Roughness micro-surface */
#define TEX_FLOOR4_8     0x9C02  /* High-roughness metallic structure */
#define TEX_CEIL5_1      0x9C03  /* Global emissive photon attenuation surface */

/* Labyrinth Dimensions (16x16 Grid: -256 to +256 in Q16.16) */
#define MAZE_BOUND_MIN_X (-0x01000000)  /* -256.0 Q16.16 */
#define MAZE_BOUND_MAX_X ( 0x01000000)  /* +256.0 Q16.16 */
#define MAZE_BOUND_MIN_Y (-0x01000000)  /* -256.0 Q16.16 */
#define MAZE_BOUND_MAX_Y ( 0x01000000)  /* +256.0 Q16.16 */

#define MAZE_FLOOR_Z     ( 0x00000000)  /* Z=0 Q16.16 */
#define MAZE_CEILING_Z   ( 0x00800000)  /* Z=128 Q16.16 */

typedef struct {
    q16_t z_floor;
    q16_t z_ceiling;
    q16_t min_x;
    q16_t max_x;
    q16_t min_y;
    q16_t max_y;
    uint32_t wall_count;
    uint32_t entity_count;
    bool outer_hull_locked;
} covalent_maze_state_t;

/* Boundary Enforcement API */
void sys_covalent_set_z_bounds(q16_t z_min, q16_t z_max);
void sys_covalent_spawn_wall(q16_t x0, q16_t y0, q16_t x1, q16_t y1, uint32_t tex_id);
void sys_covalent_spawn_entity(uint32_t type, q16_t x, q16_t y);

/* Core Synthesis Sequence */
void sys_covalent_generate_maze_manifold(void);

/* Kinetic Projection & Velocity Stripping */
bool sys_covalent_check_outer_boundary(q16_vec3_t* pos, q16_vec3_t* vel);
void sys_covalent_project_monotone_lyapunov_z(q16_vec3_t* pos, q16_t* vel_z);

/* Global State Access */
const covalent_maze_state_t* sys_covalent_get_maze_state(void);

#ifdef __cplusplus
}
#endif

#endif /* COVALENT_DEMO_SPAWNER_H */
