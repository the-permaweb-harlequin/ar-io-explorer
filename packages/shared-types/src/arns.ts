// ArNS specific types
export interface ArNSName {
  name: string;
  owner: string;
  target: string;
  ttl_seconds: number;
  created_at: Date;
  updated_at: Date;
  block_height: number;
  transaction_id: string;
}

export interface ArNSRecord {
  name: string;
  record_type: string; // A, AAAA, CNAME, etc.
  value: string;
  ttl: number;
  created_at: Date;
  updated_at: Date;
  transaction_id: string;
}

export interface ANTRegistry {
  process_id: string;
  name: string;
  owner: string;
  version: string;
  registered_at: Date;
  transaction_id: string;
}

// ArNS search and filter types
export interface ArNSNameFilters {
  name?: string;
  owner?: string;
  limit?: number;
  offset?: number;
}

export interface ArNSSearchResult {
  names: ArNSName[];
  total: number;
  page: number;
  limit: number;
}
