# TripRhythm

A constraint-aware, fatigue-aware travel itinerary planner powered by AI.

## Features

- **AI-Powered Itinerary Generation**: Generate personalized day-by-day travel itineraries based on your preferences
- **Constraint-Aware Planning**: Respects travel style, walking tolerance, wake/sleep times, and must-see places
- **Energy-Level Adjustments**: Fine-tune any day's intensity (Chill, Balanced, or Energetic) with flexible adjustment scopes:
  - Adjust just the current day without affecting others
  - Adjust from the current day onward through the rest of the trip
  - AI-powered rebalancing based on your preferences
- **Before/After Comparison**: See exactly what changes when adjusting itineraries with side-by-side preview
- **Weather Integration**: Consider weather patterns in your planning decisions
- **PDF Export**: Download your complete itinerary as a formatted PDF document
- **Packing List Generation**: AI-generated packing recommendations based on destination and trip details
- **Restaurant Discovery**: Find and view recommended restaurants in your destination
- **Destination Intelligence**: Access Wikipedia information about your destination
- **Guest Access**: Share read-only itinerary links with fellow travelers
- **User Authentication**: Secure login system with password reset functionality
- **Multiple AI Providers**: Switch between OpenAI, Google Gemini, or Anthropic Claude

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Routing**: React Router v6
- **Database**: Supabase (PostgreSQL)
- **AI Providers**: OpenAI, Google Gemini, Anthropic Claude
- **UI Components**: Lucide React icons, React Hot Toast

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:

   The `.env` file should contain:
   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

   # AI Provider Configuration
   AI_PROVIDER=openai
   OPENAI_API_KEY=your-openai-api-key
   GEMINI_API_KEY=your-gemini-api-key
   ANTHROPIC_API_KEY=your-anthropic-api-key
   ```

3. **Database Setup**:

   The database schema is automatically created via Supabase migrations. Tables include:
   - `trips`: Store trip details and preferences
   - `itineraries`: Store day-by-day itinerary plans (one row per day)

4. **Start development server**:
   ```bash
   npm run dev
   ```

## Usage

### Creating a Trip

1. Sign up or log in to your account
2. Click "Plan New Trip" from the home page
3. Fill in trip details:
   - Destination city
   - Start date and number of days
   - Travel style (chill/balanced/intense)
   - Walking tolerance (low/medium/high)
   - Wake and sleep times
   - Optional must-see places
   - Optionally consider weather in planning
4. Click "Create & Generate Itinerary"
5. Wait for AI to generate your personalized itinerary

### Adjusting Energy Levels

1. Open any trip to view its itinerary
2. Click on a day card to adjust its intensity
3. Choose your desired energy level:
   - **Chill**: Relaxed pace with fewer activities
   - **Balanced**: Mix of exploration and rest (default)
   - **Energetic**: High-intensity, packed schedule
4. Select adjustment scope:
   - **Only this day**: Adjust just the selected day
   - **From this day onward**: Adjust selected day and all following days
5. Review the before/after comparison
6. Accept or reject the changes

### Accessing Additional Features

- **View Packing List**: See AI-generated packing recommendations (available in trip details)
- **Find Restaurants**: Click the restaurants section to discover dining options
- **Destination Info**: Access Wikipedia information about your destination
- **Export as PDF**: Download your complete itinerary as a formatted PDF
- **Share with Travelers**: Generate a guest link to share your itinerary with others

### Switching AI Providers

Change the `AI_PROVIDER` environment variable to:
- `openai` - Uses GPT-4o-mini
- `gemini` - Uses Gemini 1.5 Flash
- `anthropic` - Uses Claude 3.5 Sonnet

## Architecture

### Database Schema

**users** (via Supabase Auth):
- User accounts managed through Supabase authentication

**trips table**:
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key to auth.users)
- `destination` (text)
- `country` (text, nullable)
- `start_date` (date)
- `days` (integer)
- `travel_style` (text: chill/balanced/intense)
- `walking_tolerance` (text: low/medium/high)
- `wake_time` (text: HH:MM)
- `sleep_time` (text: HH:MM)
- `must_see_places` (text, nullable)
- `consider_weather` (boolean)
- `origin_city` (text, nullable)
- `created_at` (timestamptz)

**itineraries table**:
- `id` (uuid, primary key)
- `trip_id` (uuid, foreign key to trips.id)
- `day_index` (integer, 1-based)
- `ai_plan_json` (jsonb - contains date, summary, activities array)
- `created_at` (timestamptz)

**cities table**:
- `id` (uuid, primary key)
- `name` (text)
- `country` (text)
- `latitude` (numeric)
- `longitude` (numeric)

**trip_cities table** (junction table):
- `id` (uuid, primary key)
- `trip_id` (uuid, foreign key to trips.id)
- `city_id` (uuid, foreign key to cities.id)
- `visit_order` (integer)

### AI Provider Abstraction

The application uses a provider abstraction layer that allows switching between different AI services without changing application code. All providers implement the same interface:

- `generateItinerary()` - Generate complete trip itinerary
- `adjustDaysWithMode()` - Adjust itinerary days with different energy levels (Chill, Balanced, Energetic)
- `generatePackingList()` - Generate destination-specific packing recommendations
- `generateRestaurantSuggestions()` - Suggest restaurants in the destination

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run typecheck` - Check TypeScript types

## License

MIT
