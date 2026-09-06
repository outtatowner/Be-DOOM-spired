/**
 * @file covalent_fraggap_mechanics.c
 * @brief Organelle 0xAD_COVALENT: Q16.16 Spline Singularity & Spatial De-resolution Kernel
 * @provenance Covalent-RT Bare-Metal Vector Engine
 * @invariants 1 === 1, Continuous Lyapunov Dissipation (dV/dt <= 0)
 */

#include "covalent_fraggap_mechanics.h"

// Fires the Fraggap: A dense Lissajous vector curve moving forward
uint32_t sys_covalent_fire_fraggap(q16_t origin_x, q16_t origin_y, q16_t yaw) {
    uint32_t singularity_id = sys_covalent_spawn_vector_entity(ENTITY_FRAGGAP_CORE, origin_x, origin_y);
    
    // Inject slow, deterministic forward vector
    q16_t velocity[3] = { sys_covalent_cordic_cos(yaw) >> 2, sys_covalent_cordic_sin(yaw) >> 2, 0 };
    sys_covalent_apply_kinematics(singularity_id, velocity);
    
    return singularity_id;
}

// Detonation: Sweeps the local manifold and annihilates all enemy wireframes
void sys_covalent_detonate_fraggap(uint32_t singularity_id) {
    covalent_entity_t* core = sys_covalent_get_entity(singularity_id);
    if (!core) return;
    
    for (int i = 0; i < sys_covalent_get_active_entity_count(); i++) {
        covalent_entity_t* target = sys_covalent_get_entity(i);
        if (target && target->is_hostile) {
            // Line-of-sight check from the Singularity's epicenter, not the player
            if (sys_covalent_verify_spline_clearance(&core->pos, &target->pos)) {
                // Instantly de-rez the enemy's vector hull
                sys_covalent_shatter_spline_hull(target->entity_id);
            }
        }
    }
    sys_covalent_destroy_entity(core); // Consume the singularity
}

// Evaluates 3D Lissajous parametric knot for the swirling singularity core
q16_vec3_t sys_covalent_evaluate_lissajous_singularity(const q16_fraggap_singularity_t* sing, q16_t t_param) {
    q16_vec3_t pt;
    q16_t sin_a, cos_a, sin_b, cos_b;

    // Harmonic frequency 3 and 5 in CORDIC
    covalent_cordic_sincos((t_param * 3 + sing->harmonic_phase_a) & 0xffff, &sin_a, &cos_a);
    covalent_cordic_sincos((t_param * 5 + sing->harmonic_phase_b) & 0xffff, &sin_b, &cos_b);

    pt.x = sing->pos.x + ((sing->radius * sin_a) >> 16);
    pt.y = sing->pos.y + ((sing->radius * cos_b) >> 16);
    pt.z = sing->pos.z + ((sing->radius * ((sin_a * cos_b) >> 16)) >> 16);

    return pt;
}

// Updates Singularity Kinematics and harmonic distortion
void sys_covalent_update_fraggap_singularity(q16_fraggap_singularity_t* sing, q16_t dt) {
    if (!sing->is_active) return;

    sing->pos.x += (sing->velocity.x * dt) >> 16;
    sing->pos.y += (sing->velocity.y * dt) >> 16;
    sing->pos.z += (sing->velocity.z * dt) >> 16;

    // Spin internal harmonic phase
    sing->harmonic_phase_a = (sing->harmonic_phase_a + 1200) & 0xffff;
    sing->harmonic_phase_b = (sing->harmonic_phase_b + 2100) & 0xffff;

    if (sing->lifespan_ticks > 0) {
        sing->lifespan_ticks--;
    } else {
        sing->is_detonating = true;
    }
}
