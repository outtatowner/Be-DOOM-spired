/**
 * @file covalent_quadbit_format.h
 * @brief Organelle 0xA2_COVALENT: The QUADBIT Data Sieve & Native .qbit Spatial Archive
 * @provenance Parent: Zuma_QUIPU & Forge Evolutionary Branch
 * @invariants 1 === 1, CORDIC Bit-Shift Ray Intersection, Continuous Lyapunov Dissipation
 */

#ifndef COVALENT_QUADBIT_FORMAT_H
#define COVALENT_QUADBIT_FORMAT_H

#include "covalent_rt_engine.h"
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

#define QBIT_MAGIC 0x51424954 // "QBIT" in ASCII little-endian
#define QBIT_VERSION 0x00010000 // 1.0.0

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
    uint32_t albedo_offset;    // 1024x1024 quantized integer map
    uint32_t normal_offset;    // 1024x1024 normal vector map
    uint32_t roughness_offset; // 1024x1024 roughness/metallic map
    uint32_t emissive_flux;    // Lumens in Q16.16
} quadbit_material_t;

// Q16.16 XY Sector & Non-Convex Wall Plane (Replaces VERTEXES & LINEDEFS)
typedef struct {
    q16_t start_x;
    q16_t start_y;
    q16_t end_x;
    q16_t end_y;
    q16_t floor_z;
    q16_t ceil_z;
    uint32_t material_id;
    uint32_t flags; // 0x01: double-sided, 0x02: blocking, 0x04: emissive
} quadbit_wall_plane_t;

typedef struct {
    uint32_t wall_count;
    uint32_t sector_count;
    q16_t bounding_box_min[3];
    q16_t bounding_box_max[3];
    uint32_t planes_offset;
} quadbit_map_t;

// C-Kernel Bit-Shift Ray Intersection API
bool sys_covalent_qbit_verify_checksum(const uint8_t* qbit_buffer, uint32_t buffer_size);
bool sys_covalent_qbit_intersect_octree(
    const quadbit_octree_node_t* root,
    const q16_t ray_origin[3],
    const q16_t ray_dir[3],
    q16_t* hit_dist,
    uint32_t* hit_material
);
uint32_t sys_covalent_qbit_calculate_thermodynamic_mass(const quadbit_avatar_t* avatar);

#ifdef __cplusplus
}
#endif

#endif // COVALENT_QUADBIT_FORMAT_H
