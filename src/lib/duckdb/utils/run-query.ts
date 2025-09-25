import { AsyncDuckDB } from '@duckdb/duckdb-wasm'
import { Table as Arrow } from 'apache-arrow'

import { DuckDBQueryError } from '../types'
import { logElapsedTime } from './perf'

/**
 * Execute a SQL query, and return the result as an Apache Arrow table.
 */
export const runQuery = async (
  db: AsyncDuckDB,
  sql: string,
  debug: boolean = false,
): Promise<Arrow> => {
  const start = performance.now()

  try {
    const conn = await db.connect()
    const arrow = await conn.query(sql)
    await conn.close()

    if (debug) {
      logElapsedTime(`Run query: ${sql}`, start)
    }

    return arrow
  } catch (error) {
    console.error('DuckDB query failed:', { sql, error })
    throw new DuckDBQueryError(
      'Query execution failed',
      `Failed to execute query: ${error}`,
      sql,
    )
  }
}
