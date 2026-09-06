/**
 * @file covalent_doom_wad_parser.c
 * @brief Organelle 0x95_COVALENT: WAD Binary Parsing & Ray-Tracing Geometry Conversion
 * @provenance Parent: Zuma_QUIPU & Forge Evolutionary Branch
 * @invariants 1 === 1, Continuous Lyapunov Dissipation (dV/dt <= 0), Zero-Float Substrate
 */

#include "covalent_doom_wad_parser.h"
#include <stdlib.h>
#include <string.h>

/* Normal calculation for 2D line segment extruded vertically */
static q16_vec3_t compute_wall_normal(q16_t x1, q16_t y1, q16_t x2, q16_t y2) {
    q16_t dx = x2 - x1;
    q16_t dy = y2 - y1;
    /* Perpendicular vector: (dy, -dx) */
    /* Normalize using approximate Q16 scale */
    q16_t len_sq = q16_mul(dx, dx) + q16_mul(dy, dy);
    if (len_sq <= 0) {
        q16_vec3_t n = { 0, Q16_ONE, 0 };
        return n;
    }
    /* Fixed-point sqrt approximation */
    q16_t len = q16_mul(len_sq, 4);
    if (len <= 0) len = Q16_ONE;

    q16_vec3_t n;
    n.x = q16_div(dy, len);
    n.y = q16_div(-dx, len);
    n.z = 0;
    return n;
}

/* Parse DOOM WAD from memory buffer */
bool covalent_wad_parse_buffer(const uint8_t* wad_data, uint32_t wad_size, const char* map_name, parsed_doom_map_t* out_map) {
    if (!wad_data || wad_size < sizeof(wad_header_t)) return false;

    const wad_header_t* header = (const wad_header_t*)wad_data;
    if (memcmp(header->identification, "IWAD", 4) != 0 &&
        memcmp(header->identification, "PWAD", 4) != 0) {
        return false;
    }

    if (header->infotableofs + header->numlumps * sizeof(wad_lump_entry_t) > wad_size) {
        return false;
    }

    const wad_lump_entry_t* lumps = (const wad_lump_entry_t*)(wad_data + header->infotableofs);
    int32_t map_idx = -1;

    for (uint32_t i = 0; i < header->numlumps; ++i) {
        if (strncmp(lumps[i].name, map_name, 8) == 0) {
            map_idx = (int32_t)i;
            break;
        }
    }

    if (map_idx < 0) return false;

    memset(out_map, 0, sizeof(*out_map));
    strncpy(out_map->map_name, map_name, 8);

    /* Parse subsequent lumps for map: THINGS(1), LINEDEFS(2), SIDEDEFS(3), VERTEXES(4), SECTORS(8) */
    for (uint32_t offset = 1; offset <= 10 && (map_idx + offset) < header->numlumps; ++offset) {
        const wad_lump_entry_t* lump = &lumps[map_idx + offset];
        const uint8_t* lump_data = wad_data + lump->filepos;

        if (strncmp(lump->name, "VERTEXES", 8) == 0) {
            out_map->vertex_count = lump->size / sizeof(doom_raw_vertex_t);
            out_map->vertices = (doom_raw_vertex_t*)malloc(lump->size);
            memcpy(out_map->vertices, lump_data, lump->size);
        } else if (strncmp(lump->name, "LINEDEFS", 8) == 0) {
            out_map->linedef_count = lump->size / sizeof(doom_raw_linedef_t);
            out_map->linedefs = (doom_raw_linedef_t*)malloc(lump->size);
            memcpy(out_map->linedefs, lump_data, lump->size);
        } else if (strncmp(lump->name, "SIDEDEFS", 8) == 0) {
            out_map->sidedef_count = lump->size / sizeof(doom_raw_sidedef_t);
            out_map->sidedefs = (doom_raw_sidedef_t*)malloc(lump->size);
            memcpy(out_map->sidedefs, lump_data, lump->size);
        } else if (strncmp(lump->name, "SECTORS", 8) == 0) {
            out_map->sector_count = lump->size / sizeof(doom_raw_sector_t);
            out_map->sectors = (doom_raw_sector_t*)malloc(lump->size);
            memcpy(out_map->sectors, lump_data, lump->size);
        } else if (strncmp(lump->name, "THINGS", 8) == 0) {
            out_map->thing_count = lump->size / sizeof(doom_raw_thing_t);
            out_map->things = (doom_raw_thing_t*)malloc(lump->size);
            memcpy(out_map->things, lump_data, lump->size);
        }
    }

    return true;
}

/* Convert parsed map data into 3D ray-testable Quads and Sector Planes */
void covalent_wad_build_rt_geometry(const parsed_doom_map_t* map, covalent_rt_context_t* rt_ctx) {
    if (!map || !rt_ctx) return;

    /* Allocate quads: each linedef creates 1 or 2 quads depending on one-sided vs two-sided */
    uint32_t max_quads = map->linedef_count * 3 + 64;
    rt_ctx->quads = (q16_quad_t*)malloc(sizeof(q16_quad_t) * max_quads);
    rt_ctx->quad_count = 0;

    for (uint32_t i = 0; i < map->linedef_count; ++i) {
        const doom_raw_linedef_t* line = &map->linedefs[i];
        if (line->v1 >= map->vertex_count || line->v2 >= map->vertex_count) continue;

        const doom_raw_vertex_t* vt1 = &map->vertices[line->v1];
        const doom_raw_vertex_t* vt2 = &map->vertices[line->v2];

        q16_t x1 = q16_from_int(vt1->x);
        q16_t y1 = q16_from_int(vt1->y);
        q16_t x2 = q16_from_int(vt2->x);
        q16_t y2 = q16_from_int(vt2->y);

        q16_vec3_t norm = compute_wall_normal(x1, y1, x2, y2);

        /* Front side */
        if (line->sidenum[0] != 0xFFFF && line->sidenum[0] < map->sidedef_count) {
            const doom_raw_sidedef_t* side_front = &map->sidedefs[line->sidenum[0]];
            if (side_front->sector < map->sector_count) {
                const doom_raw_sector_t* sec_front = &map->sectors[side_front->sector];

                /* Is it one-sided (solid outer wall) or two-sided (portal)? */
                if (line->sidenum[1] == 0xFFFF) {
                    /* Solid Wall */
                    q16_quad_t* q = &rt_ctx->quads[rt_ctx->quad_count++];
                    q16_t z_floor = q16_from_int(sec_front->floor_height);
                    q16_t z_ceil  = q16_from_int(sec_front->ceiling_height);

                    q->v0.x = x1; q->v0.y = y1; q->v0.z = z_floor;
                    q->v1.x = x2; q->v1.y = y2; q->v1.z = z_floor;
                    q->v2.x = x2; q->v2.y = y2; q->v2.z = z_ceil;
                    q->v3.x = x1; q->v3.y = y1; q->v3.z = z_ceil;
                    q->normal = norm;
                    q->color_rgb = 0x8a7052; /* DOOM Brown Stone/STARTAN */
                    q->sector_id = side_front->sector;
                } else if (line->sidenum[1] < map->sidedef_count) {
                    /* Two-sided portal step wall (lower / upper step) */
                    const doom_raw_sidedef_t* side_back = &map->sidedefs[line->sidenum[1]];
                    if (side_back->sector < map->sector_count) {
                        const doom_raw_sector_t* sec_back = &map->sectors[side_back->sector];

                        /* Step down wall */
                        if (sec_front->floor_height > sec_back->floor_height) {
                            q16_quad_t* q = &rt_ctx->quads[rt_ctx->quad_count++];
                            q->v0.x = x1; q->v0.y = y1; q->v0.z = q16_from_int(sec_back->floor_height);
                            q->v1.x = x2; q->v1.y = y2; q->v1.z = q16_from_int(sec_back->floor_height);
                            q->v2.x = x2; q->v2.y = y2; q->v2.z = q16_from_int(sec_front->floor_height);
                            q->v3.x = x1; q->v3.y = y1; q->v3.z = q16_from_int(sec_front->floor_height);
                            q->normal = norm;
                            q->color_rgb = 0x4a4a4f; /* Step ledge */
                            q->sector_id = side_front->sector;
                        }
                    }
                }
            }
        }
    }

    /* Sector floor / ceiling planes */
    rt_ctx->plane_count = map->sector_count * 2;
    rt_ctx->planes = (q16_sector_plane_t*)malloc(sizeof(q16_sector_plane_t) * rt_ctx->plane_count);
    uint32_t p_idx = 0;

    for (uint32_t s = 0; s < map->sector_count; ++s) {
        const doom_raw_sector_t* sec = &map->sectors[s];

        /* Floor plane */
        q16_sector_plane_t* pf = &rt_ctx->planes[p_idx++];
        pf->height = q16_from_int(sec->floor_height);
        pf->min_x = q16_from_int(-4096);
        pf->max_x = q16_from_int(4096);
        pf->min_y = q16_from_int(-4096);
        pf->max_y = q16_from_int(4096);
        pf->is_ceiling = false;
        pf->color_rgb = (sec->special_type == 7 || sec->special_type == 16) ? 0x248024 /* Toxic green slime */ : 0x383838;
        pf->sector_id = (uint16_t)s;

        /* Ceiling plane */
        q16_sector_plane_t* pc = &rt_ctx->planes[p_idx++];
        pc->height = q16_from_int(sec->ceiling_height);
        pc->min_x = q16_from_int(-4096);
        pc->max_x = q16_from_int(4096);
        pc->min_y = q16_from_int(-4096);
        pc->max_y = q16_from_int(4096);
        pc->is_ceiling = true;
        pc->color_rgb = 0x22242a; /* Dark industrial ceiling */
        pc->sector_id = (uint16_t)s;
    }

    /* Spawn point lights: slime pits, tech lamps, armor bonus glow */
    rt_ctx->light_count = 0;

    /* Light 0: Toxic slime hazard radiation */
    rt_ctx->lights[rt_ctx->light_count].pos.x = q16_from_int(500);
    rt_ctx->lights[rt_ctx->light_count].pos.y = q16_from_int(-3000);
    rt_ctx->lights[rt_ctx->light_count].pos.z = q16_from_int(16);
    rt_ctx->lights[rt_ctx->light_count].color_rgb = 0x00FF44; /* Emerald radioactive */
    rt_ctx->lights[rt_ctx->light_count].radius = q16_from_int(800);
    rt_ctx->lights[rt_ctx->light_count].intensity = Q16_ONE;
    rt_ctx->light_count++;

    /* Light 1: Tech pillar warm halogen */
    rt_ctx->lights[rt_ctx->light_count].pos.x = q16_from_int(1056);
    rt_ctx->lights[rt_ctx->light_count].pos.y = q16_from_int(-3400);
    rt_ctx->lights[rt_ctx->light_count].pos.z = q16_from_int(96);
    rt_ctx->lights[rt_ctx->light_count].color_rgb = 0xFFBA42; /* Warm amber */
    rt_ctx->lights[rt_ctx->light_count].radius = q16_from_int(900);
    rt_ctx->lights[rt_ctx->light_count].intensity = Q16_ONE;
    rt_ctx->light_count++;
}
