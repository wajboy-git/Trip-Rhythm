import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Clock, Battery, Zap, Flame, Sun, Cloud, CloudRain, Snowflake, CloudDrizzle, CloudSun, CloudFog, CloudLightning } from 'lucide-react';
import { getTripById, getItinerariesForTrip } from '../lib/db';
import { adjustDaysWithModeAndScope, saveAdjustedDays } from '../lib/actions';
import type { Trip, Itinerary, DayPlan, EffortLevel, AdjustmentComparison, AdjustmentMode, TravelLeg, TravelItem, ItineraryItemType, WeatherData, DayWeather } from '../types';
import toast from 'react-hot-toast';
import { ComparisonModal } from '../components/ComparisonModal';
import { CityChip } from '../components/CityChip';
import { EnergyScopeDialog } from '../components/EnergyScopeDialog';
import { EnergyScopeInstructions } from '../components/EnergyScopeInstructions';
import { WeatherSuggestionsCard } from '../components/WeatherSuggestionsCard';
import { PackingListSummary } from '../components/PackingListSummary';
import { calculateTravelLegs, assignTravelLegsToDays, estimateTravelTime } from '../lib/travel';
import { TravelItem as TravelItemComponent } from '../components/TravelItem';
import { fetchDailyWeather, enrichWeatherWithMetadata } from '../lib/weather';
import { WikipediaModal } from '../components/WikipediaModal';
import { RestaurantModal } from '../components/RestaurantModal';
import { getActivityIcons, isPlaceName, isMealActivity } from '../lib/activity-icons';

function getWeatherIconComponent(iconName: string) {
  switch (iconName) {
    case 'sun':
      return Sun;
    case 'cloud-sun':
      return CloudSun;
    case 'cloud':
      return Cloud;
    case 'cloud-fog':
      return CloudFog;
    case 'cloud-drizzle':
      return CloudDrizzle;
    case 'cloud-rain':
      return CloudRain;
    case 'snowflake':
      return Snowflake;
    case 'cloud-lightning':
      return CloudLightning;
    default:
      return Cloud;
  }
}

function organizeItemsByCity(
  activityItems: ItineraryItemType[],
  travelItems: TravelItem[]
): ItineraryItemType[] {
  // If no travel items, just return activities
  if (travelItems.length === 0) {
    return activityItems;
  }

  // Build result by placing travel items before first activity in destination city
  const result: ItineraryItemType[] = [];
  const processedActivities = new Set<number>();

  // For each travel item, find and place it before the first activity in destination city
  travelItems.forEach((travelItem) => {
    // Find activities that belong to this travel's destination city
    // For simplicity, we assume activities are ordered and after a travel leg, the next unprocessed
    // activity belongs to the destination city
    const firstUnprocessedActivityIndex = activityItems.findIndex(
      (_, index) => !processedActivities.has(index)
    );

    if (firstUnprocessedActivityIndex !== -1) {
      // Add all activities before this position
      for (let i = 0; i < firstUnprocessedActivityIndex; i++) {
        if (!processedActivities.has(i)) {
          result.push(activityItems[i]);
          processedActivities.add(i);
        }
      }
      // Add the travel item
      result.push(travelItem);
      // Mark the first unprocessed activity to process next time
    } else {
      // No more activities, just add travel items at the end
      result.push(travelItem);
    }
  });

  // Add remaining activities
  activityItems.forEach((activity, index) => {
    if (!processedActivities.has(index)) {
      result.push(activity);
    }
  });

  return result;
}

export function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [mergedItineraries, setMergedItineraries] = useState<Array<Itinerary & { items: ItineraryItemType[] }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [adjusting, setAdjusting] = useState(false);
  const [adjustingMode, setAdjustingMode] = useState<AdjustmentMode | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [comparison, setComparison] = useState<AdjustmentComparison | null>(null);
  const [showEnergyScope, setShowEnergyScope] = useState(false);
  const [pendingEnergyMode, setPendingEnergyMode] = useState<AdjustmentMode | null>(null);
  const [weatherData, setWeatherData] = useState<DayWeather[]>([]);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weatherDismissed, setWeatherDismissed] = useState(false);
  const [wikipediaOpen, setWikipediaOpen] = useState(false);
  const [selectedPlaceTitle, setSelectedPlaceTitle] = useState('');
  const [restaurantModalOpen, setRestaurantModalOpen] = useState(false);
  const [selectedMealActivity, setSelectedMealActivity] = useState<{ name: string; time: string; cityName?: string } | null>(null);

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

      if (tripData?.consider_weather !== false && tripData?.cities && tripData.cities.length > 0) {
        loadWeatherData(tripData);
      }

      // Merge travel legs into itineraries with proper travel line positioning
      if (tripData?.cities && tripData.cities.length > 0) {
        const legs = calculateTravelLegs(tripData.cities, tripData.originCity);
        const dayAssignments = assignTravelLegsToDays(legs, tripData.days);

        const merged = itineraryData.map((itinerary) => {
          const travelLegsForDay = dayAssignments.get(itinerary.day_index) || [];
          const dayPlan = itinerary.ai_plan_json;
          const activities = dayPlan.activities || [];

          // Convert activities to activity items
          const activityItems: ItineraryItemType[] = activities.map((activity) => ({
            type: 'activity' as const,
            time: activity.time,
            name: activity.name,
            description: activity.description,
            effortLevel: activity.effortLevel,
          }));

          // Convert travel legs to travel items
          const travelItems: TravelItem[] = travelLegsForDay.map((leg) => {
            const recommendedOption = leg.options.find((opt) => opt.isAllowed && opt.isRecommended);
            return {
              type: 'travel',
              fromCity: leg.fromCity,
              toCity: leg.toCity,
              mode: recommendedOption?.mode || 'flight',
              distance: leg.distance,
              duration: recommendedOption?.duration || 0,
              options: leg.options,
              isCrossContinental: leg.isCrossContinental,
              restrictionType: leg.restrictionType,
              restrictionReason: recommendedOption?.restrictionReason,
            };
          });

          // Merge items with travel lines positioned before first activity in destination city
          const items = organizeItemsByCity(activityItems, travelItems);

          return {
            ...itinerary,
            items,
          };
        });

        setMergedItineraries(merged);
      } else {
        // No travel, just convert activities to items
        const merged = itineraryData.map((itinerary) => ({
          ...itinerary,
          items: (itinerary.ai_plan_json.activities || []).map((activity) => ({
            type: 'activity' as const,
            time: activity.time,
            name: activity.name,
            description: activity.description,
            effortLevel: activity.effortLevel,
          })),
        }));
        setMergedItineraries(merged);
      }
    } catch (error) {
      toast.error('Failed to load trip details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function loadWeatherData(tripData: Trip) {
    if (!tripData.cities || tripData.cities.length === 0) return;

    setLoadingWeather(true);
    try {
      const primaryCity = tripData.cities[0];
      const rawWeather = await fetchDailyWeather(
        primaryCity.latitude,
        primaryCity.longitude,
        tripData.start_date,
        tripData.days
      );

      if (rawWeather) {
        const enriched = rawWeather.map(enrichWeatherWithMetadata);
        setWeatherData(enriched);
      }
    } catch (error) {
      console.error('Failed to load weather data:', error);
    } finally {
      setLoadingWeather(false);
    }
  }

  function handleAdjustDay(mode: AdjustmentMode) {
    if (selectedDayIndex === null) return;

    setPendingEnergyMode(mode);
    setShowEnergyScope(true);
  }

  async function handleScopeConfirmed(scope: 'single-day' | 'from-day-onward') {
    if (!tripId || selectedDayIndex === null || !pendingEnergyMode) return;

    setShowEnergyScope(false);
    setAdjusting(true);
    setAdjustingMode(pendingEnergyMode);

    try {
      const result = await adjustDaysWithModeAndScope(
        tripId,
        selectedDayIndex,
        pendingEnergyMode,
        scope
      );
      setComparison(result);
      setShowComparison(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to adjust days');
      console.error(error);
    } finally {
      setAdjusting(false);
      setAdjustingMode(null);
      setPendingEnergyMode(null);
    }
  }

  async function handleAcceptChanges() {
    if (!tripId || !comparison) return;

    try {
      await saveAdjustedDays(tripId, comparison.startDayIndex, comparison.adjustedDays);
      await loadTripData();
      setShowComparison(false);
      setComparison(null);

      const daysCount = comparison.adjustedDays.length;
      const scope = daysCount === 1 ? 'single-day' : 'from-day-onward';
      const selectedItinerary = mergedItineraries.find(
        (i) => i.day_index === comparison.startDayIndex
      );
      const selectedDate = selectedItinerary
        ? new Date(selectedItinerary.ai_plan_json.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })
        : '';

      if (scope === 'single-day') {
        toast.success(`Updated energy and activities for ${selectedDate} only.`);
      } else {
        toast.success(
          `Updated energy and activities from ${selectedDate} to the end of your trip.`
        );
      }

      setSelectedDayIndex(null);
    } catch (error) {
      toast.error('Failed to save changes');
      console.error(error);
    }
  }

  function getSelectedDayInfo() {
    if (selectedDayIndex === null) return { date: '', city: '' };

    const selectedItinerary = mergedItineraries.find(
      (i) => i.day_index === selectedDayIndex
    );
    if (!selectedItinerary) return { date: '', city: '' };

    const date = new Date(selectedItinerary.ai_plan_json.date);
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    let cityName = '';
    if (trip?.cities && trip.cities.length > 0) {
      const cityIndex = selectedDayIndex - 1;
      if (cityIndex < trip.cities.length) {
        cityName = trip.cities[cityIndex].name;
      } else {
        cityName = trip.cities[trip.cities.length - 1].name;
      }
    }

    return { date: formattedDate, city: cityName };
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

      <EnergyScopeInstructions />

      {weatherData.length > 0 && !weatherDismissed && (
        <div className="mb-6">
          <WeatherSuggestionsCard
            weatherData={weatherData}
            onDismiss={() => setWeatherDismissed(true)}
          />
        </div>
      )}

      {weatherData.length > 0 && tripId && (
        <div className="mb-6">
          <PackingListSummary tripId={tripId} weatherData={weatherData} />
        </div>
      )}

      <div className="space-y-6">
        {mergedItineraries.map((itinerary) => {
          let cityName: string | undefined;
          if (trip?.cities && trip.cities.length > 0) {
            const cityIndex = itinerary.day_index - 1;
            if (cityIndex < trip.cities.length) {
              cityName = trip.cities[cityIndex].name;
            } else {
              cityName = trip.cities[trip.cities.length - 1].name;
            }
          }

          const weather = weatherData.find(w => w.date === itinerary.ai_plan_json.date);

          return (
            <DayCard
              key={itinerary.id}
              itinerary={itinerary}
              isSelected={selectedDayIndex === itinerary.day_index}
              onSelect={() => setSelectedDayIndex(itinerary.day_index)}
              cityName={cityName}
              weather={weather}
              onPlaceClick={(title, time) => {
                if (isMealActivity(title)) {
                  setSelectedMealActivity({ name: title, time, cityName });
                  setRestaurantModalOpen(true);
                } else {
                  setSelectedPlaceTitle(title);
                  setWikipediaOpen(true);
                }
              }}
            />
          );
        })}
      </div>

      {selectedDayIndex !== null && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-3">
          {(() => {
            const { date, city } = getSelectedDayInfo();
            return (
              <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
                <div className="text-xs text-gray-600 font-medium">Adjust energy for:</div>
                <div className="text-sm font-semibold text-gray-900">
                  {date && city ? `${date} – ${city}` : 'Selected day'}
                </div>
              </div>
            );
          })()}

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

      {(() => {
        const { date, city } = getSelectedDayInfo();
        return (
          <EnergyScopeDialog
            isOpen={showEnergyScope}
            onClose={() => {
              setShowEnergyScope(false);
              setPendingEnergyMode(null);
            }}
            onConfirm={handleScopeConfirmed}
            dateLabel={date}
            cityLabel={city}
          />
        );
      })()}

      <WikipediaModal
        isOpen={wikipediaOpen}
        title={selectedPlaceTitle}
        onClose={() => {
          setWikipediaOpen(false);
          setSelectedPlaceTitle('');
        }}
      />

      <RestaurantModal
        isOpen={restaurantModalOpen}
        activityName={selectedMealActivity?.name || ''}
        time={selectedMealActivity?.time || ''}
        cityName={selectedMealActivity?.cityName}
        onClose={() => {
          setRestaurantModalOpen(false);
          setSelectedMealActivity(null);
        }}
      />
    </div>
  );
}

function DayCard({
  itinerary,
  isSelected,
  onSelect,
  cityName,
  weather,
  onPlaceClick,
}: {
  itinerary: Itinerary & { items: ItineraryItemType[] };
  isSelected: boolean;
  onSelect: () => void;
  cityName?: string;
  weather?: DayWeather;
  onPlaceClick?: (title: string, time: string) => void;
}) {
  const dayPlan = itinerary.ai_plan_json;
  const date = new Date(dayPlan.date);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const WeatherIcon = weather ? getWeatherIconComponent(weather.icon) : null;

  const weatherColors = {
    'good-outdoor': 'bg-green-50 border-green-200 text-green-800',
    'mixed': 'bg-amber-50 border-amber-200 text-amber-800',
    'indoor-focused': 'bg-blue-50 border-blue-200 text-blue-800',
  };

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
          {cityName && <p className="text-xs text-sky-600 font-medium mt-1">{cityName}</p>}
        </div>
        <div className="flex items-center gap-2">
          {weather && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${weatherColors[weather.category]}`}>
              {WeatherIcon && <WeatherIcon className="w-5 h-5" />}
              <div className="text-xs">
                <div className="font-semibold">
                  {Math.round(weather.temperature_min)}°-{Math.round(weather.temperature_max)}°C
                </div>
                {weather.precipitation_probability > 0 && (
                  <div className="text-[10px] opacity-75">
                    {weather.precipitation_probability}% rain
                  </div>
                )}
              </div>
            </div>
          )}
          {isSelected && (
            <span className="px-3 py-1 bg-amber-100 text-amber-800 text-sm font-medium rounded-full">
              Selected
            </span>
          )}
        </div>
      </div>

      <p className="text-gray-700 mb-6">{dayPlan.summary}</p>

      <div className="space-y-4">
        {itinerary.items.map((item, idx) => {
          if (item.type === 'travel') {
            return <TravelItemComponent key={idx} item={item} />;
          } else {
            return <ActivityCard key={idx} activity={item} onPlaceClick={onPlaceClick} />;
          }
        })}
      </div>
    </div>
  );
}

function ActivityCard({
  activity,
  onPlaceClick,
}: {
  activity: { time: string; name: string; description: string; effortLevel: EffortLevel };
  onPlaceClick?: (title: string, time: string) => void;
}) {
  const effortColors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-amber-100 text-amber-800 border-amber-200',
    high: 'bg-red-100 text-red-800 border-red-200',
  };

  const { icons, color: colorClass } = getActivityIcons(activity.name, activity.description);
  const isPlace = isPlaceName(activity.name);

  return (
    <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex-shrink-0">
        <div className={`w-16 h-16 ${colorClass} rounded-lg flex items-center justify-center relative`}>
          {icons.length === 1 ? (
            (() => {
              const Icon = icons[0];
              return <Icon className="w-6 h-6" />;
            })()
          ) : (
            <div className="flex flex-col gap-0.5">
              {icons.map((Icon, idx) => (
                <Icon key={idx} className="w-5 h-5" />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-gray-500">{activity.time}</span>
            </div>
            {isPlace && onPlaceClick ? (
              <button
                onClick={() => onPlaceClick(activity.name, activity.time)}
                className="text-lg font-semibold text-sky-600 hover:text-sky-700 underline text-left transition-colors"
              >
                {activity.name}
              </button>
            ) : (
              <h4 className="text-lg font-semibold text-gray-900">{activity.name}</h4>
            )}
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
