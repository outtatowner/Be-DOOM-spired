/**
 * @file covalent_doom_wad_parser.h
 * @brief Organelle 0x95_COVALENT: Binary WAD Lump Ingestion & Q16.16 3D Conversion
 * @provenance Parent: Zuma_QUIPU & Forge Evolutionary Branch
 * @invariants 1 === 1, Continuous Lyapunov Dissipation (dV/dt <= 0), Zero-Float Substrate
 */

#ifndef COVALENT_DOOM_WAD_PARSER_H
#define COVALENT_DOOM_WAD_PARSER_H

#include "covalent_rt_engine.h"
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Binary WAD Header */
typedef struct __attribute__((packed)) {
    char     identification[4]; /* "IWAD" or "PWAD" */
    uint32_t numlumps;
    uint32_t infotableofs;
} wad_header_t;

/* Lump Directory Entry */
typedef struct __attribute__((packed)) {
    uint32_t filepos;
    uint32_t size;
    char     name[8];
} wad_lump_entry_t;

/* DOOM Raw Map Lump Structures (Little Endian) */
typedef struct __attribute__((packed)) {
    int16_t x;
    int16_t y;
} doom_raw_vertex_t;

typedef struct __attribute__((packed)) {
    uint16_t v1;
    uint16_t v2;
    uint16_t flags;
    int16_t  special_type;
    int16_t  sector_tag;
    uint16_t sidenum[2]; /* Front and Back Sidedef indices (0xFFFF = none) */
} doom_raw_linedef_t;

typedef struct __attribute__((packed)) {
    int16_t  texture_offset_x;
    int16_t  texture_offset_y;
    char     upper_texture[8];
    char     lower_texture[8];
    char     middle_texture[8];
    uint16_t sector;
} doom_raw_sidedef_t;

typedef struct __attribute__((packed)) {
    int16_t floor_height;
    int16_t ceiling_height;
    char    floor_flat[8];
    char    ceiling_flat[8];
    int16_t light_level;
    int16_t special_type;
    int16_t tag;
} doom_raw_sector_t;

typedef struct __attribute__((packed)) {
    int16_t  x;
    int16_t  y;
    int16_t  angle;
    int16_t  type;
    uint16_t flags;
} doom_raw_thing_t;

/* Extracted Map Geometry in Q16.16 space */
typedef struct {
    char               map_name[8];
    uint32_t           vertex_count;
    doom_raw_vertex_t* vertices;

    uint32_t           linedef_count;
    doom_raw_linedef_t* linedefs;

    uint32_t           sidedef_count;
    doom_raw_sidedef_t* sidedefs;

    uint32_t           sector_count;
    doom_raw_sector_t* sectors;

    uint32_t           thing_count;
    doom_raw_thing_t*  things;

    /* Player 1 spawn coordinates in Q16.16 */
    q16_vec3_t         player_spawn_pos;
    q16_t              player_spawn_angle;

    /* Be <> Co-Play Agent spawn coordinates */
    q16_vec3_t         be_agent_spawn_pos;
    q16_t              be_agent_spawn_angle;
} parsed_doom_map_t;

/* Parser API */
bool covalent_wad_parse_buffer(const uint8_t* wad_data, uint32_t wad_size, const char* map_name, parsed_doom_map_t* out_map);
bool covalent_wad_generate_e1m1_benchmark(parsed_doom_map_t* out_map);
void covalent_wad_build_rt_geometry(const parsed_doom_map_t* map, covalent_rt_context_t* rt_ctx);

#ifdef __cplusplus
}
#endif

#endif /* COVALENT_DOOM_WAD_PARSER_H */
