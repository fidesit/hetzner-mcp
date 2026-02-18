/**
 * Hetzner DNS Zone tools — CRUD, validate, import/export.
 */

import { z } from 'zod';
import type { ToolRegistrar } from '../server.js';
import type { CloudClient } from '../clients/cloud.js';
import type { DnsZone, DnsZonesResponse, DnsZoneResponse, DnsValidationResponse } from '../types/dns.js';

export function registerDnsZoneTools(register: ToolRegistrar, cloud: CloudClient, readOnly: boolean): void {
  // ── Read-only tools ─────────────────────────────────────────────────────

  register(
    'list_dns_zones',
    'List all DNS zones. Supports filtering by name and pagination.',
    {
      name: z.string().optional().describe('Filter by exact zone name (domain)'),
      search_name: z.string().optional().describe('Search zones by partial name'),
      page: z.number().optional().describe('Page number for pagination'),
      per_page: z.number().optional().describe('Number of results per page (max 100)'),
    },
    async (args) => {
      const params: Record<string, string | number | undefined> = {
        name: args.name as string | undefined,
        search_name: args.search_name as string | undefined,
        page: args.page as number | undefined,
        per_page: args.per_page as number | undefined,
      };
      const result = await cloud.request<DnsZonesResponse>('/dns/zones', { params });
      let output = JSON.stringify(result, null, 2);
      const warning = cloud.rateLimitWarning();
      if (warning) output += '\n' + warning;
      return output;
    },
  );

  register(
    'get_dns_zone',
    'Get detailed information about a specific DNS zone by ID.',
    {
      id: z.string().describe('DNS zone ID'),
    },
    async (args) => {
      const result = await cloud.request<DnsZoneResponse>(`/dns/zones/${args.id}`);
      let output = JSON.stringify(result.zone, null, 2);
      const warning = cloud.rateLimitWarning();
      if (warning) output += '\n' + warning;
      return output;
    },
  );

  register(
    'export_dns_zone',
    'Export a DNS zone as a plain text zone file.',
    {
      id: z.string().describe('DNS zone ID to export'),
    },
    async (args) => {
      const result = await cloud.request<{ zone_file: string }>(`/dns/zones/${args.id}/export`);
      let output = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
      const warning = cloud.rateLimitWarning();
      if (warning) output += '\n' + warning;
      return output;
    },
  );

  // ── Mutating tools ────────────────────────────────────────────────────

  if (!readOnly) {
    register(
      'create_dns_zone',
      'Create a new DNS zone for a domain.',
      {
        name: z.string().describe('Domain name for the zone (e.g. example.com)'),
        ttl: z.number().optional().describe('Default TTL for the zone in seconds (e.g. 86400)'),
      },
      async (args) => {
        const body: Record<string, unknown> = {
          name: args.name,
        };
        if (args.ttl !== undefined) body.ttl = args.ttl;

        const result = await cloud.request<DnsZoneResponse>('/dns/zones', {
          method: 'POST',
          body,
        });
        let output = JSON.stringify(result.zone, null, 2);
        const warning = cloud.rateLimitWarning();
        if (warning) output += '\n' + warning;
        return output;
      },
    );

    register(
      'update_dns_zone',
      'Update a DNS zone\'s name or TTL.',
      {
        id: z.string().describe('DNS zone ID'),
        name: z.string().optional().describe('New domain name for the zone'),
        ttl: z.number().optional().describe('New default TTL for the zone in seconds'),
      },
      async (args) => {
        const body: Record<string, unknown> = {};
        if (args.name !== undefined) body.name = args.name;
        if (args.ttl !== undefined) body.ttl = args.ttl;

        const result = await cloud.request<DnsZoneResponse>(`/dns/zones/${args.id}`, {
          method: 'PUT',
          body,
        });
        let output = JSON.stringify(result.zone, null, 2);
        const warning = cloud.rateLimitWarning();
        if (warning) output += '\n' + warning;
        return output;
      },
    );

    register(
      'delete_dns_zone',
      'Delete a DNS zone permanently. Requires confirm=true. This will also delete all records in the zone.',
      {
        id: z.string().describe('DNS zone ID to delete'),
        confirm: z.boolean().default(false).describe('Must be true to confirm deletion'),
      },
      async (args) => {
        if (!args.confirm) {
          return 'Deletion not confirmed. Set confirm=true to proceed with deleting this DNS zone and all its records.';
        }
        await cloud.request(`/dns/zones/${args.id}`, { method: 'DELETE' });
        let output = JSON.stringify({ success: true, deleted: args.id }, null, 2);
        const warning = cloud.rateLimitWarning();
        if (warning) output += '\n' + warning;
        return output;
      },
    );

    register(
      'validate_dns_zone_file',
      'Validate a DNS zone file without importing it. Returns parsed and valid records.',
      {
        zone_file: z.string().describe('Zone file content as plain text to validate'),
      },
      async (args) => {
        const result = await cloud.request<DnsValidationResponse>('/dns/zones/file/validate', {
          method: 'POST',
          body: { zone_file: args.zone_file },
        });
        let output = JSON.stringify(result, null, 2);
        const warning = cloud.rateLimitWarning();
        if (warning) output += '\n' + warning;
        return output;
      },
    );

    register(
      'import_dns_zone',
      'Import DNS records into a zone from a zone file. Existing records may be overwritten.',
      {
        id: z.string().describe('DNS zone ID to import records into'),
        zone_file: z.string().describe('Zone file content as plain text to import'),
      },
      async (args) => {
        const result = await cloud.request<{ zone: DnsZone }>(`/dns/zones/${args.id}/import`, {
          method: 'POST',
          body: { zone_file: args.zone_file },
        });
        let output = JSON.stringify(result, null, 2);
        const warning = cloud.rateLimitWarning();
        if (warning) output += '\n' + warning;
        return output;
      },
    );
  }
}
