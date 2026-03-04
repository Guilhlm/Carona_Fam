import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function AuthRegisterPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    ra: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.error || 'Falha ao cadastrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Cadastrar</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome"
            name="name"
            value={form.name}
            onChange={handleChange}
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <Input
            label="Senha"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <Input
            label="RA (opcional)"
            name="ra"
            value={form.ra}
            onChange={handleChange}
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Já tem conta?{' '}
          <Link to="/" className="text-primary-600 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
