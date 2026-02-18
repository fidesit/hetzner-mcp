/**
 * Hetzner Robot SSH Key tools — list, get, create, update, delete.
 */

import { z } from 'zod';
import type { ToolRegistrar } from '../server.js';
import type { RobotClient } from '../clients/robot.js';
import type { RobotSSHKey } from '../types/robot.js';

export function registerRobotKeyTools(register: ToolRegistrar, robot: RobotClient, readOnly: boolean): void {
  // ── Read-only tools ─────────────────────────────────────────────────────

  register(
    'list_robot_ssh_keys',
    'List all SSH keys stored in the Hetzner Robot account.',
    {},
    async () => {
      const result = await robot.request<RobotSSHKey[]>('/key');
      return JSON.stringify(result, null, 2);
    },
  );

  register(
    'get_robot_ssh_key',
    'Get details of a specific SSH key by its fingerprint.',
    {
      fingerprint: z.string().describe('SSH key fingerprint (e.g. "xx:xx:xx:...")'),
    },
    async (args) => {
      const result = await robot.request<RobotSSHKey>(`/key/${args.fingerprint}`);
      return JSON.stringify(result, null, 2);
    },
  );

  // ── Mutating tools ────────────────────────────────────────────────────

  if (!readOnly) {
    register(
      'create_robot_ssh_key',
      'Upload a new SSH public key to the Hetzner Robot account.',
      {
        name: z.string().describe('Display name for the SSH key'),
        data: z.string().describe('SSH public key data (e.g. "ssh-rsa AAAA...")'),
      },
      async (args) => {
        const result = await robot.request<RobotSSHKey>('/key', {
          method: 'POST',
          body: { name: args.name, data: args.data },
        });
        return JSON.stringify(result, null, 2);
      },
    );

    register(
      'update_robot_ssh_key',
      'Update the name of an existing SSH key.',
      {
        fingerprint: z.string().describe('SSH key fingerprint (e.g. "xx:xx:xx:...")'),
        name: z.string().describe('New display name for the SSH key'),
      },
      async (args) => {
        const result = await robot.request<RobotSSHKey>(`/key/${args.fingerprint}`, {
          method: 'POST',
          body: { name: args.name },
        });
        return JSON.stringify(result, null, 2);
      },
    );

    register(
      'delete_robot_ssh_key',
      'Delete an SSH key from the Hetzner Robot account. Requires confirm=true.',
      {
        fingerprint: z.string().describe('SSH key fingerprint (e.g. "xx:xx:xx:...")'),
        confirm: z.boolean().default(false).describe('Must be true to confirm deletion'),
      },
      async (args) => {
        if (!args.confirm) {
          return 'Deletion not confirmed. Set confirm=true to proceed with deleting this SSH key.';
        }
        const result = await robot.request<Record<string, never>>(`/key/${args.fingerprint}`, {
          method: 'DELETE',
        });
        return JSON.stringify(result, null, 2);
      },
    );
  }
}
