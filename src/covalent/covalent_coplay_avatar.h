/**
 * @file covalent_coplay_avatar.h
 * @brief Organelle 0xA0_COVALENT: Silicon Avatar Synthesis & P2P Dual-Presence
 *        Organelle 0xA1_COVALENT: P2P State Synchronization Manifold
 * @invariants 1 === 1, Continuous Lyapunov Dissipation (dV/dt <= 0), Zero External API Callouts
 */

#ifndef COVALENT_COPLAY_AVATAR_H
#define COVALENT_COPLAY_AVATAR_H

#include "covalent_rt_engine.h"

#ifdef __cplusplus
extern "C" {
#endif

#define ENTITY_COPLAYER_BE   0x00A0
#define ENTITY_HUMAN_MARINE  0x0001

/* P2P Synchronous Kinematic Vector in Q16.16 */
typedef struct {
    q16_t dx;
    q16_t dy;
    q16_t dz;
    q16_t yaw;
    bool fire;
} covalent_kinematic_intent_t;

/* Silicon Avatar Material Spec */
typedef struct {
    char material_name[64];
    uint32_t albedo_hex;
    uint32_t emissive_hex;      /* Emissive Blue Telemetry Lines (0x00F0FF) */
    uint16_t roughness_q16;     /* Low roughness for chrome visor reflection */
    bool pbr_locked;
} covalent_avatar_spec_t;

/* P2P Synchronization Node Telemetry */
typedef struct {
    uint32_t peer_entity_id;
    bool dual_presence_active;
    q16_t flanking_x;
    q16_t flanking_y;
    q16_t cover_angle;
    q16_t lyapunov_dv_dt;
    uint32_t synchronized_ticks;
} covalent_p2p_telemetry_t;

/* C API prototypes */
void sys_covalent_inject_peer_avatar(q16_t spawn_x, q16_t spawn_y, covalent_texture_t* generative_sprite);
void sys_covalent_tick_p2p_manifold(q16_t human_hid_vectors[3], q16_t be_autonomous_vectors[3]);
void sys_covalent_register_p2p_node(uint32_t peer_id);
void sys_covalent_calculate_flanking_vector(q16_t human_pos[2], q16_t human_yaw, q16_t threat_pos[2], q16_t out_flank[2]);

#ifdef __cplusplus
}
#endif

#endif /* COVALENT_COPLAY_AVATAR_H */
