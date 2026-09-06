/**
 * @file covalent_vector_raycaster.h
 * @brief Organelle 0xAC_COVALENT: Q16.16 Ray-Spline Intersection & De Casteljau Evaluator
 * @provenance Covalent-RT Bare-Metal Vector Engine
 * @invariants 1 === 1, Zero-Raster Footprint, Deterministic Fixed-Point Ray-Bézier Intersect
 */

#ifndef COVALENT_VECTOR_RAYCASTER_H
#define COVALENT_VECTOR_RAYCASTER_H

#include "covalent_rt_engine.h"

#ifdef __cplusplus
extern "C" {
#endif

#define MAX_SPLINE_SUBDIVISIONS 8
#define SPLINE_COLLISION_EPSILON (Q16_ONE >> 6) /* ~1/64 unit precision */

/* 3D Quadratic Bézier Spline in Q16.16 */
typedef struct {
    q16_vec3_t p0;      /* Start control point */
    q16_vec3_t p1;      /* Anchor / curvature control point */
    q16_vec3_t p2;      /* End control point */
    q16_t      radius;  /* Swept hull extrusion thickness in Q16.16 */
    uint32_t   color_rgb;
    uint16_t   flags;   /* 0x01: Dynamic Trap, 0x02: Wireframe Entity, 0x04: Reflective */
} q16_bezier_spline_t;

/* Extruded Spline Wireframe Cage */
typedef struct {
    uint32_t spline_count;
    q16_bezier_spline_t splines[16];
    q16_vec3_t center_pos;
    q16_t morph_phase;  /* Fixed-point phase [0, 65535] for continuous undulation */
    uint32_t entity_type; /* 1: Daemon Imp, 2: Cyber-Serpent, 3: Blade Trap */
} q16_vector_hull_t;

/* Hit result for ray-spline intersection */
typedef struct {
    bool       hit;
    q16_t      t;
    q16_t      u_spline;  /* Curve parameter t [0, Q16_ONE] */
    q16_vec3_t hit_pos;
    q16_vec3_t normal;
    uint32_t   color_rgb;
    uint32_t   material_id;
} q16_spline_hit_t;

/* Mathematical Evaluators */
q16_t sys_covalent_evaluate_bezier(q16_t p0, q16_t p1, q16_t p2, q16_t t);
q16_vec3_t sys_covalent_evaluate_bezier_3d(const q16_bezier_spline_t* spline, q16_t t);
q16_vec3_t sys_covalent_evaluate_spline_tangent(const q16_bezier_spline_t* spline, q16_t t);

/* De Casteljau Exact Ray-Spline Intersection */
q16_spline_hit_t sys_covalent_ray_spline_intersect(
    const q16_ray_t* ray,
    const q16_bezier_spline_t* spline,
    q16_t t_min,
    q16_t t_max
);

/* Dynamic Trap Evaluator: Oscillating Spline Blade */
void sys_covalent_update_oscillating_blade(
    q16_bezier_spline_t* blade,
    q16_vec3_t origin,
    q16_t amplitude_q16,
    q16_t angle_cordic,
    q16_t tick_delta
);

#ifdef __cplusplus
}
#endif

#endif /* COVALENT_VECTOR_RAYCASTER_H */
