import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Meu Perfil</h1>
      <Card className="p-6">
        <dl className="space-y-4">
          <div>
            <dt className="text-sm text-gray-500">Nome</dt>
            <dd className="text-gray-900">{user?.name}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Email</dt>
            <dd className="text-gray-900">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Função</dt>
            <dd className="text-gray-900">{user?.role}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
