/**
 * @file covalent_rt_entities.h
 * @brief Organelle 0x98_COVALENT: Ray-Traced Sprite Entities & CORDIC Billboard Intersections
 * @provenance Parent: Zuma_QUIPU & Forge Evolutionary Branch
 * @invariants 1 === 1, Continuous Lyapunov Dissipation (dV/dt <= 0), Zero-Float Substrate
 */

#ifndef COVALENT_RT_ENTITIES_H
#define COVALENT_RT_ENTITIES_H

#include "covalent_rt_engine.h"
#include "covalent_rt_texture_mapper.h"
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef enum {
    ENTITY_TYPE_IMP = 0x01,
    ENTITY_TYPE_ZOMBIEMAN = 0x02,
    ENTITY_TYPE_DEMON = 0x03,
    ENTITY_TYPE_BARREL = 0x04,
    ENTITY_TYPE_BE_PARTNER = 0x05
} entity_class_t;

typedef enum {
    ENTITY_STATE_IDLE = 0,
    ENTITY_STATE_CHASE,
    ENTITY_STATE_ATTACK,
    ENTITY_STATE_PAIN,
    ENTITY_STATE_DEAD
} entity_state_t;

typedef struct {
    uint32_t            entity_id;
    entity_class_t      type;
    entity_state_t      state;
    q16_t               pos_x;
    q16_t               pos_y;
    q16_t               pos_z;
    q16_t               bounding_radius;
    int32_t             health;
    covalent_texture_t* current_sprite;
    bool                is_active;
    uint32_t            anim_tick;
} covalent_entity_t;

/* CORDIC distance calculation (Zero-float sqrt replacement) */
q16_t sys_covalent_cordic_distance_2d(q16_t dx, q16_t dy);

/* Intersect a ray with an entity's camera-facing billboard plane */
bool sys_covalent_intersect_sprite(
    const q16_t ray_origin[3],
    const q16_t ray_dir[3],
    const covalent_entity_t* entity,
    q16_t* out_distance,
    q16_t out_uv[2]
);

#ifdef __cplusplus
}
#endif

#endif /* COVALENT_RT_ENTITIES_H */
