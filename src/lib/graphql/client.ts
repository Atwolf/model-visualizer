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
 * Builds GraphQL endpoint URL from base Nautobot URL
 * Ensures proper URL formatting with trailing slashes
 * In development, uses Vite proxy to avoid CORS issues
 *
 * @param baseUrl - Base Nautobot URL from environment
 * @returns Full GraphQL endpoint URL
 */
function buildGraphQLEndpoint(baseUrl: string): string {
  // In development, use the Vite proxy
  if (import.meta.env.DEV) {
    return '/api/graphql/';
  }

  // In production, use the full URL
  const normalizedUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${normalizedUrl}api/graphql/`;
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
    url: buildGraphQLEndpoint(url),
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

  console.log('GraphQL client initialized:', { url: config.url });
  console.log('GraphQL request:', {
    query: query.length > 100 ? query.substring(0, 100) + '...' : query
  });

  const request: GraphQLRequest = {
    query,
    variables: variables || {},
  };

  try {
    const response = await fetch(config.url, {
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

    console.log('GraphQL response:', {
      hasData: !!result.data,
      hasErrors: !!result.errors
    });

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
