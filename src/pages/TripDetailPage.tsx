import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Clock, Battery, RefreshCw, Zap, Flame } from 'lucide-react';
import { getTripById, getItinerariesForTrip } from '../lib/db';
import { adjustDaysWithMode, saveAdjustedDays } from '../lib/actions';
import type { Trip, Itinerary, DayPlan, EffortLevel, AdjustmentComparison, AdjustmentMode, TravelLeg } from '../types';
import toast from 'react-hot-toast';
import { ComparisonModal } from '../components/ComparisonModal';
import { CityChip } from '../components/CityChip';
import { TravelLegCard } from '../components/TravelLegCard';
import { calculateTravelLegs } from '../lib/travel';

export function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [travelLegs, setTravelLegs] = useState<TravelLeg[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [adjusting, setAdjusting] = useState(false);
  const [adjustingMode, setAdjustingMode] = useState<AdjustmentMode | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [comparison, setComparison] = useState<AdjustmentComparison | null>(null);

  useEffect(() => {
    if (tripId) {
      loadTripData();
    }
  }, [tripId]);

  async function loadTripData() {
    if (!tripId) return;

    try {
      const [tripData, itineraryData] = await Promise.all([
        getTripById(tripId),
        getItinerariesForTrip(tripId),
      ]);

      setTrip(tripData);
      setItineraries(itineraryData);

      if (tripData?.cities && tripData.cities.length > 0) {
        const legs = calculateTravelLegs(tripData.cities, tripData.originCity);
        setTravelLegs(legs);
      }
    } catch (error) {
      toast.error('Failed to load trip details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdjustDay(mode: AdjustmentMode) {
    if (!tripId || selectedDayIndex === null) return;

    setAdjusting(true);
    setAdjustingMode(mode);

    try {
      const result = await adjustDaysWithMode(tripId, selectedDayIndex, mode);
      setComparison(result);
      setShowComparison(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to adjust days');
      console.error(error);
    } finally {
      setAdjusting(false);
      setAdjustingMode(null);
    }
  }

  async function handleAcceptChanges() {
    if (!tripId || !comparison) return;

    try {
      await saveAdjustedDays(tripId, comparison.startDayIndex, comparison.adjustedDays);
      await loadTripData();
      setShowComparison(false);
      setComparison(null);
      setSelectedDayIndex(null);
      const daysCount = comparison.adjustedDays.length;
      toast.success(`${daysCount} ${daysCount === 1 ? 'day' : 'days'} updated successfully!`);
    } catch (error) {
      toast.error('Failed to save changes');
      console.error(error);
    }
  }

  function handleCancelChanges() {
    setShowComparison(false);
    setComparison(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="text-center py-16">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Trip not found</h3>
        <Link to="/" className="text-sky-600 hover:text-sky-700">
          Back to trips
        </Link>
      </div>
    );
  }

  const startDate = new Date(trip.start_date);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + trip.days - 1);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Trips
      </Link>

      <div className="bg-white rounded-xl shadow-md p-8 mb-8">
        <div className="flex items-start justify-between mb-6">
          <div className="w-full">
            <div className="flex items-center gap-3 mb-3">
              <MapPin className="w-6 h-6 text-sky-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                {trip.cities && trip.cities.length > 0
                  ? trip.cities.map(city => city.name).join(', ')
                  : trip.destination}
              </h1>
            </div>
            {trip.cities && trip.cities.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 ml-9">
                {trip.cities.map((city, index) => (
                  <CityChip key={index} city={city.name} country={city.country} />
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600 mb-4">
              <Calendar className="w-4 h-4" />
              <span>
                {formatDate(startDate)} - {formatDate(endDate)} ({trip.days} days)
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-sky-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Style:</span>
            <span className="text-sm font-semibold text-sky-700 capitalize">{trip.travel_style}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Walking:</span>
            <span className="text-sm font-semibold text-green-700 capitalize">
              {trip.walking_tolerance}
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-lg">
            <Clock className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">
              {trip.wake_time} - {trip.sleep_time}
            </span>
          </div>
          {trip.must_see_places && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Must-see:</span>
              <span className="text-sm text-amber-700">{trip.must_see_places}</span>
            </div>
          )}
        </div>
      </div>

      {travelLegs.length > 0 && (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Travel Between Cities</h2>
          <div className="space-y-4">
            {travelLegs.map((leg, index) => (
              <TravelLegCard key={index} leg={leg} />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {itineraries.map((itinerary) => (
          <DayCard
            key={itinerary.id}
            itinerary={itinerary}
            isSelected={selectedDayIndex === itinerary.day_index}
            onSelect={() => setSelectedDayIndex(itinerary.day_index)}
          />
        ))}
      </div>

      {selectedDayIndex !== null && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-3">
          <button
            onClick={() => handleAdjustDay('reduce-fatigue')}
            disabled={adjusting}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium whitespace-nowrap"
          >
            {adjusting && adjustingMode === 'reduce-fatigue' ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Adjusting...
              </>
            ) : (
              <>
                <Battery className="w-5 h-5" />
                Feels Too Tiring
              </>
            )}
          </button>

          <button
            onClick={() => handleAdjustDay('increase-energy')}
            disabled={adjusting}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium whitespace-nowrap"
          >
            {adjusting && adjustingMode === 'increase-energy' ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Adjusting...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                I've More Energy
              </>
            )}
          </button>

          <button
            onClick={() => handleAdjustDay('bring-it-on')}
            disabled={adjusting}
            className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium whitespace-nowrap"
          >
            {adjusting && adjustingMode === 'bring-it-on' ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Adjusting...
              </>
            ) : (
              <>
                <Flame className="w-5 h-5" />
                I Am Game - Bring it On
              </>
            )}
          </button>
        </div>
      )}

      {showComparison && comparison && (
        <ComparisonModal
          comparison={comparison}
          onAccept={handleAcceptChanges}
          onCancel={handleCancelChanges}
        />
      )}
    </div>
  );
}

function DayCard({
  itinerary,
  isSelected,
  onSelect,
}: {
  itinerary: Itinerary;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const dayPlan = itinerary.ai_plan_json;
  const date = new Date(dayPlan.date);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded-xl shadow-md p-6 cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-amber-500 shadow-lg' : 'hover:shadow-lg'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            Day {itinerary.day_index}
          </h3>
          <p className="text-sm text-gray-600">{formattedDate}</p>
        </div>
        {isSelected && (
          <span className="px-3 py-1 bg-amber-100 text-amber-800 text-sm font-medium rounded-full">
            Selected
          </span>
        )}
      </div>

      <p className="text-gray-700 mb-6">{dayPlan.summary}</p>

      <div className="space-y-4">
        {dayPlan.activities.map((activity, idx) => (
          <ActivityCard key={idx} activity={activity} />
        ))}
      </div>
    </div>
  );
}

function ActivityCard({ activity }: { activity: { time: string; name: string; description: string; effortLevel: EffortLevel } }) {
  const effortColors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-amber-100 text-amber-800 border-amber-200',
    high: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex-shrink-0">
        <div className="w-16 h-16 bg-sky-100 rounded-lg flex items-center justify-center">
          <Clock className="w-6 h-6 text-sky-600" />
        </div>
      </div>

      <div className="flex-1">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-gray-500">{activity.time}</span>
            </div>
            <h4 className="text-lg font-semibold text-gray-900">{activity.name}</h4>
          </div>
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${effortColors[activity.effortLevel]}`}>
            <Battery className="w-3 h-3" />
            {activity.effortLevel}
          </div>
        </div>
        <p className="text-gray-600 text-sm">{activity.description}</p>
      </div>
    </div>
  );
}
