import { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, Umbrella, X } from 'lucide-react';
import type { WeatherData } from '../types';
import { suggestAccessoriesForWeather } from '../lib/weather';

interface WeatherSuggestionsCardProps {
  weatherData: WeatherData[];
  onDismiss?: () => void;
}

export function WeatherSuggestionsCard({ weatherData, onDismiss }: WeatherSuggestionsCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const daysWithAccessories = weatherData
    .map((weather, index) => ({
      day: index + 1,
      date: new Date(weather.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      accessories: suggestAccessoriesForWeather(weather),
      precipitation: weather.precipitation_probability,
    }))
    .filter(d => d.accessories.length > 0);

  if (daysWithAccessories.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <Umbrella className="w-5 h-5 text-amber-700" />
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Weather Packing Suggestions</h3>
              <p className="text-sm text-gray-600">
                Based on the forecast, consider bringing these items
              </p>
            </div>
          </div>

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              aria-label="Dismiss suggestions"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="space-y-2">
          {daysWithAccessories.slice(0, isExpanded ? undefined : 3).map((day) => (
            <div
              key={day.day}
              className="bg-white rounded-lg p-3 border border-amber-100"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Day {day.day} ({day.date})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {day.accessories.map((item, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                {day.precipitation > 0 && (
                  <div className="ml-3 flex-shrink-0">
                    <span className="text-xs text-gray-500">{day.precipitation}%</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {daysWithAccessories.length > 3 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 w-full flex items-center justify-center space-x-1 text-sm font-medium text-amber-700 hover:text-amber-800 transition-colors py-2 hover:bg-amber-50 rounded-lg"
          >
            <span>{isExpanded ? 'Show less' : `Show ${daysWithAccessories.length - 3} more days`}</span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      <div className="bg-amber-100/50 px-4 py-3 border-t border-amber-200">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-900">
            These are suggestions based on weather forecasts. Actual conditions may vary.
          </p>
        </div>
      </div>
    </div>
  );
}
