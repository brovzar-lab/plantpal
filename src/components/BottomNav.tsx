import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', icon: '🌿', label: 'My Garden' },
  { to: '/identify', icon: '🔍', label: 'Identify' },
  { to: '/schedule', icon: '📅', label: 'Schedule' },
  { to: '/profile', icon: '👤', label: 'Profile' },
];

export default function BottomNav() {
  return (
    <nav className="flex border-t border-slate-200 bg-white">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
              isActive ? 'text-green-600' : 'text-slate-400'
            }`
          }
        >
          <span className="text-xl leading-none">{tab.icon}</span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
