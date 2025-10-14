import { useMemo, useState } from 'react';
import {
  Box,
  Autocomplete,
  TextField,
  Slider,
  Chip,
  Divider,
  IconButton,
  Collapse,
  Paper,
  Typography,
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';

interface GraphControlsPanelProps {
  rootTypes: string[];
  selectedRootType: string | null;
  onRootTypeSelect: (type: string | null) => void;
  depth: number;
  onDepthChange: (depth: number) => void;
  availableFilterTypes: string[];
  selectedFilterTypes: string[];
  onFilterChange: (types: string[]) => void;
}

export function GraphControlsPanel({
  rootTypes,
  selectedRootType,
  onRootTypeSelect,
  depth,
  onDepthChange,
  availableFilterTypes,
  selectedFilterTypes,
  onFilterChange,
}: GraphControlsPanelProps): JSX.Element {
  const [filterExpanded, setFilterExpanded] = useState(false);

  const sortedRootTypes = useMemo(
    () => [...rootTypes].sort((a, b) => a.localeCompare(b)),
    [rootTypes]
  );

  const sortedFilterOptions = useMemo(
    () => [...availableFilterTypes].sort((a, b) => a.localeCompare(b)),
    [availableFilterTypes]
  );

  const handleFilterRemove = (typename: string) => {
    onFilterChange(selectedFilterTypes.filter(type => type !== typename));
  };

  return (
    <Paper
      elevation={4}
      sx={{
        width: 360,
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'rgba(255, 255, 255, 0.97)',
        backdropFilter: 'blur(12px)',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Main Controls - Always Visible */}
      <Box sx={{ p: 2, pb: 1.5 }}>
        {/* Root Type - Starting point for graph visualization */}
        <Autocomplete
          size="small"
          options={sortedRootTypes}
          value={selectedRootType}
          onChange={(_, value) => onRootTypeSelect(value)}
          disabled={sortedRootTypes.length === 0}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Root Type"
              placeholder={sortedRootTypes.length > 0 ? 'Select a root type...' : 'Loading root types...'}
              size="small"
              helperText={sortedRootTypes.length > 0 ? `${sortedRootTypes.length} available` : undefined}
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
      </Box>

      {/* Type Filter Section - Collapsible */}
      {sortedFilterOptions.length > 0 && (
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
                Type Filter ({selectedFilterTypes.length})
              </Typography>
              <IconButton size="small">
                {filterExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
            </Box>

            {/* Filter Content */}
            <Collapse in={filterExpanded}>
              <Box sx={{ px: 2, pb: 2, maxHeight: '50vh', overflow: 'auto' }}>
                {/* Add/Remove Types Autocomplete */}
                <Autocomplete
                  size="small"
                  multiple
                  disableCloseOnSelect
                  options={sortedFilterOptions}
                  value={selectedFilterTypes}
                  onChange={(_, value) => onFilterChange(value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Filter Types"
                      placeholder="Select filter types..."
                      size="small"
                      helperText={`${selectedFilterTypes.length} selected`}
                    />
                  )}
                  sx={{ mb: 2 }}
                />

                {selectedFilterTypes.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selectedFilterTypes.map(typename => (
                      <Chip
                        key={typename}
                        label={typename}
                        onDelete={() => handleFilterRemove(typename)}
                        deleteIcon={<CloseIcon />}
                        size="small"
                        sx={{ height: 24, fontSize: '0.75rem' }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            </Collapse>
          </Box>
        </>
      )}
    </Paper>
  );
}
