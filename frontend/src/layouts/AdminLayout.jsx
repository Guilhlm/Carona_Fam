import { useState } from 'react';
import BottomNav from '../components/ui/BottomNav';
import AdminUsersPage from '../pages/Admin/AdminUsersPage';
import AdminDriversPage from '../pages/Admin/AdminDriversPage';
import AdminRidesPage from '../pages/Admin/AdminRidesPage';

const adminNavItems = [
  { id: 'users', label: 'Usuários' },
  { id: 'drivers', label: 'Motoristas' },
  { id: 'rides', label: 'Corridas' },
];

export default function AdminLayout() {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="min-h-screen flex flex-col relative">
      <main className="flex-1 pb-24 px-4 py-8 text-text-main overflow-x-hidden">
        <div className="w-full max-w-4xl mx-auto flex flex-col">
          <header className="mb-4">
            <h1 className="text-center text-xl mb-5 md:text-2xl font-semibold text-text-main">Área Administrativa</h1>
          </header>

          <nav className="flex gap-3 mb-4">
            {adminNavItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex-1 h-[38px] px-3 rounded-[10px] text-xs md:text-sm border flex items-center justify-center transition-colors ${
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

          <div className="rounded-[10px] border-2 border-border-muted bg-surface-input/20 backdrop-blur-2xl px-4 py-5 md:px-6 md:py-6 shadow-2xl text-sm text-text-main">
            {activeTab === 'drivers' && <AdminDriversPage />}
            {activeTab === 'rides' && activeTab !== 'drivers' && <AdminRidesPage />}
            {activeTab === 'users' && <AdminUsersPage />}
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}