import { useState } from 'react';
import BottomNav from '../components/ui/BottomNav';
import AdminUsersPage from '../pages/Admin/AdminUsersPage';
import AdminDriversPage from '../pages/Admin/AdminDriversPage';
import AdminVehiclesPage from '../pages/Admin/AdminVehiclesPage';
import AdminReviewsPage from '../pages/Admin/AdminReviewsPage';
import AdminRidesPage from '../pages/Admin/AdminRidesPage';

const adminNavItems = [
  { id: 'users', label: 'Usuários' },
  { id: 'drivers', label: 'Motoristas' },
  { id: 'vehicles', label: 'Veículos' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'rides', label: 'Corridas' },
];

const TAB_PAGES = {
  users: AdminUsersPage,
  drivers: AdminDriversPage,
  vehicles: AdminVehiclesPage,
  reviews: AdminReviewsPage,
  rides: AdminRidesPage,
};

export default function AdminLayout() {
  const [activeTab, setActiveTab] = useState('users');
  const ActivePage = TAB_PAGES[activeTab] ?? AdminUsersPage;

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden relative overscroll-none">
      <main className="flex-1 min-h-0 flex flex-col px-4 pt-4 pb-28 text-text-main overflow-hidden">
        <div className="w-full max-w-4xl md:max-w-5xl xl:max-w-6xl mx-auto flex flex-col flex-1 min-h-0 h-full">
          <header className="shrink-0 mb-3">
            <h1 className="text-center text-xl md:text-2xl font-semibold text-text-main">
              Área Administrativa
            </h1>
          </header>

          <nav className="shrink-0 flex gap-2 md:gap-3 mb-3" aria-label="Abas do admin">
            {adminNavItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex-1 h-[38px] px-2 md:px-3 rounded-[10px] text-xs md:text-sm border flex items-center justify-center transition-colors ${
                    active
                      ? 'bg-brand text-text-main border-brand/80'
                      : 'border-border-muted text-text-muted hover:border-brand/60 hover:text-text-main'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex-1 min-h-0 rounded-[10px] border-2 border-border-muted bg-surface-input/20 backdrop-blur-2xl px-4 py-4 md:px-6 md:py-5 shadow-2xl text-sm text-text-main flex flex-col overflow-hidden">
            <div className="flex flex-1 min-h-0 flex-col overflow-hidden h-full w-full">
              <ActivePage key={activeTab} />
            </div>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
