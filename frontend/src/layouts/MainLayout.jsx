import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function MainLayout() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/home" className="text-xl font-bold text-primary-600">
              Carona FAM
            </Link>
            <nav className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/home/rides/history"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Histórico
                  </Link>
                  <Link
                    to="/home/profile"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Perfil
                  </Link>
                  {user?.role === 'ADMIN' || user?.isAdmin ? (
                    <Link
                      to="/admin"
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Admin
                    </Link>
                  ) : null}
                  <span className="text-gray-500 text-sm">{user?.name}</span>
                  <button
                    onClick={handleLogout}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Sair
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Entrar
                  </Link>
                  <Link
                    to="/register"
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                  >
                    Cadastrar
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-gray-100 border-t py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          Carona FAM &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
