import OpenAI from 'openai';
import type { AIProvider } from './types';
import type { DayPlan, TripFormData, AdjustmentMode, AdjustmentComparison } from '../../types';

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  }

  async generateItinerary(tripData: TripFormData): Promise<DayPlan[]> {
    const prompt = this.buildGeneratePrompt(tripData);

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a travel planning expert. Generate detailed, realistic day-by-day itineraries that respect user constraints. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);
    return parsed.days as DayPlan[];
  }

  async adjustDayForFatigue(
    currentDay: DayPlan,
    dayIndex: number,
    allDays: DayPlan[],
    tripContext: TripFormData
  ): Promise<{ originalDay: DayPlan; adjustedDay: DayPlan }> {
    const prompt = this.buildAdjustPrompt(currentDay, dayIndex, allDays, tripContext);

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a travel planning expert. Adjust itineraries to reduce fatigue while maintaining trip quality. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);
    return {
      originalDay: parsed.originalDay,
      adjustedDay: parsed.adjustedDay,
    };
  }

  async adjustDaysWithMode(
    startDayIndex: number,
    allDays: DayPlan[],
    tripContext: TripFormData,
    mode: AdjustmentMode
  ): Promise<AdjustmentComparison> {
    const daysToAdjust = allDays.slice(startDayIndex - 1);
    const prompt = this.buildAdjustWithModePrompt(startDayIndex, daysToAdjust, allDays, tripContext, mode);

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a travel planning expert. Adjust itineraries based on user preferences while maintaining trip quality. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);
    return {
      originalDays: daysToAdjust,
      adjustedDays: parsed.adjustedDays,
      startDayIndex,
      mode,
    };
  }

  private buildGeneratePrompt(tripData: TripFormData): string {
    const startDate = new Date(tripData.start_date);

    const destinationInfo = tripData.cities && tripData.cities.length > 0
      ? tripData.cities.map(city => `${city.name}, ${city.country} (${city.latitude}, ${city.longitude})`).join(' → ')
      : tripData.destination;

    const originNote = tripData.originCity
      ? `\n- Origin City: Starting from ${tripData.originCity.name}, ${tripData.originCity.country}`
      : '';

    const citiesNote = tripData.cities && tripData.cities.length > 1
      ? `\n- Multi-City Trip: The itinerary should flow across these cities in order: ${tripData.cities.map(c => `${c.name}, ${c.country}`).join(' → ')}`
      : '';

    return `Generate a ${tripData.days}-day travel itinerary for ${destinationInfo}.

Trip Details:
- Destination: ${destinationInfo}${originNote}
- Start Date: ${tripData.start_date}
- Number of Days: ${tripData.days}
- Travel Style: ${tripData.travel_style} (chill = relaxed pace with downtime; balanced = moderate sightseeing with breaks; intense = packed schedule)
- Walking Tolerance: ${tripData.walking_tolerance} (low = minimal walking, use transport; medium = moderate walking with breaks; high = comfortable with long walks)
- Wake Time: ${tripData.wake_time}
- Sleep Time: ${tripData.sleep_time}${citiesNote}
${tripData.must_see_places ? `- Must-See Places: ${tripData.must_see_places}` : ''}

Requirements:
1. Create ${tripData.days} days of activities
2. Respect the wake time (${tripData.wake_time}) and sleep time (${tripData.sleep_time})
3. Match the travel style (${tripData.travel_style}) - adjust activity density accordingly
4. Match the walking tolerance (${tripData.walking_tolerance}) - adjust physical demands
5. Include must-see places if specified: ${tripData.must_see_places || 'none specified'}
6. Each activity should have a time, name, description, and effort level (low/medium/high)
7. Effort levels should reflect physical and mental demands
8. For ${tripData.travel_style} style and ${tripData.walking_tolerance} walking tolerance, balance activity intensity appropriately

Return JSON in this exact format:
{
  "days": [
    {
      "date": "YYYY-MM-DD",
      "summary": "Brief overview of the day",
      "activities": [
        {
          "time": "HH:MM",
          "name": "Activity name",
          "description": "What you'll do and why it's worthwhile",
          "effortLevel": "low|medium|high"
        }
      ]
    }
  ]
}

Generate realistic, engaging activities. Make dates sequential starting from ${tripData.start_date}.`;
  }

  private buildAdjustPrompt(
    currentDay: DayPlan,
    dayIndex: number,
    allDays: DayPlan[],
    tripContext: TripFormData
  ): string {
    return `The user finds Day ${dayIndex} too tiring. Adjust this day to reduce fatigue while keeping it enjoyable.

Original Day ${dayIndex} (${currentDay.date}):
${JSON.stringify(currentDay, null, 2)}

Trip Context:
- Destination: ${tripContext.destination}
- Travel Style: ${tripContext.travel_style}
- Walking Tolerance: ${tripContext.walking_tolerance}
- Wake Time: ${tripContext.wake_time}
- Sleep Time: ${tripContext.sleep_time}

Instructions:
1. Reduce the number of activities or their physical demands
2. Add more rest time or leisure activities
3. Lower effort levels where possible (high → medium, medium → low)
4. Consider replacing strenuous activities with relaxing alternatives
5. Keep the day enjoyable and worthwhile

Return JSON in this exact format:
{
  "originalDay": ${JSON.stringify(currentDay)},
  "adjustedDay": {
    "date": "${currentDay.date}",
    "summary": "Updated summary reflecting the more relaxed pace",
    "activities": [
      {
        "time": "HH:MM",
        "name": "Activity name",
        "description": "Description",
        "effortLevel": "low|medium|high"
      }
    ]
  }
}`;
  }

  private buildAdjustWithModePrompt(
    startDayIndex: number,
    daysToAdjust: DayPlan[],
    allDays: DayPlan[],
    tripContext: TripFormData,
    mode: AdjustmentMode
  ): string {
    let modeInstructions = '';

    if (mode === 'reduce-fatigue') {
      modeInstructions = `The user finds Day ${startDayIndex} too tiring. Adjust this day and all following days to reduce overall fatigue:
1. Reduce the number of activities or their physical demands
2. Add more rest time, leisure activities, or downtime
3. Lower effort levels where possible (high → medium, medium → low)
4. Replace strenuous activities with relaxing alternatives
5. Ensure each day feels comfortable and not overwhelming
6. Maintain trip quality while prioritizing rest and recovery`;
    } else if (mode === 'increase-energy') {
      modeInstructions = `The user has more energy and wants Day ${startDayIndex} and following days to be more active:
1. Add more activities to fill the schedule
2. Increase effort levels where appropriate (low → medium, medium → high)
3. Include more physical or adventurous activities
4. Pack the schedule more densely while keeping it realistic
5. Add exciting experiences and energetic pursuits
6. Keep some strategic breaks but maximize engagement`;
    } else if (mode === 'bring-it-on') {
      modeInstructions = `The user wants maximum intensity starting from Day ${startDayIndex}. Transform the remaining trip to INTENSE style with HIGH walking tolerance:
1. Pack each day with as many quality activities as realistically possible
2. Maximize effort levels - prioritize high-energy activities
3. Minimize downtime - only essential breaks
4. Include challenging physical activities and long walks
5. Create an adventurous, action-packed experience
6. Push the boundaries while remaining realistic and safe
7. Adjust travel style to "intense" and walking tolerance to "high"`;
    }

    return `Adjust Day ${startDayIndex} and all following days based on user preference.

Days to Adjust (starting from Day ${startDayIndex}):
${JSON.stringify(daysToAdjust, null, 2)}

Trip Context:
- Destination: ${tripContext.destination}
- Current Travel Style: ${tripContext.travel_style}
- Current Walking Tolerance: ${tripContext.walking_tolerance}
- Wake Time: ${tripContext.wake_time}
- Sleep Time: ${tripContext.sleep_time}

Mode: ${mode}

${modeInstructions}

IMPORTANT: Adjust ALL days from Day ${startDayIndex} onwards (${daysToAdjust.length} days total). Each day should reflect the requested adjustment while maintaining logical flow and trip coherence.

Return JSON in this exact format:
{
  "adjustedDays": [
    {
      "date": "YYYY-MM-DD",
      "summary": "Updated summary reflecting the adjustment",
      "activities": [
        {
          "time": "HH:MM",
          "name": "Activity name",
          "description": "Description",
          "effortLevel": "low|medium|high"
        }
      ]
    }
  ]
}

Return exactly ${daysToAdjust.length} adjusted days in the array.`;
  }
}
