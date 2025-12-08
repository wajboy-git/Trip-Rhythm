/*
  # Add consider_weather column to trips table

  ## Description
  This migration adds a new boolean column `consider_weather` to the `trips` table to track whether weather conditions should be considered when generating trip itineraries.

  ## Changes
  1. New Columns
    - `trips.consider_weather` (boolean, default: true)
      - Indicates whether the AI should factor weather forecasts into activity planning
      - Defaults to true for optimal trip planning

  ## Notes
  - The column defaults to true to enable weather-aware planning by default
  - Existing trips will have this value set to true
  - Users can toggle this setting when creating new trips
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'consider_weather'
  ) THEN
    ALTER TABLE trips ADD COLUMN consider_weather BOOLEAN DEFAULT true;
  END IF;
END $$;