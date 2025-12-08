import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { generateItinerary } from '../lib/actions';
import type { TripFormData, TravelStyle, WalkingTolerance } from '../types';
import { parseCityInput, geocodeCities } from '../lib/geocoding';
import { CityChip } from '../components/CityChip';
import toast from 'react-hot-toast';

export function NewTripPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodingOrigin, setGeocodingOrigin] = useState(false);
  const [originInput, setOriginInput] = useState('');
  const [formData, setFormData] = useState<TripFormData>({
    destination: '',
    start_date: '',
    days: 5,
    travel_style: 'balanced' as TravelStyle,
    walking_tolerance: 'medium' as WalkingTolerance,
    wake_time: '08:00',
    sleep_time: '22:00',
    must_see_places: '',
    consider_weather: true,
    cities: [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.destination || !formData.start_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.cities || formData.cities.length === 0) {
      toast.error('Please add at least one city');
      return;
    }

    setLoading(true);

    try {
      const tripId = await generateItinerary(formData);
      toast.success('Itinerary generated successfully!');
      navigate(`/trip/${tripId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate itinerary');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'days' ? parseInt(value) : value,
    }));
  };

  const handleCityInputBlur = async () => {
    const cityNames = parseCityInput(formData.destination);
    if (cityNames.length === 0) {
      setFormData((prev) => ({ ...prev, cities: [] }));
      return;
    }

    setGeocoding(true);
    try {
      const geocodedCities = await geocodeCities(cityNames);

      if (geocodedCities.length === 0) {
        toast.error('Could not find any of the cities entered');
        setFormData((prev) => ({ ...prev, cities: [] }));
      } else if (geocodedCities.length < cityNames.length) {
        toast.error(`Found ${geocodedCities.length} of ${cityNames.length} cities`);
        setFormData((prev) => ({ ...prev, cities: geocodedCities }));
      } else {
        setFormData((prev) => ({ ...prev, cities: geocodedCities }));
      }
    } catch (error) {
      toast.error('Failed to geocode cities');
      console.error(error);
    } finally {
      setGeocoding(false);
    }
  };

  const handleRemoveCity = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      cities: prev.cities?.filter((_, i) => i !== index) || [],
    }));

    const remainingCityNames = (formData.cities || [])
      .filter((_, i) => i !== index)
      .map((city) => city.name)
      .join(', ');

    setFormData((prev) => ({
      ...prev,
      destination: remainingCityNames,
    }));
  };

  const handleOriginInputBlur = async () => {
    if (!originInput.trim()) {
      setFormData((prev) => ({ ...prev, originCity: undefined }));
      return;
    }

    const cityNames = parseCityInput(originInput);
    if (cityNames.length === 0) {
      setFormData((prev) => ({ ...prev, originCity: undefined }));
      return;
    }

    setGeocodingOrigin(true);
    try {
      const geocodedCities = await geocodeCities([cityNames[0]]);

      if (geocodedCities.length === 0) {
        toast.error('Could not find the origin city entered');
        setFormData((prev) => ({ ...prev, originCity: undefined }));
      } else {
        setFormData((prev) => ({ ...prev, originCity: geocodedCities[0] }));
      }
    } catch (error) {
      toast.error('Failed to geocode origin city');
      console.error(error);
    } finally {
      setGeocodingOrigin(false);
    }
  };

  const handleRemoveOriginCity = () => {
    setFormData((prev) => ({ ...prev, originCity: undefined }));
    setOriginInput('');
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Trips
      </Link>

      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Plan Your Trip</h2>
          <p className="text-gray-600">
            Tell us about your travel preferences and we'll create a personalized itinerary
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="origin" className="block text-sm font-medium text-gray-700 mb-2">
              Origin City (Optional)
            </label>
            <input
              type="text"
              id="origin"
              name="origin"
              value={originInput}
              onChange={(e) => setOriginInput(e.target.value)}
              onBlur={handleOriginInputBlur}
              placeholder="e.g., New York"
              disabled={geocodingOrigin}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            {geocodingOrigin && (
              <p className="text-sm text-gray-600 mt-2">
                <span className="inline-block animate-spin mr-2">⟳</span>
                Finding city...
              </p>
            )}
            {formData.originCity && (
              <div className="flex flex-wrap gap-2 mt-3">
                <CityChip
                  city={formData.originCity.name}
                  country={formData.originCity.country}
                  onRemove={handleRemoveOriginCity}
                />
              </div>
            )}
          </div>

          <div>
            <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">
              Destination Cities *
            </label>
            <input
              type="text"
              id="destination"
              name="destination"
              value={formData.destination}
              onChange={handleChange}
              onBlur={handleCityInputBlur}
              placeholder="e.g., Paris, London, Berlin (comma-separated)"
              required
              disabled={geocoding}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            {geocoding && (
              <p className="text-sm text-gray-600 mt-2">
                <span className="inline-block animate-spin mr-2">⟳</span>
                Finding cities...
              </p>
            )}
            {formData.cities && formData.cities.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.cities.map((city, index) => (
                  <CityChip
                    key={index}
                    city={city.name}
                    country={city.country}
                    onRemove={() => handleRemoveCity(index)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="days" className="block text-sm font-medium text-gray-700 mb-2">
                Number of Days *
              </label>
              <input
                type="number"
                id="days"
                name="days"
                value={formData.days}
                onChange={handleChange}
                min="1"
                max="14"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Travel Style *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { value: 'chill', label: 'Chill', description: 'Relaxed pace with downtime' },
                { value: 'balanced', label: 'Balanced', description: 'Moderate sightseeing' },
                { value: 'intense', label: 'Intense', description: 'Packed schedule' },
              ].map((style) => (
                <label
                  key={style.value}
                  className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.travel_style === style.value
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="travel_style"
                    value={style.value}
                    checked={formData.travel_style === style.value}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span className="font-medium text-gray-900">{style.label}</span>
                  <span className="text-sm text-gray-600">{style.description}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Walking Tolerance *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { value: 'low', label: 'Low', description: 'Minimal walking' },
                { value: 'medium', label: 'Medium', description: 'Moderate walking' },
                { value: 'high', label: 'High', description: 'Comfortable with long walks' },
              ].map((tolerance) => (
                <label
                  key={tolerance.value}
                  className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.walking_tolerance === tolerance.value
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="walking_tolerance"
                    value={tolerance.value}
                    checked={formData.walking_tolerance === tolerance.value}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span className="font-medium text-gray-900">{tolerance.label}</span>
                  <span className="text-sm text-gray-600">{tolerance.description}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <div>
                <span className="block text-sm font-medium text-gray-900 mb-1">
                  Consider Weather Conditions
                </span>
                <span className="block text-sm text-gray-600">
                  AI will optimize activities based on forecasted weather
                </span>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={formData.consider_weather}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, consider_weather: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="wake_time" className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Wake Time *
              </label>
              <input
                type="time"
                id="wake_time"
                name="wake_time"
                value={formData.wake_time}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="sleep_time" className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Sleep Time *
              </label>
              <input
                type="time"
                id="sleep_time"
                name="sleep_time"
                value={formData.sleep_time}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="must_see_places" className="block text-sm font-medium text-gray-700 mb-2">
              Must-See Places (Optional)
            </label>
            <textarea
              id="must_see_places"
              name="must_see_places"
              value={formData.must_see_places}
              onChange={handleChange}
              placeholder="e.g., Eiffel Tower, Louvre Museum, Arc de Triomphe"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-sky-600 text-white px-6 py-3 rounded-lg hover:bg-sky-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Generating Your Itinerary...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Create & Generate Itinerary
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
