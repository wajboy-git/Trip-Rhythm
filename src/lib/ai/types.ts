import type { DayPlan, TripFormData, AdjustmentMode, AdjustmentComparison, WeatherData } from '../../types';

export interface AIProvider {
  generateItinerary(tripData: TripFormData, weatherData?: WeatherData[] | null): Promise<DayPlan[]>;
  adjustDayForFatigue(
    currentDay: DayPlan,
    dayIndex: number,
    allDays: DayPlan[],
    tripContext: TripFormData
  ): Promise<{ originalDay: DayPlan; adjustedDay: DayPlan }>;
  adjustDaysWithMode(
    startDayIndex: number,
    allDays: DayPlan[],
    tripContext: TripFormData,
    mode: AdjustmentMode
  ): Promise<AdjustmentComparison>;
}
