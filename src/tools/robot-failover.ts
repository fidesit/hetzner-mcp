/**
 * Hetzner Robot Failover IP tools — list, get, and route failover IPs.
 */

import { z } from 'zod';
import type { ToolRegistrar } from '../server.js';
import type { RobotClient } from '../clients/robot.js';
import type { RobotFailover } from '../types/robot.js';

export function registerRobotFailoverTools(register: ToolRegistrar, robot: RobotClient, readOnly: boolean): void {
  // ── Read-only tools ─────────────────────────────────────────────────────

  register(
    'list_robot_failover_ips',
    'List all failover IPs in the Hetzner Robot account.',
    {},
    async () => {
      const result = await robot.request<RobotFailover[]>('/failover');
      return JSON.stringify(result, null, 2);
    },
  );

  register(
    'get_robot_failover_ip',
    'Get details about a specific failover IP.',
    {
      ip: z.string().describe('Failover IP address'),
    },
    async (args) => {
      const result = await robot.request<RobotFailover>(`/failover/${args.ip}`);
      return JSON.stringify(result, null, 2);
    },
  );

  // ── Mutating tools ────────────────────────────────────────────────────

  if (!readOnly) {
    register(
      'route_robot_failover_ip',
      'Switch routing of a failover IP to a different server.',
      {
        ip: z.string().describe('Failover IP address to route'),
        active_server_ip: z.string().describe('Destination server IP to route the failover IP to'),
      },
      async (args) => {
        const result = await robot.request<RobotFailover>(`/failover/${args.ip}`, {
          method: 'POST',
          body: { active_server_ip: args.active_server_ip },
        });
        return JSON.stringify(result, null, 2);
      },
    );
  }
}
