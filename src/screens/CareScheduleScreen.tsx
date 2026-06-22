import { useStore } from '../lib/store';
import { isDemoMode } from '../lib/config';
import type { CareTask, CareType } from '../lib/types';

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

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date(2026, 5, 22); // anchored demo date
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function groupByDate(tasks: CareTask[]): [string, CareTask[]][] {
  const map = new Map<string, CareTask[]>();
  for (const task of tasks) {
    const key = task.dueDate.slice(0, 10);
    const group = map.get(key) ?? [];
    group.push(task);
    map.set(key, group);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}

export default function CareScheduleScreen() {
  const careTasks = useStore((s) => s.careTasks);
  const markTaskDone = useStore((s) => s.markTaskDone);
  const showToast = useStore((s) => s.showToast);

  const pending = careTasks.filter((t) => !t.done);
  const grouped = groupByDate(pending);

  function handleMark(taskId: string) {
    if (isDemoMode) {
      showToast('Demo mode — not saved');
    }
    markTaskDone(taskId);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900">Care Schedule</h1>
        <p className="text-sm text-slate-400">{pending.length} upcoming task{pending.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-6">
        {grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span className="text-6xl mb-4">🎉</span>
            <p className="text-slate-600 font-semibold">All caught up!</p>
            <p className="text-sm text-slate-400">No upcoming care tasks</p>
          </div>
        ) : (
          grouped.map(([dateKey, tasks]) => {
            const today = isToday(tasks[0].dueDate);
            return (
              <div key={dateKey}>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {today ? 'Today' : formatDate(tasks[0].dueDate)}
                  </p>
                  {today && (
                    <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">Due</span>
                  )}
                </div>
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl p-3 shadow-sm"
                    >
                      <span className="text-2xl">{CARE_ICONS[task.type]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm">{task.plantName}</p>
                        <p className="text-xs text-slate-400">{CARE_LABELS[task.type]}</p>
                      </div>
                      <button
                        onClick={() => handleMark(task.id)}
                        className="w-7 h-7 rounded-full border-2 border-green-300 flex items-center justify-center hover:bg-green-50 transition-colors flex-shrink-0"
                        aria-label="Mark done"
                      >
                        <span className="text-xs text-green-600 font-bold">✓</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
