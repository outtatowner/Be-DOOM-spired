/**
 * @file covalent_live_editor.h
 * @brief Organelle 0xA5_COVALENT: Live Ledger Mutation & Non-Destructive Spatial BVH
 * @provenance Parent: Zuma_QUIPU & Forge Evolutionary Branch
 * @invariants 1 === 1, Continuous Lyapunov Dissipation (dV/dt <= 0), Non-Destructive Mutation
 */

#ifndef COVALENT_LIVE_EDITOR_H
#define COVALENT_LIVE_EDITOR_H

#include "covalent_rt_engine.h"
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

// Tri-Shard Framebuffer Multiplex Allocations
typedef struct {
    char shard_id[32];
    uint32_t x;
    uint32_t y;
    uint32_t width;
    uint32_t height;
    bool is_active;
} fb_shard_descriptor_t;

// Quadbit Editable Asset Properties
typedef struct {
    uint32_t entity_id;
    q16_t min_z;
    q16_t max_z;
    q16_t friction_cost; // Thermodynamic mass
    q16_t radius;        // Bounding cylinder radius
    q16_t height;        // Bounding cylinder height
    uint32_t emissive_color;
    uint32_t material_id;
    bool is_staged_mutating;
} covalent_quadbit_properties_t;

// Non-Destructive Drag Staging Record
typedef struct {
    uint32_t target_entity_id;
    q16_t initial_x;
    q16_t initial_y;
    q16_t staged_x;
    q16_t staged_y;
    bool is_dragging;
    uint32_t drag_start_tick;
} live_mutation_session_t;

// Shard Allocation
void sys_covalent_allocate_fb_shard(const char* shard_id, uint32_t x, uint32_t y, uint32_t w, uint32_t h);
fb_shard_descriptor_t* sys_covalent_get_fb_shard(const char* shard_id);

// Real-time Spatial Mutation
void sys_covalent_update_entity_transform(uint32_t entity_id, q16_t new_x, q16_t new_y);
void sys_covalent_stage_drag_mutation(uint32_t entity_id, q16_t delta_x, q16_t delta_y);
void sys_covalent_commit_drag_mutation(uint32_t entity_id, uint32_t* out_recalculated_merkle);
void sys_covalent_cancel_drag_mutation(uint32_t entity_id);

// Property Access & Constraints
covalent_quadbit_properties_t sys_covalent_read_quadbit_properties(uint32_t entity_id);
void sys_covalent_write_quadbit_property(uint32_t entity_id, const char* prop_name, q16_t value);

#ifdef __cplusplus
}
#endif

#endif // COVALENT_LIVE_EDITOR_H
