export type TravelStyle = 'chill' | 'balanced' | 'intense';
export type WalkingTolerance = 'low' | 'medium' | 'high';
export type EffortLevel = 'low' | 'medium' | 'high';
export type AdjustmentMode = 'reduce-fatigue' | 'increase-energy' | 'bring-it-on';

export interface Trip {
  id: string;
  destination: string;
  country: string | null;
  country_code: string | null;
  start_date: string;
  days: number;
  travel_style: TravelStyle;
  walking_tolerance: WalkingTolerance;
  wake_time: string;
  sleep_time: string;
  must_see_places: string | null;
  created_at: string;
}

export interface Activity {
  time: string;
  name: string;
  description: string;
  effortLevel: EffortLevel;
}

export interface DayPlan {
  date: string;
  summary: string;
  activities: Activity[];
}

export interface Itinerary {
  id: string;
  trip_id: string;
  day_index: number;
  ai_plan_json: DayPlan;
  created_at: string;
}

export interface TripFormData {
  destination: string;
  country: string;
  country_code: string;
  start_date: string;
  days: number;
  travel_style: TravelStyle;
  walking_tolerance: WalkingTolerance;
  wake_time: string;
  sleep_time: string;
  must_see_places: string;
}

export interface AdjustmentComparison {
  originalDays: DayPlan[];
  adjustedDays: DayPlan[];
  startDayIndex: number;
  mode: AdjustmentMode;
}
