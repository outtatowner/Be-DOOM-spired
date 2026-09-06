/**
 * @file covalent_demo_spawner.c
 * @brief Organelle 0x9D_COVALENT: Topological Maze Synthesis & Strict AABB Boundary Invariants
 * @provenance Parent: Zuma_QUIPU & Forge Evolutionary Branch
 * @invariants 1 === 1, Zero-Float Substrate, Monotone Lyapunov Projection (dV/dt <= 0)
 */

#include "covalent_demo_spawner.h"
#include "covalent_quipu_ledger.h"
#include <string.h>

static covalent_maze_state_t g_maze_state = {
    .z_floor = MAZE_FLOOR_Z,
    .z_ceiling = MAZE_CEILING_Z,
    .min_x = MAZE_BOUND_MIN_X,
    .max_x = MAZE_BOUND_MAX_X,
    .min_y = MAZE_BOUND_MIN_Y,
    .max_y = MAZE_BOUND_MAX_Y,
    .wall_count = 0,
    .entity_count = 0,
    .outer_hull_locked = false
};

void sys_covalent_set_z_bounds(q16_t z_min, q16_t z_max) {
    g_maze_state.z_floor = z_min;
    g_maze_state.z_ceiling = z_max;
}

void sys_covalent_spawn_wall(q16_t x0, q16_t y0, q16_t x1, q16_t y1, uint32_t tex_id) {
    (void)x0; (void)y0; (void)x1; (void)y1; (void)tex_id;
    g_maze_state.wall_count++;
    
    // Ingest wall construction footprint into Quipu ledger
    q16_t wall_friction = 0x00010000; // 1.0 in Q16
    sys_covalent_quipu_ingest(sys_get_manifold(), (q16_t)(x0 ^ y1), wall_friction);
}

void sys_covalent_spawn_entity(uint32_t type, q16_t x, q16_t y) {
    (void)type; (void)x; (void)y;
    g_maze_state.entity_count++;

    // Ingest adversarial entity injection into spatial ledger
    q16_t entity_entropy_cost = (type == ENTITY_DEMON) ? 0x00030000 : 0x00020000;
    sys_covalent_quipu_ingest(sys_get_manifold(), (q16_t)(type << 16 | (x & 0xffff)), entity_entropy_cost);
}

/**
 * Monotone Lyapunov Projection: Vertical kinetic vectors exceeding [Z=0, Z=128]
 * are strictly clamped and vertical velocity is instantaneously dissipated.
 */
void sys_covalent_project_monotone_lyapunov_z(q16_vec3_t* pos, q16_t* vel_z) {
    if (pos->z < g_maze_state.z_floor) {
        pos->z = g_maze_state.z_floor;
        if (vel_z && *vel_z < 0) *vel_z = 0; // Dissipate downward velocity
    } else if (pos->z > g_maze_state.z_ceiling) {
        pos->z = g_maze_state.z_ceiling;
        if (vel_z && *vel_z > 0) *vel_z = 0; // Dissipate ceiling impact velocity
    }
}

/**
 * Outer Hull Boundary Enforcement:
 * Maze encased in rigid 16x16 sector grid.
 * Perimeter linedefs strip all forward velocity upon collision to preserve spatial ledger.
 */
bool sys_covalent_check_outer_boundary(q16_vec3_t* pos, q16_vec3_t* vel) {
    bool collision = false;
    q16_t margin = 0x00100000; // 16.0 margin in Q16

    if (pos->x <= g_maze_state.min_x + margin) {
        pos->x = g_maze_state.min_x + margin;
        if (vel && vel->x < 0) vel->x = 0;
        collision = true;
    } else if (pos->x >= g_maze_state.max_x - margin) {
        pos->x = g_maze_state.max_x - margin;
        if (vel && vel->x > 0) vel->x = 0;
        collision = true;
    }

    if (pos->y <= g_maze_state.min_y + margin) {
        pos->y = g_maze_state.min_y + margin;
        if (vel && vel->y < 0) vel->y = 0;
        collision = true;
    } else if (pos->y >= g_maze_state.max_y - margin) {
        pos->y = g_maze_state.max_y - margin;
        if (vel && vel->y > 0) vel->y = 0;
        collision = true;
    }

    return collision;
}

const covalent_maze_state_t* sys_covalent_get_maze_state(void) {
    return &g_maze_state;
}

/**
 * [SYSTEM DIRECTIVE: TOPOLOGICAL MAZE SYNTHESIS]
 * Organelle 0x9D_COVALENT Initialization Sequence
 */
void sys_covalent_generate_maze_manifold(void) {
    // 1. Lock absolute Floor (Z=0) and Ceiling (Z=128) constraints
    sys_covalent_set_z_bounds(MAZE_FLOOR_Z, MAZE_CEILING_Z);

    // 2. Spawn impassable perimeter to prevent Void clipping
    sys_covalent_spawn_wall(-0x01000000, -0x01000000,  0x01000000, -0x01000000, TEX_STARTAN_PBR); // South
    sys_covalent_spawn_wall( 0x01000000, -0x01000000,  0x01000000,  0x01000000, TEX_STARTAN_PBR); // East
    sys_covalent_spawn_wall( 0x01000000,  0x01000000, -0x01000000,  0x01000000, TEX_STARTAN_PBR); // North
    sys_covalent_spawn_wall(-0x01000000,  0x01000000, -0x01000000, -0x01000000, TEX_STARTAN_PBR); // West
    g_maze_state.outer_hull_locked = true;

    // 3. Generate internal geometry for occlusion and collision testing
    sys_covalent_spawn_wall(-0x00800000, -0x00800000, -0x00800000,  0x00800000, TEX_STARTAN_PBR); // Central Pillar Left
    sys_covalent_spawn_wall( 0x00800000, -0x00800000,  0x00800000,  0x00800000, TEX_STARTAN_PBR); // Central Pillar Right

    // Non-convex internal labyrinth segments (chicanes & occlusion baffles)
    sys_covalent_spawn_wall(-0x00800000,  0x00000000, -0x00200000,  0x00000000, TEX_STARTAN_PBR); // West Chicane
    sys_covalent_spawn_wall( 0x00200000,  0x00000000,  0x00800000,  0x00000000, TEX_STARTAN_PBR); // East Chicane
    sys_covalent_spawn_wall( 0x00000000, -0x00600000,  0x00000000, -0x00200000, TEX_STARTAN_PBR); // South Baffle

    // 4. Inject Entities into the Spatial Ledger
    sys_covalent_spawn_entity(ENTITY_ZOMBIEMAN,  0x00400000,  0x00400000); // Hitscan LOS
    sys_covalent_spawn_entity(ENTITY_IMP,       -0x00200000,  0x00500000); // Projectile + Moving Light
    sys_covalent_spawn_entity(ENTITY_DEMON,      0x00000000, -0x00800000); // Melee AABB Kinetic Push
}
