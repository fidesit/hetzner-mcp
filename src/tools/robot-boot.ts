/**
 * Hetzner Robot Boot Configuration tools — rescue, linux, VNC.
 */

import { z } from 'zod';
import type { ToolRegistrar } from '../server.js';
import type { RobotClient } from '../clients/robot.js';
import type { RobotBootConfig, RobotRescueConfig, RobotLinuxConfig, RobotVncConfig } from '../types/robot.js';

export function registerRobotBootTools(register: ToolRegistrar, robot: RobotClient, readOnly: boolean): void {
  // ── Read-only tools ─────────────────────────────────────────────────────

  register(
    'get_robot_boot_config',
    'Get all boot configuration options (rescue, linux, VNC) for a server.',
    {
      server_number: z.number().describe('Unique server number'),
    },
    async (args) => {
      const result = await robot.request<RobotBootConfig>(`/boot/${args.server_number}`);
      return JSON.stringify(result, null, 2);
    },
  );

  register(
    'get_robot_rescue',
    'Get rescue system boot configuration for a server.',
    {
      server_number: z.number().describe('Unique server number'),
    },
    async (args) => {
      const result = await robot.request<RobotRescueConfig>(`/boot/${args.server_number}/rescue`);
      return JSON.stringify(result, null, 2);
    },
  );

  register(
    'get_robot_linux',
    'Get Linux installation boot configuration for a server.',
    {
      server_number: z.number().describe('Unique server number'),
    },
    async (args) => {
      const result = await robot.request<RobotLinuxConfig>(`/boot/${args.server_number}/linux`);
      return JSON.stringify(result, null, 2);
    },
  );

  register(
    'get_robot_vnc',
    'Get VNC installation boot configuration for a server.',
    {
      server_number: z.number().describe('Unique server number'),
    },
    async (args) => {
      const result = await robot.request<RobotVncConfig>(`/boot/${args.server_number}/vnc`);
      return JSON.stringify(result, null, 2);
    },
  );

  // ── Mutating tools ────────────────────────────────────────────────────

  if (!readOnly) {
    register(
      'enable_robot_rescue',
      'Enable the rescue system for the next boot. Returns a temporary root password.',
      {
        server_number: z.number().describe('Unique server number'),
        os: z.string().describe('Rescue OS (e.g. linux, linuxold, freebsd, vkvm)'),
        arch: z.number().optional().describe('Architecture (e.g. 64 or 32)'),
        authorized_key: z.string().optional().describe('SSH key fingerprint to authorize'),
      },
      async (args) => {
        const body: Record<string, unknown> = { os: args.os };
        if (args.arch !== undefined) body.arch = args.arch;
        if (args.authorized_key) body.authorized_key = args.authorized_key;

        const result = await robot.request<RobotRescueConfig>(`/boot/${args.server_number}/rescue`, {
          method: 'POST',
          body,
        });
        return JSON.stringify(result, null, 2);
      },
    );

    register(
      'disable_robot_rescue',
      'Disable the rescue system for a server.',
      {
        server_number: z.number().describe('Unique server number'),
      },
      async (args) => {
        const result = await robot.request<Record<string, never>>(`/boot/${args.server_number}/rescue`, {
          method: 'DELETE',
        });
        return JSON.stringify(result, null, 2);
      },
    );

    register(
      'enable_robot_linux',
      'Enable automatic Linux installation for the next boot. Returns a temporary root password.',
      {
        server_number: z.number().describe('Unique server number'),
        dist: z.string().describe('Linux distribution (e.g. Rescue System, Ubuntu 22.04 LTS base)'),
        arch: z.number().optional().describe('Architecture (e.g. 64 or 32)'),
        lang: z.string().optional().describe('Language (e.g. en)'),
        authorized_key: z.string().optional().describe('SSH key fingerprint to authorize'),
      },
      async (args) => {
        const body: Record<string, unknown> = { dist: args.dist };
        if (args.arch !== undefined) body.arch = args.arch;
        if (args.lang) body.lang = args.lang;
        if (args.authorized_key) body.authorized_key = args.authorized_key;

        const result = await robot.request<RobotLinuxConfig>(`/boot/${args.server_number}/linux`, {
          method: 'POST',
          body,
        });
        return JSON.stringify(result, null, 2);
      },
    );

    register(
      'disable_robot_linux',
      'Disable automatic Linux installation for a server.',
      {
        server_number: z.number().describe('Unique server number'),
      },
      async (args) => {
        const result = await robot.request<Record<string, never>>(`/boot/${args.server_number}/linux`, {
          method: 'DELETE',
        });
        return JSON.stringify(result, null, 2);
      },
    );

    register(
      'enable_robot_vnc',
      'Enable VNC installation for the next boot. Returns a temporary password.',
      {
        server_number: z.number().describe('Unique server number'),
        dist: z.string().describe('Distribution to install via VNC'),
        arch: z.number().optional().describe('Architecture (e.g. 64 or 32)'),
        lang: z.string().optional().describe('Language (e.g. en)'),
      },
      async (args) => {
        const body: Record<string, unknown> = { dist: args.dist };
        if (args.arch !== undefined) body.arch = args.arch;
        if (args.lang) body.lang = args.lang;

        const result = await robot.request<RobotVncConfig>(`/boot/${args.server_number}/vnc`, {
          method: 'POST',
          body,
        });
        return JSON.stringify(result, null, 2);
      },
    );

    register(
      'disable_robot_vnc',
      'Disable VNC installation for a server.',
      {
        server_number: z.number().describe('Unique server number'),
      },
      async (args) => {
        const result = await robot.request<Record<string, never>>(`/boot/${args.server_number}/vnc`, {
          method: 'DELETE',
        });
        return JSON.stringify(result, null, 2);
      },
    );
  }
}
