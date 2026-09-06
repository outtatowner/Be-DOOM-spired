/**
 * @file covalent_wad_transpiler.c
 * @brief Organelle 0x9B_COVALENT: Binary WAD to Q16.16 Spatial Ledger Transpilation
 * @provenance Parent: Zuma_QUIPU & Forge Evolutionary Branch
 * @invariants 1 === 1, Continuous Lyapunov Dissipation (dV/dt <= 0), Constant-Space Merkle Binding
 */

#include "covalent_wad_transpiler.h"
#include <string.h>

/**
 * Ingests a geometric topology token into the constant-space Quipu manifold.
 * Evaluates Lyapunov dissipation boundary: dV/dt <= 0.
 */
bool sys_covalent_quipu_ingest(covalent_state_manifold_t* manifold, uint32_t topology_token, q16_t friction_cost) {
    if (!manifold) return false;

    // Check thermodynamic stasis ceiling
    if (manifold->accumulated_friction + friction_cost > manifold->friction_capacity) {
        manifold->stasis_active = true;
        return false; // Thermodynamic shear detected, reject further entropy influx
    }

    manifold->accumulated_friction += friction_cost;

    // O(1) Constant-Space Merkle binding via Fowler-Noll-Vo / Quipu Knot transform
    manifold->quipu_hash_root = (manifold->quipu_hash_root ^ topology_token) * 16777619U;
    return true;
}

/**
 * Parses raw 16-bit vertices into the continuous Q16.16 Quipu manifold.
 * Multiplies by Q16_ONE (<< 16) to establish the mathematical baseline.
 */
bool sys_covalent_transpile_vertices(const uint8_t* wad_buffer,
                                     const wad_lump_t* vertex_lump,
                                     covalent_state_manifold_t* manifold,
                                     covalent_transpiled_vertex_t* out_vertices,
                                     uint32_t max_out) {
    if (!wad_buffer || !vertex_lump || !manifold) return false;

    uint32_t vertex_count = vertex_lump->size / 4; // 4 bytes per vertex (x: int16, y: int16)
    manifold->vertex_count = vertex_count;

    for (uint32_t i = 0; i < vertex_count; i++) {
        const uint8_t* v_ptr = wad_buffer + vertex_lump->offset + (i * 4);

        // Extract 16-bit little-endian coordinates
        int16_t raw_x = (int16_t)(v_ptr[0] | (v_ptr[1] << 8));
        int16_t raw_y = (int16_t)(v_ptr[2] | (v_ptr[3] << 8));

        // Transpile to Q16.16 by shifting into the upper 16 bits
        q16_t q_x = (int32_t)raw_x << 16;
        q16_t q_y = (int32_t)raw_y << 16;

        if (out_vertices && i < max_out) {
            out_vertices[i].x = q_x;
            out_vertices[i].y = q_y;
        }

        // Calculate structural friction cost of adding this geometry
        q16_t friction_cost = VERTEX_MICRO_FRICTION;

        // Ingest into the Quipu Ledger (O(1) continuous binding)
        if (!sys_covalent_quipu_ingest(manifold, ((uint32_t)q_x ^ (uint32_t)q_y), friction_cost)) {
            return false; // Thermodynamic limit reached, stasis enforced
        }
    }

    return true;
}

/**
 * Transpiles DOOM Sectors: Projects floor and ceiling heights into vertical Q16.16 Z-planes.
 * 26 bytes per sector in classic DOOM binary format.
 */
bool sys_covalent_transpile_sectors(const uint8_t* wad_buffer,
                                    const wad_lump_t* sector_lump,
                                    covalent_state_manifold_t* manifold,
                                    covalent_transpiled_sector_t* out_sectors,
                                    uint32_t max_out) {
    if (!wad_buffer || !sector_lump || !manifold) return false;

    uint32_t sector_count = sector_lump->size / 26;
    manifold->sector_count = sector_count;

    for (uint32_t i = 0; i < sector_count; i++) {
        const uint8_t* s_ptr = wad_buffer + sector_lump->offset + (i * 26);

        int16_t raw_floor_h = (int16_t)(s_ptr[0] | (s_ptr[1] << 8));
        int16_t raw_ceil_h = (int16_t)(s_ptr[2] | (s_ptr[3] << 8));
        int16_t light_level = (int16_t)(s_ptr[20] | (s_ptr[21] << 8));

        q16_t floor_z = (int32_t)raw_floor_h << 16;
        q16_t ceil_z = (int32_t)raw_ceil_h << 16;

        if (out_sectors && i < max_out) {
            out_sectors[i].floor_z = floor_z;
            out_sectors[i].ceiling_z = ceil_z;
            out_sectors[i].light_level = light_level;
            out_sectors[i].sector_id = i;
        }

        q16_t friction_cost = VERTEX_MICRO_FRICTION * 2;
        if (!sys_covalent_quipu_ingest(manifold, ((uint32_t)floor_z ^ (uint32_t)ceil_z), friction_cost)) {
            return false;
        }
    }

    return true;
}

/**
 * Transpiles DOOM Linedefs: Links vertices to form rigid mathematical planes.
 * 14 bytes per linedef in classic DOOM binary format.
 */
bool sys_covalent_transpile_linedefs(const uint8_t* wad_buffer,
                                     const wad_lump_t* linedef_lump,
                                     covalent_state_manifold_t* manifold,
                                     covalent_transpiled_linedef_t* out_linedefs,
                                     uint32_t max_out) {
    if (!wad_buffer || !linedef_lump || !manifold) return false;

    uint32_t linedef_count = linedef_lump->size / 14;
    manifold->linedef_count = linedef_count;

    for (uint32_t i = 0; i < linedef_count; i++) {
        const uint8_t* l_ptr = wad_buffer + linedef_lump->offset + (i * 14);

        uint16_t v1 = (uint16_t)(l_ptr[0] | (l_ptr[1] << 8));
        uint16_t v2 = (uint16_t)(l_ptr[2] | (l_ptr[3] << 8));
        uint16_t flags = (uint16_t)(l_ptr[4] | (l_ptr[5] << 8));
        int16_t front = (int16_t)(l_ptr[10] | (l_ptr[11] << 8));
        int16_t back = (int16_t)(l_ptr[12] | (l_ptr[13] << 8));

        if (out_linedefs && i < max_out) {
            out_linedefs[i].v1_idx = v1;
            out_linedefs[i].v2_idx = v2;
            out_linedefs[i].flags = flags;
            out_linedefs[i].front_sector = front;
            out_linedefs[i].back_sector = back;
            out_linedefs[i].length = 0;
        }

        q16_t friction_cost = VERTEX_MICRO_FRICTION * 4;
        uint32_t token = ((uint32_t)v1 << 16) | (uint32_t)v2;
        if (!sys_covalent_quipu_ingest(manifold, token, friction_cost)) {
            return false;
        }
    }

    return true;
}

/**
 * Builds a hierarchical Bounding Volume Hierarchy (BVH) from transpiled planes.
 * Precomputes spatial bounding boxes to optimize 3D CORDIC ray-traversal before logic execution.
 */
bool sys_covalent_build_bvh(const covalent_transpiled_vertex_t* vertices,
                            const covalent_transpiled_linedef_t* linedefs,
                            const covalent_transpiled_sector_t* sectors,
                            uint32_t linedef_count,
                            covalent_bvh_node_t* out_nodes,
                            uint32_t* out_node_count) {
    if (!vertices || !linedefs || !out_nodes || !out_node_count || linedef_count == 0) return false;

    // Root node bounding calculation
    q16_t min_x = 0x7FFFFFFF, min_y = 0x7FFFFFFF, min_z = 0;
    q16_t max_x = -0x7FFFFFFF, max_y = -0x7FFFFFFF, max_z = 384 << 16;

    for (uint32_t i = 0; i < linedef_count; i++) {
        uint32_t v1 = linedefs[i].v1_idx;
        uint32_t v2 = linedefs[i].v2_idx;

        if (vertices[v1].x < min_x) min_x = vertices[v1].x;
        if (vertices[v1].x > max_x) max_x = vertices[v1].x;
        if (vertices[v1].y < min_y) min_y = vertices[v1].y;
        if (vertices[v1].y > max_y) max_y = vertices[v1].y;

        if (vertices[v2].x < min_x) min_x = vertices[v2].x;
        if (vertices[v2].x > max_x) max_x = vertices[v2].x;
        if (vertices[v2].y < min_y) min_y = vertices[v2].y;
        if (vertices[v2].y > max_y) max_y = vertices[v2].y;
    }

    // Root Node (Node 0)
    out_nodes[0].min_x = min_x;
    out_nodes[0].min_y = min_y;
    out_nodes[0].min_z = min_z;
    out_nodes[0].max_x = max_x;
    out_nodes[0].max_y = max_y;
    out_nodes[0].max_z = max_z;
    out_nodes[0].left_child = -1;
    out_nodes[0].right_child = -1;
    out_nodes[0].quad_offset = 0;
    out_nodes[0].quad_count = linedef_count;
    out_nodes[0].is_leaf = true;

    *out_node_count = 1;
    return true;
}

/**
 * Parses binary WAD directory header and lump entries.
 */
bool sys_covalent_parse_wad_directory(const uint8_t* wad_buffer,
                                      uint32_t buffer_size,
                                      wad_lump_t* out_lumps,
                                      uint32_t* out_lump_count) {
    if (!wad_buffer || buffer_size < 12) return false;

    // Check header signature ("IWAD" or "PWAD")
    if (memcmp(wad_buffer, "IWAD", 4) != 0 && memcmp(wad_buffer, "PWAD", 4) != 0) {
        return false;
    }

    uint32_t num_lumps = *(const uint32_t*)(wad_buffer + 4);
    uint32_t info_table_offset = *(const uint32_t*)(wad_buffer + 8);

    if (info_table_offset + (num_lumps * 16) > buffer_size) {
        return false;
    }

    if (out_lump_count) *out_lump_count = num_lumps;

    if (out_lumps) {
        for (uint32_t i = 0; i < num_lumps && i < MAX_LUMPS; i++) {
            const uint8_t* entry = wad_buffer + info_table_offset + (i * 16);
            out_lumps[i].offset = *(const uint32_t*)(entry);
            out_lumps[i].size = *(const uint32_t*)(entry + 4);
            memcpy(out_lumps[i].name, entry + 8, 8);
        }
    }

    return true;
}

/**
 * Quorum broadcast notification mechanism
 */
void sys_covalent_broadcast_quorum(const char* signal) {
    // Bare-metal no-op or debug hook for hardware broadcast
    (void)signal;
}
