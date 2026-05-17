import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import AuthInput from '../components/ui/AuthInput';
import LoginButton from '../components/ui/LoginButton';
import Logo from '../assets/images/Logo.png';
import { isValidEmail, normalizeEmail } from '../utils/validation';

export default function AuthLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { showToast, hideToast } = useToast();

  useEffect(() => {
    if (isAuthenticated) navigate('/home', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      showToast('Informe um e-mail válido.', 'error');
      return;
    }
    setLoading(true);
    try {
      await login(normalizedEmail, password);
      hideToast();
      navigate('/home');
    } catch (err) {
      const message = err.response?.data?.error || 'Falha ao fazer login';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen max-h-screen flex items-center justify-center px-4 py-8 text-text-main relative overflow-x-hidden overflow-y-auto">
      <div className="w-full max-w-[390px]">
        <Link to="/" className="flex flex-col items-center mb-10">
          <img src={Logo} alt="Carona FAM" className="w-45 h-45 transform scale-[0.92]" />
          <p className="text-sm font-medium text-text-main">Carona FAM</p>
        </Link>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 px-3 py-6"
        >
          <AuthInput
            type="email"
            placeholder="Email"
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
                onClick={() => navigate('/forgot-password')}
                className="text-xs text-brand hover:text-brand/60">Esqueceu sua senha?</button>
            </div>
          </div>

          <div className="flex flex-col items-center gap-5 pt-20">
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="text-xs text-brand hover:text-text-main/60">Criar uma conta</button>

            <LoginButton loading={loading} />
          </div>
        </form>
      </div>
    </div>
  );
}