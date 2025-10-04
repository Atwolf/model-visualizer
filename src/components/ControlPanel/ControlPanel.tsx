import {
  Slider,
  Autocomplete,
  TextField,
  Chip,
  Box,
  Typography,
  Paper
} from '@mui/material';

interface ControlPanelProps {
  depth: number;
  onDepthChange: (depth: number) => void;
  availableTypes: string[];
  selectedTypes: string[];
  onTypeSelect: (types: string[]) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  depth,
  onDepthChange,
  availableTypes,
  selectedTypes,
  onTypeSelect,
}) => {
  function handleDepthChange(newDepth: number) {
    console.log('Depth changed:', { from: depth, to: newDepth });
    onDepthChange(newDepth);
  }

  function handleTypeSelect(types: string[]) {
    console.log('Type selection changed:', {
      added: types.filter(t => !selectedTypes.includes(t)),
      removed: selectedTypes.filter(t => !types.includes(t))
    });

    onTypeSelect(types);
  }

  function handleRemoveType(typeToRemove: string) {
    const updated = selectedTypes.filter(t => t !== typeToRemove);
    onTypeSelect(updated);
  }

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Graph Controls
      </Typography>

      {/* Depth Slider */}
      <Box sx={{ mb: 4 }}>
        <Typography gutterBottom>
          Traversal Depth: {depth}
        </Typography>
        <Slider
          value={depth}
          onChange={(_, value) => handleDepthChange(value as number)}
          min={1}
          max={7}
          step={1}
          marks
          valueLabelDisplay="auto"
        />
      </Box>

      {/* Type Autocomplete */}
      <Box sx={{ mb: 2 }}>
        <Autocomplete
          multiple
          options={availableTypes}
          value={selectedTypes}
          onChange={(_, newValue) => handleTypeSelect(newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select Root Types"
              placeholder="Start typing to search..."
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                label={option}
                {...getTagProps({ index })}
                color="primary"
                sx={{ m: 0.5 }}
                key={option}
              />
            ))
          }
        />
      </Box>

      {/* Selected Types Display */}
      {selectedTypes.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Selected Types ({selectedTypes.length}):
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {selectedTypes.map((type) => (
              <Chip
                key={type}
                label={type}
                onDelete={() => handleRemoveType(type)}
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  );
};
