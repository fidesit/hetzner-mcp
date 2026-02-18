/**
 * Hetzner Robot Server tools — list, get, rename, cancellation.
 */

import { z } from 'zod';
import type { ToolRegistrar } from '../server.js';
import type { RobotClient } from '../clients/robot.js';
import type { RobotServer, RobotServerDetail, RobotCancellation } from '../types/robot.js';

export function registerRobotServerTools(register: ToolRegistrar, robot: RobotClient, readOnly: boolean): void {
  // ── Read-only tools ─────────────────────────────────────────────────────

  register(
    'list_robot_servers',
    'List all dedicated servers in the Hetzner Robot account.',
    {},
    async () => {
      const result = await robot.request<RobotServer[]>('/server');
      return JSON.stringify(result, null, 2);
    },
  );

  register(
    'get_robot_server',
    'Get detailed information about a specific dedicated server.',
    {
      server_number: z.number().describe('Unique server number'),
    },
    async (args) => {
      const result = await robot.request<RobotServerDetail>(`/server/${args.server_number}`);
      return JSON.stringify(result, null, 2);
    },
  );

  register(
    'get_robot_server_cancellation',
    'Get cancellation status and earliest cancellation date for a server.',
    {
      server_number: z.number().describe('Unique server number'),
    },
    async (args) => {
      const result = await robot.request<RobotCancellation>(`/server/${args.server_number}/cancellation`);
      return JSON.stringify(result, null, 2);
    },
  );

  // ── Mutating tools ────────────────────────────────────────────────────

  if (!readOnly) {
    register(
      'rename_robot_server',
      'Rename a dedicated server.',
      {
        server_number: z.number().describe('Unique server number'),
        server_name: z.string().describe('New server name'),
      },
      async (args) => {
        const result = await robot.request<RobotServerDetail>(`/server/${args.server_number}`, {
          method: 'POST',
          body: { server_name: args.server_name },
        });
        return JSON.stringify(result, null, 2);
      },
    );

    register(
      'cancel_robot_server',
      'Request cancellation of a dedicated server. Requires confirm=true. This is a destructive action.',
      {
        server_number: z.number().describe('Unique server number'),
        cancellation_date: z.string().describe('Desired cancellation date (YYYY-MM-DD). Must be >= earliest_cancellation_date'),
        cancellation_reason: z.string().optional().describe('Optional reason for cancellation'),
        confirm: z.boolean().default(false).describe('Must be true to confirm cancellation'),
      },
      async (args) => {
        if (!args.confirm) {
          return 'Cancellation not confirmed. Set confirm=true to proceed with cancelling this server.';
        }
        const body: Record<string, unknown> = {
          cancellation_date: args.cancellation_date,
        };
        if (args.cancellation_reason) body.cancellation_reason = args.cancellation_reason;

        const result = await robot.request<RobotCancellation>(`/server/${args.server_number}/cancellation`, {
          method: 'POST',
          body,
        });
        return JSON.stringify(result, null, 2);
      },
    );

    register(
      'withdraw_robot_server_cancellation',
      'Withdraw a pending server cancellation. Requires confirm=true.',
      {
        server_number: z.number().describe('Unique server number'),
        confirm: z.boolean().default(false).describe('Must be true to confirm withdrawal'),
      },
      async (args) => {
        if (!args.confirm) {
          return 'Withdrawal not confirmed. Set confirm=true to proceed with withdrawing the cancellation.';
        }
        const result = await robot.request<Record<string, never>>(`/server/${args.server_number}/cancellation`, {
          method: 'DELETE',
        });
        return JSON.stringify(result, null, 2);
      },
    );
  }
}
