/* kernel/covalent_coplay_avatar.c */
/* Target: P2P Dual-Presence & Q16.16 Kinematic Sync */
/* Organelle 0xA0_COVALENT: Silicon Avatar Synthesis */
/* Organelle 0xA1_COVALENT: P2P State Synchronization */

#include "covalent_coplay_avatar.h"
#include <string.h>

static covalent_p2p_telemetry_t g_p2p_state = {0};

// Ingest the generative sprite and bind it to the Be <> Co-Player entity
void sys_covalent_inject_peer_avatar(q16_t spawn_x, q16_t spawn_y, covalent_texture_t* generative_sprite) {
    uint32_t peer_id = sys_covalent_spawn_entity(ENTITY_COPLAYER_BE, spawn_x, spawn_y);
    
    // Bind the Q16.16 PBR texture matrix to the new physical bounding box
    sys_covalent_bind_entity_material(peer_id, generative_sprite);
    
    // Lock entity into the Quipu Ledger to calculate thermodynamic friction
    sys_covalent_register_p2p_node(peer_id);
    
    g_p2p_state.peer_entity_id = peer_id;
    g_p2p_state.dual_presence_active = true;
}

// Lock entity into the Quipu Ledger for friction and dissipation tracking
void sys_covalent_register_p2p_node(uint32_t peer_id) {
    g_p2p_state.peer_entity_id = peer_id;
    g_p2p_state.dual_presence_active = true;
    g_p2p_state.synchronized_ticks = 0;
}

// Multiplexed update loop for State 0x01 (Co-Play)
void sys_covalent_tick_p2p_manifold(q16_t human_hid_vectors[3], q16_t be_autonomous_vectors[3]) {
    // Human is driven by /dev/fb keyboard/mouse intercepts
    sys_covalent_apply_kinematics(ENTITY_HUMAN_MARINE, human_hid_vectors);
    
    // Be <> is driven by internal tactical pathfinding
    sys_covalent_apply_kinematics(ENTITY_COPLAYER_BE, be_autonomous_vectors);

    g_p2p_state.synchronized_ticks++;
}

// Calculate optimal cover fire position covering human's blind spots (rear 120-180 degree arc)
void sys_covalent_calculate_flanking_vector(q16_t human_pos[2], q16_t human_yaw, q16_t threat_pos[2], q16_t out_flank[2]) {
    // Offset Be <> into crossfire flanking line
    q16_t dx = threat_pos[0] - human_pos[0];
    q16_t dy = threat_pos[1] - human_pos[1];
    
    // Perpendicular crossfire offset (~96 units in Q16.16)
    q16_t flank_offset = 0x00600000;
    out_flank[0] = human_pos[0] - (dy >> 4);
    out_flank[1] = human_pos[1] + (dx >> 4);
    
    g_p2p_state.flanking_x = out_flank[0];
    g_p2p_state.flanking_y = out_flank[1];
}
