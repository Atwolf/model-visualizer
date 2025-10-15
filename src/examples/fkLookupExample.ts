/**
 * Example: Using the FK Lookup System
 *
 * This example demonstrates how to load FK data and use the lookup map
 * to determine edge directions and cardinality.
 */

import { loadBundledFKData, getFKDataStats } from '../utils/fkLoader';
import { buildFKLookupMap, StubTableToTypeMapper, getFKMetadata, isFK } from '../utils/fkLookup';

/**
 * Example 1: Load and inspect FK data
 */
export function exampleLoadFKData() {
  console.log('=== Example 1: Load FK Data ===');

  // Load the bundled FK data
  const foreignKeys = loadBundledFKData();
  console.log(`Loaded ${foreignKeys.length} foreign key relationships`);

  // Get statistics
  const stats = getFKDataStats();
  console.log('FK Data Statistics:', stats);

  // Show first few FKs
  console.log('\nFirst 3 foreign keys:');
  foreignKeys.slice(0, 3).forEach(fk => {
    console.log(`  ${fk.source_table}.${fk.source_column} -> ${fk.target_table}.${fk.target_column}`);
  });
}

/**
 * Example 2: Build FK lookup map with stub mapper
 */
export function exampleBuildLookupMap() {
  console.log('\n=== Example 2: Build FK Lookup Map ===');

  // Create a stub mapper for testing
  const mapper = new StubTableToTypeMapper();
  mapper.addMapping('dcim_device', 'DeviceType');
  mapper.addMapping('dcim_manufacturer', 'ManufacturerType');
  mapper.addMapping('dcim_location', 'LocationType');
  mapper.addMapping('ipam_ipaddress', 'IPAddressType');

  // Load FK data and build lookup
  const foreignKeys = loadBundledFKData();
  const fkLookup = buildFKLookupMap(foreignKeys, mapper);

  console.log(`\nBuilt FK lookup map with ${fkLookup.size} entries`);
}

/**
 * Example 3: Query FK metadata
 */
export function exampleQueryFKMetadata() {
  console.log('\n=== Example 3: Query FK Metadata ===');

  // Setup
  const mapper = new StubTableToTypeMapper();
  mapper.addMapping('dcim_device', 'DeviceType');
  mapper.addMapping('dcim_manufacturer', 'ManufacturerType');
  mapper.addMapping('dcim_location', 'LocationType');
  mapper.addMapping('dcim_rack', 'RackType');

  const foreignKeys = loadBundledFKData();
  const fkLookup = buildFKLookupMap(foreignKeys, mapper);

  // Check if a field is a FK
  const isManufacturerFK = isFK(fkLookup, 'DeviceType', 'manufacturer');
  console.log(`\nIs DeviceType.manufacturer a FK? ${isManufacturerFK}`);

  // Get FK metadata
  const metadata = getFKMetadata(fkLookup, 'DeviceType', 'location');
  if (metadata) {
    console.log('\nDeviceType.location FK metadata:');
    console.log(`  Direction: ${metadata.direction}`);
    console.log(`  Cardinality: ${metadata.cardinality}`);
    console.log(`  Source: ${metadata.sourceTable}.${metadata.sourceColumn}`);
    console.log(`  Target: ${metadata.targetTable}.${metadata.targetColumn}`);
    console.log(`  Is Junction Table: ${metadata.isJunctionTable || false}`);
  }
}

/**
 * Example 4: Full workflow
 */
export function exampleFullWorkflow() {
  console.log('\n=== Example 4: Full Workflow ===');

  // 1. Load FK data
  const foreignKeys = loadBundledFKData();
  console.log(`Step 1: Loaded ${foreignKeys.length} FKs`);

  // 2. Create name mapper
  const mapper = new StubTableToTypeMapper();
  // In production, this would be populated from GraphQL introspection
  mapper.addMapping('dcim_device', 'DeviceType');
  mapper.addMapping('dcim_manufacturer', 'ManufacturerType');
  console.log('Step 2: Created name mapper');

  // 3. Build lookup map
  const fkLookup = buildFKLookupMap(foreignKeys, mapper);
  console.log(`Step 3: Built lookup with ${fkLookup.size} entries`);

  // 4. Use in graph building
  // This would typically happen in graphqlTransformer.ts
  const typeName = 'DeviceType';
  const fieldName = 'manufacturer';

  if (isFK(fkLookup, typeName, fieldName)) {
    const metadata = getFKMetadata(fkLookup, typeName, fieldName);
    console.log(`\nStep 4: Found FK metadata for ${typeName}.${fieldName}`);
    console.log(`  This is a ${metadata?.cardinality} relationship`);
    console.log(`  Direction: ${metadata?.direction}`);
    console.log('  -> Can use this to style edges differently!');
  }
}

/**
 * Run all examples
 */
export function runAllExamples() {
  exampleLoadFKData();
  exampleBuildLookupMap();
  exampleQueryFKMetadata();
  exampleFullWorkflow();

  console.log('\n=== All Examples Complete ===');
}

// Uncomment to run when this file is executed
// runAllExamples();
