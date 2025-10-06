import {
  Box,
  Paper,
  Typography,
  Chip,
  Divider,
  Stack,
  Card,
  CardContent,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { TypeAutocomplete } from './TypeAutocomplete';
import { categorizeType, NautobotApp } from '../../lib/graph/appTypeFilter';

/**
 * Props for the simplified filtering panel component
 * @property additionalTypes - List of additional types selected by user
 * @property availableTypes - All available types from schema discovery
 * @property onAddType - Callback when a type is added via autocomplete
 * @property onRemoveType - Callback when an additional type is removed
 * @property typeFilter - Filter function to check if a type is currently being filtered
 */
export interface AppFilterPanelProps {
  additionalTypes: string[];
  availableTypes: string[];
  onAddType: (typename: string) => void;
  onRemoveType: (typename: string) => void;
  typeFilter?: (typename: string) => boolean;
}

/**
 * App color scheme for borders and headers
 */
const APP_COLORS: Record<NautobotApp, string> = {
  DCIM: '#1976d2',
  IPAM: '#2e7d32',
  CIRCUITS: '#ed6c02',
};

/**
 * Paler chip colors for AppFilterPanel
 */
const APP_CHIP_COLORS: Record<NautobotApp, string> = {
  DCIM: '#64b5f6',      // Lighter blue
  IPAM: '#66bb6a',      // Lighter green
  CIRCUITS: '#ff9800',  // Lighter orange
};

export function AppFilterPanel({
  additionalTypes,
  availableTypes,
  onAddType,
  onRemoveType,
  typeFilter,
}: AppFilterPanelProps): JSX.Element {

  // Organize selected types by app
  const typesByApp: Record<NautobotApp, string[]> = {
    DCIM: [],
    IPAM: [],
    CIRCUITS: [],
  };

  additionalTypes.forEach(typename => {
    const app = categorizeType(typename);
    typesByApp[app].push(typename);
  });

  // Sort types within each app alphabetically
  (['DCIM', 'IPAM', 'CIRCUITS'] as NautobotApp[]).forEach(app => {
    typesByApp[app].sort((a, b) => a.localeCompare(b));
  });

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Type Filter
      </Typography>

      {/* Selected Types organized by App */}
      {additionalTypes.length > 0 && (
        <>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Currently Selected Types
          </Typography>
          <Stack spacing={2} sx={{ mb: 3 }}>
            {(['DCIM', 'IPAM', 'CIRCUITS'] as NautobotApp[]).map((app) => {
              const typesInApp = typesByApp[app];
              if (typesInApp.length === 0) return null;

              return (
                <Card key={app} variant="outlined" sx={{ borderLeft: `4px solid ${APP_COLORS[app]}` }}>
                  <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color: APP_COLORS[app],
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'block',
                        mb: 1
                      }}
                    >
                      {app} ({typesInApp.length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                      {typesInApp.map((typename) => (
                        <Chip
                          key={typename}
                          label={typename}
                          onDelete={() => onRemoveType(typename)}
                          deleteIcon={<CloseIcon />}
                          size="small"
                          sx={{
                            backgroundColor: APP_CHIP_COLORS[app],
                            color: 'white',
                            fontWeight: 'bold',
                            px: 0.5,
                            height: '28px',
                            '& .MuiChip-label': {
                              px: 1.5,
                            },
                            '& .MuiChip-deleteIcon': {
                              color: 'white',
                              marginRight: '4px',
                              '&:hover': {
                                color: 'white',
                                opacity: 0.8,
                              }
                            }
                          }}
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
          <Divider sx={{ my: 3 }} />
        </>
      )}

      {/* Autocomplete for adding types */}
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 1.5 }}>
        Add Types
      </Typography>
      <TypeAutocomplete
        availableTypes={availableTypes}
        selectedTypes={additionalTypes}
        onTypeSelect={onAddType}
        typeFilter={typeFilter}
      />
    </Paper>
  );
}
