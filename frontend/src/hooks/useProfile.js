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

function formatPhoneForDisplay(digits) {
  const d = String(digits || '').replace(/\D/g, '');
  if (d.length <= 2) return d ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

function formatCepForDisplay(digits) {
  const d = String(digits || '').replace(/\D/g, '').slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

const normalizeUserToForm = (user, fallbackPhoto = '') => {
  const rawPhone = user?.phone || '';
  const phoneDigits = String(rawPhone).replace(/\D/g, '');
  const rawCep = user?.cep || '';
  const cepDigits = String(rawCep).replace(/\D/g, '');
  return {
    name: user?.name || '',
    email: user?.email || '',
    ra: user?.ra || '',
    course: user?.course || '',
    gender:
      user?.gender === 'MASCULINO' || user?.gender === 'FEMININO' ? user.gender : '',
    age: user?.age ? String(user.age) : '',
    phone: formatPhoneForDisplay(phoneDigits),
    cep: formatCepForDisplay(cepDigits),
    photoUrl: user?.photoUrl || fallbackPhoto || '',
    role: user?.role || 'USER',
  };
};

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

  const handlePhoneChange = useCallback((e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
    setForm((prev) => ({ ...prev, phone: formatPhoneForDisplay(digits) }));
  }, []);

  const handleCepChange = useCallback((e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
    setForm((prev) => ({ ...prev, cep: formatCepForDisplay(digits) }));
  }, []);

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
      const trimmedName = form.name.trim();
      if (!trimmedName) {
        showToast('Nome é obrigatório.', 'error');
        return;
      }

      if (form.ra && !/^\d+$/.test(form.ra)) {
        showToast('RA deve conter apenas números.', 'error');
        return;
      }

      if (!form.age) {
        showToast('Idade é obrigatória.', 'error');
        return;
      }
      const ageNumber = Number(form.age);
      if (
        !Number.isInteger(ageNumber) ||
        ageNumber < 16 ||
        ageNumber > 120
      ) {
        showToast('Idade deve ser um número entre 16 e 120 anos.', 'error');
        return;
      }

      if (!form.phone) {
        showToast('Telefone é obrigatório.', 'error');
        return;
      }
      const numericPhone = form.phone.replace(/\D/g, '');
      if (numericPhone.length < 8 || numericPhone.length > 15) {
        showToast('Telefone deve conter entre 8 e 15 dígitos numéricos.', 'error');
        return;
      }

      if (!form.cep) {
        showToast('CEP é obrigatório.', 'error');
        return;
      }
      const numericCep = form.cep.replace(/\D/g, '');
      if (!/^\d{8}$/.test(numericCep)) {
        showToast('CEP deve conter exatamente 8 dígitos numéricos.', 'error');
        return;
      }

      setSaving(true);
      try {
        const payload = {
          name: form.name,
          email: form.email,
          ra: form.ra,
          course: form.course,
          gender: form.gender,
          age: form.age,
          phone: numericPhone,
          cep: numericCep,
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
    handlePhoneChange,
    handleCepChange,
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
    extraProps: { inputMode: 'numeric', maxLength: 20 },
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
    extraProps: { min: 16, max: 120 },
  },
  {
    key: 'phone',
    label: 'Telefone:',
    type: 'tel',
    placeholder: '(11) 00000-0000',
    phoneFormat: true,
    extraProps: { inputMode: 'tel', maxLength: 16 },
  },
  {
    key: 'cep',
    label: 'CEP:',
    type: 'text',
    placeholder: '00000-000',
    cepFormat: true,
    extraProps: { inputMode: 'numeric', maxLength: 9 },
  },
];