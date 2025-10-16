/**
 * FK Parser - Parses PostgreSQL foreign key export JSON
 *
 * This module handles parsing, validation, and loading of foreign key data
 * from sql_export.json. It ensures data integrity and provides helpful
 * error messages for malformed entries.
 */

import { PgForeignKey, FKParseStats } from '../types/fkMetadata';

/**
 * Type guard to validate PgForeignKey structure
 *
 * Checks that an object has all required properties with correct types
 * and non-empty string values.
 *
 * @param obj - Object to validate
 * @returns True if object matches PgForeignKey interface
 */
function isValidForeignKey(obj: unknown): obj is PgForeignKey {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

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
 * Parse sql_export.json into typed PgForeignKey array
 *
 * Validates JSON structure and reports malformed entries.
 * Continues parsing even if some entries are invalid, but tracks errors.
 *
 * @param jsonData - Raw JSON string from sql_export.json
 * @returns Parsed array of valid foreign keys
 * @throws Error if JSON is completely invalid or not an array
 *
 * @example
 * ```typescript
 * import sqlExport from './data/sql_export.json';
 *
 * try {
 *   const foreignKeys = parseForeignKeys(JSON.stringify(sqlExport));
 *   console.log(`Parsed ${foreignKeys.length} foreign keys`);
 * } catch (error) {
 *   console.error('Failed to parse FK data:', error);
 * }
 * ```
 */
export function parseForeignKeys(jsonData: string): PgForeignKey[] {
  let parsed: unknown;

  // Step 1: Parse JSON string
  try {
    parsed = JSON.parse(jsonData);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON in FK export: ${message}`);
  }

  // Step 2: Validate it's an array
  if (!Array.isArray(parsed)) {
    throw new Error(
      `FK export must be a JSON array, got ${typeof parsed}. ` +
        `Expected format: [{source_table, source_column, target_table, target_column}, ...]`
    );
  }

  // Step 3: Validate and collect valid entries
  const results: PgForeignKey[] = [];
  const errors: string[] = [];

  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i];

    if (!isValidForeignKey(item)) {
      // Collect detailed error information
      const itemStr = JSON.stringify(item);
      const reason = getValidationFailureReason(item);
      errors.push(`Index ${i}: ${reason} - ${itemStr}`);
      continue;
    }

    results.push(item as PgForeignKey);
  }

  // Step 4: Report warnings for invalid entries
  if (errors.length > 0) {
    console.warn(
      `FK parsing warnings: ${errors.length} invalid entries out of ${parsed.length} total:`,
      errors.slice(0, 10) // Show first 10 errors
    );
    if (errors.length > 10) {
      console.warn(`... and ${errors.length - 10} more errors`);
    }
  }

  // Step 5: Log success
  const successRate = parsed.length > 0 ? (results.length / parsed.length) * 100 : 0;
  console.log(
    `FK Parser: Successfully parsed ${results.length}/${parsed.length} entries (${successRate.toFixed(1)}%)`
  );

  return results;
}

/**
 * Provides detailed reason for validation failure
 *
 * @param obj - Object that failed validation
 * @returns Human-readable failure reason
 */
function getValidationFailureReason(obj: unknown): string {
  if (typeof obj !== 'object' || obj === null) {
    return `Expected object, got ${typeof obj}`;
  }

  const fk = obj as Record<string, unknown>;
  const required = ['source_table', 'source_column', 'target_table', 'target_column'];

  for (const field of required) {
    if (!(field in fk)) {
      return `Missing required field '${field}'`;
    }
    if (typeof fk[field] !== 'string') {
      return `Field '${field}' must be a string, got ${typeof fk[field]}`;
    }
    if ((fk[field] as string).length === 0) {
      return `Field '${field}' cannot be empty`;
    }
  }

  return 'Unknown validation failure';
}

/**
 * Parse foreign keys from imported JSON module
 *
 * Convenience wrapper for parsing FK data from direct JSON imports.
 * Handles the common case of `import sqlExport from './data/sql_export.json'`.
 *
 * @param jsonModule - Imported JSON module
 * @returns Parsed array of foreign keys
 *
 * @example
 * ```typescript
 * import sqlExport from './data/sql_export.json';
 *
 * const foreignKeys = parseForeignKeysFromModule(sqlExport);
 * ```
 */
export function parseForeignKeysFromModule(jsonModule: unknown): PgForeignKey[] {
  // JSON modules are already parsed, so stringify and re-parse for validation
  return parseForeignKeys(JSON.stringify(jsonModule));
}

/**
 * Calculate statistics from parsed foreign keys
 *
 * Analyzes the parsed FK data to provide insights about the relationships.
 * Useful for debugging and monitoring data quality.
 *
 * @param foreignKeys - Parsed foreign key array
 * @returns Statistics about the FK data
 *
 * @example
 * ```typescript
 * const foreignKeys = parseForeignKeys(jsonData);
 * const stats = calculateFKStats(foreignKeys);
 *
 * console.log(`Total FKs: ${stats.totalFKs}`);
 * console.log(`Unique source tables: ${stats.uniqueSourceTables}`);
 * console.log(`Unique target tables: ${stats.uniqueTargetTables}`);
 * console.log(`Self-referencing: ${stats.selfReferences}`);
 * ```
 */
export function calculateFKStats(foreignKeys: PgForeignKey[]): FKParseStats & {
  uniqueSourceTables: number;
  uniqueTargetTables: number;
  uniqueTables: number;
} {
  const sourceTables = new Set<string>();
  const targetTables = new Set<string>();
  const allTables = new Set<string>();
  let selfReferences = 0;

  for (const fk of foreignKeys) {
    sourceTables.add(fk.source_table);
    targetTables.add(fk.target_table);
    allTables.add(fk.source_table);
    allTables.add(fk.target_table);

    if (fk.source_table === fk.target_table) {
      selfReferences++;
    }
  }

  return {
    totalFKs: foreignKeys.length,
    forwardFKs: foreignKeys.length, // All parsed FKs are forward FKs
    reverseFKs: 0, // Reverse FKs are inferred, not in source data
    junctionTables: 0, // Will be detected in fkLookup.ts
    selfReferences,
    parseErrors: 0, // This function operates on already-parsed data
    uniqueSourceTables: sourceTables.size,
    uniqueTargetTables: targetTables.size,
    uniqueTables: allTables.size,
  };
}

/**
 * Load and parse FK data from a file path or URL
 *
 * Convenience function for loading FK data from various sources.
 * In browser environments, only URL loading is supported.
 *
 * @param source - File path or URL to FK data
 * @returns Promise resolving to parsed foreign keys
 * @throws Error if loading or parsing fails
 *
 * @example
 * ```typescript
 * // Load from URL (works in browser and Node)
 * const foreignKeys = await loadForeignKeys('https://example.com/fks.json');
 *
 * // Load from file (Node.js only)
 * const foreignKeys = await loadForeignKeys('./data/sql_export.json');
 * ```
 */
export async function loadForeignKeys(source: string): Promise<PgForeignKey[]> {
  try {
    // Attempt to fetch as URL
    if (source.startsWith('http://') || source.startsWith('https://')) {
      const response = await fetch(source);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      return parseForeignKeys(text);
    }

    // For file paths, throw helpful error in browser environments
    throw new Error(
      'File path loading not supported in browser environment. ' +
        'Use URL or import the JSON file directly.'
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load FK data from ${source}: ${message}`);
  }
}

/**
 * Validate that FK data has minimum expected structure
 *
 * Quick validation to ensure FK data looks reasonable before processing.
 * Checks for minimum number of entries and common patterns.
 *
 * @param foreignKeys - Parsed foreign keys to validate
 * @returns Validation result with any warnings
 *
 * @example
 * ```typescript
 * const foreignKeys = parseForeignKeys(jsonData);
 * const validation = validateFKData(foreignKeys);
 *
 * if (!validation.valid) {
 *   console.error('FK data validation failed:', validation.warnings);
 * }
 * ```
 */
export function validateFKData(foreignKeys: PgForeignKey[]): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check minimum size
  if (foreignKeys.length === 0) {
    warnings.push('No foreign keys found in data');
    return { valid: false, warnings };
  }

  if (foreignKeys.length < 10) {
    warnings.push(
      `Only ${foreignKeys.length} foreign keys found - expected more for typical schema`
    );
  }

  // Check for common patterns
  const hasDcim = foreignKeys.some((fk) => fk.source_table.startsWith('dcim_'));
  const hasIpam = foreignKeys.some((fk) => fk.source_table.startsWith('ipam_'));

  if (!hasDcim && !hasIpam) {
    warnings.push('No dcim_ or ipam_ tables found - is this Nautobot data?');
  }

  // Check for suspicious patterns
  const allTargetId = foreignKeys.every((fk) => fk.target_column === 'id');
  if (!allTargetId) {
    warnings.push(
      'Some foreign keys target non-id columns - this is unusual but may be valid'
    );
  }

  return {
    valid: warnings.length === 0 || foreignKeys.length > 0,
    warnings,
  };
}
