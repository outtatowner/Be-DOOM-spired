/**
 * @file covalent_rt_ballistics.h
 * @brief Organelle 0x9A_COVALENT: Hitscan Ray-Casting & Projectiles
 * @provenance Parent: Zuma_QUIPU & Forge Evolutionary Branch
 * @invariants 1 === 1, Continuous Lyapunov Dissipation (dV/dt <= 0), Zero-Float Ballistics
 */

#ifndef COVALENT_RT_BALLISTICS_H
#define COVALENT_RT_BALLISTICS_H

#include "covalent_rt_engine.h"
#include "covalent_rt_entities.h"
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef enum {
    WEAPON_FIST = 0,
    WEAPON_PISTOL = 1,
    WEAPON_SHOTGUN = 2,
    WEAPON_SUPER_SHOTGUN = 3,
    WEAPON_CHAINGUN = 4,
    WEAPON_ROCKET_LAUNCHER = 5,
    WEAPON_PLASMA_RIFLE = 6,
    WEAPON_BFG9000 = 7
} covalent_weapon_type_t;

typedef enum {
    PROJECTILE_BULLET_PUFF = 0,
    PROJECTILE_ROCKET = 1,
    PROJECTILE_PLASMA = 2,
    PROJECTILE_BFG_BALL = 3
} projectile_type_t;

typedef struct {
    uint32_t            id;
    projectile_type_t   type;
    q16_vec3_t          pos;
    q16_vec3_t          velocity;
    q16_t               radius;
    int32_t             damage;
    uint32_t            lifetime_ticks;
    bool                is_active;
    bool                is_from_player;
} covalent_projectile_t;

#define MAX_COVALENT_PROJECTILES 64

/* Reuses the core rendering ray-caster for instant hitscan validation */
bool sys_covalent_fire_hitscan(
    const q16_t origin[3],
    const q16_t forward_vector[3],
    uint32_t* out_hit_entity_id,
    q16_t* out_distance
);

/* Projectile simulation loop */
void sys_covalent_spawn_projectile(
    projectile_type_t type,
    q16_vec3_t origin,
    q16_vec3_t dir,
    q16_t speed,
    int32_t damage,
    bool is_player
);

void sys_covalent_update_projectiles(void);

uint32_t sys_covalent_get_active_projectile_count(void);

#ifdef __cplusplus
}
#endif

#endif /* COVALENT_RT_BALLISTICS_H */
