/**
 * @file covalent_rt_collision.c
 * @brief Organelle 0x99_COVALENT: Deterministic AABB Physics Resolution
 * @provenance Parent: Zuma_QUIPU & Forge Evolutionary Branch
 * @invariants 1 === 1, Continuous Lyapunov Dissipation (dV/dt <= 0), Zero-Float Substrate
 */

#include "covalent_rt_collision.h"

/* Pure Q16.16 bounding box intersection */
bool sys_covalent_check_aabb_overlap(const covalent_aabb_t* box_a, const covalent_aabb_t* box_b) {
    if (!box_a || !box_b) return false;

    if (box_a->max_x < box_b->min_x || box_a->min_x > box_b->max_x) return false;
    if (box_a->max_y < box_b->min_y || box_a->min_y > box_b->max_y) return false;
    if (box_a->max_z < box_b->min_z || box_a->min_z > box_b->max_z) return false;

    return true; /* Thermodynamic kinetic overlap confirmed */
}

/* Create AABB centered at (x, y, z) with half-extents (hx, hy, hz) */
covalent_aabb_t sys_covalent_create_aabb(q16_t x, q16_t y, q16_t z, q16_t hx, q16_t hy, q16_t hz) {
    covalent_aabb_t box;
    box.min_x = x - hx;
    box.max_x = x + hx;
    box.min_y = y - hy;
    box.max_y = y + hy;
    box.min_z = z - hz;
    box.max_z = z + hz;
    return box;
}

/* Resolve AABB collision with wall sliding */
bool sys_covalent_resolve_aabb_slide(
    covalent_aabb_t* mover,
    q16_vec3_t* move_delta,
    const covalent_aabb_t* obstacle
) {
    covalent_aabb_t test_box = *mover;
    test_box.min_x += move_delta->x;
    test_box.max_x += move_delta->x;
    test_box.min_y += move_delta->y;
    test_box.max_y += move_delta->y;

    if (!sys_covalent_check_aabb_overlap(&test_box, obstacle)) {
        return false; /* No collision along trajectory */
    }

    /* Test X-axis alone */
    covalent_aabb_t test_x = *mover;
    test_x.min_x += move_delta->x;
    test_x.max_x += move_delta->x;
    if (sys_covalent_check_aabb_overlap(&test_x, obstacle)) {
        move_delta->x = 0; /* Slide against normal */
    }

    /* Test Y-axis alone */
    covalent_aabb_t test_y = *mover;
    test_y.min_y += move_delta->y;
    test_y.max_y += move_delta->y;
    if (sys_covalent_check_aabb_overlap(&test_y, obstacle)) {
        move_delta->y = 0; /* Slide against normal */
    }

    return true;
}
