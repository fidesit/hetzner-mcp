/**
 * Hetzner Cloud API response types.
 * These are used for type safety in tool handlers.
 * The Cloud API returns JSON; we type the most commonly-used response shapes.
 */

import type { HetznerAction, PaginationMeta } from '../clients/common.js';

// ── Generic Response Wrappers ───────────────────────────────────────────────

export interface PaginatedResponse<T> {
  [key: string]: T[] | { pagination: PaginationMeta } | unknown;
  meta?: { pagination: PaginationMeta };
}

export interface ActionResponse {
  action: HetznerAction;
}

export interface ActionsResponse {
  actions: HetznerAction[];
}

// ── Servers ─────────────────────────────────────────────────────────────────

export interface CloudServer {
  id: number;
  name: string;
  status: string;
  public_net: {
    ipv4?: { ip: string; blocked: boolean; dns_ptr: string };
    ipv6?: { ip: string; blocked: boolean };
    floating_ips: number[];
    firewalls: Array<{ id: number; status: string }>;
  };
  private_net: Array<{ network: number; ip: string; alias_ips: string[] }>;
  server_type: { id: number; name: string; description: string; cores: number; memory: number; disk: number };
  datacenter: { id: number; name: string; description: string; location: CloudLocation };
  image: { id: number; name: string; os_flavor: string; os_version: string } | null;
  iso: { id: number; name: string } | null;
  rescue_enabled: boolean;
  locked: boolean;
  protection: { delete: boolean; rebuild: boolean };
  labels: Record<string, string>;
  volumes: number[];
  load_balancers: number[];
  created: string;
}

// ── Locations & Datacenters ─────────────────────────────────────────────────

export interface CloudLocation {
  id: number;
  name: string;
  description: string;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  network_zone: string;
}

export interface CloudDatacenter {
  id: number;
  name: string;
  description: string;
  location: CloudLocation;
}

// ── Volumes ─────────────────────────────────────────────────────────────────

export interface CloudVolume {
  id: number;
  name: string;
  size: number;
  server: number | null;
  location: CloudLocation;
  status: string;
  protection: { delete: boolean };
  labels: Record<string, string>;
  linux_device: string;
  created: string;
  format: string | null;
}

// ── Networks ────────────────────────────────────────────────────────────────

export interface CloudNetwork {
  id: number;
  name: string;
  ip_range: string;
  subnets: Array<{ type: string; ip_range: string; network_zone: string; gateway: string }>;
  routes: Array<{ destination: string; gateway: string }>;
  servers: number[];
  protection: { delete: boolean };
  labels: Record<string, string>;
  created: string;
}

// ── Firewalls ───────────────────────────────────────────────────────────────

export interface CloudFirewall {
  id: number;
  name: string;
  rules: Array<{
    direction: 'in' | 'out';
    protocol: string;
    port: string | null;
    source_ips: string[];
    destination_ips: string[];
    description: string | null;
  }>;
  applied_to: Array<{ type: string; server?: { id: number } }>;
  labels: Record<string, string>;
  created: string;
}

// ── Floating IPs ────────────────────────────────────────────────────────────

export interface CloudFloatingIP {
  id: number;
  name: string;
  ip: string;
  type: 'ipv4' | 'ipv6';
  server: number | null;
  dns_ptr: Array<{ ip: string; dns_ptr: string }>;
  home_location: CloudLocation;
  blocked: boolean;
  protection: { delete: boolean };
  labels: Record<string, string>;
  created: string;
}

// ── Primary IPs ─────────────────────────────────────────────────────────────

export interface CloudPrimaryIP {
  id: number;
  name: string;
  ip: string;
  type: 'ipv4' | 'ipv6';
  assignee_id: number | null;
  assignee_type: string;
  auto_delete: boolean;
  blocked: boolean;
  datacenter: CloudDatacenter;
  dns_ptr: Array<{ ip: string; dns_ptr: string }>;
  protection: { delete: boolean };
  labels: Record<string, string>;
  created: string;
}

// ── Load Balancers ──────────────────────────────────────────────────────────

export interface CloudLoadBalancer {
  id: number;
  name: string;
  public_net: { enabled: boolean; ipv4: { ip: string }; ipv6: { ip: string } };
  private_net: Array<{ network: number; ip: string }>;
  location: CloudLocation;
  load_balancer_type: { id: number; name: string; description: string };
  protection: { delete: boolean };
  labels: Record<string, string>;
  targets: unknown[];
  services: unknown[];
  algorithm: { type: string };
  created: string;
}

// ── Certificates ────────────────────────────────────────────────────────────

export interface CloudCertificate {
  id: number;
  name: string;
  type: 'uploaded' | 'managed';
  certificate: string | null;
  domain_names: string[];
  not_valid_before: string;
  not_valid_after: string;
  status: { issuance: string; renewal: string; error?: { code: string; message: string } } | null;
  labels: Record<string, string>;
  created: string;
}

// ── SSH Keys ────────────────────────────────────────────────────────────────

export interface CloudSSHKey {
  id: number;
  name: string;
  fingerprint: string;
  public_key: string;
  labels: Record<string, string>;
  created: string;
}

// ── Placement Groups ────────────────────────────────────────────────────────

export interface CloudPlacementGroup {
  id: number;
  name: string;
  type: string;
  servers: number[];
  labels: Record<string, string>;
  created: string;
}

// ── Images ──────────────────────────────────────────────────────────────────

export interface CloudImage {
  id: number;
  name: string | null;
  description: string;
  type: 'system' | 'snapshot' | 'backup' | 'app';
  status: string;
  os_flavor: string;
  os_version: string | null;
  disk_size: number;
  protection: { delete: boolean };
  labels: Record<string, string>;
  created: string;
  image_size: number | null;
  created_from?: { id: number; name: string };
  rapid_deploy: boolean;
  architecture: string;
}

// ── ISOs ────────────────────────────────────────────────────────────────────

export interface CloudISO {
  id: number;
  name: string;
  description: string;
  type: 'public' | 'private';
  architecture: string | null;
}

// ── Server Types ────────────────────────────────────────────────────────────

export interface CloudServerType {
  id: number;
  name: string;
  description: string;
  cores: number;
  memory: number;
  disk: number;
  storage_type: string;
  cpu_type: string;
  architecture: string;
  prices: Array<{
    location: string;
    price_hourly: { net: string; gross: string };
    price_monthly: { net: string; gross: string };
  }>;
}

// ── Storage Boxes ───────────────────────────────────────────────────────────

export interface CloudStorageBox {
  id: number;
  name: string;
  disk_size: number;
  labels: Record<string, string>;
  location: CloudLocation;
  status: string;
}
