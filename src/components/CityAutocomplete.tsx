import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { searchCities, formatCityDisplay, type CityLocation } from '../lib/geocoding';

interface CityAutocompleteProps {
  value: string;
  onChange: (city: string, location: CityLocation | null) => void;
  placeholder?: string;
  required?: boolean;
}

export function CityAutocomplete({ value, onChange, placeholder, required }: CityAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<CityLocation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSelectedIndex(-1);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!newValue.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      onChange('', null);
      return;
    }

    onChange(newValue, null);

    timeoutRef.current = setTimeout(async () => {
      if (newValue.trim().length >= 2) {
        setIsLoading(true);
        try {
          const results = await searchCities(newValue);
          setSuggestions(results);
          setIsOpen(results.length > 0);
        } catch (error) {
          console.error('Failed to fetch cities:', error);
          setSuggestions([]);
          setIsOpen(false);
        } finally {
          setIsLoading(false);
        }
      }
    }, 300);
  };

  const handleSelectCity = (location: CityLocation) => {
    const displayText = formatCityDisplay(location);
    setInputValue(displayText);
    onChange(displayText, location);
    setSuggestions([]);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectCity(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        />
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((location, index) => (
            <button
              key={`${location.latitude}-${location.longitude}`}
              type="button"
              onClick={() => handleSelectCity(location)}
              className={`w-full px-4 py-3 text-left hover:bg-sky-50 transition-colors flex items-start gap-3 ${
                index === selectedIndex ? 'bg-sky-50' : ''
              } ${index !== 0 ? 'border-t border-gray-100' : ''}`}
            >
              <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{location.name}</div>
                <div className="text-sm text-gray-600 truncate">
                  {location.admin1 && `${location.admin1}, `}
                  {location.country}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && !isLoading && suggestions.length === 0 && inputValue.trim().length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm">
          No cities found. Try a different search term.
        </div>
      )}
    </div>
  );
}
