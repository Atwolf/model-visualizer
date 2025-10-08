import React, { useState } from 'react';
import { Autocomplete, TextField, Box, Chip } from '@mui/material';
import { Star as StarIcon } from '@mui/icons-material';
import { categorizeType, NautobotApp, APP_CORE_TYPES } from '../../lib/graph/appTypeFilter';

/**
 * Color mapping for Nautobot app chips
 */
const APP_COLORS: Record<NautobotApp, string> = {
  DCIM: '#1976d2',      // Blue
  IPAM: '#2e7d32',      // Green
  CIRCUITS: '#ed6c02',  // Orange
};

/**
 * Check if a type is a core/default type for any app
 */
function isCoreType(typename: string): boolean {
  return Object.values(APP_CORE_TYPES).some(types => types.includes(typename));
}

/**
 * Props for the type autocomplete search component
 * @property availableTypes - All types available for selection
 * @property selectedTypes - Types already selected (to filter out from options)
 * @property onTypeSelect - Callback when a type is selected from autocomplete
 * @property typeFilter - Filter function to check if a type is currently being filtered
 */
export interface TypeAutocompleteProps {
  availableTypes: string[];
  selectedTypes: string[];
  onTypeSelect: (typename: string) => void;
  typeFilter?: (typename: string) => boolean;
}

export function TypeAutocomplete({
  availableTypes,
  selectedTypes,
  onTypeSelect,
  typeFilter,
}: TypeAutocompleteProps): JSX.Element {
  const [inputValue, setInputValue] = useState('');

  // Sort by: App → Filter Status → Is Default → Alphabetically (keep all types, including selected)
  const options = availableTypes
    .sort((a, b) => {
      const appA = categorizeType(a);
      const appB = categorizeType(b);

      // 1. First sort by app category
      if (appA !== appB) {
        const appOrder = { DCIM: 0, IPAM: 1, CIRCUITS: 2 };
        return appOrder[appA] - appOrder[appB];
      }

      // 2. Within same app, sort by filter status (filtered types first)
      if (typeFilter) {
        const isFilteredA = typeFilter(a);
        const isFilteredB = typeFilter(b);
        if (isFilteredA !== isFilteredB) {
          return isFilteredB ? 1 : -1; // Filtered (true) comes first
        }
      }

      // 3. Within same filter status, sort by default/core status (core types first)
      const isCoreA = isCoreType(a);
      const isCoreB = isCoreType(b);
      if (isCoreA !== isCoreB) {
        return isCoreB ? 1 : -1; // Core types come first
      }

      // 4. Finally, sort alphabetically
      return a.localeCompare(b);
    });

  const handleSelect = (
    _event: React.SyntheticEvent,
    value: string | null
  ) => {
    if (value) {
      onTypeSelect(value);
      setInputValue('');
    }
  };

  return (
    <Autocomplete
      options={options}
      value={null}
      inputValue={inputValue}
      onInputChange={(_event, newValue) => setInputValue(newValue)}
      onChange={handleSelect}
      groupBy={(option) => categorizeType(option)}
      renderOption={(props, option) => {
        const app = categorizeType(option);
        const color = APP_COLORS[app];
        const isFiltered = typeFilter ? typeFilter(option) : false;
        const isCore = isCoreType(option);
        const isSelected = selectedTypes.includes(option);

        // Determine background color based on state
        let bgColor = 'transparent';
        let hoverBgColor = undefined;

        if (isSelected) {
          // Selected types: pale green
          bgColor = 'rgba(46, 125, 50, 0.08)';
          hoverBgColor = 'rgba(46, 125, 50, 0.12)';
        } else if (!isFiltered) {
          // Not filtered: pale red
          bgColor = 'rgba(211, 47, 47, 0.08)';
          hoverBgColor = 'rgba(211, 47, 47, 0.12)';
        }

        return (
          <Box
            component="li"
            {...props}
            key={option}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              backgroundColor: bgColor,
              '&:hover': {
                backgroundColor: hoverBgColor,
              }
            }}
          >
            {/* App chip */}
            <Chip
              label={app}
              size="small"
              sx={{
                backgroundColor: color,
                color: 'white',
                fontWeight: 'bold',
                minWidth: 80,
              }}
            />

            {/* Type name */}
            <Box sx={{ flex: 1 }}>{option}</Box>

            {/* Status indicators */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {/* Core/default type indicator */}
              {isCore && (
                <StarIcon sx={{ fontSize: 18, color: '#f57c00' }} titleAccess="Default core type" />
              )}
            </Box>
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Search types..."
          placeholder="e.g., TagType"
          size="small"
        />
      )}
      noOptionsText="No types found"
    />
  );
}
