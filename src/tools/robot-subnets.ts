/**
 * Hetzner Robot Subnet tools — list, get, update, and MAC address management.
 */

import { z } from 'zod';
import type { ToolRegistrar } from '../server.js';
import type { RobotClient } from '../clients/robot.js';
import type { RobotSubnet, RobotMAC } from '../types/robot.js';

export function registerRobotSubnetTools(register: ToolRegistrar, robot: RobotClient, readOnly: boolean): void {
  // ── Read-only tools ─────────────────────────────────────────────────────

  register(
    'list_robot_subnets',
    'List all subnets in the Hetzner Robot account.',
    {},
    async () => {
      const result = await robot.request<RobotSubnet[]>('/subnet');
      return JSON.stringify(result, null, 2);
    },
  );

  register(
    'get_robot_subnet',
    'Get details about a specific subnet.',
    {
      ip: z.string().describe('Subnet base IP address (e.g. "2a01:4f8:0:0::")'),
    },
    async (args) => {
      const result = await robot.request<RobotSubnet>(`/subnet/${args.ip}`);
      return JSON.stringify(result, null, 2);
    },
  );

  register(
    'get_robot_subnet_mac',
    'Get the separate MAC address for a subnet.',
    {
      ip: z.string().describe('Subnet base IP address'),
    },
    async (args) => {
      const result = await robot.request<RobotMAC>(`/subnet/${args.ip}/mac`);
      return JSON.stringify(result, null, 2);
    },
  );

  // ── Mutating tools ────────────────────────────────────────────────────

  if (!readOnly) {
    register(
      'update_robot_subnet',
      'Update traffic warning settings for a subnet.',
      {
        ip: z.string().describe('Subnet base IP address'),
        traffic_warnings: z.boolean().optional().describe('Enable or disable traffic warnings'),
        traffic_hourly: z.number().optional().describe('Hourly traffic limit in MB'),
        traffic_daily: z.number().optional().describe('Daily traffic limit in MB'),
        traffic_monthly: z.number().optional().describe('Monthly traffic limit in MB'),
      },
      async (args) => {
        const body: Record<string, unknown> = {};
        if (args.traffic_warnings !== undefined) body.traffic_warnings = args.traffic_warnings;
        if (args.traffic_hourly !== undefined) body.traffic_hourly = args.traffic_hourly;
        if (args.traffic_daily !== undefined) body.traffic_daily = args.traffic_daily;
        if (args.traffic_monthly !== undefined) body.traffic_monthly = args.traffic_monthly;

        const result = await robot.request<RobotSubnet>(`/subnet/${args.ip}`, {
          method: 'POST',
          body,
        });
        return JSON.stringify(result, null, 2);
      },
    );

    register(
      'create_robot_subnet_mac',
      'Generate a separate MAC address for a subnet.',
      {
        ip: z.string().describe('Subnet base IP address'),
      },
      async (args) => {
        const result = await robot.request<RobotMAC>(`/subnet/${args.ip}/mac`, {
          method: 'PUT',
        });
        return JSON.stringify(result, null, 2);
      },
    );

    register(
      'delete_robot_subnet_mac',
      'Remove the separate MAC address from a subnet. Requires confirm=true.',
      {
        ip: z.string().describe('Subnet base IP address'),
        confirm: z.boolean().default(false).describe('Must be true to confirm deletion'),
      },
      async (args) => {
        if (!args.confirm) {
          return 'Deletion not confirmed. Set confirm=true to proceed with removing the MAC address.';
        }
        const result = await robot.request<Record<string, never>>(`/subnet/${args.ip}/mac`, {
          method: 'DELETE',
        });
        return JSON.stringify(result, null, 2);
      },
    );
  }
}
