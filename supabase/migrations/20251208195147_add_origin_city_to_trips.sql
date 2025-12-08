/*
  # Add Origin City to Trips

  1. Changes
    - Add `origin_city_id` column to `trips` table as a foreign key to `cities` table
    - This allows users to specify their starting point for the trip
    - Column is nullable for backward compatibility with existing trips
  
  2. Security
    - No RLS changes needed as trips table already has proper policies
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'origin_city_id'
  ) THEN
    ALTER TABLE trips ADD COLUMN origin_city_id uuid REFERENCES cities(id) ON DELETE SET NULL;
  END IF;
END $$;