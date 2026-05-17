import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import AuthInput from '../components/ui/AuthInput';
import Logo from '../assets/images/Logo.png';
import { resetPassword } from '../services/authService';
import {
  MIN_PASSWORD_LENGTH,
  isStrongPassword,
  isValidEmail,
  isValidRa,
  normalizeDigits,
  normalizeEmail,
} from '../utils/validation';

export default function AuthForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [ra, setRa] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/home', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalizedEmail = normalizeEmail(email);
    const normalizedRa = normalizeDigits(ra, 20);

    if (!normalizedEmail || !normalizedRa || !newPassword) {
      showToast('Preencha todos os campos para redefinir sua senha', 'error');
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      showToast('Informe um e-mail válido.', 'error');
      return;
    }

    if (!isValidRa(normalizedRa)) {
      showToast('RA inválido. Use ao menos 4 dígitos numéricos.', 'error');
      return;
    }

    if (!isStrongPassword(newPassword)) {
      showToast(
        `Senha deve ter ao menos ${MIN_PASSWORD_LENGTH} caracteres, incluindo letras e números.`,
        'error'
      );
      return;
    }

    setLoading(true);
    try {
      const response = await resetPassword({
        email: normalizedEmail,
        ra: normalizedRa,
        newPassword,
      });
      const message =
        response?.message || 'Senha redefinida com sucesso! Você já pode fazer login.';
      showToast(message, 'success');
      setEmail('');
      setRa('');
      setNewPassword('');
    } catch (err) {
      const message =
        err.response?.data?.error ||
        'Não foi possível redefinir sua senha. Verifique os dados informados.';
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

        <form onSubmit={handleSubmit} className="space-y-5 px-3 py-6">
          <div className="space-y-2">
            <p className="text-xs text-brand">* Digite o email cadastrado na plataforma</p>

            <AuthInput
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<FiMail className="h-5 w-5" />}
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs text-brand">* Informe seu RA (o mesmo utilizado no cadastro)</p>

            <AuthInput
              type="text"
              placeholder="RA"
              value={ra}
              onChange={(e) => setRa(e.target.value)}
              icon={<FiUser className="h-5 w-5" />}
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs text-brand">
              * Crie uma nova senha com no mínimo {MIN_PASSWORD_LENGTH} caracteres, letras e
              números
            </p>

            <AuthInput
              type={showPassword ? 'text' : 'password'}
              placeholder="Nova senha"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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

          <div className="flex flex-col items-center gap-4 pt-6">
            

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[70px] rounded-[10px] bg-brand text-text-main hover:text-text-main/60 text-sm font-medium flex items-center justify-center hover:bg-brand/60 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>{loading ? 'Redefinindo senha...' : 'Redefinir senha'}</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-xs text-brand hover:text-text-main/60"
            >
              Voltar para o login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}