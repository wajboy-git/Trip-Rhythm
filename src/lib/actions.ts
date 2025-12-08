import { createTrip, createItineraryDay, updateItineraryDay, getItinerariesForTrip, getTripById } from './db';
import { getAIProvider } from './ai/provider-factory';
import type { TripFormData, AdjustmentComparison, AdjustmentMode, DayPlan } from '../types';

export async function generateItinerary(tripData: TripFormData): Promise<string> {
  try {
    const trip = await createTrip(tripData);

    const aiProvider = getAIProvider();
    const dayPlans = await aiProvider.generateItinerary(tripData);

    for (let i = 0; i < dayPlans.length; i++) {
      await createItineraryDay(trip.id, i + 1, dayPlans[i]);
    }

    return trip.id;
  } catch (error) {
    console.error('Error generating itinerary:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate itinerary');
  }
}

export async function adjustDayForFatigue(
  tripId: string,
  dayIndex: number
): Promise<AdjustmentComparison> {
  try {
    const trip = await getTripById(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    const itineraries = await getItinerariesForTrip(tripId);
    const allDays = itineraries.map((itin) => itin.ai_plan_json);
    const currentDay = allDays[dayIndex - 1];

    if (!currentDay) {
      throw new Error('Day not found');
    }

    const tripContext: TripFormData = {
      destination: trip.destination,
      start_date: trip.start_date,
      days: trip.days,
      travel_style: trip.travel_style,
      walking_tolerance: trip.walking_tolerance,
      wake_time: trip.wake_time,
      sleep_time: trip.sleep_time,
      must_see_places: trip.must_see_places || '',
    };

    const aiProvider = getAIProvider();
    const adjustment = await aiProvider.adjustDayForFatigue(
      currentDay,
      dayIndex,
      allDays,
      tripContext
    );

    return adjustment;
  } catch (error) {
    console.error('Error adjusting day:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to adjust day');
  }
}

export async function saveAdjustedDay(
  tripId: string,
  dayIndex: number,
  adjustedDay: any
): Promise<void> {
  try {
    await updateItineraryDay(tripId, dayIndex, adjustedDay);
  } catch (error) {
    console.error('Error saving adjusted day:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to save adjusted day');
  }
}

export async function adjustDaysWithMode(
  tripId: string,
  dayIndex: number,
  mode: AdjustmentMode
): Promise<AdjustmentComparison> {
  try {
    const trip = await getTripById(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    const itineraries = await getItinerariesForTrip(tripId);
    const allDays = itineraries.map((itin) => itin.ai_plan_json);

    const tripContext: TripFormData = {
      destination: trip.destination,
      start_date: trip.start_date,
      days: trip.days,
      travel_style: trip.travel_style,
      walking_tolerance: trip.walking_tolerance,
      wake_time: trip.wake_time,
      sleep_time: trip.sleep_time,
      must_see_places: trip.must_see_places || '',
    };

    const aiProvider = getAIProvider();
    const adjustment = await aiProvider.adjustDaysWithMode(
      dayIndex,
      allDays,
      tripContext,
      mode
    );

    return adjustment;
  } catch (error) {
    console.error('Error adjusting days:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to adjust days');
  }
}

export async function saveAdjustedDays(
  tripId: string,
  startDayIndex: number,
  adjustedDays: DayPlan[]
): Promise<void> {
  try {
    for (let i = 0; i < adjustedDays.length; i++) {
      await updateItineraryDay(tripId, startDayIndex + i, adjustedDays[i]);
    }
  } catch (error) {
    console.error('Error saving adjusted days:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to save adjusted days');
  }
}
