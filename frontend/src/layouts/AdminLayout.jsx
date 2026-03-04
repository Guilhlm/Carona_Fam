import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const adminNavItems = [
  { path: '/admin', label: 'Dashboard' },
  { path: '/admin/users', label: 'Usuários' },
  { path: '/admin/drivers', label: 'Motoristas' },
  { path: '/admin/rides', label: 'Corridas' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-64 bg-white shadow-sm border-r flex flex-col">
        <div className="p-4 border-b">
          <Link to="/home" className="text-lg font-bold text-primary-600">
            Carona FAM
          </Link>
          <p className="text-xs text-gray-500 mt-1">Painel Admin</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {adminNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-primary-600"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <p className="text-sm text-gray-600 truncate">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="mt-2 text-sm text-red-600 hover:text-red-700"
          >
            Sair
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-800">Área Administrativa</h1>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
