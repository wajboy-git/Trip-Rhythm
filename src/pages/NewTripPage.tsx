import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { generateItinerary } from '../lib/actions';
import type { TripFormData, TravelStyle, WalkingTolerance } from '../types';
import toast from 'react-hot-toast';

export function NewTripPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TripFormData>({
    destination: '',
    start_date: '',
    days: 5,
    travel_style: 'balanced' as TravelStyle,
    walking_tolerance: 'medium' as WalkingTolerance,
    wake_time: '08:00',
    sleep_time: '22:00',
    must_see_places: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.destination || !formData.start_date) {
      toast.error('Please fill in all required fields');
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
            <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">
              Destination City *
            </label>
            <input
              type="text"
              id="destination"
              name="destination"
              value={formData.destination}
              onChange={handleChange}
              placeholder="e.g., Paris, France"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
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
