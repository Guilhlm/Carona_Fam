import { useLocation, useNavigate } from 'react-router-dom';
import { FiMap, FiHome, FiSettings, FiShield } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { path: '/home/rides/request', label: 'Pedir Corrida', icon: FiMap },
  { path: '/home', label: 'Home', icon: FiHome },
  { path: '/home/profile', label: 'Configurações', icon: FiSettings },
  { path: '/admin', label: 'Admin', icon: FiShield, adminOnly: true },
];

function isItemActive(pathname, item) {
  if (item.path === '/home') {
    return (
      pathname === '/home' ||
      pathname === '/home/' ||
      pathname.startsWith('/home/rides/history') ||
      pathname.startsWith('/home/ride/')
    );
  }
  if (item.path === '/admin') {
    return pathname.startsWith('/admin');
  }
  return pathname === item.path || pathname.startsWith(item.path + '/');
}

export default function BottomNav() {
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  if (!isAuthenticated) return null;

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="fixed bottom-4 left-0 right-0 flex justify-center px-4 pointer-events-none z-50">
      <nav
        className="pointer-events-auto flex items-center justify-between gap-2 w-full max-w-4xl rounded-[10px] border border-[#333232] px-6 py-3"
        style={{ backgroundColor: 'rgba(36, 36, 36, 0.2)', backdropFilter: 'blur(24px)' }}
      >
        {visibleItems.map((item) => {
          const active = isItemActive(pathname, item);
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-1 text-xs text-white min-w-0 flex-1"
            >
              {active ? (
                <div className="rounded-full border border-[#333232] px-4 py-3 shadow-md flex items-center justify-center" style={{ backgroundColor: '#242424' }}>
                  <Icon className="w-5 h-5 shrink-0" />
                </div>
              ) : (
                <Icon className="w-5 h-5 shrink-0" />
              )}
              <span className={active ? 'sr-only' : 'whitespace-nowrap'}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}