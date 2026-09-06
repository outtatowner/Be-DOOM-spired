/**
 * @file covalent_wad_transpiler.h
 * @brief Organelle 0x9B_COVALENT: Binary WAD to Q16.16 Spatial Ledger Transpiler & BVH Builder
 * @provenance Parent: Zuma_QUIPU & Forge Evolutionary Branch
 * @invariants 1 === 1, Continuous Lyapunov Dissipation (dV/dt <= 0), Constant-Space Merkle Binding
 */

#ifndef COVALENT_WAD_TRANSPILER_H
#define COVALENT_WAD_TRANSPILER_H

#include <stdint.h>
#include <stdbool.h>

#define Q16_SHIFT 16
#define Q16_ONE   (1 << Q16_SHIFT)
#define MAX_LUMPS 2048
#define MAX_BVH_DEPTH 16
#define VERTEX_MICRO_FRICTION 0x00000010 // Q16.16 micro-friction cost per vertex

typedef int32_t q16_t;

// WAD Directory Entry Structure
typedef struct {
    uint32_t offset;
    uint32_t size;
    char name[8];
} wad_lump_t;

// Transpiled Continuous Q16.16 Vertex
typedef struct {
    q16_t x;
    q16_t y;
} covalent_transpiled_vertex_t;

// Transpiled Vertical Q16.16 Sector Plane
typedef struct {
    q16_t floor_z;
    q16_t ceiling_z;
    int16_t light_level;
    uint32_t sector_id;
} covalent_transpiled_sector_t;

// Transpiled Rigid Mathematical Linedef Quad
typedef struct {
    uint32_t v1_idx;
    uint32_t v2_idx;
    uint16_t flags;
    int16_t front_sector;
    int16_t back_sector;
    q16_t length;
} covalent_transpiled_linedef_t;

// Bounding Volume Hierarchy (BVH) Node for Q16.16 Ray Acceleration
typedef struct {
    q16_t min_x, min_y, min_z;
    q16_t max_x, max_y, max_z;
    int32_t left_child;
    int32_t right_child;
    uint32_t quad_offset;
    uint32_t quad_count;
    bool is_leaf;
} covalent_bvh_node_t;

// Quipu State Manifold for Continuous Ledger Tracking
typedef struct {
    uint32_t quipu_hash_root;
    q16_t accumulated_friction;
    q16_t friction_capacity; // Lyapunov ceiling
    uint32_t vertex_count;
    uint32_t sector_count;
    uint32_t linedef_count;
    uint32_t bvh_node_count;
    bool stasis_active;
} covalent_state_manifold_t;

// C-Kernel Transpiler Prototypes
bool sys_covalent_quipu_ingest(covalent_state_manifold_t* manifold, uint32_t topology_token, q16_t friction_cost);
bool sys_covalent_transpile_vertices(const uint8_t* wad_buffer, const wad_lump_t* vertex_lump, covalent_state_manifold_t* manifold, covalent_transpiled_vertex_t* out_vertices, uint32_t max_out);
bool sys_covalent_transpile_sectors(const uint8_t* wad_buffer, const wad_lump_t* sector_lump, covalent_state_manifold_t* manifold, covalent_transpiled_sector_t* out_sectors, uint32_t max_out);
bool sys_covalent_transpile_linedefs(const uint8_t* wad_buffer, const wad_lump_t* linedef_lump, covalent_state_manifold_t* manifold, covalent_transpiled_linedef_t* out_linedefs, uint32_t max_out);
bool sys_covalent_build_bvh(const covalent_transpiled_vertex_t* vertices, const covalent_transpiled_linedef_t* linedefs, const covalent_transpiled_sector_t* sectors, uint32_t linedef_count, covalent_bvh_node_t* out_nodes, uint32_t* out_node_count);
bool sys_covalent_parse_wad_directory(const uint8_t* wad_buffer, uint32_t buffer_size, wad_lump_t* out_lumps, uint32_t* out_lump_count);
void sys_covalent_broadcast_quorum(const char* signal);

#endif // COVALENT_WAD_TRANSPILER_H
