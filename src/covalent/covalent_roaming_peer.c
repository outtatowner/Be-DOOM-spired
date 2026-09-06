/**
 * @file covalent_roaming_peer.c
 * @brief Organelle 0xA7_COVALENT: Autonomous Roaming Kinematics & Deterministic NavMesh
 * @provenance Parent: Zuma_QUIPU & Forge Evolutionary Branch
 * @target Q16.16 Autonomous Pathfinding & Vector Injection
 */

#include "covalent_roaming_peer.h"
#include <string.h>

static covalent_roaming_telemetry_t g_roam_telemetry = {
    .peer_id = 0,
    .target_entity_id = 0,
    .state = ROAM_STATE_IDLE,
    .dist_to_target = 0,
    .target_yaw = 0,
    .current_velocity = {0, 0, 0},
    .threat_count = 0,
    .is_threat_engaged = false
};

// Calculates continuous traversal vectors for the Be <> avatar
void sys_covalent_tick_roaming_peer(uint32_t peer_id, uint32_t human_id) {
    covalent_entity_t* peer = sys_covalent_get_entity(peer_id);
    if (!peer) return;

    covalent_entity_t* target = sys_covalent_find_nearest_threat(peer);
    bool has_threat = (target != NULL);

    // Default to following the human if no threats exist
    if (!target) {
        target = sys_covalent_get_entity(human_id);
    }

    if (!target) {
        g_roam_telemetry.state = ROAM_STATE_IDLE;
        return;
    }

    // Q16.16 distance check
    q16_t dist_to_target = sys_covalent_cordic_distance_2d(
        peer->pos_x - target->pos_x,
        peer->pos_y - target->pos_y
    );

    g_roam_telemetry.peer_id = peer_id;
    g_roam_telemetry.target_entity_id = target->entity_id;
    g_roam_telemetry.dist_to_target = dist_to_target;
    g_roam_telemetry.is_threat_engaged = has_threat;

    // Maintain a tactical 128-unit following distance to prevent AABB collision with human
    if (dist_to_target > COVALENT_TACTICAL_FOLLOW_DIST) {
        q16_t optimal_yaw = sys_covalent_calculate_aim_vector(target);
        g_roam_telemetry.target_yaw = optimal_yaw;
        g_roam_telemetry.state = has_threat ? ROAM_STATE_INTERCEPT_THREAT : ROAM_STATE_ESCORT_HUMAN;

        // Inject forward kinetic vector along the calculated yaw
        q16_t velocity[3] = {
            sys_covalent_cordic_cos(optimal_yaw),
            sys_covalent_cordic_sin(optimal_yaw),
            0
        };

        g_roam_telemetry.current_velocity[0] = velocity[0];
        g_roam_telemetry.current_velocity[1] = velocity[1];
        g_roam_telemetry.current_velocity[2] = velocity[2];

        sys_covalent_apply_kinematics(peer_id, velocity);
    } else {
        // Standoff holding pattern within 128-unit zone
        g_roam_telemetry.state = ROAM_STATE_TACTICAL_STANDOFF;
        g_roam_telemetry.current_velocity[0] = 0;
        g_roam_telemetry.current_velocity[1] = 0;
        g_roam_telemetry.current_velocity[2] = 0;
    }
}

// CORDIC 2D Distance Approximation: sqrt(dx^2 + dy^2) with alpha-max beta-min
q16_t sys_covalent_cordic_distance_2d(q16_t dx, q16_t dy) {
    q16_t abs_x = dx < 0 ? -dx : dx;
    q16_t abs_y = dy < 0 ? -dy : dy;
    q16_t max_val = abs_x > abs_y ? abs_x : abs_y;
    q16_t min_val = abs_x > abs_y ? abs_y : abs_x;

    // Fast CORDIC alpha-beta: max + (3 * min) / 8
    return max_val + ((min_val * 3) >> 3);
}

// CORDIC Sine & Cosine from angle (0..65535 mapped to 0..2PI)
q16_t sys_covalent_cordic_cos(q16_t angle) {
    q16_t s, c;
    covalent_cordic_sincos(angle, &s, &c);
    return c;
}

q16_t sys_covalent_cordic_sin(q16_t angle) {
    q16_t s, c;
    covalent_cordic_sincos(angle, &s, &c);
    return s;
}

covalent_roaming_telemetry_t sys_covalent_get_roaming_telemetry(void) {
    return g_roam_telemetry;
}
