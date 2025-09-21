// Re-export all types for easy importing
export * from './arweave.js';
export * from './arns.js';
export * from './ao.js';
export * from './parquet.js';
export * from './api.js';

// Version and metadata
export const SHARED_TYPES_VERSION = '1.0.0';

// Common utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type ID = string;
export type Timestamp = number;
export type Address = string;

// Common enums
export enum TransactionType {
  ARNS_NAME = 'arns_name',
  ARNS_RECORD = 'arns_record',
  ANT_REGISTRY = 'ant_registry',
  AO_PROCESS = 'ao_process',
  AO_MESSAGE = 'ao_message',
  GENERAL = 'general'
}

export enum RecordType {
  A = 'A',
  AAAA = 'AAAA',
  CNAME = 'CNAME',
  TXT = 'TXT',
  MX = 'MX'
}

export enum TableName {
  ARNS_NAMES = 'arns_names',
  ARNS_RECORDS = 'arns_records',
  ANT_REGISTRY = 'ant_registry',
  AO_PROCESSES = 'ao_processes',
  AO_MESSAGES = 'ao_messages',
  TRANSACTIONS = 'transactions'
}
