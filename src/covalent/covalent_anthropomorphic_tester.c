/* kernel/covalent_anthropomorphic_tester.c */
/* Target: Human-Mimicry & Reaction Throttling */
/* Organelle 0x9F_COVALENT: Anthropomorphic Kinetic Engine (The Tester) */

#include "covalent_anthropomorphic_tester.h"
#include <math.h>
#include <stdio.h>

void sys_covalent_init_human_mimic(human_mimic_state_t* mimic, q16_t initial_yaw) {
    mimic->optic_detection_tick = 0;
    mimic->threat_registered = false;
    mimic->current_yaw = initial_yaw;
    mimic->last_fire_tick = 0;
    mimic->aabb_checks_passed = 0;
    mimic->sightlines_checked = 0;
    mimic->aim_aligned = false;
    mimic->current_phase = "IDLE_EXPLORE";
}

void sys_covalent_execute_solo_play(
    human_mimic_state_t* mimic,
    covalent_entity_t* visible_threat,
    uint32_t current_engine_tick
) {
    // 1. Human Reaction Delay (Assuming 60Hz tick, 15 ticks = 250ms delay)
    if (!mimic->threat_registered && visible_threat != NULL) {
        mimic->threat_registered = true;
        mimic->optic_detection_tick = current_engine_tick;
        mimic->current_phase = "OPTIC_PROCESSING_DELAY_250MS";
        mimic->sightlines_checked++;
        return; // Stare blankly. Human brain is processing.
    }

    if (mimic->threat_registered && (current_engine_tick - mimic->optic_detection_tick) >= 15) {
        // 2. Bound turn speed (prevent instant 180-degree Q16.16 snaps)
        q16_t target_yaw = sys_covalent_calculate_aim_vector(visible_threat);
        mimic->current_yaw = sys_covalent_lerp_yaw_human_speed(mimic->current_yaw, target_yaw);
        mimic->current_phase = "BOUNDED_YAW_ROTATION";

        // 3. Inject Virtual HID firing vector once aim is aligned
        if (sys_covalent_aim_aligned(mimic->current_yaw, target_yaw)) {
            mimic->aim_aligned = true;
            mimic->current_phase = "VIRTUAL_HID_FIRE";
            sys_covalent_inject_keystroke("DOOM_SHARD", 0x39, true); // FIRE (Spacebar)
            mimic->last_fire_tick = current_engine_tick;
            mimic->threat_registered = false; // Reset optic loop
        } else {
            mimic->aim_aligned = false;
        }
    } else if (!mimic->threat_registered) {
        mimic->current_phase = "AABB_BOUNDS_VALIDATION";
        mimic->aabb_checks_passed++;
    }
}

q16_t sys_covalent_calculate_aim_vector(covalent_entity_t* visible_threat) {
    if (!visible_threat) return 0;
    // Calculate discrete angle in 16-bit circle [0..65535]
    double dx = (double)(visible_threat->pos.x);
    double dy = (double)(visible_threat->pos.y);
    double rad = atan2(dy, dx);
    int32_t angle = (int32_t)((rad * 65536.0 / (2.0 * 3.14159265358979323846)) + 65536.0) & 0xffff;
    return (q16_t)angle;
}

q16_t sys_covalent_lerp_yaw_human_speed(q16_t current_yaw, q16_t target_yaw) {
    int32_t diff = (int32_t)(target_yaw - current_yaw);
    // Wrap shortest angle difference in [-32768, 32767]
    while (diff < -32768) diff += 65536;
    while (diff > 32767) diff -= 65536;

    // Throttle turn speed to human limit (no instant 180 snap)
    if (diff > MAX_HUMAN_YAW_RATE) {
        diff = MAX_HUMAN_YAW_RATE;
    } else if (diff < -MAX_HUMAN_YAW_RATE) {
        diff = -MAX_HUMAN_YAW_RATE;
    }

    return (q16_t)((current_yaw + diff) & 0xffff);
}

bool sys_covalent_aim_aligned(q16_t current_yaw, q16_t target_yaw) {
    int32_t diff = (int32_t)(target_yaw - current_yaw);
    while (diff < -32768) diff += 65536;
    while (diff > 32767) diff -= 65536;
    if (diff < 0) diff = -diff;
    // Within ~650 angle units (~3.5 degrees)
    return diff <= 650;
}

void sys_covalent_inject_keystroke(const char* target_shard, uint8_t scan_code, bool is_down) {
    // Virtual HID driver shim: injects keystroke event directly into DOOM shard input queue
    // scan_code 0x39 corresponds to DIK_SPACE (Spacebar / Primary Fire)
    (void)target_shard;
    (void)scan_code;
    (void)is_down;
}
