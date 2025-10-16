import { useState, useMemo } from 'react';
import {
  Box,
  Autocomplete,
  TextField,
  Slider,
  Chip,
  Divider,
  IconButton,
  Collapse,
  Typography,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { TypeInfo } from '../../lib/graph/typeUtils';
import { APP_ORDER } from '../../constants/defaults';

// Nautobot app categories for UI organization
type NautobotApp = 'DCIM' | 'IPAM' | 'CIRCUITS';

// Categorize types by Nautobot app for visual organization
function categorizeType(typename: string): NautobotApp {
  const lower = typename.toLowerCase();

  if (
    lower.includes('ipaddress') ||
    lower.includes('prefix') ||
    lower.includes('vlan') ||
    lower.includes('vrf') ||
    lower.includes('namespace')
  ) {
    return 'IPAM';
  }

  if (
    lower.includes('circuit') ||
    lower.includes('provider')
  ) {
    return 'CIRCUITS';
  }

  return 'DCIM';
}

interface GraphControlsPanelProps {
  // Root type selection - types that can be selected as graph starting points
  rootTypeInfos: TypeInfo[];
  selectedRootTypes: string[];
  onRootTypeSelect: (types: string[]) => void;

  // Depth control
  depth: number;
  onDepthChange: (depth: number) => void;

  // Type filtering - additional types to include during graph traversal
  filterTypes: string[];
  discoveredTypeInfos: TypeInfo[];
  onAddFilterType: (typename: string) => void;
  onRemoveFilterType: (typename: string) => void;

  // FK filtering - show only FK edges
  showFKOnly: boolean;
  onToggleFKOnly: (enabled: boolean) => void;
}

const APP_COLORS: Record<NautobotApp, string> = {
  DCIM: '#1976d2',
  IPAM: '#2e7d32',
  CIRCUITS: '#ed6c02',
};

export function GraphControlsPanel({
  rootTypeInfos,
  selectedRootTypes,
  onRootTypeSelect,
  depth,
  onDepthChange,
  filterTypes,
  discoveredTypeInfos,
  onAddFilterType,
  onRemoveFilterType,
  showFKOnly,
  onToggleFKOnly,
}: GraphControlsPanelProps): JSX.Element {
  const [filterExpanded, setFilterExpanded] = useState(false);

  // Create maps for quick lookup of display names
  const typenameToDisplayName = useMemo(() => {
    const map = new Map<string, string>();
    discoveredTypeInfos.forEach(info => {
      map.set(info.typename, info.displayName);
    });
    return map;
  }, [discoveredTypeInfos]);

  // Memoized sorted list to prevent sorting on every render
  const sortedTypeInfos = useMemo(() => {
    return [...discoveredTypeInfos].sort((a, b) => {
      const appA = categorizeType(a.typename);
      const appB = categorizeType(b.typename);
      if (appA !== appB) {
        return APP_ORDER[appA] - APP_ORDER[appB];
      }
      return a.displayName.localeCompare(b.displayName);
    });
  }, [discoveredTypeInfos]);

  // Organize filter types by app with display names
  const typesByApp = useMemo(() => {
    const organized: Record<NautobotApp, Array<{ typename: string; displayName: string }>> = {
      DCIM: [],
      IPAM: [],
      CIRCUITS: [],
    };

    filterTypes.forEach(typename => {
      const app = categorizeType(typename);
      const displayName = typenameToDisplayName.get(typename) || typename;
      organized[app].push({ typename, displayName });
    });

    return organized;
  }, [filterTypes, typenameToDisplayName]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Main Controls - Always Visible */}
      <Box sx={{ pb: 1.5 }}>
        {/* Root Type - Starting point for graph visualization */}
        <Autocomplete
          size="small"
          options={rootTypeInfos}
          getOptionLabel={(option) => option.displayName}
          value={rootTypeInfos.find(info => selectedRootTypes.includes(info.typename)) || null}
          onChange={(_, newValue) => onRootTypeSelect(newValue ? [newValue.typename] : [])}
          disabled={rootTypeInfos.length === 0}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Root Type"
              placeholder="Select type..."
              size="small"
            />
          )}
          sx={{ mb: 2 }}
        />

        {/* Depth Slider */}
        <Box sx={{ px: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              Depth
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main' }}>
              {depth}
            </Typography>
          </Box>
          <Slider
            value={depth}
            onChange={(_, value) => onDepthChange(value as number)}
            min={1}
            max={7}
            step={1}
            marks
            size="small"
            sx={{
              '& .MuiSlider-mark': {
                height: 4,
                width: 1,
              },
            }}
          />
        </Box>

        {/* FK Filter Toggle */}
        <Box sx={{ px: 1, pt: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={showFKOnly}
                onChange={(e) => onToggleFKOnly(e.target.checked)}
                size="small"
                color="primary"
              />
            }
            label={
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                Show FK edges only
              </Typography>
            }
            sx={{ m: 0 }}
          />
        </Box>
      </Box>

      {/* Type Filter Section - Collapsible */}
      {discoveredTypeInfos.length > 0 && (
        <>
          <Divider />
          <Box>
            {/* Filter Header */}
            <Box
              onClick={() => setFilterExpanded(!filterExpanded)}
              sx={{
                px: 2,
                py: 1.5,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Type Filter ({filterTypes.length})
              </Typography>
              <IconButton size="small">
                {filterExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
            </Box>

            {/* Filter Content */}
            <Collapse in={filterExpanded}>
              <Box sx={{ px: 2, pb: 2, maxHeight: '50vh', overflow: 'auto' }}>
                {/* Add Types Autocomplete */}
                <Autocomplete
                  size="small"
                  options={sortedTypeInfos}
                  getOptionLabel={(option) => option.displayName}
                  value={null}
                  onChange={(_, value) => value && onAddFilterType(value.typename)}
                  groupBy={(option) => categorizeType(option.typename)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Add type..."
                      size="small"
                    />
                  )}
                  renderOption={(props, option) => {
                    const app = categorizeType(option.typename);
                    const isSelected = filterTypes.includes(option.typename);

                    return (
                      <Box
                        component="li"
                        {...props}
                        key={option.typename}
                        sx={{
                          fontSize: '0.875rem',
                          py: 0.5,
                          backgroundColor: isSelected ? 'action.selected' : 'transparent',
                        }}
                      >
                        <Chip
                          label={app}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            backgroundColor: APP_COLORS[app],
                            color: 'white',
                            mr: 1,
                            minWidth: 60,
                          }}
                        />
                        {option.displayName}
                      </Box>
                    );
                  }}
                  sx={{ mb: 2 }}
                />

                {/* Selected Types by Category */}
                {(['DCIM', 'IPAM', 'CIRCUITS'] as NautobotApp[]).map((app) => {
                  const types = typesByApp[app];
                  if (types.length === 0) return null;

                  return (
                    <Box key={app} sx={{ mb: 1.5 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: APP_COLORS[app],
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          fontSize: '0.7rem',
                          letterSpacing: 0.5,
                        }}
                      >
                        {app} ({types.length})
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {types.map((typeInfo) => (
                          <Chip
                            key={typeInfo.typename}
                            label={typeInfo.displayName}
                            onDelete={() => onRemoveFilterType(typeInfo.typename)}
                            deleteIcon={<CloseIcon />}
                            size="small"
                            sx={{
                              height: 24,
                              fontSize: '0.75rem',
                              backgroundColor: APP_COLORS[app],
                              color: 'white',
                              '& .MuiChip-deleteIcon': {
                                color: 'rgba(255, 255, 255, 0.7)',
                                fontSize: '1rem',
                                '&:hover': {
                                  color: 'white',
                                },
                              },
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Collapse>
          </Box>
        </>
      )}
    </Box>
  );
}
