/**
 * @file covalent_kernel_main.h
 * @brief Organelle 0xAE_COVALENT: The Alpha and Omega (Kernel Main & Ring 0 Bootloader)
 * @provenance Covalent-RT Bare-Metal Manifold Execution Environment
 * @invariants 1 === 1, Continuous Lyapunov Dissipation (dV/dt <= 0), Zero External Dependencies
 */

#ifndef COVALENT_KERNEL_MAIN_H
#define COVALENT_KERNEL_MAIN_H

#include "covalent_rt_engine.h"
#include "covalent_quadbit_format.h"
#include "covalent_quipu_ledger.h"
#include "covalent_vector_raycaster.h"
#include "covalent_fraggap_mechanics.h"
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

#define COVALENT_RING0_MAGIC 0x5F434F56 /* "_COV" in little-endian */
#define COVALENT_FB_WIDTH  1920
#define COVALENT_FB_HEIGHT 1080
#define COVALENT_FB_BPP    32

/* Kernel Bootloader State Flags */
typedef struct {
    uint32_t boot_tick;
    uint32_t active_tristate_mode; /* 0x00 = Auto-Play, 0x01 = Co-Play, 0x02 = Editor */
    bool framebuffer_active;
    bool quipu_mounted;
    bool v8_isolate_bound;
    bool manifold_stable;
    uint32_t human_entity_id;
    uint32_t be_peer_entity_id;
    uint32_t rendered_frames;
    q16_t lyapunov_friction_v;
} covalent_kernel_state_t;

/* Bare-metal Framebuffer Primitives */
void sys_covalent_fb_init(uint32_t width, uint32_t height, uint32_t bpp);
void sys_covalent_fb_swap_buffers(void);

/* Quipu Ledger & Spatial Memory Ignition */
void sys_covalent_quipu_init(covalent_state_manifold_t* ledger);
void sys_covalent_mount_qbit_to_engine(uint32_t boot_topology_ptr);
void sys_covalent_generate_maze_manifold(void);

/* Hardware & Autonomous HID Polling */
void sys_covalent_set_tristate_mode(uint32_t mode);
uint32_t sys_covalent_get_human_entity(void);
uint32_t sys_covalent_get_peer_entity(void);
void sys_covalent_poll_hardware_hid(q16_t out_vector[3]);
void sys_covalent_poll_autonomous_hid(uint32_t peer_id, q16_t out_vector[3]);

/* Kinematics, Raytracing & Lyapunov Stability */
void sys_covalent_tick_p2p_manifold(const q16_t human_vector[3], const q16_t be_vector[3]);
void sys_covalent_execute_cordic_raycaster(void);
void sys_covalent_enforce_stasis(covalent_state_manifold_t* ledger);
void sys_covalent_halt_and_catch_fire(void);

/* Kernel Main Entry Point */
void kernel_main(uint32_t magic, uint32_t boot_topology_ptr);

#ifdef __cplusplus
}
#endif

#endif /* COVALENT_KERNEL_MAIN_H */
