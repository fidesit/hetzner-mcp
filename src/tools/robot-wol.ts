/**
 * Hetzner Robot Wake-on-LAN tools — check availability and send WoL.
 */

import { z } from 'zod';
import type { ToolRegistrar } from '../server.js';
import type { RobotClient } from '../clients/robot.js';
import type { RobotWolResponse } from '../types/robot.js';

export function registerRobotWolTools(register: ToolRegistrar, robot: RobotClient, readOnly: boolean): void {
  // ── Read-only tools ─────────────────────────────────────────────────────

  register(
    'get_robot_wol',
    'Check if Wake-on-LAN is available for a specific server.',
    {
      server_number: z.number().describe('Unique server number'),
    },
    async (args) => {
      const result = await robot.request<RobotWolResponse>(`/wol/${args.server_number}`);
      return JSON.stringify(result, null, 2);
    },
  );

  // ── Mutating tools ────────────────────────────────────────────────────

  if (!readOnly) {
    register(
      'send_robot_wol',
      'Send a Wake-on-LAN packet to a dedicated server to power it on.',
      {
        server_number: z.number().describe('Unique server number'),
      },
      async (args) => {
        const result = await robot.request<RobotWolResponse>(`/wol/${args.server_number}`, {
          method: 'POST',
        });
        return JSON.stringify(result, null, 2);
      },
    );
  }
}
