import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Carona FAM
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Compartilhe caronas com a comunidade. Encontre ou ofereça corridas de forma simples e segura.
        </p>
        {!isAuthenticated ? (
          <div className="flex gap-4 justify-center">
            <Link
              to="/"
              className="bg-primary-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-700"
            >
              Entrar
            </Link>
            <Link
              to="/register"
              className="border-2 border-primary-600 text-primary-600 px-8 py-3 rounded-lg font-medium hover:bg-primary-50"
            >
              Cadastrar
            </Link>
          </div>
        ) : (
          <div className="flex gap-4 justify-center">
            <Link
              to="/home/rides/history"
              className="bg-primary-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-700"
            >
              Ver Histórico de Corridas
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
