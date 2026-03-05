import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getMe, updateMe } from '../services/userService';

const EDITABLE_FIELDS = [
  'name',
  'email',
  'ra',
  'course',
  'gender',
  'age',
  'phone',
  'cep',
];

const emptyForm = {
  name: '',
  email: '',
  ra: '',
  course: '',
  gender: '',
  age: '',
  phone: '',
  cep: '',
  photoUrl: '',
  role: 'USER',
};

const normalizeUserToForm = (user, fallbackPhoto = '') => ({
  name: user?.name || '',
  email: user?.email || '',
  ra: user?.ra || '',
  course: user?.course || '',
  gender:
    user?.gender === 'MASCULINO' || user?.gender === 'FEMININO' ? user.gender : '',
  age: user?.age ? String(user.age) : '',
  phone: user?.phone || '',
  cep: user?.cep || '',
  photoUrl: user?.photoUrl || fallbackPhoto || '',
  role: user?.role || 'USER',
});

export function useProfile() {
  const { user, refreshUser } = useAuth();
  const { showToast, hideToast } = useToast();

  const [form, setForm] = useState(emptyForm);
  const [initialForm, setInitialForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const me = await getMe();
        if (!isMounted) return;

        const normalized = normalizeUserToForm(me);
        setForm(normalized);
        setInitialForm(normalized);
      } catch (err) {
        if (!isMounted) return;
        showToast('Não foi possível carregar seus dados de perfil.', 'error');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [showToast]);

  const handleChange = useCallback(
    (field) => (e) => {
      const { value } = e.target;
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleNumericChange = useCallback(
    (field) => (e) => {
      const onlyDigits = e.target.value.replace(/\D/g, '');
      setForm((prev) => ({ ...prev, [field]: onlyDigits }));
    },
    []
  );

  const handleAvatarClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleAvatarChange = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();

      reader.onload = async () => {
        const base64 = reader.result;
        if (typeof base64 !== 'string') return;

        setUploadingPhoto(true);
        try {
          const updated = await updateMe({ photoUrl: base64 });
          setForm((prev) => ({
            ...prev,
            photoUrl: updated.photoUrl || base64,
          }));
          refreshUser(updated);
          hideToast();
          showToast('Foto de perfil atualizada com sucesso.', 'success');
        } catch (err) {
          const message =
            err.response?.data?.error ||
            'Não foi possível atualizar sua foto de perfil.';
          showToast(message, 'error');
        } finally {
          setUploadingPhoto(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };

      reader.readAsDataURL(file);
    },
    [hideToast, refreshUser, showToast]
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setSaving(true);
      try {
        const payload = {
          name: form.name,
          email: form.email,
          ra: form.ra,
          course: form.course,
          gender: form.gender,
          age: form.age,
          phone: form.phone,
          cep: form.cep,
        };

        const updated = await updateMe(payload);
        const normalized = normalizeUserToForm(updated, form.photoUrl);

        setForm(normalized);
        setInitialForm(normalized);
        refreshUser(updated);
        hideToast();
        showToast('Cadastro atualizado com sucesso.', 'success');
      } catch (err) {
        const message =
          err.response?.data?.error || 'Não foi possível atualizar seu cadastro.';
        showToast(message, 'error');
      } finally {
        setSaving(false);
      }
    },
    [form, hideToast, refreshUser, showToast]
  );

  const displayName =
    form.name || user?.name || emptyForm.name || 'Seu nome completo';
  const displayEmail = form.email || user?.email || emptyForm.email || 'Seu email';
  const displayPhoto = form.photoUrl || user?.photoUrl || emptyForm.photoUrl || '';

  const handleRoleChange = useCallback(
    async (nextRole) => {
      if (!nextRole || nextRole === form.role) return;
      setUpdatingRole(true);
      try {
        const updated = await updateMe({ role: nextRole });
        const normalized = normalizeUserToForm(updated, form.photoUrl);
        setForm(normalized);
        setInitialForm((prev) => (prev ? { ...prev, role: normalized.role } : normalized));
        refreshUser(updated);
        hideToast();
        showToast('Tipo de conta atualizado com sucesso.', 'success');
      } catch (err) {
        const message =
          err.response?.data?.error || 'Não foi possível atualizar o tipo de conta.';
        showToast(message, 'error');
      } finally {
        setUpdatingRole(false);
      }
    },
    [form.photoUrl, form.role, hideToast, refreshUser, showToast]
  );

  const hasChanges = useMemo(() => {
    if (loading || !initialForm) return false;
    return EDITABLE_FIELDS.some(
      (field) => (form[field] || '') !== (initialForm[field] || '')
    );
  }, [form, initialForm, loading]);

  return {
    user,
    form,
    loading,
    saving,
    uploadingPhoto,
    updatingRole,
    hasChanges,
    fileInputRef,
    handleChange,
    handleNumericChange,
    handleAvatarClick,
    handleAvatarChange,
    handleRoleChange,
    handleSubmit,
    displayName,
    displayEmail,
    displayPhoto,
    role: form.role || user?.role || 'USER',
  };
}

export const PROFILE_INPUT_FIELDS = [
  {
    key: 'name',
    label: 'Nome:',
    type: 'text',
    placeholder: 'Seu nome completo',
  },
  {
    key: 'ra',
    label: 'RA:',
    type: 'text',
    placeholder: 'RA do estudante',
    numeric: true,
    extraProps: { inputMode: 'numeric' },
  },
  {
    key: 'course',
    label: 'Curso:',
    type: 'text',
    placeholder: 'Seu curso',
  },
  {
    key: 'age',
    label: 'Idade:',
    type: 'number',
    placeholder: 'Sua idade',
    extraProps: { min: 0 },
  },
  {
    key: 'phone',
    label: 'Telefone:',
    type: 'tel',
    placeholder: 'Telefone para contato',
  },
  {
    key: 'cep',
    label: 'CEP:',
    type: 'text',
    placeholder: 'CEP da sua região',
  },
];
