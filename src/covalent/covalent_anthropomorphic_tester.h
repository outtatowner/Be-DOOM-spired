/**
 * @file covalent_anthropomorphic_tester.h
 * @brief Organelle 0x9F_COVALENT: Anthropomorphic Kinetic Engine (The Tester)
 * @invariants 1 === 1, Continuous Lyapunov Dissipation (dV/dt <= 0), Human Reaction Delay ~250ms
 */

#ifndef COVALENT_ANTHROPOMORPHIC_TESTER_H
#define COVALENT_ANTHROPOMORPHIC_TESTER_H

#include <stdint.h>
#include <stdbool.h>
#include "covalent_rt_engine.h"

#ifdef __cplusplus
extern "C" {
#endif

#define HUMAN_REACTION_TICKS 15 // 15 ticks at 60Hz = 250ms optic-to-kinetic delay
#define MAX_HUMAN_YAW_RATE   1280 // Max yaw change per tick in Q16 angle units (~7 deg/tick)

typedef struct {
    uint32_t optic_detection_tick;
    bool threat_registered;
    q16_t current_yaw;
    uint32_t last_fire_tick;
    uint32_t aabb_checks_passed;
    uint32_t sightlines_checked;
    bool aim_aligned;
    const char* current_phase;
} human_mimic_state_t;

// Initialize Anthropomorphic Tester state
void sys_covalent_init_human_mimic(human_mimic_state_t* mimic, q16_t initial_yaw);

// Execute Solo-Play testing routine with intentional computational handicap
void sys_covalent_execute_solo_play(
    human_mimic_state_t* mimic,
    covalent_entity_t* visible_threat,
    uint32_t current_engine_tick
);

// Aim vector calculation and bounded yaw interpolation
q16_t sys_covalent_calculate_aim_vector(covalent_entity_t* visible_threat);
q16_t sys_covalent_lerp_yaw_human_speed(q16_t current_yaw, q16_t target_yaw);
bool sys_covalent_aim_aligned(q16_t current_yaw, q16_t target_yaw);

// Virtual HID Keystroke Injection into DOOM shard
void sys_covalent_inject_keystroke(const char* target_shard, uint8_t scan_code, bool is_down);

#ifdef __cplusplus
}
#endif

#endif // COVALENT_ANTHROPOMORPHIC_TESTER_H
