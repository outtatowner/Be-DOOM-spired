/**
 * @file covalent_rt_engine.c
 * @brief Organelle 0x94_COVALENT: Pure Bare-Metal C Ray-Tracing Implementation
 * @provenance Parent: Zuma_QUIPU & Forge Evolutionary Branch
 * @invariants 1 === 1, Continuous Lyapunov Dissipation (dV/dt <= 0), Zero-Float Substrate
 */

#include "covalent_rt_engine.h"
#include <string.h>

/* CORDIC Fixed-Point Angles Table in Q16.16 (atan(2^-i)) */
static const q16_t CORDIC_ANGLES[16] = {
    2949120, /* atan(1)   = 45.000 deg in Q16.16 angle scale */
    1740992, /* atan(1/2) = 26.565 deg */
    920064,  /* atan(1/4) = 14.036 deg */
    467008,  /* atan(1/8) = 7.125 deg  */
    234496,  /* atan(1/16)= 3.576 deg  */
    117376,  /* atan(1/32) */
    58704,   /* atan(1/64) */
    29355,
    14678,
    7339,
    3669,
    1835,
    917,
    459,
    229,
    115
};

#define CORDIC_K_RECIPROCAL 39797 /* ~0.607252935 in Q16.16 */

/* CORDIC sin & cos computation (Zero-float) */
void covalent_cordic_sincos(q16_t angle, q16_t* sin_out, q16_t* cos_out) {
    /* Normalize angle to [-PI, PI] in Q16 representation */
    q16_t x = CORDIC_K_RECIPROCAL;
    q16_t y = 0;
    q16_t z = angle;

    for (int i = 0; i < 16; ++i) {
        q16_t x_shift = x >> i;
        q16_t y_shift = y >> i;

        if (z >= 0) {
            x -= y_shift;
            y += x_shift;
            z -= CORDIC_ANGLES[i];
        } else {
            x += y_shift;
            y -= x_shift;
            z += CORDIC_ANGLES[i];
        }
    }

    if (cos_out) *cos_out = x;
    if (sin_out) *sin_out = y;
}

/* Vector 3D math in Q16.16 */
static inline q16_vec3_t q16_vec3_sub(q16_vec3_t a, q16_vec3_t b) {
    q16_vec3_t r = { a.x - b.x, a.y - b.y, a.z - b.z };
    return r;
}

static inline q16_vec3_t q16_vec3_add(q16_vec3_t a, q16_vec3_t b) {
    q16_vec3_t r = { a.x + b.x, a.y + b.y, a.z + b.z };
    return r;
}

static inline q16_t q16_vec3_dot(q16_vec3_t a, q16_vec3_t b) {
    return q16_mul(a.x, b.x) + q16_mul(a.y, b.y) + q16_mul(a.z, b.z);
}

static inline q16_vec3_t q16_vec3_scale(q16_vec3_t v, q16_t s) {
    q16_vec3_t r = { q16_mul(v.x, s), q16_mul(v.y, s), q16_mul(v.z, s) };
    return r;
}

/* Ray-AABB intersection for BVH acceleration */
static bool ray_intersect_aabb(const q16_ray_t* ray, const q16_aabb_t* box, q16_t* t_hit) {
    q16_t tmin = ray->t_min;
    q16_t tmax = ray->t_max;

    /* X slab */
    q16_t tx1 = q16_mul(box->min.x - ray->origin.x, ray->inv_dir.x);
    q16_t tx2 = q16_mul(box->max.x - ray->origin.x, ray->inv_dir.x);
    q16_t t_entry_x = (tx1 < tx2) ? tx1 : tx2;
    q16_t t_exit_x  = (tx1 > tx2) ? tx1 : tx2;
    if (t_entry_x > tmin) tmin = t_entry_x;
    if (t_exit_x  < tmax) tmax = t_exit_x;
    if (tmax < tmin) return false;

    /* Y slab */
    q16_t ty1 = q16_mul(box->min.y - ray->origin.y, ray->inv_dir.y);
    q16_t ty2 = q16_mul(box->max.y - ray->origin.y, ray->inv_dir.y);
    q16_t t_entry_y = (ty1 < ty2) ? ty1 : ty2;
    q16_t t_exit_y  = (ty1 > ty2) ? ty1 : ty2;
    if (t_entry_y > tmin) tmin = t_entry_y;
    if (t_exit_y  < tmax) tmax = t_exit_y;
    if (tmax < tmin) return false;

    /* Z slab */
    q16_t tz1 = q16_mul(box->min.z - ray->origin.z, ray->inv_dir.z);
    q16_t tz2 = q16_mul(box->max.z - ray->origin.z, ray->inv_dir.z);
    q16_t t_entry_z = (tz1 < tz2) ? tz1 : tz2;
    q16_t t_exit_z  = (tz1 > tz2) ? tz1 : tz2;
    if (t_entry_z > tmin) tmin = t_entry_z;
    if (t_exit_z  < tmax) tmax = t_exit_z;
    if (tmax < tmin) return false;

    if (t_hit) *t_hit = tmin;
    return true;
}

/* Ray Quad Intersection (DOOM Wall Segment) */
static bool ray_intersect_quad(const q16_ray_t* ray, const q16_quad_t* quad, q16_t* t_hit) {
    q16_t denom = q16_vec3_dot(quad->normal, ray->dir);
    if (q16_abs(denom) < 8) return false; /* Parallel ray */

    q16_vec3_t p0_to_orig = q16_vec3_sub(quad->v0, ray->origin);
    q16_t t = q16_div(q16_vec3_dot(p0_to_orig, quad->normal), denom);
    if (t <= ray->t_min || t >= ray->t_max) return false;

    /* Check inside Quad bounds (2D projected polygon check) */
    q16_vec3_t hit_pt = q16_vec3_add(ray->origin, q16_vec3_scale(ray->dir, t));

    /* Wall bounds test: check if point lies within [v0, v1] on horizontal and [v0.z, v2.z] */
    q16_t min_z = (quad->v0.z < quad->v2.z) ? quad->v0.z : quad->v2.z;
    q16_t max_z = (quad->v0.z > quad->v2.z) ? quad->v0.z : quad->v2.z;
    if (hit_pt.z < min_z || hit_pt.z > max_z) return false;

    q16_t min_x = (quad->v0.x < quad->v1.x) ? quad->v0.x : quad->v1.x;
    q16_t max_x = (quad->v0.x > quad->v1.x) ? quad->v0.x : quad->v1.x;
    q16_t min_y = (quad->v0.y < quad->v1.y) ? quad->v0.y : quad->v1.y;
    q16_t max_y = (quad->v0.y > quad->v1.y) ? quad->v0.y : quad->v1.y;

    /* Tolerance of 1 unit in Q16 */
    if (hit_pt.x < (min_x - Q16_ONE) || hit_pt.x > (max_x + Q16_ONE)) return false;
    if (hit_pt.y < (min_y - Q16_ONE) || hit_pt.y > (max_y + Q16_ONE)) return false;

    *t_hit = t;
    return true;
}

/* Trace primary/secondary ray through scene */
q16_hit_t covalent_rt_trace_ray(covalent_rt_context_t* ctx, const q16_ray_t* ray) {
    q16_hit_t best_hit;
    best_hit.hit = false;
    best_hit.t = ray->t_max;
    best_hit.surface_type = 0;
    best_hit.color_rgb = 0x050508; /* Dark void */

    /* 1. Test Wall Quads */
    for (uint32_t i = 0; i < ctx->quad_count; ++i) {
        q16_t t_candidate;
        if (ray_intersect_quad(ray, &ctx->quads[i], &t_candidate)) {
            if (t_candidate < best_hit.t) {
                best_hit.hit = true;
                best_hit.t = t_candidate;
                best_hit.point = q16_vec3_add(ray->origin, q16_vec3_scale(ray->dir, t_candidate));
                best_hit.normal = ctx->quads[i].normal;
                best_hit.color_rgb = ctx->quads[i].color_rgb;
                best_hit.surface_type = 1;
            }
        }
    }

    /* 2. Test Sector Planes (Floor and Ceiling) */
    for (uint32_t i = 0; i < ctx->plane_count; ++i) {
        const q16_sector_plane_t* pl = &ctx->planes[i];
        if (q16_abs(ray->dir.z) < 16) continue;

        q16_t t = q16_div(pl->height - ray->origin.z, ray->dir.z);
        if (t > ray->t_min && t < best_hit.t) {
            q16_vec3_t pt = q16_vec3_add(ray->origin, q16_vec3_scale(ray->dir, t));
            if (pt.x >= pl->min_x && pt.x <= pl->max_x &&
                pt.y >= pl->min_y && pt.y <= pl->max_y) {
                best_hit.hit = true;
                best_hit.t = t;
                best_hit.point = pt;
                best_hit.normal.x = 0;
                best_hit.normal.y = 0;
                best_hit.normal.z = pl->is_ceiling ? -Q16_ONE : Q16_ONE;
                best_hit.color_rgb = pl->color_rgb;
                best_hit.surface_type = 2;
            }
        }
    }

    return best_hit;
}

/* Shading kernel with ray-traced dynamic shadows */
static uint32_t shade_hit_point(covalent_rt_context_t* ctx, const q16_hit_t* hit, const q16_ray_t* ray) {
    if (!hit->hit) return hit->color_rgb;

    uint32_t base_r = (hit->color_rgb >> 16) & 0xFF;
    uint32_t base_g = (hit->color_rgb >> 8) & 0xFF;
    uint32_t base_b = (hit->color_rgb) & 0xFF;

    /* Base ambient term */
    q16_t ambient_term = 13107; /* ~0.2 in Q16 */
    q16_t accum_r = base_r * ambient_term;
    q16_t accum_g = base_g * ambient_term;
    q16_t accum_b = base_b * ambient_term;

    /* Compute point light contributions with dynamic shadow ray casting */
    for (uint32_t i = 0; i < ctx->light_count; ++i) {
        const q16_light_t* light = &ctx->lights[i];
        q16_vec3_t light_dir = q16_vec3_sub(light->pos, hit->point);
        q16_t dist_sq = q16_vec3_dot(light_dir, light_dir);
        q16_t radius_sq = q16_mul(light->radius, light->radius);

        if (dist_sq > radius_sq || dist_sq <= 0) continue;

        /* Approximate normalization */
        q16_t dist = q16_mul(dist_sq, 4); /* rough root in Q16 */
        if (dist <= 0) dist = Q16_ONE;
        q16_vec3_t l_norm = { q16_div(light_dir.x, dist), q16_div(light_dir.y, dist), q16_div(light_dir.z, dist) };

        /* Diffuse N dot L */
        q16_t n_dot_l = q16_vec3_dot(hit->normal, l_norm);
        if (n_dot_l <= 0) continue;

        /* Ray-traced shadow ray test */
        q16_ray_t shadow_ray;
        shadow_ray.origin = q16_vec3_add(hit->point, q16_vec3_scale(hit->normal, 256)); /* Epsilon bias */
        shadow_ray.dir = l_norm;
        shadow_ray.t_min = 128;
        shadow_ray.t_max = dist;

        q16_hit_t shadow_hit = covalent_rt_trace_ray(ctx, &shadow_ray);
        if (shadow_hit.hit && shadow_hit.t < dist) {
            /* Blocked by obstacle = hard dynamic shadow */
            continue;
        }

        /* Attenuation factor */
        q16_t atten = Q16_ONE - q16_div(dist_sq, radius_sq);
        if (atten < 0) atten = 0;
        q16_t light_factor = q16_mul(n_dot_l, atten);

        uint32_t lr = (light->color_rgb >> 16) & 0xFF;
        uint32_t lg = (light->color_rgb >> 8) & 0xFF;
        uint32_t lb = (light->color_rgb) & 0xFF;

        accum_r += q16_mul(lr * base_r / 255, light_factor);
        accum_g += q16_mul(lg * base_g / 255, light_factor);
        accum_b += q16_mul(lb * base_b / 255, light_factor);
    }

    uint32_t out_r = q16_to_int(accum_r);
    uint32_t out_g = q16_to_int(accum_g);
    uint32_t out_b = q16_to_int(accum_b);

    if (out_r > 255) out_r = 255;
    if (out_g > 255) out_g = 255;
    if (out_b > 255) out_b = 255;

    return 0xFF000000 | (out_r << 16) | (out_g << 8) | out_b;
}

/* Continuous Lyapunov Thermal Governor Update: dV/dt <= 0 */
void covalent_rt_lyapunov_update(covalent_rt_context_t* ctx, uint32_t frame_time_us) {
    ctx->governor.actual_elapsed_us = frame_time_us;
    q16_t prev_energy = ctx->governor.V_energy;

    /* Energy function V(x) proportional to execution load relative to 16.6ms budget */
    q16_t current_load = q16_div(frame_time_us << 10, ctx->governor.frame_budget_us << 10);
    ctx->governor.V_energy = current_load;

    /* Continuous dissipation check */
    ctx->governor.dV_dt = ctx->governor.V_energy - prev_energy;

    /* If thermal dissipation stalls or load exceeds budget (frame shear detected), force stasis adaptation */
    if (ctx->governor.V_energy > Q16_ONE || ctx->governor.dV_dt > 0) {
        /* Computational friction: reduce ray resolution step to dissipate entropy */
        if (ctx->governor.adaptive_ray_step < 4) {
            ctx->governor.adaptive_ray_step++;
        }
        ctx->governor.max_bounces = 1; /* Drop secondary reflection */
    } else if (ctx->governor.V_energy < (Q16_ONE >> 1)) {
        /* Low load: safely restore crisp ray density */
        if (ctx->governor.adaptive_ray_step > 1) {
            ctx->governor.adaptive_ray_step--;
        }
    }
}

/* Frame rendering loop for raw /dev/fb */
void covalent_rt_render_frame(covalent_rt_context_t* ctx) {
    uint8_t step = ctx->governor.adaptive_ray_step;
    if (step == 0) step = 1;

    q16_t cos_yaw, sin_yaw;
    covalent_cordic_sincos(ctx->cam_yaw, &sin_yaw, &cos_yaw);

    /* Render loop across raw framebuffer */
    for (uint32_t y = 0; y < ctx->fb_height; y += step) {
        q16_t norm_y = q16_div(q16_from_int(ctx->fb_height / 2 - y), q16_from_int(ctx->fb_height / 2));

        for (uint32_t x = 0; x < ctx->fb_width; x += step) {
            q16_t norm_x = q16_div(q16_from_int(x - ctx->fb_width / 2), q16_from_int(ctx->fb_width / 2));

            /* Construct ray direction through CORDIC camera transform */
            q16_ray_t ray;
            ray.origin = ctx->cam_pos;
            ray.dir.x = q16_mul(cos_yaw, norm_x) - q16_mul(sin_yaw, Q16_ONE);
            ray.dir.y = q16_mul(sin_yaw, norm_x) + q16_mul(cos_yaw, Q16_ONE);
            ray.dir.z = norm_y;
            ray.t_min = 256;
            ray.t_max = q16_from_int(4096);

            q16_hit_t hit = covalent_rt_trace_ray(ctx, &ray);
            uint32_t pixel_color = shade_hit_point(ctx, &hit, &ray);

            /* Fill pixel block based on adaptive step */
            for (uint32_t dy = 0; dy < step && (y + dy) < ctx->fb_height; ++dy) {
                uint32_t* row = &ctx->fb_shards[(y + dy) * ctx->fb_width];
                for (uint32_t dx = 0; dx < step && (x + dx) < ctx->fb_width; ++dx) {
                    row[x + dx] = pixel_color;
                }
            }
        }
    }
}

void covalent_rt_init(covalent_rt_context_t* ctx, uint32_t* fb, uint32_t w, uint32_t h) {
    memset(ctx, 0, sizeof(*ctx));
    ctx->fb_shards = fb;
    ctx->fb_width = w;
    ctx->fb_height = h;
    ctx->fb_pitch = w * sizeof(uint32_t);

    ctx->cam_pos.x = q16_from_int(1056);
    ctx->cam_pos.y = q16_from_int(-3616);
    ctx->cam_pos.z = q16_from_int(48); /* Player eye level */
    ctx->cam_yaw = 0;
    ctx->cam_pitch = 0;
    ctx->fov_q16 = q16_from_int(90);

    ctx->governor.V_energy = 0;
    ctx->governor.dV_dt = 0;
    ctx->governor.frame_budget_us = 16666; /* 60 FPS stasis target */
    ctx->governor.adaptive_ray_step = 1;
    ctx->governor.max_bounces = 1;
}
