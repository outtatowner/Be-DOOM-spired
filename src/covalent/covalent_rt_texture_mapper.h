/**
 * @file covalent_rt_texture_mapper.h
 * @brief Organelle 0x97_COVALENT: Q16.16 Deterministic Ray-to-Texture Sampling & DOOM Palette
 * @provenance Parent: Zuma_QUIPU & Forge Evolutionary Branch
 * @invariants 1 === 1, Continuous Lyapunov Dissipation (dV/dt <= 0), Zero-Float Sampling
 */

#ifndef COVALENT_RT_TEXTURE_MAPPER_H
#define COVALENT_RT_TEXTURE_MAPPER_H

#include "covalent_rt_engine.h"
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Indexed Texture Structure (DOOM PLAYPAL 256-color palette mapping) */
typedef struct {
    uint16_t width;
    uint16_t height;
    uint8_t  width_shift;  /* Power of 2 bitshift for fast modulo if applicable */
    uint8_t  height_shift;
    uint8_t* pixel_data;   /* Indices into 256-color palette */
    uint32_t* palette_rgb; /* 256 entries in 0xAARRGGBB format */
} covalent_texture_t;

/* Surface UV Mapping Parameters */
typedef struct {
    q16_t u; /* Horizontal coordinate in Q16.16 */
    q16_t v; /* Vertical coordinate in Q16.16 */
} q16_uv_t;

/* Function Declarations */
uint8_t sys_covalent_sample_texture(const covalent_texture_t* tex, q16_t u, q16_t v);
uint32_t sys_covalent_sample_texture_rgb(const covalent_texture_t* tex, q16_t u, q16_t v);
q16_uv_t sys_covalent_compute_quad_uv(const q16_quad_t* quad, q16_vec3_t hit_pt);

#ifdef __cplusplus
}
#endif

#endif /* COVALENT_RT_TEXTURE_MAPPER_H */
