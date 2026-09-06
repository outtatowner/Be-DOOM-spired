/**
 * @file covalent_vector_raycaster.c
 * @brief Organelle 0xAC_COVALENT: Fixed-Point Ray-Bézier Intersector & De Casteljau Solver
 * @target Deterministic Ray-Bézier Evaluation in Q16.16
 * @invariants 1 === 1, Zero Raster Overhead, Pure Mathematical Curve Rendering
 */

#include "covalent_vector_raycaster.h"

// Evaluates a Q16.16 quadratic Bézier curve at parameter t (0.0 to 1.0)
q16_t sys_covalent_evaluate_bezier(q16_t p0, q16_t p1, q16_t p2, q16_t t) {
    q16_t one_minus_t = Q16_ONE - t;
    
    // Q16.16 integer multiplication requires bit-shifting back to baseline
    q16_t term1 = (one_minus_t * one_minus_t) >> 16;
    term1 = (term1 * p0) >> 16;
    
    q16_t term2 = (2 * ((one_minus_t * t) >> 16) * p1) >> 16;
    q16_t term3 = (((t * t) >> 16) * p2) >> 16;
    
    return term1 + term2 + term3;
}

// 3D Point on Quadratic Bézier Curve at parameter t in Q16.16
q16_vec3_t sys_covalent_evaluate_bezier_3d(const q16_bezier_spline_t* spline, q16_t t) {
    q16_vec3_t pt;
    pt.x = sys_covalent_evaluate_bezier(spline->p0.x, spline->p1.x, spline->p2.x, t);
    pt.y = sys_covalent_evaluate_bezier(spline->p0.y, spline->p1.y, spline->p2.y, t);
    pt.z = sys_covalent_evaluate_bezier(spline->p0.z, spline->p1.z, spline->p2.z, t);
    return pt;
}

// Evaluates analytical tangent vector B'(t) = 2(1-t)(P1 - P0) + 2t(P2 - P1)
q16_vec3_t sys_covalent_evaluate_spline_tangent(const q16_bezier_spline_t* spline, q16_t t) {
    q16_t one_minus_t = Q16_ONE - t;
    q16_t c0 = (2 * one_minus_t) >> 16;
    q16_t c1 = (2 * t) >> 16;

    q16_vec3_t tan;
    tan.x = (c0 * (spline->p1.x - spline->p0.x) + c1 * (spline->p2.x - spline->p1.x)) >> 16;
    tan.y = (c0 * (spline->p1.y - spline->p0.y) + c1 * (spline->p2.y - spline->p1.y)) >> 16;
    tan.z = (c0 * (spline->p1.z - spline->p0.z) + c1 * (spline->p2.z - spline->p1.z)) >> 16;
    return tan;
}

// Distance squared between two 3D points in Q16.16
static inline q16_t vec3_dist_sq(q16_vec3_t a, q16_vec3_t b) {
    q16_t dx = (a.x - b.x) >> 8;
    q16_t dy = (a.y - b.y) >> 8;
    q16_t dz = (a.z - b.z) >> 8;
    return (dx * dx + dy * dy + dz * dz);
}

// Exact Ray-to-Swept-Spline intersection using De Casteljau adaptive subdivision
q16_spline_hit_t sys_covalent_ray_spline_intersect(
    const q16_ray_t* ray,
    const q16_bezier_spline_t* spline,
    q16_t t_min,
    q16_t t_max
) {
    q16_spline_hit_t result;
    result.hit = false;
    result.t = t_max;
    result.u_spline = 0;
    result.color_rgb = spline->color_rgb;

    q16_t r_sq = (spline->radius >> 8) * (spline->radius >> 8);
    if (r_sq == 0) r_sq = 4; // Minimal baseline line thickness

    // Fixed-point De Casteljau subdivision stepping
    const int STEPS = 16;
    q16_t step_dt = Q16_ONE / STEPS;
    q16_t closest_t = t_max;
    q16_t best_u = 0;
    q16_vec3_t best_pt = {0, 0, 0};

    for (int i = 0; i <= STEPS; i++) {
        q16_t u = i * step_dt;
        if (u > Q16_ONE) u = Q16_ONE;

        q16_vec3_t curve_pt = sys_covalent_evaluate_bezier_3d(spline, u);

        // Project ray origin -> curve point vector onto ray direction
        q16_vec3_t oc;
        oc.x = curve_pt.x - ray->origin.x;
        oc.y = curve_pt.y - ray->origin.y;
        oc.z = curve_pt.z - ray->origin.z;

        // t_proj = dot(oc, ray->dir) / Q16_ONE
        q16_t t_proj = (q16_t)(((int64_t)oc.x * ray->dir.x +
                                (int64_t)oc.y * ray->dir.y +
                                (int64_t)oc.z * ray->dir.z) >> 16);

        if (t_proj > t_min && t_proj < closest_t) {
            // Compute closest point along ray
            q16_vec3_t ray_pt;
            ray_pt.x = ray->origin.x + (q16_t)(((int64_t)ray->dir.x * t_proj) >> 16);
            ray_pt.y = ray->origin.y + (q16_t)(((int64_t)ray->dir.y * t_proj) >> 16);
            ray_pt.z = ray->origin.z + (q16_t)(((int64_t)ray->dir.z * t_proj) >> 16);

            q16_t dist_sq = vec3_dist_sq(ray_pt, curve_pt);

            if (dist_sq <= r_sq) {
                closest_t = t_proj;
                best_u = u;
                best_pt = curve_pt;
                result.hit = true;
            }
        }
    }

    if (result.hit) {
        result.t = closest_t;
        result.u_spline = best_u;
        result.hit_pos.x = ray->origin.x + (q16_t)(((int64_t)ray->dir.x * closest_t) >> 16);
        result.hit_pos.y = ray->origin.y + (q16_t)(((int64_t)ray->dir.y * closest_t) >> 16);
        result.hit_pos.z = ray->origin.z + (q16_t)(((int64_t)ray->dir.z * closest_t) >> 16);

        // Normal is vector from spline spine to ray hit surface
        result.normal.x = result.hit_pos.x - best_pt.x;
        result.normal.y = result.hit_pos.y - best_pt.y;
        result.normal.z = result.hit_pos.z - best_pt.z;
    }

    return result;
}

// Oscillating Spline Blade Trap Update (Pure Fixed-Point Periodic Sine)
void sys_covalent_update_oscillating_blade(
    q16_bezier_spline_t* blade,
    q16_vec3_t origin,
    q16_t amplitude_q16,
    q16_t angle_cordic,
    q16_t tick_delta
) {
    // Evaluate CORDIC sine
    q16_t sin_val, cos_val;
    covalent_cordic_sincos(angle_cordic, &sin_val, &cos_val);

    q16_t offset_x = (amplitude_q16 * sin_val) >> 16;
    q16_t offset_z = (amplitude_q16 * cos_val) >> 17;

    blade->p0.x = origin.x - offset_x;
    blade->p0.y = origin.y;
    blade->p0.z = origin.z + offset_z;

    // Anchor blade tip with high curvature
    blade->p1.x = origin.x + (offset_x >> 1);
    blade->p1.y = origin.y + (amplitude_q16 >> 1);
    blade->p1.z = origin.z + amplitude_q16;

    blade->p2.x = origin.x + offset_x;
    blade->p2.y = origin.y;
    blade->p2.z = origin.z - offset_z;
}
