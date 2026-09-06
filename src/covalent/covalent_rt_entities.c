/**
 * @file covalent_rt_entities.c
 * @brief Organelle 0x98_COVALENT: Ray-Traced Sprite Entities & Billboard Ray Intersections
 * @provenance Parent: Zuma_QUIPU & Forge Evolutionary Branch
 * @invariants 1 === 1, Continuous Lyapunov Dissipation (dV/dt <= 0), Zero-Float Substrate
 */

#include "covalent_rt_entities.h"

/* CORDIC distance calculation (replaces float sqrt) */
q16_t sys_covalent_cordic_distance_2d(q16_t dx, q16_t dy) {
    q16_t x = q16_abs(dx);
    q16_t y = q16_abs(dy);

    /* 8 iterations of vectoring CORDIC to rotate (x, y) into (r, 0) */
    for (int i = 0; i < 8; ++i) {
        q16_t x_shift = x >> i;
        q16_t y_shift = y >> i;
        if (y > 0) {
            x += y_shift;
            y -= x_shift;
        } else {
            x -= y_shift;
            y += x_shift;
        }
    }
    /* Multiply by inverse CORDIC gain (~0.60725) */
    return q16_mul(x, 39797);
}

/* Intersect a ray with an entity's camera-facing billboard plane */
bool sys_covalent_intersect_sprite(
    const q16_t ray_origin[3],
    const q16_t ray_dir[3],
    const covalent_entity_t* entity,
    q16_t* out_distance,
    q16_t out_uv[2]
) {
    if (!entity || !entity->is_active) return false;

    /* Q16.16 Vector subtraction for horizontal distance */
    q16_t dx = entity->pos_x - ray_origin[0];
    q16_t dy = entity->pos_y - ray_origin[1];
    q16_t dz = entity->pos_z - ray_origin[2];

    /* Project entity center along ray direction */
    q16_t t_proj = q16_mul(dx, ray_dir[0]) + q16_mul(dy, ray_dir[1]) + q16_mul(dz, ray_dir[2]);
    if (t_proj <= 0) return false;

    /* Closest point on ray to entity center */
    q16_t close_x = ray_origin[0] + q16_mul(ray_dir[0], t_proj);
    q16_t close_y = ray_origin[1] + q16_mul(ray_dir[1], t_proj);
    q16_t close_z = ray_origin[2] + q16_mul(ray_dir[2], t_proj);

    /* Distance from ray to entity center */
    q16_t miss_x = close_x - entity->pos_x;
    q16_t miss_y = close_y - entity->pos_y;
    q16_t miss_z = close_z - entity->pos_z;

    q16_t dist_2d = sys_covalent_cordic_distance_2d(miss_x, miss_y);
    q16_t total_dist = sys_covalent_cordic_distance_2d(dist_2d, miss_z);

    if (total_dist < entity->bounding_radius) {
        /* Hit confirmed. Calculate UVs based on ray hit offset */
        if (out_distance) *out_distance = t_proj;
        if (out_uv) {
            /* Map [-radius, +radius] to [0, width], [0, height] in Q16 */
            q16_t half_rad = entity->bounding_radius;
            q16_t norm_u = q16_div(miss_x + half_rad, half_rad << 1);
            q16_t norm_v = q16_div(miss_z + half_rad, half_rad << 1);
            out_uv[0] = q16_mul(norm_u, q16_from_int(64));
            out_uv[1] = q16_mul(norm_v, q16_from_int(64));
        }
        return true;
    }

    return false;
}
