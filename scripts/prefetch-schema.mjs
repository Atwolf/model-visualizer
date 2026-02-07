/**
 * Pre-fetches GraphQL introspection data from Nautobot and writes it
 * to src/data/schema-cache.json so production builds on GitHub Pages
 * can run without any runtime API calls.
 *
 * Usage:
 *   VITE_NAUTOBOT_URL=... VITE_NAUTOBOT_API_TOKEN=... node scripts/prefetch-schema.mjs
 *
 * Or with a .env file present:
 *   node scripts/prefetch-schema.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const OUTPUT_PATH = resolve(PROJECT_ROOT, 'src/data/schema-cache.json');
const ENV_PATH = resolve(PROJECT_ROOT, '.env');

const CONCURRENCY_LIMIT = 10;

// ---------------------------------------------------------------------------
// GraphQL queries (mirrored from src/lib/graphql/introspection.ts)
// ---------------------------------------------------------------------------

const DISCOVER_TYPES_QUERY = `
  query DiscoverTypes {
    __schema {
      types {
        name
        kind
        description
      }
    }
  }
`;

const TYPE_INTROSPECTION_QUERY = `
  query IntrospectType($typename: String!) {
    __type(name: $typename) {
      name
      kind
      description
      fields {
        name
        description
        type {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
              }
            }
          }
        }
      }
      interfaces {
        name
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Environment helpers
// ---------------------------------------------------------------------------

function loadEnv() {
  let url = process.env.VITE_NAUTOBOT_URL;
  let token = process.env.VITE_NAUTOBOT_API_TOKEN;

  // Fallback: parse .env file if env vars are not set
  if ((!url || !token) && existsSync(ENV_PATH)) {
    const envContent = readFileSync(ENV_PATH, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      if (key === 'VITE_NAUTOBOT_URL' && !url) url = value;
      if (key === 'VITE_NAUTOBOT_API_TOKEN' && !token) token = value;
    }
  }

  if (!url || !token) {
    console.error(
      'Missing required environment variables: VITE_NAUTOBOT_URL and VITE_NAUTOBOT_API_TOKEN.\n' +
      'Set them in the environment or in a .env file at the project root.'
    );
    process.exit(1);
  }

  // Normalise URL
  const normalizedUrl = url.endsWith('/') ? url : `${url}/`;
  return { url: `${normalizedUrl}api/graphql/`, token };
}

// ---------------------------------------------------------------------------
// GraphQL client
// ---------------------------------------------------------------------------

async function graphqlQuery(endpoint, token, query, variables = {}) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  if (json.errors) {
    throw new Error(`GraphQL errors: ${json.errors.map(e => e.message).join(', ')}`);
  }
  return json.data;
}

// ---------------------------------------------------------------------------
// Batched type introspection with concurrency limit
// ---------------------------------------------------------------------------

async function fetchTypesInBatches(endpoint, token, typeNames) {
  const results = {};
  let i = 0;

  while (i < typeNames.length) {
    const batch = typeNames.slice(i, i + CONCURRENCY_LIMIT);
    const promises = batch.map(async (typename) => {
      const data = await graphqlQuery(endpoint, token, TYPE_INTROSPECTION_QUERY, { typename });
      return { typename, type: data.__type };
    });

    const settled = await Promise.allSettled(promises);
    for (const result of settled) {
      if (result.status === 'fulfilled' && result.value.type) {
        results[result.value.typename] = result.value.type;
      } else if (result.status === 'rejected') {
        console.warn(`  Warning: failed to fetch type - ${result.reason.message}`);
      }
    }

    i += CONCURRENCY_LIMIT;
    if (i < typeNames.length) {
      console.log(`  Fetched ${Math.min(i, typeNames.length)}/${typeNames.length} types...`);
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('Prefetch: loading environment...');
  const { url, token } = loadEnv();
  console.log(`Prefetch: using endpoint ${url}`);

  // Step 1: Discover all OBJECT types
  console.log('Prefetch: discovering types...');
  const schemaData = await graphqlQuery(url, token, DISCOVER_TYPES_QUERY);
  const objectTypes = schemaData.__schema.types
    .filter(t => t.kind === 'OBJECT' && !t.name.startsWith('__'))
    .map(t => t.name);

  console.log(`Prefetch: found ${objectTypes.length} object types`);

  // Step 2: Introspect each type
  console.log('Prefetch: fetching type details...');
  const types = await fetchTypesInBatches(url, token, objectTypes);

  const fetched = Object.keys(types).length;
  console.log(`Prefetch: successfully fetched ${fetched}/${objectTypes.length} types`);

  // Step 3: Write output
  const output = {
    discoveredTypes: objectTypes,
    types,
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n');
  console.log(`Prefetch: wrote cache to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('Prefetch failed:', err.message);
  process.exit(1);
});
