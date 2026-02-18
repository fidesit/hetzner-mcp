/**
 * Hetzner Robot IP tools — list, get, update IPs and manage MACs.
 */

import { z } from 'zod';
import type { ToolRegistrar } from '../server.js';
import type { RobotClient } from '../clients/robot.js';
import type { RobotIP, RobotMAC } from '../types/robot.js';

export function registerRobotIpTools(register: ToolRegistrar, robot: RobotClient, readOnly: boolean): void {
  // ── Read-only tools ─────────────────────────────────────────────────────

  register(
    'list_robot_ips',
    'List all single IP addresses in the Hetzner Robot account.',
    {},
    async () => {
      const result = await robot.request<RobotIP[]>('/ip');
      return JSON.stringify(result, null, 2);
    },
  );

  register(
    'get_robot_ip',
    'Get details of a specific IP address.',
    {
      ip: z.string().describe('IP address (e.g. "1.2.3.4")'),
    },
    async (args) => {
      const result = await robot.request<RobotIP>(`/ip/${args.ip}`);
      return JSON.stringify(result, null, 2);
    },
  );

  register(
    'get_robot_ip_mac',
    'Get the separate MAC address for a specific IP address.',
    {
      ip: z.string().describe('IP address (e.g. "1.2.3.4")'),
    },
    async (args) => {
      const result = await robot.request<RobotMAC>(`/ip/${args.ip}/mac`);
      return JSON.stringify(result, null, 2);
    },
  );

  // ── Mutating tools ────────────────────────────────────────────────────

  if (!readOnly) {
    register(
      'update_robot_ip',
      'Update traffic warning settings for an IP address.',
      {
        ip: z.string().describe('IP address (e.g. "1.2.3.4")'),
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

        const result = await robot.request<RobotIP>(`/ip/${args.ip}`, {
          method: 'POST',
          body,
        });
        return JSON.stringify(result, null, 2);
      },
    );

    register(
      'create_robot_ip_mac',
      'Request a separate MAC address for an IP address.',
      {
        ip: z.string().describe('IP address (e.g. "1.2.3.4")'),
      },
      async (args) => {
        const result = await robot.request<RobotMAC>(`/ip/${args.ip}/mac`, {
          method: 'PUT',
        });
        return JSON.stringify(result, null, 2);
      },
    );

    register(
      'delete_robot_ip_mac',
      'Delete the separate MAC address for an IP address. Requires confirm=true.',
      {
        ip: z.string().describe('IP address (e.g. "1.2.3.4")'),
        confirm: z.boolean().default(false).describe('Must be true to confirm deletion'),
      },
      async (args) => {
        if (!args.confirm) {
          return 'Deletion not confirmed. Set confirm=true to proceed with deleting this MAC address.';
        }
        const result = await robot.request<Record<string, never>>(`/ip/${args.ip}/mac`, {
          method: 'DELETE',
        });
        return JSON.stringify(result, null, 2);
      },
    );
  }
}
