/**
 * Hetzner Cloud Action tools — read-only.
 */

import { z } from 'zod';
import type { ToolRegistrar } from '../server.js';
import type { CloudClient } from '../clients/cloud.js';
import type { HetznerAction } from '../clients/common.js';

export function registerActionTools(register: ToolRegistrar, cloud: CloudClient): void {
  register(
    'list_actions',
    'List all actions in the Hetzner Cloud project. Actions track async operations like server creation. Supports filtering by ID, status, and sorting.',
    {
      id: z.number().optional().describe('Filter by action ID'),
      status: z.string().optional().describe('Filter by status (running, success, error)'),
      sort: z.string().optional().describe('Sort by field (id, command, status, progress, started, finished — add :asc or :desc)'),
    },
    async (args) => {
      const params: Record<string, string | number | undefined> = {
        id: args.id as number | undefined,
        status: args.status as string | undefined,
        sort: args.sort as string | undefined,
      };
      const actions = await cloud.requestAll<HetznerAction>('/actions', 'actions', params);
      let output = JSON.stringify(actions, null, 2);
      const warning = cloud.rateLimitWarning();
      if (warning) output += '\n' + warning;
      return output;
    },
  );

  register(
    'get_action',
    'Get detailed information about a specific action by ID. Useful for checking the status of async operations.',
    {
      id: z.number().describe('Action ID'),
    },
    async (args) => {
      const result = await cloud.request<{ action: HetznerAction }>(`/actions/${args.id}`);
      let output = JSON.stringify(result.action, null, 2);
      const warning = cloud.rateLimitWarning();
      if (warning) output += '\n' + warning;
      return output;
    },
  );
}
