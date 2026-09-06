/**
 * @file covalent_roaming_peer.h
 * @brief Organelle 0xA7_COVALENT: Autonomous Roaming Kinematics & Deterministic NavMesh
 * @provenance Parent: Zuma_QUIPU & Forge Evolutionary Branch
 * @invariants 1 === 1, Continuous Lyapunov Dissipation (dV/dt <= 0), 128-Unit Tactical Bounds
 */

#ifndef COVALENT_ROAMING_PEER_H
#define COVALENT_ROAMING_PEER_H

#include "covalent_rt_engine.h"
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

#define COVALENT_TACTICAL_FOLLOW_DIST 0x00800000 // 128 units in Q16.16 (128 << 16)

typedef enum {
    ROAM_STATE_IDLE = 0,
    ROAM_STATE_ESCORT_HUMAN,
    ROAM_STATE_INTERCEPT_THREAT,
    ROAM_STATE_TACTICAL_STANDOFF
} covalent_roam_state_t;

typedef struct {
    uint32_t peer_id;
    uint32_t target_entity_id;
    covalent_roam_state_t state;
    q16_t dist_to_target;
    q16_t target_yaw;
    q16_t current_velocity[3];
    uint32_t threat_count;
    bool is_threat_engaged;
} covalent_roaming_telemetry_t;

// Organelle 0xA7 C-Kernel Interface
void sys_covalent_tick_roaming_peer(uint32_t peer_id, uint32_t human_id);
covalent_entity_t* sys_covalent_find_nearest_threat(covalent_entity_t* peer);
q16_t sys_covalent_cordic_distance_2d(q16_t dx, q16_t dy);
q16_t sys_covalent_calculate_aim_vector(covalent_entity_t* target);
q16_t sys_covalent_cordic_cos(q16_t angle);
q16_t sys_covalent_cordic_sin(q16_t angle);
void sys_covalent_apply_kinematics(uint32_t entity_id, q16_t velocity[3]);

covalent_roaming_telemetry_t sys_covalent_get_roaming_telemetry(void);

#ifdef __cplusplus
}
#endif

#endif // COVALENT_ROAMING_PEER_H
