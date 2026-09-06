/**
 * @file covalent_topology_verifier.h
 * @brief Organelle 0xAA_COVALENT: Topological Path & AABB Anti-Clipping Verifier
 * @provenance Parent: Zuma_QUIPU & Forge Evolutionary Branch
 * @invariants 1 === 1, Continuous Q16.16 AABB Clearance, Contiguous Flow (dV/dt <= 0)
 */

#ifndef COVALENT_TOPOLOGY_VERIFIER_H
#define COVALENT_TOPOLOGY_VERIFIER_H

#include "covalent_quadbit_format.h"
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

#define COVALENT_MAX_VERIFIER_WALLS 512
#define COVALENT_GRID_CELL_Q16      0x00400000 // 64.0 in Q16.16
#define COVALENT_AVATAR_RADIUS_Q16  0x00100000 // 16.0 in Q16.16
#define COVALENT_FLOODFILL_STACK    1024

typedef struct {
    q16_t start_x;
    q16_t start_y;
    q16_t end_x;
    q16_t end_y;
    uint32_t flags; // 0x01: blocking, 0x02: door, 0x04: impassable
} covalent_wall_t;

typedef struct {
    q16_t pos_x;
    q16_t pos_y;
    q16_t bounding_radius;
    uint32_t entity_type;
} covalent_entity_t;

typedef struct {
    bool is_contiguous;
    bool is_clipping_free;
    q16_t min_clearance_dist;
    uint32_t reachable_nodes;
    uint32_t total_nodes;
    uint32_t topological_merkle_root;
} covalent_topology_report_t;

// C-Kernel Interface Functions
q16_t sys_covalent_cordic_distance_to_line(q16_t px, q16_t py, q16_t x1, q16_t y1, q16_t x2, q16_t y2);
bool sys_covalent_verify_aabb_clearance(covalent_entity_t* avatar, q16_t map_bounds[4]);
bool sys_covalent_execute_cordic_floodfill(q16_t spawn_x, q16_t spawn_y, q16_t exit_x, q16_t exit_y, q16_t radius);
bool sys_covalent_verify_manifold_integrity(void);

// Wall & Virtual Tester Helpers
uint32_t sys_covalent_get_wall_count(void);
covalent_wall_t* sys_covalent_get_wall(uint32_t index);
void sys_covalent_set_wall(uint32_t index, q16_t x1, q16_t y1, q16_t x2, q16_t y2, uint32_t flags);
covalent_entity_t* sys_covalent_spawn_virtual_tester(void);
void sys_covalent_destroy_entity(covalent_entity_t* avatar);
void sys_covalent_set_spawn_exit(q16_t sx, q16_t sy, q16_t ex, q16_t ey);
covalent_topology_report_t sys_covalent_get_topology_report(void);

#ifdef __cplusplus
}
#endif

#endif // COVALENT_TOPOLOGY_VERIFIER_H
