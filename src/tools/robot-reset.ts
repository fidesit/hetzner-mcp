/**
 * Hetzner Robot Reset tools — list options and trigger resets.
 */

import { z } from 'zod';
import type { ToolRegistrar } from '../server.js';
import type { RobotClient } from '../clients/robot.js';
import type { RobotResetOption, RobotResetResponse } from '../types/robot.js';

export function registerRobotResetTools(register: ToolRegistrar, robot: RobotClient, readOnly: boolean): void {
  // ── Read-only tools ─────────────────────────────────────────────────────

  register(
    'list_robot_reset_options',
    'List available reset options for all dedicated servers.',
    {},
    async () => {
      const result = await robot.request<RobotResetOption[]>('/reset');
      return JSON.stringify(result, null, 2);
    },
  );

  register(
    'get_robot_reset_options',
    'Get available reset options for a specific server.',
    {
      server_number: z.number().describe('Unique server number'),
    },
    async (args) => {
      const result = await robot.request<RobotResetOption>(`/reset/${args.server_number}`);
      return JSON.stringify(result, null, 2);
    },
  );

  // ── Mutating tools ────────────────────────────────────────────────────

  if (!readOnly) {
    register(
      'reset_robot_server',
      'Trigger a reset (reboot) of a dedicated server. Types: sw (software), hw (hardware), man (manual).',
      {
        server_number: z.number().describe('Unique server number'),
        type: z.enum(['sw', 'hw', 'man']).describe('Reset type: sw (software), hw (hardware), man (manual/KVM)'),
      },
      async (args) => {
        const result = await robot.request<RobotResetResponse>(`/reset/${args.server_number}`, {
          method: 'POST',
          body: { type: args.type },
        });
        return JSON.stringify(result, null, 2);
      },
    );
  }
}
