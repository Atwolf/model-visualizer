import { useState } from 'react';
import { Button, Box, Typography, Paper, Alert } from '@mui/material';
import { executeGraphQLQuery } from '../lib/graphql/client';

export const GraphQLTest = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const testSchemaQuery = async () => {
    setLoading(true);
    setError('');
    setResult('');

    try {
      const response = await executeGraphQLQuery(`
        query {
          __schema {
            queryType {
              name
            }
          }
        }
      `);

      if (response.errors) {
        setError(JSON.stringify(response.errors, null, 2));
      } else {
        setResult(JSON.stringify(response.data, null, 2));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        GraphQL Client Test
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          onClick={testSchemaQuery}
          disabled={loading}
        >
          {loading ? 'Testing...' : 'Test Schema Query'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
            {error}
          </Typography>
        </Alert>
      )}

      {result && (
        <Alert severity="success">
          <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
            {result}
          </Typography>
        </Alert>
      )}
    </Paper>
  );
};
