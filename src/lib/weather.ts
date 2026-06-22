import type { WeatherData, WeatherDay } from './types';

interface OpenMeteoResponse {
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
  };
}

export async function fetchWeather(lat: number, lng: number): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max',
    timezone: 'auto',
    forecast_days: '8',
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);
  const data = (await res.json()) as OpenMeteoResponse;
  const { daily } = data;
  const days: WeatherDay[] = daily.time.slice(0, 8).map((date, i) => ({
    date,
    weatherCode: daily.weather_code[i] ?? 0,
    tempMaxC: Math.round(daily.temperature_2m_max[i] ?? 0),
    tempMinC: Math.round(daily.temperature_2m_min[i] ?? 0),
    precipitationMm: daily.precipitation_sum[i] ?? 0,
    precipProbabilityPct: daily.precipitation_probability_max[i] ?? 0,
  }));
  return {
    lat,
    lng,
    fetchedAt: new Date().toISOString(),
    today: days[0],
    forecast: days.slice(1),
  };
}

export function requestLocation(): Promise<GeolocationCoordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      (err) => reject(err),
      { timeout: 10000, maximumAge: 300_000 }
    );
  });
}
