/**
 * @file covalent_live_editor.c
 * @brief Organelle 0xA5_COVALENT: Live Ledger Mutation & Non-Destructive Spatial BVH
 * @provenance Parent: Zuma_QUIPU & Forge Evolutionary Branch
 */

#include "covalent_live_editor.h"
#include <string.h>

#define MAX_FB_SHARDS 8

static fb_shard_descriptor_t g_fb_shards[MAX_FB_SHARDS];
static uint32_t g_fb_shard_count = 0;
static live_mutation_session_t g_active_session = { 0, 0, 0, 0, 0, false, 0 };

void sys_covalent_allocate_fb_shard(const char* shard_id, uint32_t x, uint32_t y, uint32_t w, uint32_t h) {
    for (uint32_t i = 0; i < g_fb_shard_count; i++) {
        if (strcmp(g_fb_shards[i].shard_id, shard_id) == 0) {
            g_fb_shards[i].x = x;
            g_fb_shards[i].y = y;
            g_fb_shards[i].width = w;
            g_fb_shards[i].height = h;
            g_fb_shards[i].is_active = true;
            return;
        }
    }

    if (g_fb_shard_count < MAX_FB_SHARDS) {
        strncpy(g_fb_shards[g_fb_shard_count].shard_id, shard_id, 31);
        g_fb_shards[g_fb_shard_count].shard_id[31] = '\0';
        g_fb_shards[g_fb_shard_count].x = x;
        g_fb_shards[g_fb_shard_count].y = y;
        g_fb_shards[g_fb_shard_count].width = w;
        g_fb_shards[g_fb_shard_count].height = h;
        g_fb_shards[g_fb_shard_count].is_active = true;
        g_fb_shard_count++;
    }
}

fb_shard_descriptor_t* sys_covalent_get_fb_shard(const char* shard_id) {
    for (uint32_t i = 0; i < g_fb_shard_count; i++) {
        if (strcmp(g_fb_shards[i].shard_id, shard_id) == 0) {
            return &g_fb_shards[i];
        }
    }
    return NULL;
}

void sys_covalent_update_entity_transform(uint32_t entity_id, q16_t new_x, q16_t new_y) {
    covalent_entity_t* target = sys_covalent_get_entity(entity_id);
    if (!target) return;

    // Unbind from current spatial quadtree node
    sys_covalent_bvh_remove(target);

    // Update raw Q16.16 geometry
    target->pos_x = new_x;
    target->pos_y = new_y;

    // Rebind to BVH. The FS Game ray-caster will immediately intersect the new volume on the next tick
    sys_covalent_bvh_insert(target);
}

void sys_covalent_stage_drag_mutation(uint32_t entity_id, q16_t delta_x, q16_t delta_y) {
    covalent_entity_t* target = sys_covalent_get_entity(entity_id);
    if (!target) return;

    if (!g_active_session.is_dragging || g_active_session.target_entity_id != entity_id) {
        g_active_session.target_entity_id = entity_id;
        g_active_session.initial_x = target->pos_x;
        g_active_session.initial_y = target->pos_y;
        g_active_session.is_dragging = true;
    }

    g_active_session.staged_x = g_active_session.initial_x + delta_x;
    g_active_session.staged_y = g_active_session.initial_y + delta_y;

    // Real-time BVH transformation without committing permanent dissipation stasis
    sys_covalent_update_entity_transform(entity_id, g_active_session.staged_x, g_active_session.staged_y);
}

void sys_covalent_commit_drag_mutation(uint32_t entity_id, uint32_t* out_recalculated_merkle) {
    if (!g_active_session.is_dragging || g_active_session.target_entity_id != entity_id) {
        return;
    }

    // Finalize permanent coordinates
    sys_covalent_update_entity_transform(entity_id, g_active_session.staged_x, g_active_session.staged_y);
    g_active_session.is_dragging = false;

    // Recompute Quipu Merkle Root for 1 === 1 invariant
    uint32_t root = 0x811c9dc5;
    root ^= entity_id;
    root *= 0x01000193;
    root ^= (uint32_t)g_active_session.staged_x;
    root *= 0x01000193;
    root ^= (uint32_t)g_active_session.staged_y;
    root *= 0x01000193;

    if (out_recalculated_merkle) {
        *out_recalculated_merkle = root;
    }
}

void sys_covalent_cancel_drag_mutation(uint32_t entity_id) {
    if (g_active_session.is_dragging && g_active_session.target_entity_id == entity_id) {
        sys_covalent_update_entity_transform(entity_id, g_active_session.initial_x, g_active_session.initial_y);
        g_active_session.is_dragging = false;
    }
}

covalent_quadbit_properties_t sys_covalent_read_quadbit_properties(uint32_t entity_id) {
    covalent_quadbit_properties_t props;
    memset(&props, 0, sizeof(props));
    props.entity_id = entity_id;

    covalent_entity_t* target = sys_covalent_get_entity(entity_id);
    if (target) {
        props.min_z = target->pos_z;
        props.max_z = target->pos_z + (64 << 16);
        props.friction_cost = 42000;
        props.radius = target->radius > 0 ? target->radius : (32 << 16);
        props.height = 64 << 16;
        props.emissive_color = 0x00f0ff;
        props.material_id = 0;
        props.is_staged_mutating = g_active_session.is_dragging && g_active_session.target_entity_id == entity_id;
    } else {
        props.min_z = 0;
        props.max_z = 64 << 16;
        props.friction_cost = 42000;
        props.radius = 32 << 16;
        props.height = 64 << 16;
    }

    return props;
}

void sys_covalent_write_quadbit_property(uint32_t entity_id, const char* prop_name, q16_t value) {
    covalent_entity_t* target = sys_covalent_get_entity(entity_id);
    if (!target) return;

    if (strcmp(prop_name, "min_z") == 0) {
        target->pos_z = value;
    } else if (strcmp(prop_name, "radius") == 0) {
        target->radius = value;
    }
}
