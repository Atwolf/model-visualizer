import { useState } from 'react';
import { Button, Box, Typography, Paper, Alert } from '@mui/material';
import { executeGraphQLQuery } from '../lib/graphql/client';
import { introspectType, isRelationshipField, unwrapType } from '../lib/graphql/introspection';
import { getErrorMessage } from '../lib/utils/errors';

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
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const testTypeIntrospection = async () => {
    setLoading(true);
    setError('');
    setResult('');

    try {
      // Test introspecting DeviceType
      const typeData = await introspectType('DeviceType');

      // Analyze the type
      const relationshipFields = typeData.fields?.filter(isRelationshipField) || [];
      const scalarFields = typeData.fields?.filter(f => !isRelationshipField(f)) || [];

      // Test unwrapping a field type
      const sampleField = typeData.fields?.[0];
      const unwrapped = sampleField ? unwrapType(sampleField.type) : null;

      const analysis = {
        type: {
          name: typeData.name,
          kind: typeData.kind,
          totalFields: typeData.fields?.length || 0,
        },
        fieldBreakdown: {
          relationships: relationshipFields.length,
          scalars: scalarFields.length,
        },
        sampleRelationships: relationshipFields.slice(0, 5).map(f => ({
          name: f.name,
          type: unwrapType(f.type).name,
        })),
        sampleUnwrap: unwrapped ? {
          fieldName: sampleField?.name,
          unwrapped,
        } : null,
      };

      setResult(JSON.stringify(analysis, null, 2));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        GraphQL Client Test
      </Typography>

      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          onClick={testSchemaQuery}
          disabled={loading}
        >
          {loading ? 'Testing...' : 'Test Schema Query'}
        </Button>

        <Button
          variant="contained"
          color="secondary"
          onClick={testTypeIntrospection}
          disabled={loading}
        >
          {loading ? 'Testing...' : 'Test Type Introspection'}
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
