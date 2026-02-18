/**
 * Hetzner Robot API response types.
 */

// ── Servers ─────────────────────────────────────────────────────────────────

export interface RobotServer {
  server: {
    server_ip: string;
    server_ipv6_net: string;
    server_number: number;
    server_name: string;
    product: string;
    dc: string;
    traffic: string;
    status: 'ready' | 'in process';
    cancelled: boolean;
    paid_until: string;
    ip: string[];
    subnet: Array<{ ip: string; mask: string }> | null;
  };
}

export interface RobotServerDetail {
  server: RobotServer['server'] & {
    reset: boolean;
    rescue: boolean;
    vnc: boolean;
    windows: boolean;
    plesk: boolean;
    cpanel: boolean;
    wol: boolean;
    hot_swap: boolean;
    linked_storagebox: number | null;
  };
}

// ── Cancellation ────────────────────────────────────────────────────────────

export interface RobotCancellation {
  cancellation: {
    server_ip: string;
    server_ipv6_net: string;
    server_number: number;
    server_name: string;
    earliest_cancellation_date: string;
    cancelled: boolean;
    reservation_possible: boolean;
    reserved: boolean;
    cancellation_date: string | null;
    cancellation_reason: string[] | string | null;
  };
}

// ── Reset ───────────────────────────────────────────────────────────────────

export interface RobotResetOption {
  reset: {
    server_ip: string;
    server_number: number;
    type: string[];
  };
}

export interface RobotResetResponse {
  reset: {
    server_ip: string;
    server_number: number;
    type: string;
  };
}

// ── Wake on LAN ─────────────────────────────────────────────────────────────

export interface RobotWolResponse {
  wol: {
    server_ip: string;
    server_number: number;
  };
}

// ── Boot Configuration ──────────────────────────────────────────────────────

export interface RobotBootConfig {
  rescue?: RobotRescueConfig;
  linux?: RobotLinuxConfig;
  vnc?: RobotVncConfig;
}

export interface RobotRescueConfig {
  rescue: {
    server_ip: string;
    server_number: number;
    os: string | string[];
    arch: number | number[];
    active: boolean;
    password: string | null;
    authorized_key: string[];
    host_key: string[];
  };
}

export interface RobotLinuxConfig {
  linux: {
    server_ip: string;
    server_number: number;
    dist: string | string[];
    arch: number | number[];
    lang: string | string[];
    active: boolean;
    password: string | null;
    authorized_key: string[];
    host_key: string[];
  };
}

export interface RobotVncConfig {
  vnc: {
    server_ip: string;
    server_number: number;
    dist: string | string[];
    arch: number | number[];
    lang: string | string[];
    active: boolean;
    password: string | null;
  };
}

// ── SSH Keys ────────────────────────────────────────────────────────────────

export interface RobotSSHKey {
  key: {
    name: string;
    fingerprint: string;
    type: string;
    size: number;
    data: string;
  };
}

// ── IPs ─────────────────────────────────────────────────────────────────────

export interface RobotIP {
  ip: {
    ip: string;
    gateway?: string;
    mask?: number;
    broadcast?: string;
    server_ip: string;
    server_number: number;
    locked: boolean;
    separate_mac: string | null;
    traffic_warnings: boolean;
    traffic_hourly: number;
    traffic_daily: number;
    traffic_monthly: number;
  };
}

export interface RobotMAC {
  mac: {
    ip: string;
    mac: string | null;
  };
}

// ── Subnets ─────────────────────────────────────────────────────────────────

export interface RobotSubnet {
  subnet: {
    ip: string;
    mask: number;
    gateway: string;
    server_ip: string | null;
    server_number: number;
    failover: boolean;
    locked: boolean;
    traffic_warnings: boolean;
    traffic_hourly: number;
    traffic_daily: number;
    traffic_monthly: number;
  };
}

// ── Failover ────────────────────────────────────────────────────────────────

export interface RobotFailover {
  failover: {
    ip: string;
    netmask: string;
    server_ip: string;
    server_number: number;
    active_server_ip: string;
  };
}

// ── Firewall ────────────────────────────────────────────────────────────────

export interface RobotFirewallRule {
  ip_version: 'ipv4' | 'ipv6';
  name: string;
  dst_ip: string | null;
  dst_port: string | null;
  src_ip: string | null;
  src_port: string | null;
  protocol: string | null;
  tcp_flags: string | null;
  action: 'accept' | 'discard';
}

export interface RobotFirewall {
  firewall: {
    server_ip: string;
    server_number: number;
    status: 'active' | 'disabled' | 'in process';
    filter_ipv6: boolean;
    whitelist_hos: boolean;
    port: 'main' | 'kvm';
    rules: {
      input: RobotFirewallRule[];
      output: RobotFirewallRule[];
    };
  };
}

export interface RobotFirewallTemplate {
  id: number;
  name: string;
  is_default: boolean;
  filter_ipv6: boolean;
  whitelist_hos: boolean;
  rules: {
    input: RobotFirewallRule[];
    output: RobotFirewallRule[];
  };
}

// ── vSwitch ─────────────────────────────────────────────────────────────────

export interface RobotVSwitch {
  id: number;
  name: string;
  vlan: number;
  cancelled: boolean;
  server: Array<{
    server_ip: string;
    server_number: number;
    status: 'ready' | 'in process';
  }>;
  subnet: Array<{
    ip: string;
    mask: number;
    gateway: string;
  }>;
  cloud_network: Array<{
    id: number;
    ip: string;
    mask: number;
    gateway: string;
  }>;
}

// ── RDNS ────────────────────────────────────────────────────────────────────

export interface RobotRdns {
  rdns: {
    ip: string;
    ptr: string;
  };
}

// ── Traffic ─────────────────────────────────────────────────────────────────

export interface RobotTraffic {
  traffic: {
    type: string;
    from: string;
    to: string;
    data: Record<string, {
      in: number;
      out: number;
      sum: number;
    }>;
  };
}

// ── Storage Box ─────────────────────────────────────────────────────────────

export interface RobotStorageBox {
  storagebox: {
    id: number;
    login: string;
    name: string;
    product: string;
    cancelled: boolean;
    locked: boolean;
    location: string;
    linked_server: number | null;
    paid_until: string;
    disk_quota: number;
    disk_usage: number;
    disk_usage_data: number;
    disk_usage_snapshots: number;
    webdav: boolean;
    samba: boolean;
    ssh: boolean;
    external_reachability: boolean;
    zfs: boolean;
    server: string;
  };
}

// ── Errors ──────────────────────────────────────────────────────────────────

export interface RobotError {
  error: {
    status: number;
    code: string;
    message: string;
    missing?: string[] | null;
    invalid?: string[] | null;
  };
}
