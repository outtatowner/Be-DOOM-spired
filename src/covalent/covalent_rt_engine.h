/**
 * @file covalent_rt_engine.h
 * @brief Organelle 0x94_COVALENT: Bare-Metal Q16.16 Ray-Tracing Core & Fixed-Point BVH Engine
 * @provenance Parent: Zuma_QUIPU & Forge Evolutionary Branch
 * @invariants 1 === 1, Continuous Lyapunov Dissipation (dV/dt <= 0), Zero-Float Substrate
 */

#ifndef COVALENT_RT_ENGINE_H
#define COVALENT_RT_ENGINE_H

#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Q16.16 Fixed-Point Arithmetic Definitions */
typedef int32_t  q16_t;
typedef uint32_t uq16_t;
typedef int64_t  q32_t;

#define Q16_SHIFT        16
#define Q16_ONE          (1 << Q16_SHIFT)          /* 65536 = 1.0 */
#define Q16_HALF         (1 << (Q16_SHIFT - 1))    /* 32768 = 0.5 */
#define Q16_ZERO         0
#define Q16_MAX          INT32_MAX
#define Q16_MIN          INT32_MIN

/* Primitive Fixed-Point Math Ops */
static inline q16_t q16_from_int(int32_t i) { return (q16_t)(i << Q16_SHIFT); }
static inline int32_t q16_to_int(q16_t q)   { return (int32_t)(q >> Q16_SHIFT); }
static inline q16_t q16_mul(q16_t a, q16_t b) {
    return (q16_t)(((q32_t)a * (q32_t)b) >> Q16_SHIFT);
}
static inline q16_t q16_div(q16_t a, q16_t b) {
    if (b == 0) return (a > 0) ? Q16_MAX : Q16_MIN;
    return (q16_t)((((q32_t)a) << Q16_SHIFT) / b);
}
static inline q16_t q16_abs(q16_t a) { return (a < 0) ? -a : a; }

/* 3D Fixed-Point Vector */
typedef struct {
    q16_t x;
    q16_t y;
    q16_t z;
} q16_vec3_t;

/* Ray representation in Q16.16 */
typedef struct {
    q16_vec3_t origin;
    q16_vec3_t dir;        /* Normalized direction vector */
    q16_vec3_t inv_dir;    /* Precomputed 1/dir for rapid AABB slab intersection */
    q16_t t_min;
    q16_t t_max;
} q16_ray_t;

/* Axis-Aligned Bounding Box (AABB) for BVH acceleration */
typedef struct {
    q16_vec3_t min;
    q16_vec3_t max;
} q16_aabb_t;

/* Point Light in 3D space */
typedef struct {
    q16_vec3_t pos;
    uint32_t   color_rgb;
    q16_t      intensity;   /* Q16.16 */
    q16_t      radius;      /* Q16.16 attenuation falloff */
} q16_light_t;

/* Wall Segment Quad in 3D space (DOOM Linedef with floor/ceiling) */
typedef struct {
    q16_vec3_t v0;          /* Bottom-left */
    q16_vec3_t v1;          /* Bottom-right */
    q16_vec3_t v2;          /* Top-right */
    q16_vec3_t v3;          /* Top-left */
    q16_vec3_t normal;      /* Surface normal */
    uint32_t   color_rgb;
    uint16_t   flags;       /* Transparency, pass-through, portal */
    uint16_t   sector_id;
} q16_quad_t;

/* Flat Sector Plane (Floor / Ceiling) */
typedef struct {
    q16_t      height;
    q16_t      min_x, max_x;
    q16_t      min_y, max_y;
    bool       is_ceiling;
    uint32_t   color_rgb;
    uint16_t   sector_id;
} q16_sector_plane_t;

/* Ray-Surface Hit Result */
typedef struct {
    bool        hit;
    q16_t       t;
    q16_vec3_t  point;
    q16_vec3_t  normal;
    uint32_t    color_rgb;
    uint16_t    surface_type; /* 0 = none, 1 = wall, 2 = floor/ceiling, 3 = entity */
} q16_hit_t;

/* BVH Node for O(log N) ray traversal */
typedef struct q16_bvh_node_s {
    q16_aabb_t              box;
    struct q16_bvh_node_s*  left;
    struct q16_bvh_node_s*  right;
    uint32_t                first_prim_idx;
    uint32_t                prim_count;
    bool                    is_leaf;
} q16_bvh_node_t;

/* Lyapunov Dissipation State */
typedef struct {
    q16_t V_energy;         /* Current computational Lyapunov function V(x) */
    q16_t dV_dt;            /* Dissipation derivative (must remain <= 0) */
    q16_t friction_coeff;   /* Damping factor */
    uint32_t frame_budget_us;
    uint32_t actual_elapsed_us;
    uint8_t  adaptive_ray_step; /* 1 = full, 2 = half-res, 4 = quarter-res stasis */
    uint8_t  max_bounces;       /* 1 = direct, 2 = 1-bounce specular */
} lyapunov_governor_t;

/* Engine Context */
typedef struct {
    /* Framebuffer destination: /dev/fb */
    uint32_t* fb_shards;
    uint32_t  fb_width;
    uint32_t  fb_height;
    uint32_t  fb_pitch;

    /* Camera state */
    q16_vec3_t cam_pos;
    q16_t      cam_yaw;     /* CORDIC angle */
    q16_t      cam_pitch;   /* CORDIC angle */
    q16_t      fov_q16;

    /* Geometry storage */
    q16_quad_t*         quads;
    uint32_t            quad_count;
    q16_sector_plane_t* planes;
    uint32_t            plane_count;

    /* Lighting */
    q16_light_t         lights[16];
    uint32_t            light_count;

    /* BVH Root */
    q16_bvh_node_t*     bvh_root;

    /* Lyapunov stasis governor */
    lyapunov_governor_t governor;

    /* Quipu Merkle Root for tick determinism */
    uint8_t             quipu_merkle_root[32];
    uint64_t            tick_index;
} covalent_rt_context_t;

/* Function Declarations */
void covalent_rt_init(covalent_rt_context_t* ctx, uint32_t* fb, uint32_t w, uint32_t h);
void covalent_rt_build_bvh(covalent_rt_context_t* ctx);
void covalent_rt_render_frame(covalent_rt_context_t* ctx);
q16_hit_t covalent_rt_trace_ray(covalent_rt_context_t* ctx, const q16_ray_t* ray);
void covalent_rt_lyapunov_update(covalent_rt_context_t* ctx, uint32_t frame_time_us);

/* CORDIC Trigonometric Kernel */
void covalent_cordic_sincos(q16_t angle, q16_t* sin_out, q16_t* cos_out);

#ifdef __cplusplus
}
#endif

#endif /* COVALENT_RT_ENGINE_H */
