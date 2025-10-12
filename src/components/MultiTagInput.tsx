import React, { useState, useRef } from 'react';
import Tag from './Tag';

interface MultiTagInputProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  suggestions: string[];
  placeholder: string;
}

const MultiTagInput: React.FC<MultiTagInputProps> = ({ label, values, onChange, suggestions, placeholder }) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const addValue = (valueToAdd: string) => {
    const trimmedValue = valueToAdd.trim();
    if (trimmedValue && !values.includes(trimmedValue)) {
      onChange([...values, trimmedValue]);
    }
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ',' || e.key === 'Enter' || e.key === 'Tab') {
      if (inputValue) {
        e.preventDefault();
        addValue(inputValue);
      }
    }
  };

  const removeValue = (valueToRemove: string) => {
    onChange(values.filter(value => value !== valueToRemove));
  };
  
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasteData = e.clipboardData.getData('text');
      const pastedValues = pasteData.split(/,/).map(v => v.trim()).filter(Boolean);
      const newValues = [...new Set([...values, ...pastedValues])];
      onChange(newValues);
      setInputValue('');
  }

  return (
    <div>
      <label className="block text-xs text-brand-subtle mb-1">{label}</label>
      <div 
        className="flex flex-wrap items-center gap-2 bg-slate-700 p-2 rounded-md w-full border-transparent focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-accent min-h-[42px]"
        onClick={() => inputRef.current?.focus()}
      >
        {values.map(value => (
            <div key={value} className="flex items-center bg-slate-800/50 rounded-full">
                <Tag name={value} />
                <button
                    type="button"
                    onClick={() => removeValue(value)}
                    className="-ml-2 mr-1 text-slate-400 hover:text-white bg-slate-600/50 hover:bg-slate-500/50 rounded-full h-4 w-4 flex items-center justify-center text-xs transition-colors"
                    aria-label={`Remove ${value}`}
                >
                    &times;
                </button>
            </div>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={values.length === 0 ? placeholder : ''}
          className="flex-grow bg-transparent border-none p-0 focus:ring-0 text-sm min-w-[100px]"
          list={`${label}-suggestions`}
        />
        <datalist id={`${label}-suggestions`}>
            {suggestions
              .filter(s => !values.includes(s) && s.toLowerCase().includes(inputValue.toLowerCase()))
              .map(s => <option key={s} value={s} />)
            }
        </datalist>
      </div>
    </div>
  );
};

export default MultiTagInput;
