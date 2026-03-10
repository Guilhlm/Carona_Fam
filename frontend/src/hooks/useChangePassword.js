import { useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import { changePassword } from '../services/authService';

export function useChangePassword() {
  const { showToast } = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      showToast('Preencha todos os campos para alterar sua senha', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('A confirmação de senha não confere com a nova senha', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await changePassword({ newPassword });
      const message =
        response?.message || 'Senha alterada com sucesso. Use a nova senha no próximo login.';
      showToast(message, 'success');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const message =
        err.response?.data?.error ||
        'Não foi possível alterar sua senha. Verifique os dados informados.';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return {
    newPassword,
    confirmPassword,
    loading,
    setNewPassword,
    setConfirmPassword,
    handleSubmit,
  };
}
