import { useState } from 'react';
import { useStore } from '../lib/store';
import { isDemoMode } from '../lib/config';
import type { CareTask, CareType, WeatherData } from '../lib/types';
import { DEMO_AI_ADJUSTMENTS } from '../demo/seed';

const CARE_ICONS: Record<CareType, string> = {
  water: '💧',
  fertilize: '🌿',
  repot: '🪴',
  prune: '✂️',
  mist: '💦',
};

const CARE_LABELS: Record<CareType, string> = {
  water: 'Water',
  fertilize: 'Fertilize',
  repot: 'Repot',
  prune: 'Prune',
  mist: 'Mist',
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatShortDate(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00');
  return `${DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

function getTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function weatherEmoji(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 3) return '⛅';
  if (code <= 48) return '🌫';
  if (code <= 67) return '🌧';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌦';
  return '⛈';
}

interface WeatherWidgetProps {
  weather: WeatherData;
  onPersonalize: () => void;
  isPersonalizing: boolean;
}

function WeatherWidget({ weather, onPersonalize, isPersonalizing }: WeatherWidgetProps) {
  const { today } = weather;
  return (
    <div className="bg-gradient-to-br from-sky-50 to-indigo-50 border border-sky-100 rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-3xl flex-shrink-0">{weatherEmoji(today.weatherCode)}</span>
          <div className="min-w-0">
            <p className="text-base font-bold text-slate-900 leading-tight">
              {today.tempMaxC}° / {today.tempMinC}°C
            </p>
            <p className="text-xs text-slate-500 truncate">
              {today.precipitationMm > 0
                ? `${today.precipitationMm}mm rain`
                : 'No rain today'}{' '}
              · {today.precipProbabilityPct}% chance
            </p>
          </div>
        </div>
        <button
          onClick={onPersonalize}
          disabled={isPersonalizing}
          className="text-xs bg-green-600 text-white px-3 py-2 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors flex-shrink-0"
        >
          {isPersonalizing ? '⏳ Updating…' : '✨ AI Schedule'}
        </button>
      </div>
    </div>
  );
}

interface WeatherPromptProps {
  onEnable: () => void;
  isLoading: boolean;
  errorMsg: string | null;
}

function WeatherPrompt({ onEnable, isLoading, errorMsg }: WeatherPromptProps) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-3">
      <span className="text-2xl flex-shrink-0">🌤</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-700">Weather-smart schedules</p>
        <p className="text-xs text-slate-400 truncate">
          {errorMsg ?? 'Enable location for AI-adjusted watering'}
        </p>
      </div>
      <button
        onClick={onEnable}
        disabled={isLoading}
        className="text-xs bg-green-600 text-white px-3 py-2 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors flex-shrink-0"
      >
        {isLoading ? '…' : 'Enable'}
      </button>
    </div>
  );
}

interface TaskCardProps {
  task: CareTask;
  isOverdue: boolean;
  adjustmentReason?: string;
  onMark: () => void;
}

function TaskCard({ task, isOverdue, adjustmentReason, onMark }: TaskCardProps) {
  return (
    <div
      className={`bg-white border rounded-2xl p-3 shadow-sm ${
        isOverdue ? 'border-red-200 bg-red-50/30' : 'border-slate-100'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl flex-shrink-0">{CARE_ICONS[task.type]}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 text-sm">{task.plantName}</p>
          <p className="text-xs text-slate-400">{CARE_LABELS[task.type]}</p>
        </div>
        <button
          onClick={onMark}
          className="w-7 h-7 rounded-full border-2 border-green-300 flex items-center justify-center hover:bg-green-50 transition-colors flex-shrink-0"
          aria-label="Mark done"
        >
          <span className="text-xs text-green-600 font-bold">✓</span>
        </button>
      </div>
      {adjustmentReason && task.type === 'water' && (
        <p className="text-xs text-sky-600 mt-1.5 pl-11 leading-relaxed">🌤 {adjustmentReason}</p>
      )}
    </div>
  );
}

export default function CareScheduleScreen() {
  const careTasks = useStore((s) => s.careTasks);
  const markTaskDone = useStore((s) => s.markTaskDone);
  const showToast = useStore((s) => s.showToast);
  const plants = useStore((s) => s.plants);
  const weather = useStore((s) => s.weather);
  const setWeather = useStore((s) => s.setWeather);
  const updatePlant = useStore((s) => s.updatePlant);

  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [isPersonalizing, setIsPersonalizing] = useState(false);

  const today = getTodayIso();
  const pending = careTasks.filter((t) => !t.done);

  const overdueTasks = pending
    .filter((t) => t.dueDate.slice(0, 10) < today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const todayTasks = pending.filter((t) => t.dueDate.slice(0, 10) === today);

  const futureGrouped = new Map<string, CareTask[]>();
  for (const task of pending.filter((t) => t.dueDate.slice(0, 10) > today)) {
    const key = task.dueDate.slice(0, 10);
    futureGrouped.set(key, [...(futureGrouped.get(key) ?? []), task]);
  }
  const futureSorted = Array.from(futureGrouped.entries()).sort(([a], [b]) => a.localeCompare(b));

  function getAdjustmentReason(task: CareTask): string | undefined {
    return plants.find((p) => p.id === task.plantId)?.adjustmentReason;
  }

  function handleMark(taskId: string) {
    if (isDemoMode) showToast('Demo mode — not saved');
    markTaskDone(taskId);
  }

  async function handleEnableWeather() {
    setIsLoadingWeather(true);
    setWeatherError(null);
    try {
      const { requestLocation, fetchWeather } = await import('../lib/weather');
      const coords = await requestLocation();
      const data = await fetchWeather(coords.latitude, coords.longitude);
      setWeather(data);
    } catch (err) {
      const code = (err as { code?: number })?.code;
      setWeatherError(code === 1 ? 'Location access denied' : 'Could not load weather');
    } finally {
      setIsLoadingWeather(false);
    }
  }

  async function handlePersonalize() {
    if (!weather) return;
    setIsPersonalizing(true);

    if (isDemoMode) {
      await new Promise<void>((r) => setTimeout(r, 1500));
      for (const [plantId, adj] of Object.entries(DEMO_AI_ADJUSTMENTS)) {
        updatePlant(plantId, adj);
      }
      showToast('Schedule personalized for this week\'s weather! 🌿');
      setIsPersonalizing(false);
      return;
    }

    try {
      const { generateCareScheduleViaFunction } = await import('../lib/firebase');
      const waterPlantIds = [...new Set(pending.filter((t) => t.type === 'water').map((t) => t.plantId))];
      await Promise.all(
        waterPlantIds.map(async (plantId) => {
          const plant = plants.find((p) => p.id === plantId);
          if (!plant) return;
          const result = await generateCareScheduleViaFunction({
            plantId,
            species: plant.scientificName || plant.commonName,
            wateringFrequencyDays: plant.wateringFrequencyDays,
            weather: { today: weather.today, forecast: weather.forecast },
          });
          updatePlant(plantId, {
            adjustedWateringDays: result.adjustedWateringDays,
            adjustmentReason: result.adjustmentReason,
            lastScheduleUpdatedAt: new Date().toISOString(),
          });
        })
      );
      showToast('Schedule personalized for this week\'s weather! 🌿');
    } catch {
      showToast('Could not personalize schedule. Try again.');
    }
    setIsPersonalizing(false);
  }

  const totalPending = pending.length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900">Care Schedule</h1>
        <p className="text-sm text-slate-400">
          {totalPending} upcoming task{totalPending !== 1 ? 's' : ''}
          {overdueTasks.length > 0 && (
            <span className="ml-2 text-red-500 font-semibold">· {overdueTasks.length} overdue</span>
          )}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-5">
        {/* Weather widget */}
        {weather ? (
          <WeatherWidget
            weather={weather}
            onPersonalize={() => void handlePersonalize()}
            isPersonalizing={isPersonalizing}
          />
        ) : (
          <WeatherPrompt
            onEnable={() => void handleEnableWeather()}
            isLoading={isLoadingWeather}
            errorMsg={weatherError}
          />
        )}

        {totalPending === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <span className="text-6xl mb-4">🎉</span>
            <p className="text-slate-600 font-semibold">All caught up!</p>
            <p className="text-sm text-slate-400">No upcoming care tasks</p>
          </div>
        ) : (
          <>
            {/* Overdue section */}
            {overdueTasks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-bold text-red-500 uppercase tracking-wider">Overdue</p>
                  <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">
                    {overdueTasks.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {overdueTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isOverdue
                      adjustmentReason={getAdjustmentReason(task)}
                      onMark={() => handleMark(task.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Today section */}
            {todayTasks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today</p>
                  <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">
                    Due
                  </span>
                </div>
                <div className="space-y-2">
                  {todayTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isOverdue={false}
                      adjustmentReason={getAdjustmentReason(task)}
                      onMark={() => handleMark(task.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Future sections grouped by date */}
            {futureSorted.map(([dateKey, tasks]) => (
              <div key={dateKey}>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {formatShortDate(dateKey)}
                </p>
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isOverdue={false}
                      adjustmentReason={getAdjustmentReason(task)}
                      onMark={() => handleMark(task.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
