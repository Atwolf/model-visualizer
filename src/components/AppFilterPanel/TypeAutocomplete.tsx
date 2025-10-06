import React, { useState } from 'react';
import { Autocomplete, TextField } from '@mui/material';

/**
 * Props for the type autocomplete search component
 * @property availableTypes - All types available for selection
 * @property selectedTypes - Types already selected (to filter out from options)
 * @property onTypeSelect - Callback when a type is selected from autocomplete
 */
export interface TypeAutocompleteProps {
  availableTypes: string[];
  selectedTypes: string[];
  onTypeSelect: (typename: string) => void;
}

export function TypeAutocomplete({
  availableTypes,
  selectedTypes,
  onTypeSelect,
}: TypeAutocompleteProps): JSX.Element {
  const [inputValue, setInputValue] = useState('');

  const options = availableTypes.filter(
    (type) => !selectedTypes.includes(type)
  );

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
