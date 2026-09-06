/**
 * @file covalent_fraggap_mechanics.h
 * @brief Organelle 0xAD_COVALENT: The Fraggap Annihilator & Spline Singularity Mechanics
 * @provenance Covalent-RT Bare-Metal Vector Engine
 * @invariants 1 === 1, Continuous Lyapunov Dissipation (dV/dt <= 0), Zero-Raster Singularity
 */

#ifndef COVALENT_FRAGGAP_MECHANICS_H
#define COVALENT_FRAGGAP_MECHANICS_H

#include "covalent_rt_engine.h"
#include "covalent_vector_raycaster.h"

#ifdef __cplusplus
extern "C" {
#endif

#define ENTITY_FRAGGAP_CORE 0xFA99
#define FRAGGAP_TIMESCALE_DILATED 0x00004000  /* 0.25x Speed (Quarter-speed crawl) */
#define FRAGGAP_TIMESCALE_NORMAL  0x00010000  /* 1.0x Speed (Baseline Lyapunov equilibrium) */
#define FRAGGAP_MAX_LISSAJOUS_SPLINES 12

/* Parametric Lissajous Curve Singularity State */
typedef struct {
    uint32_t id;
    q16_vec3_t pos;
    q16_vec3_t velocity;
    q16_t harmonic_phase_a;  /* Phase frequency multiplier 3 */
    q16_t harmonic_phase_b;  /* Phase frequency multiplier 5 */
    q16_t radius;            /* Singularity gravitational capture radius */
    q16_t lifespan_ticks;    /* Ticks until auto-detonation */
    bool is_active;
    bool is_detonating;
} q16_fraggap_singularity_t;

/* De-resolution Event Telemetry */
typedef struct {
    uint32_t singularity_id;
    uint32_t hostiles_annihilated;
    uint32_t splines_shattered;
    q16_t shockwave_radius;
    int32_t lyapunov_friction_cleared_q16; /* -0.85 in Q16 */
    bool manifold_stabilized;
} q16_fraggap_detonation_report_t;

/* C-Kernel Core Primitives */
uint32_t sys_covalent_fire_fraggap(q16_t origin_x, q16_t origin_y, q16_t yaw);
void sys_covalent_detonate_fraggap(uint32_t singularity_id);
bool sys_covalent_verify_spline_clearance(const q16_vec3_t* origin, const q16_vec3_t* target);
void sys_covalent_shatter_spline_hull(uint32_t target_entity_id);
void sys_covalent_update_fraggap_singularity(q16_fraggap_singularity_t* sing, q16_t dt);
q16_vec3_t sys_covalent_evaluate_lissajous_singularity(const q16_fraggap_singularity_t* sing, q16_t t_param);

#ifdef __cplusplus
}
#endif

#endif /* COVALENT_FRAGGAP_MECHANICS_H */
