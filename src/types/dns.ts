/**
 * Hetzner DNS API response types.
 * DNS is integrated into the Cloud API under /dns/zones and /dns/records.
 */

// ── Zones ───────────────────────────────────────────────────────────────────

export interface DnsZone {
  id: string;
  name: string;
  ttl: number;
  registrar: string;
  legacy_dns_host: string;
  legacy_ns: string[];
  ns: string[];
  created: string;
  verified: string;
  modified: string;
  project: string;
  owner: string;
  permission: string;
  zone_type: {
    id: string;
    name: string;
    description: string;
    prices: unknown;
  };
  status: 'verified' | 'failed' | 'pending';
  paused: boolean;
  is_secondary_dns: boolean;
  txt_verification: {
    name: string;
    token: string;
  };
  records_count: number;
}

// ── Records ─────────────────────────────────────────────────────────────────

export type DnsRecordType =
  | 'A'
  | 'AAAA'
  | 'NS'
  | 'MX'
  | 'CNAME'
  | 'RP'
  | 'TXT'
  | 'SOA'
  | 'HINFO'
  | 'SRV'
  | 'DANE'
  | 'TLSA'
  | 'DS'
  | 'CAA';

export interface DnsRecord {
  id: string;
  type: DnsRecordType;
  name: string;
  value: string;
  zone_id: string;
  created: string;
  modified: string;
  ttl?: number;
}

// ── Response Wrappers ───────────────────────────────────────────────────────

export interface DnsZonesResponse {
  zones: DnsZone[];
  meta: {
    pagination: {
      page: number;
      per_page: number;
      last_page: number;
      total_entries: number;
    };
  };
}

export interface DnsZoneResponse {
  zone: DnsZone;
}

export interface DnsRecordsResponse {
  records: DnsRecord[];
  meta?: {
    pagination: {
      page: number;
      per_page: number;
      last_page: number;
      total_entries: number;
    };
  };
}

export interface DnsRecordResponse {
  record: DnsRecord;
}

export interface DnsBulkCreateResponse {
  records: DnsRecord[];
  valid_records: DnsRecord[];
  invalid_records: Array<{
    record: Partial<DnsRecord>;
    message: string;
  }>;
}

export interface DnsValidationResponse {
  parsed_records: number;
  valid_records: Array<{
    name: string;
    type: string;
    value: string;
    ttl: number;
  }>;
}

export interface DnsError {
  error: {
    message: string;
    code: number;
  };
}
