import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import AuthInput from '../components/ui/AuthInput';
import LoginButton from '../components/ui/LoginButton';
import Background from '../assets/images/Background.png';
import Logo from '../assets/images/Logo.png';

export default function AuthLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Falha ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 text-text-main relative">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <img
          src={Background}
          alt=""
          className="w-full h-full object-cover blur-lg"
        />
        <div className="absolute inset-0"
          style={{
            background:
              'linear-gradient(125deg, rgba(9,9,10,0.9), rgba(14,14,25,0.9))',
          }}
        />
      </div>

      <div className="w-full max-w-[390px]">
        <div className="flex flex-col items-center mb-10">
          <img src={Logo} alt="Carona FAM" className="w-45 h-45" />
          <p className="text-sm font-medium text-text-main">Carona FAM</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 px-3 py-6"
        >
          <AuthInput
            type="email"
            placeholder="Login"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={
              <FiMail className="h-5 w-5" />
            }
          />

          <div className="space-y-4">
            <AuthInput
              type={showPassword ? 'text' : 'password'}
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={
                <FiLock className="h-5 w-5" />
              }
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-text-muted/60 hover:text-text-muted"
                >
                  {showPassword ? (
                    <FiEyeOff className="h-5 w-5" />
                  ) : (
                    <FiEye className="h-5 w-5" />
                  )}
                </button>
              }
            />
            <div className="flex justify-end">
              <button
                type="button"
                className="text-xs text-brand hover:text-brand/60"
              >
                Esqueceu sua senha?
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 text-center mt-1">{error}</p>
          )}

          <div className="flex flex-col items-center gap-5 pt-36">
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="text-xs text-brand hover:text-text-main/60"
            >
              Criar uma conta
            </button>

            <LoginButton loading={loading} />
          </div>
        </form>
      </div>
    </div>
  );
}