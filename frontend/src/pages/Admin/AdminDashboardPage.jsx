import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Admin</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/admin/users">
          <Card className="p-6 hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-gray-900">Usuários</h3>
            <p className="text-sm text-gray-500 mt-1">Gerenciar usuários e bloqueios</p>
          </Card>
        </Link>
        <Link to="/admin/drivers">
          <Card className="p-6 hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-gray-900">Motoristas</h3>
            <p className="text-sm text-gray-500 mt-1">Listar motoristas e veículos</p>
          </Card>
        </Link>
        <Link to="/admin/rides">
          <Card className="p-6 hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-gray-900">Corridas</h3>
            <p className="text-sm text-gray-500 mt-1">Visualizar todas as corridas</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
