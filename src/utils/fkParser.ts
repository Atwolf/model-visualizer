/**
 * Foreign Key Parser
 *
 * Parses and validates PostgreSQL foreign key export JSON data.
 * Handles validation, error reporting, and type safety.
 */

import { PgForeignKey } from '../types/fkMetadata';

/**
 * Parse source_target.json into typed PgForeignKey array
 * Validates structure and reports any malformed entries
 *
 * @param jsonData - Raw JSON string from source_target.json
 * @returns Parsed array of foreign keys
 * @throws Error if JSON is invalid or structure is malformed
 */
export function parseForeignKeys(jsonData: string): PgForeignKey[] {
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonData);
  } catch (error) {
    throw new Error(`Invalid JSON in FK export: ${(error as Error).message}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error('FK export must be a JSON array');
  }

  const results: PgForeignKey[] = [];
  const errors: string[] = [];

  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i];

    // Validate structure
    if (!isValidForeignKey(item)) {
      errors.push(`Invalid FK at index ${i}: ${JSON.stringify(item)}`);
      continue;
    }

    results.push(item as PgForeignKey);
  }

  if (errors.length > 0) {
    console.warn(`FK parsing warnings (${errors.length} entries):`, errors);
  }

  console.log(`Parsed ${results.length} foreign keys`);
  return results;
}

/**
 * Type guard to validate PgForeignKey structure
 */
function isValidForeignKey(obj: unknown): obj is PgForeignKey {
  if (typeof obj !== 'object' || obj === null) return false;

  const fk = obj as Record<string, unknown>;

  return (
    typeof fk.source_table === 'string' &&
    typeof fk.source_column === 'string' &&
    typeof fk.target_table === 'string' &&
    typeof fk.target_column === 'string' &&
    fk.source_table.length > 0 &&
    fk.source_column.length > 0 &&
    fk.target_table.length > 0 &&
    fk.target_column.length > 0
  );
}

/**
 * Load and parse FK data from file path or URL
 * Convenience wrapper around parseForeignKeys
 *
 * @param source - File path or URL to FK JSON data
 * @returns Parsed foreign keys
 */
export async function loadForeignKeys(source: string): Promise<PgForeignKey[]> {
  try {
    // Attempt to fetch as URL first
    if (source.startsWith('http://') || source.startsWith('https://')) {
      const response = await fetch(source);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const text = await response.text();
      return parseForeignKeys(text);
    }

    // For browser environments with static imports, use dynamic import
    // This works with Vite's import system
    const module = await import(/* @vite-ignore */ source);
    const data = module.default || module;
    return parseForeignKeys(JSON.stringify(data));
  } catch (error) {
    throw new Error(`Failed to load FK data from ${source}: ${(error as Error).message}`);
  }
}

/**
 * Load FK data from a JSON module (for static imports)
 *
 * @param data - JSON data object
 * @returns Parsed foreign keys
 */
export function parseForeignKeysFromModule(data: unknown): PgForeignKey[] {
  return parseForeignKeys(JSON.stringify(data));
}
