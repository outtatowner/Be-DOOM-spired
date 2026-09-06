/**
 * @file covalent_rt_collision.h
 * @brief Organelle 0x99_COVALENT: Q16.16 Deterministic Collision (AABB)
 * @provenance Parent: Zuma_QUIPU & Forge Evolutionary Branch
 * @invariants 1 === 1, Continuous Lyapunov Dissipation (dV/dt <= 0), Zero-Float Substrate
 */

#ifndef COVALENT_RT_COLLISION_H
#define COVALENT_RT_COLLISION_H

#include "covalent_rt_engine.h"
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    q16_t min_x, min_y, min_z;
    q16_t max_x, max_y, max_z;
} covalent_aabb_t;

/* Pure Q16.16 bounding box intersection */
bool sys_covalent_check_aabb_overlap(const covalent_aabb_t* box_a, const covalent_aabb_t* box_b);

/* Create AABB centered at (x, y, z) with half-extents (hx, hy, hz) */
covalent_aabb_t sys_covalent_create_aabb(q16_t x, q16_t y, q16_t z, q16_t hx, q16_t hy, q16_t hz);

/* Resolve AABB collision between moving entity and stationary obstacle */
bool sys_covalent_resolve_aabb_slide(
    covalent_aabb_t* mover,
    q16_vec3_t* move_delta,
    const covalent_aabb_t* obstacle
);

#ifdef __cplusplus
}
#endif

#endif /* COVALENT_RT_COLLISION_H */
