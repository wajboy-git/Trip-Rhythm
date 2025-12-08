import { X, Check, Battery, Clock } from 'lucide-react';
import type { AdjustmentComparison, DayPlan, EffortLevel, AdjustmentMode } from '../types';

interface ComparisonModalProps {
  comparison: AdjustmentComparison;
  onAccept: () => void;
  onCancel: () => void;
}

export function ComparisonModal({
  comparison,
  onAccept,
  onCancel,
}: ComparisonModalProps) {
  const { originalDays, adjustedDays, startDayIndex, mode } = comparison;

  const getModeLabel = (mode: AdjustmentMode) => {
    switch (mode) {
      case 'reduce-fatigue':
        return 'Less Tiring';
      case 'increase-energy':
        return 'More Active';
      case 'bring-it-on':
        return 'Maximum Intensity';
    }
  };

  const getModeColor = (mode: AdjustmentMode) => {
    switch (mode) {
      case 'reduce-fatigue':
        return 'bg-green-100 text-green-800';
      case 'increase-energy':
        return 'bg-blue-100 text-blue-800';
      case 'bring-it-on':
        return 'bg-orange-100 text-orange-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Itinerary Adjustment Comparison
            </h2>
            <p className="text-sm text-gray-600">
              Reviewing {adjustedDays.length} {adjustedDays.length === 1 ? 'day' : 'days'} starting from Day {startDayIndex}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="mb-6 flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">Adjustment Mode:</span>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getModeColor(mode)}`}>
              {getModeLabel(mode)}
            </span>
          </div>

          <div className="space-y-8">
            {originalDays.map((originalDay, idx) => (
              <div key={idx} className="border-b border-gray-200 pb-8 last:border-b-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Day {startDayIndex + idx}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="mb-3">
                      <span className="inline-block px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                        Original
                      </span>
                    </div>
                    <DayComparison day={originalDay} />
                  </div>

                  <div>
                    <div className="mb-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getModeColor(mode)}`}>
                        Adjusted
                      </span>
                    </div>
                    <DayComparison day={adjustedDays[idx]} highlight mode={mode} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium text-gray-700"
          >
            Keep Original
          </button>
          <button
            onClick={onAccept}
            className="flex-1 flex items-center justify-center gap-2 bg-sky-600 text-white px-6 py-3 rounded-lg hover:bg-sky-700 transition-colors shadow-md hover:shadow-lg font-medium"
          >
            <Check className="w-5 h-5" />
            Accept Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function DayComparison({ day, highlight, mode }: { day: DayPlan; highlight?: boolean; mode?: AdjustmentMode }) {
  const getBorderColor = () => {
    if (!highlight) return 'border-gray-200 bg-white';
    if (mode === 'reduce-fatigue') return 'border-green-300 bg-green-50';
    if (mode === 'increase-energy') return 'border-blue-300 bg-blue-50';
    if (mode === 'bring-it-on') return 'border-orange-300 bg-orange-50';
    return 'border-sky-300 bg-sky-50';
  };

  return (
    <div className={`rounded-lg border-2 p-4 ${getBorderColor()}`}>
      <p className="text-gray-700 mb-4 font-medium">{day.summary}</p>

      <div className="space-y-3">
        {day.activities.map((activity, idx) => (
          <ActivityComparison key={idx} activity={activity} />
        ))}
      </div>
    </div>
  );
}

function ActivityComparison({
  activity,
}: {
  activity: { time: string; name: string; description: string; effortLevel: EffortLevel };
}) {
  const effortColors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-amber-100 text-amber-800 border-amber-200',
    high: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <div className="p-3 bg-white rounded-lg border border-gray-200">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-3 h-3 text-gray-400" />
            <span className="text-xs font-medium text-gray-500">{activity.time}</span>
          </div>
          <h4 className="font-semibold text-gray-900 text-sm">{activity.name}</h4>
        </div>
        <div
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
            effortColors[activity.effortLevel]
          }`}
        >
          <Battery className="w-3 h-3" />
          {activity.effortLevel}
        </div>
      </div>
      <p className="text-gray-600 text-xs">{activity.description}</p>
    </div>
  );
}
