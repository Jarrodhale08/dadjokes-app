/**
 * Database Module - Secure SQLite Integration
 *
 * SECURITY: All queries use parameterized statements ONLY.
 * No string interpolation is used anywhere in SQL construction.
 * Table/column names are validated against strict patterns.
 */

import * as SQLite from 'expo-sqlite';

export const DB_NAME = 'app.db';
export const DB_VERSION = 1;

// Valid identifier pattern (alphanumeric and underscores only)
const VALID_IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const RESERVED_WORDS = new Set(['select', 'insert', 'update', 'delete', 'drop', 'create', 'alter', 'table', 'index', 'where', 'from', 'join', 'and', 'or']);

/**
 * Validate SQL identifier (table/column name)
 */
function validateIdentifier(name: string, type: 'table' | 'column'): void {
  if (!VALID_IDENTIFIER.test(name)) {
    throw new Error(`Invalid ${type} name: ${name}. Only alphanumeric characters and underscores allowed.`);
  }
  if (RESERVED_WORDS.has(name.toLowerCase())) {
    throw new Error(`${type} name cannot be a reserved SQL keyword: ${name}`);
  }
}

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;

  dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
  await dbInstance.execAsync('PRAGMA journal_mode = WAL;');
  return dbInstance;
}

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return dbInstance;
}

export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
  }
}

// ============================================================================
// SECURE CRUD Operations - All use parameterized queries only
// ============================================================================

/**
 * Insert a record - all values are parameterized
 */
export async function insert<T extends Record<string, unknown>>(
  table: string,
  data: T
): Promise<number> {
  validateIdentifier(table, 'table');
  const db = getDatabase();

  const columns = Object.keys(data);
  columns.forEach(col => validateIdentifier(col, 'column'));

  const values = Object.values(data);
  const placeholders = columns.map(() => '?').join(', ');
  const columnList = columns.map(c => `"${c}"`).join(', ');

  const sql = `INSERT INTO "${table}" (${columnList}) VALUES (${placeholders})`;
  const result = await db.runAsync(sql, ...values);
  return result.lastInsertRowId;
}

/**
 * Update by ID - secure parameterized update
 */
export async function updateById<T extends Record<string, unknown>>(
  table: string,
  id: number | string,
  data: T
): Promise<number> {
  validateIdentifier(table, 'table');
  const db = getDatabase();

  const columns = Object.keys(data);
  columns.forEach(col => validateIdentifier(col, 'column'));

  const values = Object.values(data);
  const setClause = columns.map(col => `"${col}" = ?`).join(', ');

  const sql = `UPDATE "${table}" SET ${setClause} WHERE "id" = ?`;
  const result = await db.runAsync(sql, ...values, id);
  return result.changes;
}

/**
 * Update with single column condition - secure
 */
export async function updateWhere<T extends Record<string, unknown>>(
  table: string,
  data: T,
  whereColumn: string,
  whereValue: unknown
): Promise<number> {
  validateIdentifier(table, 'table');
  validateIdentifier(whereColumn, 'column');
  const db = getDatabase();

  const columns = Object.keys(data);
  columns.forEach(col => validateIdentifier(col, 'column'));

  const values = Object.values(data);
  const setClause = columns.map(col => `"${col}" = ?`).join(', ');

  const sql = `UPDATE "${table}" SET ${setClause} WHERE "${whereColumn}" = ?`;
  const result = await db.runAsync(sql, ...values, whereValue);
  return result.changes;
}

/**
 * Update with multiple AND conditions - secure
 */
export async function updateWhereAnd<T extends Record<string, unknown>>(
  table: string,
  data: T,
  conditions: Record<string, unknown>
): Promise<number> {
  validateIdentifier(table, 'table');
  const db = getDatabase();

  const columns = Object.keys(data);
  columns.forEach(col => validateIdentifier(col, 'column'));

  const conditionColumns = Object.keys(conditions);
  conditionColumns.forEach(col => validateIdentifier(col, 'column'));

  const values = Object.values(data);
  const conditionValues = Object.values(conditions);
  const setClause = columns.map(col => `"${col}" = ?`).join(', ');
  const whereClause = conditionColumns.map(col => `"${col}" = ?`).join(' AND ');

  const sql = `UPDATE "${table}" SET ${setClause} WHERE ${whereClause}`;
  const result = await db.runAsync(sql, ...values, ...conditionValues);
  return result.changes;
}

/**
 * Delete by ID - secure
 */
export async function deleteById(
  table: string,
  id: number | string
): Promise<number> {
  validateIdentifier(table, 'table');
  const db = getDatabase();

  const sql = `DELETE FROM "${table}" WHERE "id" = ?`;
  const result = await db.runAsync(sql, id);
  return result.changes;
}

/**
 * Delete with single column condition - secure
 */
export async function deleteWhere(
  table: string,
  whereColumn: string,
  whereValue: unknown
): Promise<number> {
  validateIdentifier(table, 'table');
  validateIdentifier(whereColumn, 'column');
  const db = getDatabase();

  const sql = `DELETE FROM "${table}" WHERE "${whereColumn}" = ?`;
  const result = await db.runAsync(sql, whereValue);
  return result.changes;
}

/**
 * Delete with multiple AND conditions - secure
 */
export async function deleteWhereAnd(
  table: string,
  conditions: Record<string, unknown>
): Promise<number> {
  validateIdentifier(table, 'table');
  const db = getDatabase();

  const conditionColumns = Object.keys(conditions);
  conditionColumns.forEach(col => validateIdentifier(col, 'column'));

  const conditionValues = Object.values(conditions);
  const whereClause = conditionColumns.map(col => `"${col}" = ?`).join(' AND ');

  const sql = `DELETE FROM "${table}" WHERE ${whereClause}`;
  const result = await db.runAsync(sql, ...conditionValues);
  return result.changes;
}

/**
 * Find by ID - secure
 */
export async function findById<T = unknown>(
  table: string,
  id: number | string
): Promise<T | null> {
  validateIdentifier(table, 'table');
  const db = getDatabase();

  const sql = `SELECT * FROM "${table}" WHERE "id" = ? LIMIT 1`;
  const result = await db.getFirstAsync<T>(sql, [id]);
  return result || null;
}

/**
 * Find by column value - secure
 */
export async function findBy<T = unknown>(
  table: string,
  column: string,
  value: unknown
): Promise<T[]> {
  validateIdentifier(table, 'table');
  validateIdentifier(column, 'column');
  const db = getDatabase();

  const sql = `SELECT * FROM "${table}" WHERE "${column}" = ?`;
  return await db.getAllAsync<T>(sql, [value]);
}

/**
 * Find one by column value - secure
 */
export async function findOneBy<T = unknown>(
  table: string,
  column: string,
  value: unknown
): Promise<T | null> {
  validateIdentifier(table, 'table');
  validateIdentifier(column, 'column');
  const db = getDatabase();

  const sql = `SELECT * FROM "${table}" WHERE "${column}" = ? LIMIT 1`;
  const result = await db.getFirstAsync<T>(sql, [value]);
  return result || null;
}

/**
 * Find with multiple AND conditions - secure
 */
export async function findWhereAnd<T = unknown>(
  table: string,
  conditions: Record<string, unknown>
): Promise<T[]> {
  validateIdentifier(table, 'table');
  const db = getDatabase();

  const conditionColumns = Object.keys(conditions);
  conditionColumns.forEach(col => validateIdentifier(col, 'column'));

  const conditionValues = Object.values(conditions);
  const whereClause = conditionColumns.map(col => `"${col}" = ?`).join(' AND ');

  const sql = `SELECT * FROM "${table}" WHERE ${whereClause}`;
  return await db.getAllAsync<T>(sql, conditionValues);
}

/**
 * Find all records - secure
 */
export async function findAll<T = unknown>(
  table: string,
  limit?: number,
  offset?: number
): Promise<T[]> {
  validateIdentifier(table, 'table');
  const db = getDatabase();

  let sql = `SELECT * FROM "${table}"`;
  const params: number[] = [];

  if (limit !== undefined) {
    sql += ' LIMIT ?';
    params.push(limit);
    if (offset !== undefined) {
      sql += ' OFFSET ?';
      params.push(offset);
    }
  }

  return await db.getAllAsync<T>(sql, params);
}

/**
 * Count records - secure
 */
export async function count(
  table: string,
  whereColumn?: string,
  whereValue?: unknown
): Promise<number> {
  validateIdentifier(table, 'table');
  const db = getDatabase();

  let sql: string;
  let params: unknown[] = [];

  if (whereColumn && whereValue !== undefined) {
    validateIdentifier(whereColumn, 'column');
    sql = `SELECT COUNT(*) as count FROM "${table}" WHERE "${whereColumn}" = ?`;
    params = [whereValue];
  } else {
    sql = `SELECT COUNT(*) as count FROM "${table}"`;
  }

  const result = await db.getFirstAsync<{ count: number }>(sql, params);
  return result?.count || 0;
}

/**
 * Count with multiple AND conditions - secure
 */
export async function countWhereAnd(
  table: string,
  conditions: Record<string, unknown>
): Promise<number> {
  validateIdentifier(table, 'table');
  const db = getDatabase();

  const conditionColumns = Object.keys(conditions);
  conditionColumns.forEach(col => validateIdentifier(col, 'column'));

  const conditionValues = Object.values(conditions);
  const whereClause = conditionColumns.map(col => `"${col}" = ?`).join(' AND ');

  const sql = `SELECT COUNT(*) as count FROM "${table}" WHERE ${whereClause}`;
  const result = await db.getFirstAsync<{ count: number }>(sql, conditionValues);
  return result?.count || 0;
}

/**
 * Execute raw parameterized query - for complex queries
 */
export async function executeQuery<T = unknown>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const db = getDatabase();
  return await db.getAllAsync<T>(sql, params);
}

/**
 * Transaction wrapper
 */
export async function transaction<T>(
  callback: () => Promise<T>
): Promise<T> {
  const db = getDatabase();
  return await db.withTransactionAsync(callback);
}

/**
 * Clear table - secure
 */
export async function clearTable(table: string): Promise<void> {
  validateIdentifier(table, 'table');
  const db = getDatabase();
  await db.runAsync(`DELETE FROM "${table}"`);
}

/**
 * Check if table exists - secure
 */
export async function tableExists(table: string): Promise<boolean> {
  validateIdentifier(table, 'table');
  const db = getDatabase();

  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name=?`,
    [table]
  );

  return (result?.count || 0) > 0;
}
