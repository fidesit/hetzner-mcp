/**
 * Hetzner Robot Firewall tools — server firewalls and firewall templates.
 */

import { z } from 'zod';
import type { ToolRegistrar } from '../server.js';
import type { RobotClient } from '../clients/robot.js';
import type { RobotFirewall, RobotFirewallTemplate } from '../types/robot.js';

export function registerRobotFirewallTools(register: ToolRegistrar, robot: RobotClient, readOnly: boolean): void {
  // ── Read-only tools ─────────────────────────────────────────────────────

  register(
    'get_robot_firewall',
    'Get the firewall configuration for a dedicated server.',
    {
      server_number: z.number().describe('Unique server number'),
    },
    async (args) => {
      const result = await robot.request<RobotFirewall>(`/firewall/${args.server_number}`);
      return JSON.stringify(result, null, 2);
    },
  );

  register(
    'list_robot_firewall_templates',
    'List all firewall templates.',
    {},
    async () => {
      const result = await robot.request<RobotFirewallTemplate[]>('/firewall/template');
      return JSON.stringify(result, null, 2);
    },
  );

  register(
    'get_robot_firewall_template',
    'Get a specific firewall template by ID.',
    {
      id: z.number().describe('Firewall template ID'),
    },
    async (args) => {
      const result = await robot.request<RobotFirewallTemplate>(`/firewall/template/${args.id}`);
      return JSON.stringify(result, null, 2);
    },
  );

  // ── Mutating tools ────────────────────────────────────────────────────

  if (!readOnly) {
    register(
      'set_robot_firewall',
      'Set (replace) the firewall configuration for a dedicated server.',
      {
        server_number: z.number().describe('Unique server number'),
        status: z.enum(['active', 'disabled']).describe('Firewall status: active or disabled'),
        filter_ipv6: z.boolean().optional().describe('Whether to filter IPv6 traffic'),
        whitelist_hos: z.boolean().optional().describe('Whether to whitelist Hetzner services'),
        rules: z.string().describe('JSON object with "input" and/or "output" arrays of firewall rules. Each rule has: ip_version, name, dst_ip, dst_port, src_ip, src_port, protocol, tcp_flags, action (accept/discard)'),
      },
      async (args) => {
        const parsedRules = JSON.parse(args.rules as string) as Record<string, unknown>;
        const body: Record<string, unknown> = {
          status: args.status,
          rules: parsedRules,
        };
        if (args.filter_ipv6 !== undefined) body.filter_ipv6 = args.filter_ipv6;
        if (args.whitelist_hos !== undefined) body.whitelist_hos = args.whitelist_hos;

        const result = await robot.request<RobotFirewall>(`/firewall/${args.server_number}`, {
          method: 'POST',
          body,
        });
        return JSON.stringify(result, null, 2);
      },
    );

    register(
      'delete_robot_firewall',
      'Disable and remove the firewall configuration for a server. Requires confirm=true.',
      {
        server_number: z.number().describe('Unique server number'),
        confirm: z.boolean().default(false).describe('Must be true to confirm deletion'),
      },
      async (args) => {
        if (!args.confirm) {
          return 'Deletion not confirmed. Set confirm=true to proceed with disabling the firewall.';
        }
        const result = await robot.request<Record<string, never>>(`/firewall/${args.server_number}`, {
          method: 'DELETE',
        });
        return JSON.stringify(result, null, 2);
      },
    );

    register(
      'create_robot_firewall_template',
      'Create a new firewall template.',
      {
        name: z.string().describe('Template name'),
        filter_ipv6: z.boolean().optional().describe('Whether to filter IPv6 traffic'),
        whitelist_hos: z.boolean().optional().describe('Whether to whitelist Hetzner services'),
        is_default: z.boolean().optional().describe('Whether this is the default template'),
        rules: z.string().describe('JSON object with "input" and/or "output" arrays of firewall rules. Each rule has: ip_version, name, dst_ip, dst_port, src_ip, src_port, protocol, tcp_flags, action (accept/discard)'),
      },
      async (args) => {
        const parsedRules = JSON.parse(args.rules as string) as Record<string, unknown>;
        const body: Record<string, unknown> = {
          name: args.name,
          rules: parsedRules,
        };
        if (args.filter_ipv6 !== undefined) body.filter_ipv6 = args.filter_ipv6;
        if (args.whitelist_hos !== undefined) body.whitelist_hos = args.whitelist_hos;
        if (args.is_default !== undefined) body.is_default = args.is_default;

        const result = await robot.request<RobotFirewallTemplate>('/firewall/template', {
          method: 'POST',
          body,
        });
        return JSON.stringify(result, null, 2);
      },
    );

    register(
      'update_robot_firewall_template',
      'Update an existing firewall template.',
      {
        id: z.number().describe('Firewall template ID'),
        name: z.string().optional().describe('Template name'),
        filter_ipv6: z.boolean().optional().describe('Whether to filter IPv6 traffic'),
        whitelist_hos: z.boolean().optional().describe('Whether to whitelist Hetzner services'),
        is_default: z.boolean().optional().describe('Whether this is the default template'),
        rules: z.string().optional().describe('JSON object with "input" and/or "output" arrays of firewall rules. Each rule has: ip_version, name, dst_ip, dst_port, src_ip, src_port, protocol, tcp_flags, action (accept/discard)'),
      },
      async (args) => {
        const body: Record<string, unknown> = {};
        if (args.name !== undefined) body.name = args.name;
        if (args.filter_ipv6 !== undefined) body.filter_ipv6 = args.filter_ipv6;
        if (args.whitelist_hos !== undefined) body.whitelist_hos = args.whitelist_hos;
        if (args.is_default !== undefined) body.is_default = args.is_default;
        if (args.rules !== undefined) {
          body.rules = JSON.parse(args.rules as string) as Record<string, unknown>;
        }

        const result = await robot.request<RobotFirewallTemplate>(`/firewall/template/${args.id}`, {
          method: 'POST',
          body,
        });
        return JSON.stringify(result, null, 2);
      },
    );

    register(
      'delete_robot_firewall_template',
      'Delete a firewall template. Requires confirm=true.',
      {
        id: z.number().describe('Firewall template ID'),
        confirm: z.boolean().default(false).describe('Must be true to confirm deletion'),
      },
      async (args) => {
        if (!args.confirm) {
          return 'Deletion not confirmed. Set confirm=true to proceed with deleting the template.';
        }
        const result = await robot.request<Record<string, never>>(`/firewall/template/${args.id}`, {
          method: 'DELETE',
        });
        return JSON.stringify(result, null, 2);
      },
    );
  }
}
