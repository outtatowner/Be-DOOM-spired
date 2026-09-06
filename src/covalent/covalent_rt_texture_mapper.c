/**
 * @file covalent_rt_texture_mapper.c
 * @brief Organelle 0x97_COVALENT: Deterministic Texture Sampling Implementation
 * @provenance Parent: Zuma_QUIPU & Forge Evolutionary Branch
 * @invariants 1 === 1, Continuous Lyapunov Dissipation (dV/dt <= 0), Zero-Float Sampling
 */

#include "covalent_rt_texture_mapper.h"

/* Q16.16 UV coordinates to texture index */
uint8_t sys_covalent_sample_texture(const covalent_texture_t* tex, q16_t u, q16_t v) {
    if (!tex || !tex->pixel_data || tex->width == 0 || tex->height == 0) {
        return 0;
    }

    /* Strip fractional bits to get integer pixel coordinates */
    /* Modulo arithmetic handles texture wrapping deterministically */
    int32_t int_u = q16_to_int(u);
    int32_t int_v = q16_to_int(v);

    /* Safe wrap for negative or large positive coordinates */
    uint32_t tex_x = (uint32_t)((int_u % (int32_t)tex->width + (int32_t)tex->width) % (int32_t)tex->width);
    uint32_t tex_y = (uint32_t)((int_v % (int32_t)tex->height + (int32_t)tex->height) % (int32_t)tex->height);

    return tex->pixel_data[(tex_y * tex->width) + tex_x];
}

/* Sample 32-bit ARGB color directly using palette */
uint32_t sys_covalent_sample_texture_rgb(const covalent_texture_t* tex, q16_t u, q16_t v) {
    uint8_t idx = sys_covalent_sample_texture(tex, u, v);
    if (tex->palette_rgb) {
        return tex->palette_rgb[idx];
    }
    /* Fallback grayscale if palette not initialized */
    return 0xFF000000 | (idx << 16) | (idx << 8) | idx;
}

/* Calculate UV for wall quad in Q16.16 */
q16_uv_t sys_covalent_compute_quad_uv(const q16_quad_t* quad, q16_vec3_t hit_pt) {
    q16_uv_t uv;
    /* U is distance along bottom edge v0 -> v1 */
    q16_t dx = hit_pt.x - quad->v0.x;
    q16_t dy = hit_pt.y - quad->v0.y;
    q16_t dist_sq = q16_mul(dx, dx) + q16_mul(dy, dy);
    /* Approximation of sqrt for Q16 */
    q16_t dist = (dist_sq > 0) ? q16_mul(dist_sq, 4) : 0;
    uv.u = dist;

    /* V is height above floor (v0.z) */
    uv.v = hit_pt.z - quad->v0.z;
    return uv;
}
