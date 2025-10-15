import React, { useState, useEffect, useMemo, useRef } from 'react';

interface StyledDatalistInputProps {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  suggestions: string[];
  required?: boolean;
}

const StyledDatalistInput: React.FC<StyledDatalistInputProps> = ({ name, value, onChange, placeholder, suggestions, required }) => {
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredSuggestions = useMemo(() => {
    if (!value) return suggestions; // Show all suggestions if input is empty
    const lowercasedValue = value.toLowerCase();
    return suggestions.filter(s => 
        s.toLowerCase().includes(lowercasedValue)
    );
  }, [value, suggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsDropdownVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [wrapperRef]);

  const handleSuggestionClick = (suggestion: string) => {
    const event = {
      target: { name, value: suggestion }
    } as React.ChangeEvent<HTMLInputElement>;
    onChange(event);
    setIsDropdownVisible(false);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);
    setIsDropdownVisible(true);
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        type="text"
        name={name}
        value={value}
        onChange={handleInputChange}
        onFocus={() => setIsDropdownVisible(true)}
        placeholder={placeholder}
        required={required}
        className="bg-slate-700 p-2 rounded-md w-full border-transparent focus:outline-none focus:ring-2 focus:ring-brand-accent"
        autoComplete="off"
      />
      {isDropdownVisible && filteredSuggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-brand-secondary border border-slate-600 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
          {filteredSuggestions.slice(0, 10).map(suggestion => ( // Limit to 10 suggestions for performance
            <li
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-3 py-2 text-sm text-brand-text hover:bg-brand-accent/20 cursor-pointer"
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default StyledDatalistInput;