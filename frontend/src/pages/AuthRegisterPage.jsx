import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import AuthInput from '../components/ui/AuthInput';
import Logo from '../assets/images/Logo.png';

export default function AuthRegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { showToast, hideToast } = useToast();

  useEffect(() => {
    if (isAuthenticated) navigate('/home', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      showToast('As senhas não coincidem', 'error');
      return;
    }

    setLoading(true);
    try {
      await register({
        email,
        password,
      });
      hideToast();
      navigate('/home');
    } catch (err) {
      const message = err.response?.data?.error || 'Falha ao cadastrar';
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
          className="space-y-5 px-3 py-6"
        >
          <div className="space-y-2">
            <p className="text-xs text-brand">* Digite seu email (exemplo@gmail.com)</p>

            <AuthInput
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<FiMail className="h-5 w-5" />}
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs text-brand">* Crie uma senha segura com caracteres especiais</p>

            <AuthInput
              type={showPassword ? 'text' : 'password'}
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<FiLock className="h-5 w-5" />}
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
          </div>

          <div className="space-y-2">
            <p className="text-xs text-brand">* Confirme sua senha</p>

            <AuthInput
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirmar senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<FiLock className="h-5 w-5" />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="text-text-muted/60 hover:text-text-muted"
                >
                  {showConfirmPassword ? (
                    <FiEyeOff className="h-5 w-5" />
                  ) : (
                    <FiEye className="h-5 w-5" />
                  )}
                </button>
              }
            />
          </div>

          <div className="flex flex-col items-center gap-5 pt-8">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[70px] rounded-[10px] bg-brand text-text-main hover:text-text-main/60 text-sm font-medium flex items-center justify-center hover:bg-brand/60 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span> {loading ? 'Criando conta...' : 'Criar sua conta agora'}</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-xs text-brand hover:text-text-main/60">Já tem conta? Entrar</button>
          </div>
        </form>
      </div>
    </div>
  );
}