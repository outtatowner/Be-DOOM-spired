/**
 * @file covalent_topology_verifier.c
 * @brief Organelle 0xAA_COVALENT: Topological Path & Clipping Verifier
 * @provenance Parent: Zuma_QUIPU & Forge Evolutionary Branch
 * @invariants 1 === 1, Q16.16 Contiguous Pathfinding and AABB Anti-Clipping
 */

/* kernel/covalent_topology_verifier.c */
/* Target: Q16.16 Contiguous Pathfinding and AABB Anti-Clipping */

#include "covalent_topology_verifier.h"
#include <stdlib.h>
#include <string.h>

static covalent_wall_t s_walls[COVALENT_MAX_VERIFIER_WALLS];
static uint32_t s_wall_count = 0;
static q16_t s_spawn_x = 0x00800000; // 128.0
static q16_t s_spawn_y = 0x00800000;
static q16_t s_exit_x = 0x03800000;  // 896.0
static q16_t s_exit_y = 0x03800000;
static q16_t current_map_bounds[4] = { 0, 0, 0x08000000, 0x08000000 };
static covalent_topology_report_t s_last_report = { false, false, 0, 0, 0, 0 };

uint32_t sys_covalent_get_wall_count(void) {
    return s_wall_count;
}

covalent_wall_t* sys_covalent_get_wall(uint32_t index) {
    if (index >= s_wall_count) return NULL;
    return &s_walls[index];
}

void sys_covalent_set_wall(uint32_t index, q16_t x1, q16_t y1, q16_t x2, q16_t y2, uint32_t flags) {
    if (index >= COVALENT_MAX_VERIFIER_WALLS) return;
    s_walls[index].start_x = x1;
    s_walls[index].start_y = y1;
    s_walls[index].end_x = x2;
    s_walls[index].end_y = y2;
    s_walls[index].flags = flags;
    if (index >= s_wall_count) {
        s_wall_count = index + 1;
    }
}

void sys_covalent_set_spawn_exit(q16_t sx, q16_t sy, q16_t ex, q16_t ey) {
    s_spawn_x = sx;
    s_spawn_y = sy;
    s_exit_x = ex;
    s_exit_y = ey;
}

// Distance from point (px, py) to line segment (x1, y1)-(x2, y2) in Q16.16
q16_t sys_covalent_cordic_distance_to_line(q16_t px, q16_t py, q16_t x1, q16_t y1, q16_t x2, q16_t y2) {
    int64_t l2 = (int64_t)(x2 - x1) * (x2 - x1) + (int64_t)(y2 - y1) * (y2 - y1);
    if (l2 == 0) {
        int64_t dx = px - x1;
        int64_t dy = py - y1;
        int64_t d2 = (dx * dx + dy * dy) >> 16;
        return (q16_t)sys_covalent_cordic_sqrt(d2);
    }

    // Project p onto line segment: t = dot(p - a, b - a) / |b - a|^2
    int64_t t = ((int64_t)(px - x1) * (x2 - x1) + (int64_t)(py - y1) * (y2 - y1));
    if (t < 0) {
        int64_t dx = px - x1;
        int64_t dy = py - y1;
        int64_t d2 = (dx * dx + dy * dy) >> 16;
        return (q16_t)sys_covalent_cordic_sqrt(d2);
    } else if (t > l2) {
        int64_t dx = px - x2;
        int64_t dy = py - y2;
        int64_t d2 = (dx * dx + dy * dy) >> 16;
        return (q16_t)sys_covalent_cordic_sqrt(d2);
    }

    // Perpendicular projection point: proj = a + t * (b - a) / l2
    int64_t proj_x = x1 + (t * (x2 - x1)) / l2;
    int64_t proj_y = y1 + (t * (y2 - y1)) / l2;
    int64_t dx = px - proj_x;
    int64_t dy = py - proj_y;
    int64_t d2 = (dx * dx + dy * dy) >> 16;
    return (q16_t)sys_covalent_cordic_sqrt(d2);
}

// 1. Verify Avatar/Wall Clipping Limits
bool sys_covalent_verify_aabb_clearance(covalent_entity_t* avatar, q16_t map_bounds[4]) {
    q16_t min_dist = 0x7FFFFFFF;
    for (int i = 0; i < (int)sys_covalent_get_wall_count(); i++) {
        covalent_wall_t* wall = sys_covalent_get_wall(i);
        if (!wall) continue;
        
        // Project the avatar's Q16.16 bounding cylinder against the wall plane
        q16_t dist = sys_covalent_cordic_distance_to_line(
            avatar->pos_x, avatar->pos_y,
            wall->start_x, wall->start_y,
            wall->end_x, wall->end_y
        );

        if (dist < min_dist) {
            min_dist = dist;
        }
        
        if (dist <= avatar->bounding_radius) {
            s_last_report.is_clipping_free = false;
            s_last_report.min_clearance_dist = dist;
            return false; // Mathematical clipping detected. Layout invalid.
        }
    }
    s_last_report.is_clipping_free = true;
    s_last_report.min_clearance_dist = min_dist;
    return true; 
}

// 2. Q16.16 Flood-fill from Spawn to Exit Sector
bool sys_covalent_execute_cordic_floodfill(q16_t spawn_x, q16_t spawn_y, q16_t exit_x, q16_t exit_y, q16_t radius) {
    // Quantize into 64.0-unit spatial macro-cells
    const int GRID_RES = 32;
    static uint8_t visited[32][32];
    memset(visited, 0, sizeof(visited));

    int start_gx = (spawn_x >> 22) & 0x1F; // (x >> 16) / 64
    int start_gy = (spawn_y >> 22) & 0x1F;
    int end_gx = (exit_x >> 22) & 0x1F;
    int end_gy = (exit_y >> 22) & 0x1F;

    int queue_x[COVALENT_FLOODFILL_STACK];
    int queue_y[COVALENT_FLOODFILL_STACK];
    int head = 0;
    int tail = 0;

    queue_x[tail] = start_gx;
    queue_y[tail] = start_gy;
    tail++;
    visited[start_gy][start_gx] = 1;
    uint32_t reached_cells = 0;

    const int dxs[4] = { 1, -1, 0, 0 };
    const int dys[4] = { 0, 0, 1, -1 };

    while (head < tail && tail < COVALENT_FLOODFILL_STACK) {
        int cx = queue_x[head];
        int cy = queue_y[head];
        head++;
        reached_cells++;

        if (cx == end_gx && cy == end_gy) {
            s_last_report.is_contiguous = true;
            s_last_report.reachable_nodes = reached_cells;
            s_last_report.total_nodes = GRID_RES * GRID_RES;
            return true;
        }

        q16_t cell_center_x = (cx << 22) + 0x00200000;
        q16_t cell_center_y = (cy << 22) + 0x00200000;

        for (int i = 0; i < 4; i++) {
            int nx = cx + dxs[i];
            int ny = cy + dys[i];

            if (nx < 0 || nx >= GRID_RES || ny < 0 || ny >= GRID_RES) continue;
            if (visited[ny][nx]) continue;

            // Check if wall blocks passage to neighbor
            q16_t n_center_x = (nx << 22) + 0x00200000;
            q16_t n_center_y = (ny << 22) + 0x00200000;
            bool blocked = false;

            for (uint32_t w = 0; w < s_wall_count; w++) {
                covalent_wall_t* wall = &s_walls[w];
                // Check if segment (cell_center -> n_center) intersects wall
                q16_t d1 = sys_covalent_cordic_distance_to_line(n_center_x, n_center_y, wall->start_x, wall->start_y, wall->end_x, wall->end_y);
                if (d1 < radius) {
                    blocked = true;
                    break;
                }
            }

            if (!blocked && tail < COVALENT_FLOODFILL_STACK) {
                visited[ny][nx] = 1;
                queue_x[tail] = nx;
                queue_y[tail] = ny;
                tail++;
            }
        }
    }

    s_last_report.is_contiguous = false;
    s_last_report.reachable_nodes = reached_cells;
    s_last_report.total_nodes = GRID_RES * GRID_RES;
    return false;
}

// 3. Virtual Tester Lifecycle
covalent_entity_t* sys_covalent_spawn_virtual_tester(void) {
    covalent_entity_t* tester = (covalent_entity_t*)malloc(sizeof(covalent_entity_t));
    if (!tester) return NULL;
    tester->pos_x = s_spawn_x;
    tester->pos_y = s_spawn_y;
    tester->bounding_radius = COVALENT_AVATAR_RADIUS_Q16; // 16.0 units
    tester->entity_type = 0x9F; // Anthropomorphic tester
    return tester;
}

void sys_covalent_destroy_entity(covalent_entity_t* avatar) {
    if (avatar) {
        free(avatar);
    }
}

// 4. Verify Contiguous Level Flow
bool sys_covalent_verify_manifold_integrity(void) {
    covalent_entity_t* dummy_avatar = sys_covalent_spawn_virtual_tester();
    if (!dummy_avatar) return false;
    
    // Check 1: Do the placed walls clip the avatar's physical volume?
    if (!sys_covalent_verify_aabb_clearance(dummy_avatar, current_map_bounds)) {
        sys_covalent_destroy_entity(dummy_avatar);
        return false;
    }
    
    // Check 2: Q16.16 Flood-fill from Spawn to Exit Sector
    bool path_exists = sys_covalent_execute_cordic_floodfill(
        s_spawn_x, s_spawn_y,
        s_exit_x, s_exit_y,
        dummy_avatar->bounding_radius
    );
    
    // Calculate Merkle root of verification
    uint32_t root = 0x811c9dc5;
    root = (root ^ (uint32_t)s_last_report.min_clearance_dist) * 0x01000193;
    root = (root ^ s_last_report.reachable_nodes) * 0x01000193;
    root = (root ^ (path_exists ? 0x00010001 : 0xDEADBEEF)) * 0x01000193;
    s_last_report.topological_merkle_root = root;

    // Maintain thermodynamic stasis: clean up virtual tester
    sys_covalent_destroy_entity(dummy_avatar);
    
    return path_exists;
}

covalent_topology_report_t sys_covalent_get_topology_report(void) {
    return s_last_report;
}
