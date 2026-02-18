/**
 * Hetzner Robot Traffic tools — query traffic statistics (all read-only).
 */

import { z } from 'zod';
import type { ToolRegistrar } from '../server.js';
import type { RobotClient } from '../clients/robot.js';
import type { RobotTraffic } from '../types/robot.js';
import { cleanParams } from '../clients/common.js';

export function registerRobotTrafficTools(register: ToolRegistrar, robot: RobotClient): void {
  register(
    'get_robot_traffic',
    'Query traffic statistics for IPs and/or subnets over a date range.',
    {
      ip: z.string().optional().describe('Comma-separated list of IP addresses to query'),
      subnet: z.string().optional().describe('Comma-separated list of subnets to query'),
      from: z.string().describe('Start date in YYYY-MM-DD format'),
      to: z.string().describe('End date in YYYY-MM-DD format'),
      type: z.enum(['month', 'day', 'year']).describe('Aggregation type: month, day, or year'),
    },
    async (args) => {
      const params = cleanParams({
        ip: args.ip as string | undefined,
        subnet: args.subnet as string | undefined,
        from: args.from as string,
        to: args.to as string,
        type: args.type as string,
      });

      const result = await robot.request<RobotTraffic>('/traffic', { params });
      return JSON.stringify(result, null, 2);
    },
  );
}
