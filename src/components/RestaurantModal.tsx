import { useEffect, useState } from 'react';
import { X, Loader, Star, Phone, MapPin, DollarSign, Clock } from 'lucide-react';
import { searchRestaurants, extractLocationFromMeal, type RestaurantResult } from '../lib/places';

interface RestaurantModalProps {
  isOpen: boolean;
  activityName: string;
  time: string;
  cityName?: string;
  onClose: () => void;
}

export function RestaurantModal({ isOpen, activityName, time, cityName, onClose }: RestaurantModalProps) {
  const [restaurants, setRestaurants] = useState<RestaurantResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && activityName) {
      fetchRestaurants();
    }
  }, [isOpen, activityName, time, cityName]);

  async function fetchRestaurants() {
    setLoading(true);
    setError(null);
    setRestaurants([]);

    const location = extractLocationFromMeal(activityName);

    try {
      const results = await searchRestaurants(location, time, cityName);
      setRestaurants(results);

      if (results.length === 0) {
        setError(`No restaurants found near "${location}"`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load restaurant recommendations');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const location = extractLocationFromMeal(activityName);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">Restaurant Recommendations</h2>
            <p className="text-sm text-gray-600 mt-1">
              Near {location} {cityName && `in ${cityName}`} at {time}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 text-sky-600 animate-spin" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
              {error}
            </div>
          )}

          {restaurants.length > 0 && (
            <div className="space-y-4">
              {restaurants.map((restaurant, index) => (
                <div
                  key={restaurant.placeId}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-sky-600 text-white text-xs font-bold rounded-full">
                          {index + 1}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-900">{restaurant.name}</h3>
                      </div>
                      {restaurant.rating > 0 && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span className="font-medium text-gray-900">{restaurant.rating.toFixed(1)}</span>
                          </div>
                          <span className="text-sm text-gray-600">
                            ({restaurant.userRatingsTotal} reviews)
                          </span>
                          {restaurant.priceLevel && (
                            <div className="flex items-center gap-1 text-gray-700">
                              {Array.from({ length: restaurant.priceLevel }, (_, i) => (
                                <DollarSign key={i} className="w-3 h-3" />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {restaurant.openNow !== undefined && (
                      <div className="flex-shrink-0">
                        {restaurant.openNow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            <Clock className="w-3 h-3" />
                            Open Now
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                            <Clock className="w-3 h-3" />
                            Closed
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    {restaurant.address && (
                      <div className="flex items-start gap-2 text-gray-700">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-500" />
                        <span>{restaurant.address}</span>
                      </div>
                    )}
                    {restaurant.phoneNumber && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Phone className="w-4 h-4 flex-shrink-0 text-gray-500" />
                        <a
                          href={`tel:${restaurant.phoneNumber}`}
                          className="text-sky-600 hover:text-sky-700 font-medium"
                        >
                          {restaurant.phoneNumber}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="mt-3">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name)}&query_place_id=${restaurant.placeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-sky-600 text-white text-sm rounded-lg hover:bg-sky-700 transition-colors font-medium"
                    >
                      <MapPin className="w-4 h-4" />
                      View on Google Maps
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
