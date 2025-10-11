interface GraphQLClientConfig {
  url: string;
  apiToken: string;
}

interface GraphQLRequest {
  query: string;
  variables?: Record<string, any>;
}

interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

/**
 * Nautobot ContentType from /extras/content-types/ API
 */
export interface ContentType {
  id: number;
  object_type: string;
  display: string;
  url: string;
  natural_slug: string;
  app_label: string;
  model: string;
}

/**
 * Response structure from /extras/content-types/ API
 */
interface ContentTypesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ContentType[];
}

/**
 * Builds GraphQL endpoint URL from base Nautobot URL
 * Ensures proper URL formatting with trailing slashes
 * In development, uses Vite proxy to avoid CORS issues
 *
 * @param baseUrl - Base Nautobot URL from environment
 * @returns Full GraphQL endpoint URL
 */
function buildApiEndpoint(baseUrl: string): string {
  // In development, use the Vite proxy
  if (import.meta.env.DEV) {
    return '/api/';
  }

  // In production, use the full URL
  const normalizedUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${normalizedUrl}api/`;
}

/**
 * Creates GraphQL client configuration from environment variables
 * Validates required environment variables are present
 *
 * @throws Error if required environment variables are missing
 * @returns GraphQL client configuration
 */
function createClientConfig(): GraphQLClientConfig {
  const url = import.meta.env.VITE_NAUTOBOT_URL;
  const apiToken = import.meta.env.VITE_NAUTOBOT_API_TOKEN;

  if (!url) {
    throw new Error('VITE_NAUTOBOT_URL is required. Please set it in your .env file.');
  }

  if (!apiToken) {
    throw new Error('VITE_NAUTOBOT_API_TOKEN is required. Please set it in your .env file.');
  }

  return {
    url: buildApiEndpoint(url),
    apiToken,
  };
}

/**
 * Executes a GraphQL query against Nautobot API
 * Handles authentication via API token in headers
 *
 * @param query - GraphQL query string
 * @param variables - Optional query variables
 * @returns GraphQL response with data or errors
 * @throws Error if network request fails
 */
export async function executeGraphQLQuery<T = any>(
  query: string,
  variables?: Record<string, any>
): Promise<GraphQLResponse<T>> {
  const config = createClientConfig();

  const request: GraphQLRequest = {
    query,
    variables: variables || {},
  };

  try {
    const response = await fetch(config.url + 'graphql/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${config.apiToken}`,
      },
      body: JSON.stringify(request),
    });

    // Handle HTTP errors
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
      }
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }

    const result: GraphQLResponse<T> = await response.json();

    // Log errors if present
    if (result.errors) {
      console.error('GraphQL error:', { errors: result.errors });
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      console.error('GraphQL request failed:', { error: error.message });
      throw error;
    }
    throw new Error('Unknown error occurred during GraphQL request');
  }
}

/**
 * Fetches all content types from Nautobot /extras/content-types/ API
 * This is a REST API endpoint, not GraphQL
 *
 * Content types represent the Django models available in Nautobot.
 * Used to identify which GraphQL types correspond to primary models.
 *
 * @returns Array of all content types with pagination handling
 * @throws Error if network request fails or authentication fails
 */
export async function executeContentTypesQuery(): Promise<ContentType[]> {
  const config = createClientConfig();
  const allContentTypes: ContentType[] = [];
  let nextUrl: string | null = config.url + 'extras/content-types/?limit=1000';

  try {
    // Handle pagination - fetch all pages
    while (nextUrl) {
      const response = await fetch(nextUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${config.apiToken}`,
        },
      });

      // Handle HTTP errors
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
        }
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }

      const result: ContentTypesResponse = await response.json();
      allContentTypes.push(...result.results);

      // Update nextUrl for pagination
      nextUrl = result.next;

      console.log('Content types fetched:', {
        currentBatch: result.results.length,
        totalSoFar: allContentTypes.length,
        hasMore: !!result.next,
      });
    }

    console.log('All content types loaded:', {
      total: allContentTypes.length,
      sampleTypes: allContentTypes.slice(0, 5).map(ct => `${ct.app_label}.${ct.model}`),
    });

    return allContentTypes;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Content types request failed:', { error: error.message });
      throw error;
    }
    throw new Error('Unknown error occurred during content types request');
  }
}
