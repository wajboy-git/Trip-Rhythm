import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, MapPin, Calendar, Footprints, Trash2 } from 'lucide-react';
import { getRecentTrips, bulkDeleteTrips, bulkRestoreTrips } from '../lib/db';
import type { Trip, DeletedTripData } from '../types';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { UndoToast } from '../components/UndoToast';
import { UNDO_TIMEOUT_MS } from '../lib/constants';
import toast from 'react-hot-toast';

export function HomePage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTripIds, setSelectedTripIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletedTripsBackup, setDeletedTripsBackup] = useState<DeletedTripData[]>([]);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [undoTimer, setUndoTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadTrips();
  }, []);

  useEffect(() => {
    return () => {
      if (undoTimer) {
        clearTimeout(undoTimer);
      }
    };
  }, [undoTimer]);

  async function loadTrips() {
    try {
      const data = await getRecentTrips(20);
      setTrips(data);
    } catch (error) {
      toast.error('Failed to load trips');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const toggleTripSelection = (tripId: string) => {
    setSelectedTripIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tripId)) {
        newSet.delete(tripId);
      } else {
        newSet.add(tripId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedTripIds.size === trips.length) {
      setSelectedTripIds(new Set());
    } else {
      setSelectedTripIds(new Set(trips.map((t) => t.id)));
    }
  };

  const clearSelection = () => {
    setSelectedTripIds(new Set());
  };

  const handleDeleteSelected = () => {
    if (selectedTripIds.size === 0) return;
    setShowDeleteDialog(true);
  };

  const handleQuickDelete = (tripId: string) => {
    setSelectedTripIds(new Set([tripId]));
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (selectedTripIds.size === 0) return;

    setShowDeleteDialog(false);
    setIsDeleting(true);

    try {
      const tripIdsArray = Array.from(selectedTripIds);
      const deletedData = await bulkDeleteTrips(tripIdsArray);

      setTrips((prev) => prev.filter((t) => !selectedTripIds.has(t.id)));
      setDeletedTripsBackup(deletedData);
      setSelectedTripIds(new Set());

      startUndoTimer();
      setShowUndoToast(true);
    } catch (error) {
      toast.error('Failed to delete trips');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const startUndoTimer = () => {
    const startTime = Date.now();
    const endTime = startTime + UNDO_TIMEOUT_MS;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.ceil((endTime - now) / 1000);

      if (remaining <= 0) {
        setShowUndoToast(false);
        setDeletedTripsBackup([]);
        setRemainingSeconds(0);
        return;
      }

      setRemainingSeconds(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setShowUndoToast(false);
      setDeletedTripsBackup([]);
      toast.success('Deletion finalized');
    }, UNDO_TIMEOUT_MS);

    setUndoTimer(timeout);
  };

  const handleUndo = async () => {
    if (undoTimer) {
      clearTimeout(undoTimer);
      setUndoTimer(null);
    }

    setShowUndoToast(false);

    try {
      await bulkRestoreTrips(deletedTripsBackup);
      setDeletedTripsBackup([]);
      await loadTrips();
      toast.success('Trips restored successfully');
    } catch (error) {
      toast.error('Failed to restore trips');
      console.error(error);
    }
  };

  const handleDismissToast = () => {
    setShowUndoToast(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  const tripNames = Array.from(selectedTripIds)
    .map((id) => {
      const trip = trips.find((t) => t.id === id);
      return trip
        ? trip.cities && trip.cities.length > 0
          ? trip.cities.map((c) => c.name).join(', ')
          : trip.destination
        : '';
    })
    .filter(Boolean);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Your Trips</h2>
          <p className="text-gray-600 mt-1">Plan your next adventure with AI-powered itineraries</p>
        </div>
        <Link
          to="/new-trip"
          className="flex items-center gap-2 bg-sky-600 text-white px-6 py-3 rounded-lg hover:bg-sky-700 transition-colors shadow-md hover:shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Plan New Trip
        </Link>
      </div>

      {trips.length > 0 && (
        <div className="mb-6 flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedTripIds.size === trips.length && trips.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-2 focus:ring-sky-500"
              />
              <span className="text-sm font-medium text-gray-700">Select All</span>
            </label>

            {selectedTripIds.size > 0 && (
              <span className="text-sm text-gray-600">
                {selectedTripIds.size} {selectedTripIds.size === 1 ? 'trip' : 'trips'} selected
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {selectedTripIds.size > 0 && (
              <>
                <button
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Selected
                </button>

                <button
                  onClick={clearSelection}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Clear Selection
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {trips.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-sky-100 rounded-full mb-4">
            <MapPin className="w-10 h-10 text-sky-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No trips yet</h3>
          <p className="text-gray-600 mb-6">Start planning your first adventure!</p>
          <Link
            to="/new-trip"
            className="inline-flex items-center gap-2 bg-sky-600 text-white px-6 py-3 rounded-lg hover:bg-sky-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Your First Trip
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              isSelected={selectedTripIds.has(trip.id)}
              onToggleSelect={() => toggleTripSelection(trip.id)}
              onQuickDelete={() => handleQuickDelete(trip.id)}
            />
          ))}
        </div>
      )}

      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        tripCount={selectedTripIds.size}
        tripNames={tripNames}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />

      {showUndoToast && (
        <UndoToast
          tripCount={deletedTripsBackup.length}
          remainingSeconds={remainingSeconds}
          onUndo={handleUndo}
          onDismiss={handleDismissToast}
        />
      )}
    </div>
  );
}

interface TripCardProps {
  trip: Trip;
  isSelected: boolean;
  onToggleSelect: () => void;
  onQuickDelete: () => void;
}

function TripCard({ trip, isSelected, onToggleSelect, onQuickDelete }: TripCardProps) {
  const startDate = new Date(trip.start_date);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + trip.days - 1);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const displayDestination =
    trip.cities && trip.cities.length > 0
      ? trip.cities.map((city) => `${city.name}, ${city.country}`).join(' • ')
      : trip.destination;

  return (
    <div
      className={`relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden border-2 ${
        isSelected ? 'border-sky-500 ring-2 ring-sky-200' : 'border-gray-100 hover:border-sky-200'
      }`}
    >
      <div
        className="absolute top-3 left-3 z-10"
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect();
        }}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => {}}
          className="w-5 h-5 text-sky-600 border-gray-300 rounded focus:ring-2 focus:ring-sky-500 cursor-pointer"
          aria-label={`Select trip to ${displayDestination}`}
        />
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onQuickDelete();
        }}
        className="absolute top-3 right-3 z-10 p-2 bg-white rounded-full shadow-sm opacity-0 hover:opacity-100 transition-opacity hover:bg-red-50 group"
        aria-label="Delete this trip"
      >
        <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
      </button>

      <Link to={`/trip/${trip.id}`} className="block p-6 pt-12">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-sky-600 flex-shrink-0" />
            <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{displayDestination}</h3>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">
              {formatDate(startDate)} - {formatDate(endDate)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Footprints className="w-4 h-4" />
            <span className="text-sm">{trip.days} days</span>
          </div>
        </div>

        <div className="flex gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-800 capitalize">
            {trip.travel_style}
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 capitalize">
            {trip.walking_tolerance} walking
          </span>
        </div>
      </Link>
    </div>
  );
}
