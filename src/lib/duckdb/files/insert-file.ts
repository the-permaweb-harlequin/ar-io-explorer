/**
 * Insert files in DuckDB with multi-instance support.
 */
import * as duckdb from '@duckdb/duckdb-wasm'
import { AsyncDuckDB } from '@duckdb/duckdb-wasm'
import { Table as Arrow } from 'apache-arrow'

import { instanceManager } from '../instance-manager'
import { DuckDBFileError, ImportFileOptions } from '../types'
import { inferTypes } from '../utils/infer-types'
import { logElapsedTime } from '../utils/perf'
import { runQuery } from '../utils/run-query'
import { getTempFilename } from '../utils/tempfile'
import { arrayBufferToArrow, isArrowFile } from './arrow'
import { isParquetFile } from './parquet'

/**
 * Insert a CSV, Arrow, or Parquet file in DuckDB.
 * Supports multi-instance usage via instanceId in options.
 */
export const insertFile = async (
  file: File,
  options: ImportFileOptions = {},
): Promise<void> => {
  const { instanceId = 'default', tableName, debug = false } = options

  // Get the database instance
  const instance = instanceManager.getExistingInstance(instanceId)
  if (!instance) {
    throw new DuckDBFileError(
      'Instance not found',
      `DuckDB instance '${instanceId}' not found. Please create it first.`,
      file.name,
      instanceId,
    )
  }

  const start = performance.now()
  await _insertFile(instance.db, file, tableName, instanceId)

  if (debug) {
    logElapsedTime(`Imported ${file.name}`, start)
  }
}

/**
 * Insert a file using a specific database instance
 */
export const insertFileToInstance = async (
  db: AsyncDuckDB,
  file: File,
  tableName?: string,
  debug: boolean = false,
): Promise<void> => {
  const start = performance.now()
  await _insertFile(db, file, tableName)

  if (debug) {
    logElapsedTime(`Imported ${file.name}`, start)
  }
}

/**
 * Private method to do the insert.
 */
const _insertFile = async (
  db: AsyncDuckDB,
  file: File,
  tableName?: string,
  instanceId?: string,
): Promise<void> => {
  try {
    tableName = tableName || file.name

    // Try Parquet first.
    if (await isParquetFile(file)) {
      await insertParquet(db, file, tableName)
      return
    }

    // Then Arrow.
    if (await isArrowFile(file)) {
      await insertArrow(db, file, tableName)
      return
    }

    // Next, try matching the file extension.
    const filename = file.name.toLowerCase()
    const extension = filename.split('.').at(-1)
    switch (extension) {
      case 'arrow':
        await insertArrow(db, file, tableName)
        return
      case 'parquet':
        await insertParquet(db, file, tableName)
        return
      case 'csv':
        await insertCSV(db, file, tableName)
        return
    }

    // If nothing else matches, try inserting as CSV.
    return await insertCSV(db, file, tableName)
  } catch (e) {
    console.error(e)
    if (e instanceof DuckDBFileError) {
      throw e
    } else {
      throw new DuckDBFileError(
        'Invalid file type',
        'Only CSV, Parquet, or Arrow files are supported',
        file.name,
        instanceId,
      )
    }
  }
}

/**
 * Insert a CSV file in DuckDB from a File handle.
 */
export const insertCSV = async (
  db: AsyncDuckDB,
  file: File,
  tableName: string,
): Promise<void> => {
  try {
    const text = await file.text()

    const tempFile = getTempFilename()
    await db.registerFileText(tempFile, text)

    const conn = await db.connect()
    await conn.insertCSVFromPath(tempFile, {
      name: tableName,
      schema: 'main',
      detect: true,
    })
    await conn.close()
    db.dropFile(tempFile)

    // Infer additional column types after CSV import.
    await inferTypes(db, tableName)
  } catch (e) {
    console.error(e)
    // The file looks like a CSV, but parsing failed.
    if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
      throw new DuckDBFileError(
        'CSV import failed',
        "Sorry, we couldn't import that CSV. Please try again.",
        file.name,
      )
    }

    // Probably an invalid file type.
    throw e
  }
}

/**
 * Insert an Arrow file in DuckDB from a File handle.
 */
export const insertArrow = async (
  db: AsyncDuckDB,
  file: File,
  tableName: string,
): Promise<void> => {
  try {
    const buffer = await file.arrayBuffer()
    const arrow = arrayBufferToArrow(buffer)
    await insertArrowTable(db, arrow, tableName)
  } catch (e) {
    console.error(e)
    throw new DuckDBFileError(
      'Arrow import failed',
      "Sorry, we couldn't import that file",
      file.name,
    )
  }
}

/**
 * Insert an in-memory Arrow table in DuckDB.
 */
export const insertArrowTable = async (
  db: AsyncDuckDB,
  arrow: Arrow,
  tableName: string,
): Promise<void> => {
  const conn = await db.connect()
  await conn.insertArrowTable(arrow, {
    name: tableName,
  })
  await conn.close()
}

/**
 * Insert a Parquet file in DuckDB from a File handle.
 */
export const insertParquet = async (
  db: AsyncDuckDB,
  file: File,
  tableName: string,
): Promise<void> => {
  try {
    const tempFile = getTempFilename() + '.parquet'
    await db.registerFileHandle(
      tempFile,
      file,
      duckdb.DuckDBDataProtocol.BROWSER_FILEREADER,
      true,
    )
    await runQuery(
      db,
      `CREATE TABLE '${tableName}' AS SELECT * FROM '${tempFile}'`,
    )
    await db.dropFile(tempFile)
  } catch (e) {
    console.error(e)
    throw new DuckDBFileError(
      'Parquet import failed',
      "Sorry, we couldn't import that file",
      file.name,
    )
  }
}
