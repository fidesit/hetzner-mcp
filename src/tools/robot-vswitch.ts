/**
 * Hetzner Robot vSwitch tools — list, create, update, delete, and server management.
 */

import { z } from 'zod';
import type { ToolRegistrar } from '../server.js';
import type { RobotClient } from '../clients/robot.js';
import type { RobotVSwitch } from '../types/robot.js';

export function registerRobotVswitchTools(register: ToolRegistrar, robot: RobotClient, readOnly: boolean): void {
  // ── Read-only tools ─────────────────────────────────────────────────────

  register(
    'list_robot_vswitches',
    'List all vSwitches in the Hetzner Robot account.',
    {},
    async () => {
      const result = await robot.request<RobotVSwitch[]>('/vswitch');
      return JSON.stringify(result, null, 2);
    },
  );

  register(
    'get_robot_vswitch',
    'Get details about a specific vSwitch.',
    {
      id: z.number().describe('vSwitch ID'),
    },
    async (args) => {
      const result = await robot.request<RobotVSwitch>(`/vswitch/${args.id}`);
      return JSON.stringify(result, null, 2);
    },
  );

  // ── Mutating tools ────────────────────────────────────────────────────

  if (!readOnly) {
    register(
      'create_robot_vswitch',
      'Create a new vSwitch.',
      {
        name: z.string().describe('Name for the vSwitch'),
        vlan: z.number().describe('VLAN ID (4000-4091)'),
      },
      async (args) => {
        const result = await robot.request<RobotVSwitch>('/vswitch', {
          method: 'POST',
          body: { name: args.name, vlan: args.vlan },
        });
        return JSON.stringify(result, null, 2);
      },
    );

    register(
      'update_robot_vswitch',
      'Update a vSwitch name or VLAN ID.',
      {
        id: z.number().describe('vSwitch ID'),
        name: z.string().optional().describe('New name for the vSwitch'),
        vlan: z.number().optional().describe('New VLAN ID (4000-4091)'),
      },
      async (args) => {
        const body: Record<string, unknown> = {};
        if (args.name !== undefined) body.name = args.name;
        if (args.vlan !== undefined) body.vlan = args.vlan;

        const result = await robot.request<RobotVSwitch>(`/vswitch/${args.id}`, {
          method: 'POST',
          body,
        });
        return JSON.stringify(result, null, 2);
      },
    );

    register(
      'delete_robot_vswitch',
      'Cancel (delete) a vSwitch. Requires confirm=true.',
      {
        id: z.number().describe('vSwitch ID'),
        confirm: z.boolean().default(false).describe('Must be true to confirm deletion'),
      },
      async (args) => {
        if (!args.confirm) {
          return 'Deletion not confirmed. Set confirm=true to proceed with deleting the vSwitch.';
        }
        const result = await robot.request<Record<string, never>>(`/vswitch/${args.id}`, {
          method: 'DELETE',
        });
        return JSON.stringify(result, null, 2);
      },
    );

    register(
      'add_robot_vswitch_server',
      'Add a server to a vSwitch.',
      {
        id: z.number().describe('vSwitch ID'),
        server: z.number().describe('Server number to add to the vSwitch'),
      },
      async (args) => {
        const result = await robot.request<Record<string, never>>(`/vswitch/${args.id}/server`, {
          method: 'POST',
          body: { server: args.server },
        });
        return JSON.stringify(result, null, 2);
      },
    );

    register(
      'remove_robot_vswitch_server',
      'Remove a server from a vSwitch. Requires confirm=true.',
      {
        id: z.number().describe('vSwitch ID'),
        server: z.number().describe('Server number to remove from the vSwitch'),
        confirm: z.boolean().default(false).describe('Must be true to confirm removal'),
      },
      async (args) => {
        if (!args.confirm) {
          return 'Removal not confirmed. Set confirm=true to proceed with removing the server from the vSwitch.';
        }
        const result = await robot.request<Record<string, never>>(`/vswitch/${args.id}/server`, {
          method: 'DELETE',
          body: { server: args.server },
        });
        return JSON.stringify(result, null, 2);
      },
    );
  }
}
