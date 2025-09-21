// Parquet and data management types
export interface TableStats {
  file_size: number;
  row_count: number;
  buffer_count: number;
  last_modified: Date | null;
  file_exists: boolean;
}

export interface PartitionInfo {
  key: string;
  value: string;
  arweave_id: string;
  row_count: number;
}

export interface TableInfo {
  name: string;
  arweave_id: string;
  schema_version: string;
  row_count: number;
  file_size: number;
  last_checkpoint: number;
  created_at: string;
  updated_at: string;
  partitions: PartitionInfo[];
  compression: string;
  format: string;
}

export interface DataCatalog {
  version: string;
  created_at: string;
  last_updated: number;
  service: string;
  tables: Record<string, TableInfo>;
}

export interface CatalogInfo {
  arns_name: string;
  wallet_loaded: boolean;
  wallet_address: string | null;
  arweave_host: string;
}

// General transaction type for parquet storage
export interface GeneralTransaction {
  id: string;
  owner: string;
  target?: string;
  data_size: number;
  block_height: number;
  block_timestamp: Date;
  fee: number;
  tags: string; // JSON string
  app_name?: string;
}
