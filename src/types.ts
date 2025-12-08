export type TravelStyle = 'chill' | 'balanced' | 'intense';
export type WalkingTolerance = 'low' | 'medium' | 'high';
export type EffortLevel = 'low' | 'medium' | 'high';
export type AdjustmentMode = 'reduce-fatigue' | 'increase-energy' | 'bring-it-on';

export interface City {
  id: string;
  name: string;
  country: string;
  country_code: string | null;
  latitude: number;
  longitude: number;
  created_at: string;
}

export interface TripCity {
  id: string;
  trip_id: string;
  city_id: string;
  order_index: number;
  created_at: string;
  city?: City;
}

export interface Trip {
  id: string;
  destination: string;
  start_date: string;
  days: number;
  travel_style: TravelStyle;
  walking_tolerance: WalkingTolerance;
  wake_time: string;
  sleep_time: string;
  must_see_places: string | null;
  created_at: string;
  origin_city_id?: string | null;
  originCity?: City | null;
  cities?: City[];
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
  start_date: string;
  days: number;
  travel_style: TravelStyle;
  walking_tolerance: WalkingTolerance;
  wake_time: string;
  sleep_time: string;
  must_see_places: string;
  originCity?: {
    name: string;
    country: string;
    country_code?: string;
    latitude: number;
    longitude: number;
  };
  cities?: Array<{
    name: string;
    country: string;
    country_code?: string;
    latitude: number;
    longitude: number;
  }>;
}

export interface AdjustmentComparison {
  originalDays: DayPlan[];
  adjustedDays: DayPlan[];
  startDayIndex: number;
  mode: AdjustmentMode;
}

export type TravelMode = 'flight' | 'train' | 'car' | 'bus';

export interface TravelModeOption {
  mode: TravelMode;
  duration: number;
  isRecommended: boolean;
}

export interface TravelLeg {
  fromCity: City;
  toCity: City;
  distance: number;
  options: TravelModeOption[];
}
