import {
  Box,
  Paper,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Chip,
  Divider,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { NautobotApp, APP_CORE_TYPES } from '../../lib/graph/appTypeFilter';
import { TypeAutocomplete } from './TypeAutocomplete';

/**
 * Props for the app-based filtering panel component
 * @property enabledApps - Current state of enabled/disabled apps
 * @property additionalTypes - List of additional types selected by user
 * @property availableTypes - All available types from schema discovery
 * @property onToggleApp - Callback when an app checkbox is toggled
 * @property onAddType - Callback when a type is added via autocomplete
 * @property onRemoveType - Callback when an additional type is removed
 */
export interface AppFilterPanelProps {
  enabledApps: Record<NautobotApp, boolean>;
  additionalTypes: string[];
  availableTypes: string[];
  onToggleApp: (app: NautobotApp) => void;
  onAddType: (typename: string) => void;
  onRemoveType: (typename: string) => void;
}

export function AppFilterPanel({
  enabledApps,
  additionalTypes,
  availableTypes,
  onToggleApp,
  onAddType,
  onRemoveType,
}: AppFilterPanelProps): JSX.Element {

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Filter by App
      </Typography>

      <FormGroup>
        {(['DCIM', 'IPAM', 'CIRCUITS'] as NautobotApp[]).map((app) => {
          const coreTypes = APP_CORE_TYPES[app];
          const label = `${app} (${coreTypes.length} types)`;

          return (
            <FormControlLabel
              key={app}
              control={
                <Checkbox
                  checked={enabledApps[app]}
                  onChange={() => onToggleApp(app)}
                />
              }
              label={label}
            />
          );
        })}
      </FormGroup>

      {additionalTypes.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" gutterBottom>
            Additional Types
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {additionalTypes.map((typename) => (
              <Chip
                key={typename}
                label={typename}
                onDelete={() => onRemoveType(typename)}
                deleteIcon={<CloseIcon />}
                size="small"
              />
            ))}
          </Box>
        </>
      )}

      <TypeAutocomplete
        availableTypes={availableTypes}
        selectedTypes={additionalTypes}
        onTypeSelect={onAddType}
      />
    </Paper>
  );
}
