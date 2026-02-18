/**
 * Hetzner DNS Record tools — CRUD + bulk operations.
 */

import { z } from 'zod';
import type { ToolRegistrar } from '../server.js';
import type { CloudClient } from '../clients/cloud.js';
import type { DnsRecordsResponse, DnsRecordResponse, DnsBulkCreateResponse } from '../types/dns.js';

export function registerDnsRecordTools(register: ToolRegistrar, cloud: CloudClient, readOnly: boolean): void {
  // ── Read-only tools ─────────────────────────────────────────────────────

  register(
    'list_dns_records',
    'List DNS records. Must specify a zone_id. Supports pagination.',
    {
      zone_id: z.string().describe('DNS zone ID to list records for'),
      page: z.number().optional().describe('Page number for pagination'),
      per_page: z.number().optional().describe('Number of results per page (max 100)'),
    },
    async (args) => {
      const params: Record<string, string | number | undefined> = {
        zone_id: args.zone_id as string,
        page: args.page as number | undefined,
        per_page: args.per_page as number | undefined,
      };
      const result = await cloud.request<DnsRecordsResponse>('/dns/records', { params });
      let output = JSON.stringify(result, null, 2);
      const warning = cloud.rateLimitWarning();
      if (warning) output += '\n' + warning;
      return output;
    },
  );

  register(
    'get_dns_record',
    'Get detailed information about a specific DNS record by ID.',
    {
      id: z.string().describe('DNS record ID'),
    },
    async (args) => {
      const result = await cloud.request<DnsRecordResponse>(`/dns/records/${args.id}`);
      let output = JSON.stringify(result.record, null, 2);
      const warning = cloud.rateLimitWarning();
      if (warning) output += '\n' + warning;
      return output;
    },
  );

  // ── Mutating tools ────────────────────────────────────────────────────

  if (!readOnly) {
    register(
      'create_dns_record',
      'Create a new DNS record in a zone.',
      {
        zone_id: z.string().describe('DNS zone ID to create the record in'),
        type: z.string().describe('Record type (A, AAAA, CNAME, MX, TXT, SRV, NS, CAA, TLSA, DS, etc.)'),
        name: z.string().describe('Record name (e.g. "@" for root, "www", "mail")'),
        value: z.string().describe('Record value (e.g. IP address, domain, text content)'),
        ttl: z.number().optional().describe('TTL in seconds (e.g. 300, 3600, 86400)'),
      },
      async (args) => {
        const body: Record<string, unknown> = {
          zone_id: args.zone_id,
          type: args.type,
          name: args.name,
          value: args.value,
        };
        if (args.ttl !== undefined) body.ttl = args.ttl;

        const result = await cloud.request<DnsRecordResponse>('/dns/records', {
          method: 'POST',
          body,
        });
        let output = JSON.stringify(result.record, null, 2);
        const warning = cloud.rateLimitWarning();
        if (warning) output += '\n' + warning;
        return output;
      },
    );

    register(
      'update_dns_record',
      'Update an existing DNS record.',
      {
        id: z.string().describe('DNS record ID to update'),
        zone_id: z.string().describe('DNS zone ID the record belongs to'),
        type: z.string().describe('Record type (A, AAAA, CNAME, MX, TXT, SRV, NS, CAA, etc.)'),
        name: z.string().describe('Record name (e.g. "@" for root, "www", "mail")'),
        value: z.string().describe('Record value (e.g. IP address, domain, text content)'),
        ttl: z.number().optional().describe('TTL in seconds (e.g. 300, 3600, 86400)'),
      },
      async (args) => {
        const body: Record<string, unknown> = {
          zone_id: args.zone_id,
          type: args.type,
          name: args.name,
          value: args.value,
        };
        if (args.ttl !== undefined) body.ttl = args.ttl;

        const result = await cloud.request<DnsRecordResponse>(`/dns/records/${args.id}`, {
          method: 'PUT',
          body,
        });
        let output = JSON.stringify(result.record, null, 2);
        const warning = cloud.rateLimitWarning();
        if (warning) output += '\n' + warning;
        return output;
      },
    );

    register(
      'delete_dns_record',
      'Delete a DNS record permanently. Requires confirm=true.',
      {
        id: z.string().describe('DNS record ID to delete'),
        confirm: z.boolean().default(false).describe('Must be true to confirm deletion'),
      },
      async (args) => {
        if (!args.confirm) {
          return 'Deletion not confirmed. Set confirm=true to proceed with deleting this DNS record.';
        }
        await cloud.request(`/dns/records/${args.id}`, { method: 'DELETE' });
        let output = JSON.stringify({ success: true, deleted: args.id }, null, 2);
        const warning = cloud.rateLimitWarning();
        if (warning) output += '\n' + warning;
        return output;
      },
    );

    register(
      'bulk_create_dns_records',
      'Create multiple DNS records at once. Accepts a JSON array of record objects.',
      {
        records: z.string().describe('JSON array of record objects, each with: zone_id (string), type (string), name (string), value (string), and optional ttl (number). Example: [{"zone_id":"abc","type":"A","name":"www","value":"1.2.3.4","ttl":300}]'),
      },
      async (args) => {
        const records = JSON.parse(args.records as string) as Array<{
          zone_id: string;
          type: string;
          name: string;
          value: string;
          ttl?: number;
        }>;
        const result = await cloud.request<DnsBulkCreateResponse>('/dns/records/bulk', {
          method: 'POST',
          body: { records },
        });
        let output = JSON.stringify(result, null, 2);
        const warning = cloud.rateLimitWarning();
        if (warning) output += '\n' + warning;
        return output;
      },
    );

    register(
      'bulk_update_dns_records',
      'Update multiple DNS records at once. Accepts a JSON array of record objects with IDs.',
      {
        records: z.string().describe('JSON array of record objects, each with: id (string), zone_id (string), type (string), name (string), value (string), and optional ttl (number). Example: [{"id":"rec1","zone_id":"abc","type":"A","name":"www","value":"1.2.3.4","ttl":300}]'),
      },
      async (args) => {
        const records = JSON.parse(args.records as string) as Array<{
          id: string;
          zone_id: string;
          type: string;
          name: string;
          value: string;
          ttl?: number;
        }>;
        const result = await cloud.request<{ records: unknown[] }>('/dns/records/bulk', {
          method: 'PUT',
          body: { records },
        });
        let output = JSON.stringify(result, null, 2);
        const warning = cloud.rateLimitWarning();
        if (warning) output += '\n' + warning;
        return output;
      },
    );
  }
}
