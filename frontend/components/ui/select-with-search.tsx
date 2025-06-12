// frontend\components\ui\select-with-search.tsx
import React, { useState, useEffect } from 'react';

interface Option {
  value: string;
  label: string;
}

interface SelectWithSearchProps {
  options: Option[];
  selectedValues: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export default function SelectWithSearch({
  options,
  selectedValues,
  onChange,
  placeholder = "Selecciona opciones",
}: SelectWithSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<Option[]>(options);

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [searchTerm, options]);

  
  const toggleSelectAll = () => {
    const allSelected = filteredOptions.every(opt => selectedValues.includes(opt.value));
    if (allSelected) {
      
      const newSelection = selectedValues.filter(val => !filteredOptions.some(opt => opt.value === val));
      onChange(newSelection);
    } else {
      
      const newSelection = Array.from(new Set([...selectedValues, ...filteredOptions.map(opt => opt.value)]));
      onChange(newSelection);
    }
  };

  return (
    <div className="select-with-search" style={{ width: '300px', fontFamily: 'Arial, sans-serif' }}>
      <input
        type="text"
        placeholder="Buscar..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '6px 8px',
          marginBottom: '6px',
          borderRadius: '4px',
          border: '1px solid #ccc',
        }}
      />
      <button
        type="button"
        onClick={toggleSelectAll}
        style={{
          marginBottom: '8px',
          padding: '6px 12px',
          borderRadius: '4px',
          border: '1px solid #007bff',
          backgroundColor: '#007bff',
          color: 'white',
          cursor: 'pointer',
          width: '100%',
        }}
      >
        {filteredOptions.every(opt => selectedValues.includes(opt.value))
          ? 'Deseleccionar todo'
          : 'Seleccionar todo'}
      </button>
      <div
        style={{
          maxHeight: '200px',
          overflowY: 'auto',
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '6px',
        }}
      >
        {filteredOptions.length === 0 && <p style={{ color: '#888', fontSize: '14px' }}>No hay opciones</p>}
        {filteredOptions.map(opt => (
          <label key={opt.value} style={{ display: 'block', marginBottom: '4px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              value={opt.value}
              checked={selectedValues.includes(opt.value)}
              onChange={e => {
                const checked = e.target.checked;
                if (checked) {
                  onChange([...selectedValues, opt.value]);
                } else {
                  onChange(selectedValues.filter(val => val !== opt.value));
                }
              }}
              style={{ marginRight: '8px' }}
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  );
}
