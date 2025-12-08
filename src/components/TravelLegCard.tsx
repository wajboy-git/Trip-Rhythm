import { Plane, Train, Car, Bus, ArrowRight } from 'lucide-react';
import type { TravelLeg, TravelMode } from '../types';
import { formatDuration } from '../lib/travel';

interface TravelLegCardProps {
  leg: TravelLeg;
}

const modeIcons: Record<TravelMode, typeof Plane> = {
  flight: Plane,
  train: Train,
  car: Car,
  bus: Bus,
};

const modeColors: Record<TravelMode, string> = {
  flight: 'bg-sky-100 text-sky-700 border-sky-300',
  train: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  car: 'bg-amber-100 text-amber-700 border-amber-300',
  bus: 'bg-orange-100 text-orange-700 border-orange-300',
};

const modeLabels: Record<TravelMode, string> = {
  flight: 'Flight',
  train: 'Train',
  car: 'Car',
  bus: 'Bus',
};

export function TravelLegCard({ leg }: TravelLegCardProps) {
  const recommendedOption = leg.options.find((opt) => opt.isRecommended);
  const Icon = recommendedOption ? modeIcons[recommendedOption.mode] : ArrowRight;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="text-gray-900 font-semibold">{leg.fromCity.name}</div>
          <ArrowRight className="w-5 h-5 text-gray-400" />
          <div className="text-gray-900 font-semibold">{leg.toCity.name}</div>
        </div>
        <div className="text-sm text-gray-600 font-medium">
          {leg.distance} km
        </div>
      </div>

      <div className="space-y-2">
        {leg.options.map((option) => {
          const ModeIcon = modeIcons[option.mode];
          const colorClass = modeColors[option.mode];

          return (
            <div
              key={option.mode}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                option.isRecommended
                  ? `${colorClass} border-2`
                  : 'bg-gray-50 text-gray-700 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <ModeIcon className="w-5 h-5" />
                <div className="flex items-center gap-2">
                  <span className="font-medium">{modeLabels[option.mode]}</span>
                  {option.isRecommended && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white bg-opacity-50 font-semibold">
                      Recommended
                    </span>
                  )}
                </div>
              </div>
              <div className="text-sm font-semibold">
                {formatDuration(option.duration)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
