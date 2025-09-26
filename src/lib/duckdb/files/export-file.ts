/**
 * Export files from DuckDB with multi-instance support.
 */
import { AsyncDuckDB } from '@duckdb/duckdb-wasm'

import { instanceManager } from '../instance-manager'
import { DuckDBFileError, ExportFileOptions } from '../types'
import { runQuery } from '../utils/run-query'
import { getTempFilename } from '../utils/tempfile'
import { ARROW_MIME_TYPE, arrowToArrayBuffer } from './arrow'
import { CSV_MIME_TYPE } from './csv'
import { PARQUET_MIME_TYPE } from './parquet'

/**
 * Export a table (or view) to an Arrow file with a given filename.
 * Supports multi-instance usage via instanceId in options.
 */
export const exportArrow = async (
  tableName: string,
  options: ExportFileOptions = {},
): Promise<File> => {
  const { instanceId = 'default', filename } = options

  // Get the database instance
  const instance = instanceManager.getExistingInstance(instanceId)
  if (!instance) {
    throw new DuckDBFileError(
      'Instance not found',
      `DuckDB instance '${instanceId}' not found. Please create it first.`,
      filename,
      instanceId,
    )
  }

  return exportArrowFromInstance(instance.db, tableName, filename)
}

/**
 * Export a table (or view) to a CSV file with a given filename.
 * Supports multi-instance usage via instanceId in options.
 */
export const exportCsv = async (
  tableName: string,
  options: ExportFileOptions = {},
): Promise<File> => {
  const { instanceId = 'default', filename, delimiter = ',' } = options

  // Get the database instance
  const instance = instanceManager.getExistingInstance(instanceId)
  if (!instance) {
    throw new DuckDBFileError(
      'Instance not found',
      `DuckDB instance '${instanceId}' not found. Please create it first.`,
      filename,
      instanceId,
    )
  }

  return exportCsvFromInstance(instance.db, tableName, filename, delimiter)
}

/**
 * Export a table to Parquet.
 * Supports multi-instance usage via instanceId in options.
 * Uses zstd compression by default, which seems to be both smaller & faster for many files.
 */
export const exportParquet = async (
  tableName: string,
  options: ExportFileOptions = {},
): Promise<File> => {
  const { instanceId = 'default', filename, compression = 'zstd' } = options

  // Get the database instance
  const instance = instanceManager.getExistingInstance(instanceId)
  if (!instance) {
    throw new DuckDBFileError(
      'Instance not found',
      `DuckDB instance '${instanceId}' not found. Please create it first.`,
      filename,
      instanceId,
    )
  }

  return exportParquetFromInstance(
    instance.db,
    tableName,
    filename,
    compression,
  )
}

/**
 * Export a table (or view) to an Arrow file using a specific database instance.
 */
export const exportArrowFromInstance = async (
  db: AsyncDuckDB,
  tableName: string,
  filename?: string,
): Promise<File> => {
  filename = filename || getExportedFilename(tableName, 'arrow')

  const arrow = await runQuery(db, `SELECT * FROM '${tableName}'`)
  const buffer = arrowToArrayBuffer(arrow)

  return new File([buffer], filename, { type: ARROW_MIME_TYPE })
}

/**
 * Export a table (or view) to a CSV file using a specific database instance.
 */
export const exportCsvFromInstance = async (
  db: AsyncDuckDB,
  tableName: string,
  filename?: string,
  delimiter = ',',
): Promise<File> => {
  filename = filename || getExportedFilename(tableName, 'csv')

  const tempFile = getTempFilename()
  await runQuery(
    db,
    `COPY '${tableName}' TO '${tempFile}' WITH (HEADER 1, DELIMITER '${delimiter}')`,
  )

  const buffer = await db.copyFileToBuffer(tempFile)
  await db.dropFile(tempFile)

  return new File([buffer as BlobPart], filename, { type: CSV_MIME_TYPE })
}

/**
 * Export a table to Parquet using a specific database instance.
 * Uses zstd compression by default, which seems to be both smaller & faster for many files.
 */
export const exportParquetFromInstance = async (
  db: AsyncDuckDB,
  tableName: string,
  filename?: string,
  compression: 'uncompressed' | 'snappy' | 'gzip' | 'zstd' = 'zstd',
): Promise<File> => {
  filename = filename || getExportedFilename(tableName, 'parquet')

  const tempFile = getTempFilename()
  await runQuery(
    db,
    `COPY '${tableName}' TO '${tempFile}' (FORMAT PARQUET, COMPRESSION ${compression})`,
  )

  const buffer = await db.copyFileToBuffer(tempFile)
  await db.dropFile(tempFile)

  return new File([buffer as BlobPart], filename, { type: PARQUET_MIME_TYPE })
}

/**
 * Strip the extension off a filename, if it matches a given extension.
 */
const stripFileExtension = (filename: string, extensions: string[]) => {
  const parts = filename.split('.')
  const ext = parts.length > 1 ? (parts.pop() as string) : ''
  const basename = parts.join('.')
  if (extensions.includes(ext)) {
    return basename
  }
  return filename
}

/**
 * Get a filename to use when downloading
 */
const getExportedFilename = (tableName: string, extension: string) => {
  // If the table was imported with an extension, strip it.
  const basename = stripFileExtension(tableName, ['arrow', 'csv', 'parquet'])

  return basename + '.' + extension
}
