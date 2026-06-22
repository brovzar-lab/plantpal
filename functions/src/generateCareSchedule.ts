import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';

const anthropicKey = defineSecret('ANTHROPIC_API_KEY');

interface WeatherDay {
  date: string;
  weatherCode: number;
  tempMaxC: number;
  tempMinC: number;
  precipitationMm: number;
  precipProbabilityPct: number;
}

interface CareScheduleRequest {
  plantId: string;
  species: string;
  wateringFrequencyDays: number;
  weather: {
    today: WeatherDay;
    forecast: WeatherDay[];
  };
}

interface CareScheduleResult {
  adjustedWateringDays: number;
  adjustmentReason: string;
}

function parseResult(text: string, fallback: number): CareScheduleResult {
  const clean = text.replace(/```(?:json)?\s*/g, '').replace(/```\s*$/g, '').trim();
  const match = clean.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON in response');
  const parsed = JSON.parse(match[0]) as Record<string, unknown>;
  return {
    adjustedWateringDays:
      typeof parsed.adjustedWateringDays === 'number'
        ? Math.max(1, Math.round(parsed.adjustedWateringDays))
        : fallback,
    adjustmentReason:
      typeof parsed.adjustmentReason === 'string'
        ? parsed.adjustmentReason
        : 'Standard schedule maintained.',
  };
}

export const generateCareSchedule = onCall(
  { secrets: [anthropicKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const data = (request.data ?? {}) as Partial<CareScheduleRequest>;
    const { plantId, species, wateringFrequencyDays, weather } = data;

    if (!plantId || !species || !wateringFrequencyDays || !weather) {
      throw new HttpsError('invalid-argument', 'Missing required fields');
    }

    const uid = request.auth.uid;
    const totalRain7d = weather.forecast.slice(0, 7).reduce((s, d) => s + d.precipitationMm, 0);
    const avgPrecipProb = Math.round(
      weather.forecast.slice(0, 7).reduce((s, d) => s + d.precipProbabilityPct, 0) / 7
    );
    const avgHighTemp = Math.round(
      weather.forecast.slice(0, 7).reduce((s, d) => s + d.tempMaxC, 0) / 7
    );

    const prompt = `You are a plant care expert. Based on the species and current weather, determine the optimal watering schedule.

Plant species: ${species}
Default watering: every ${wateringFrequencyDays} days
Today: ${weather.today.tempMaxC}°C high / ${weather.today.tempMinC}°C low, ${weather.today.precipitationMm}mm rain
7-day forecast: total ${totalRain7d.toFixed(1)}mm rain, avg ${avgPrecipProb}% rain probability, avg high ${avgHighTemp}°C

Return ONLY valid JSON with no markdown:
{"adjustedWateringDays": <integer>, "adjustmentReason": "<one sentence explanation>"}`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey.value(),
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      console.error('Claude API error:', await res.text());
      throw new HttpsError('internal', 'Care schedule service unavailable');
    }

    const apiData = (await res.json()) as { content: Array<{ type: string; text: string }> };
    const text = apiData.content[0]?.text ?? '{}';

    let result: CareScheduleResult;
    try {
      result = parseResult(text, wateringFrequencyDays);
    } catch (err) {
      console.error('Parse error:', err, 'raw:', text);
      throw new HttpsError('internal', 'Failed to parse care schedule result');
    }

    await admin.firestore().doc(`users/${uid}/plants/${plantId}`).update({
      adjustedWateringDays: result.adjustedWateringDays,
      adjustmentReason: result.adjustmentReason,
      lastScheduleUpdatedAt: new Date().toISOString(),
    });

    return result;
  }
);
