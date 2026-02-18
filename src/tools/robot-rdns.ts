/**
 * Hetzner Robot Reverse DNS tools — list, get, create, update, delete.
 */

import { z } from 'zod';
import type { ToolRegistrar } from '../server.js';
import type { RobotClient } from '../clients/robot.js';
import type { RobotRdns } from '../types/robot.js';

export function registerRobotRdnsTools(register: ToolRegistrar, robot: RobotClient, readOnly: boolean): void {
  // ── Read-only tools ─────────────────────────────────────────────────────

  register(
    'list_robot_rdns',
    'List all reverse DNS entries, optionally filtered by server number.',
    {
      server_number: z.number().optional().describe('Filter by server number'),
    },
    async (args) => {
      let path = '/rdns';
      if (args.server_number !== undefined) {
        path += `?server_number=${args.server_number}`;
      }
      const result = await robot.request<RobotRdns[]>(path);
      return JSON.stringify(result, null, 2);
    },
  );

  register(
    'get_robot_rdns',
    'Get the reverse DNS entry for a specific IP address.',
    {
      ip: z.string().describe('IP address to look up reverse DNS for'),
    },
    async (args) => {
      const result = await robot.request<RobotRdns>(`/rdns/${args.ip}`);
      return JSON.stringify(result, null, 2);
    },
  );

  // ── Mutating tools ────────────────────────────────────────────────────

  if (!readOnly) {
    register(
      'create_robot_rdns',
      'Create a new reverse DNS entry for an IP address.',
      {
        ip: z.string().describe('IP address to set reverse DNS for'),
        ptr: z.string().describe('PTR record (hostname) for the IP address'),
      },
      async (args) => {
        const result = await robot.request<RobotRdns>(`/rdns/${args.ip}`, {
          method: 'PUT',
          body: { ptr: args.ptr },
        });
        return JSON.stringify(result, null, 2);
      },
    );

    register(
      'update_robot_rdns',
      'Update an existing reverse DNS entry for an IP address.',
      {
        ip: z.string().describe('IP address to update reverse DNS for'),
        ptr: z.string().describe('New PTR record (hostname) for the IP address'),
      },
      async (args) => {
        const result = await robot.request<RobotRdns>(`/rdns/${args.ip}`, {
          method: 'POST',
          body: { ptr: args.ptr },
        });
        return JSON.stringify(result, null, 2);
      },
    );

    register(
      'delete_robot_rdns',
      'Delete a reverse DNS entry. Requires confirm=true.',
      {
        ip: z.string().describe('IP address to remove reverse DNS for'),
        confirm: z.boolean().default(false).describe('Must be true to confirm deletion'),
      },
      async (args) => {
        if (!args.confirm) {
          return 'Deletion not confirmed. Set confirm=true to proceed with removing the reverse DNS entry.';
        }
        const result = await robot.request<Record<string, never>>(`/rdns/${args.ip}`, {
          method: 'DELETE',
        });
        return JSON.stringify(result, null, 2);
      },
    );
  }
}
