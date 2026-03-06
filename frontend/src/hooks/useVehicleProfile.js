import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getMyVehicle, saveMyVehicle } from '../services/vehicleService';

const emptyVehicleForm = {
  id: '',
  brand: '',
  model: '',
  plate: '',
  year: '',
  capacityTotal: '',
  photoUrl: '',
};

const VEHICLE_FIELDS = [
  'brand',
  'model',
  'plate',
  'year',
  'capacityTotal',
  'photoUrl',
];

const normalizeVehicleToForm = (vehicle) => ({
  id: vehicle?.id || '',
  brand: vehicle?.brand || '',
  model: vehicle?.model || '',
  plate: vehicle?.plate || '',
  year: vehicle?.year ? String(vehicle.year) : '',
  capacityTotal: vehicle?.capacityTotal ? String(vehicle.capacityTotal) : '',
  photoUrl: vehicle?.photoUrl || '',
});

export function useVehicleProfile() {
  const { user } = useAuth();
  const { showToast, hideToast } = useToast();

  const [vehicleForm, setVehicleForm] = useState(emptyVehicleForm);
  const [initialVehicleForm, setInitialVehicleForm] = useState(null);
  const [vehicleLoading, setVehicleLoading] = useState(true);
  const [vehicleSaving, setVehicleSaving] = useState(false);
   const [vehicleUploadingPhoto, setVehicleUploadingPhoto] = useState(false);
   const [vehiclePhotoName, setVehiclePhotoName] = useState('');
   const vehicleFileInputRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function loadVehicle() {
      setVehicleLoading(true);

      try {
        if (!user || user.role !== 'DRIVER') {
          if (isMounted) {
            setVehicleForm(emptyVehicleForm);
            setInitialVehicleForm(null);
          }
          return;
        }

        const vehicle = await getMyVehicle();
        if (!isMounted) return;

        if (vehicle) {
          const normalized = normalizeVehicleToForm(vehicle);
          setVehicleForm(normalized);
          setInitialVehicleForm(normalized);
        } else {
          setVehicleForm(emptyVehicleForm);
          setInitialVehicleForm(emptyVehicleForm);
        }
        setVehiclePhotoName('');
      } catch (err) {
        if (!isMounted) return;
        showToast('Não foi possível carregar os dados do veículo.', 'error');
      } finally {
        if (isMounted) setVehicleLoading(false);
      }
    }

    loadVehicle();

    return () => {
      isMounted = false;
    };
  }, [showToast, user]);

  const handleVehicleChange = useCallback(
    (field) => (e) => {
      const { value } = e.target;
      setVehicleForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleVehicleNumericChange = useCallback(
    (field) => (e) => {
      const onlyDigits = e.target.value.replace(/\D/g, '');
      setVehicleForm((prev) => ({ ...prev, [field]: onlyDigits }));
    },
    []
  );

  const handleVehiclePhotoClick = useCallback(() => {
    if (vehicleFileInputRef.current) {
      vehicleFileInputRef.current.click();
    }
  }, []);

  const handleVehiclePhotoChange = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();

      reader.onload = async () => {
        const base64 = reader.result;
        if (typeof base64 !== 'string') return;

        setVehicleUploadingPhoto(true);
        try {
          const saved = await saveMyVehicle({ photoUrl: base64 });
          const normalized = normalizeVehicleToForm(saved);
          setVehicleForm(normalized);
          setInitialVehicleForm(normalized);
          setVehiclePhotoName(file.name);
          hideToast();
          showToast('Foto do veículo atualizada com sucesso.', 'success');
        } catch (err) {
          const message =
            err.response?.data?.error ||
            'Não foi possível atualizar a foto do veículo.';
          showToast(message, 'error');
        } finally {
          setVehicleUploadingPhoto(false);
          if (vehicleFileInputRef.current) {
            vehicleFileInputRef.current.value = '';
          }
        }
      };

      reader.readAsDataURL(file);
    },
    [hideToast, showToast]
  );

  const handleVehicleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!user || user.role !== 'DRIVER') {
        showToast('Apenas motoristas podem salvar dados de veículo.', 'error');
        return;
      }

      const brand = vehicleForm.brand.trim();
      const model = vehicleForm.model.trim();
      const plate = vehicleForm.plate.trim().toUpperCase();
      const year = vehicleForm.year.trim();
      const capacity = vehicleForm.capacityTotal.trim();
      const photoUrl = vehicleForm.photoUrl.trim();

      if (!brand) {
        showToast('Marca do veículo é obrigatória.', 'error');
        return;
      }

      if (!model) {
        showToast('Modelo do veículo é obrigatório.', 'error');
        return;
      }

      if (!plate) {
        showToast('Placa do veículo é obrigatória.', 'error');
        return;
      }

      if (!/^[A-Z0-9]{7,8}$/.test(plate)) {
        showToast(
          'Placa inválida. Use apenas letras e números (7 a 8 caracteres).',
          'error'
        );
        return;
      }

      if (!year) {
        showToast('Ano do veículo é obrigatório.', 'error');
        return;
      }
      const yearNumber = Number(year);
      const currentYear = new Date().getFullYear();
      if (
        !Number.isInteger(yearNumber) ||
        yearNumber < 1980 ||
        yearNumber > currentYear + 1
      ) {
        showToast(
          `Ano do veículo deve estar entre 1980 e ${currentYear + 1}.`,
          'error'
        );
        return;
      }

      if (!capacity) {
        showToast('Capacidade de passageiros é obrigatória.', 'error');
        return;
      }
      const capacityNumber = Number(capacity);
      if (
        !Number.isInteger(capacityNumber) ||
        capacityNumber < 1 ||
        capacityNumber > 8
      ) {
        showToast(
          'Capacidade de passageiros deve ser um número entre 1 e 8.',
          'error'
        );
        return;
      }

      setVehicleSaving(true);
      try {
        const payload = {
          brand,
          model,
          plate,
          year: yearNumber,
          capacityTotal: capacityNumber,
          photoUrl: photoUrl || null,
        };

        const saved = await saveMyVehicle(payload);
        const normalized = normalizeVehicleToForm(saved);

        setVehicleForm(normalized);
        setInitialVehicleForm(normalized);
        hideToast();
        showToast('Dados do veículo atualizados com sucesso.', 'success');
      } catch (err) {
        const message =
          err.response?.data?.error ||
          'Não foi possível atualizar os dados do veículo.';
        showToast(message, 'error');
      } finally {
        setVehicleSaving(false);
      }
    },
    [hideToast, showToast, user, vehicleForm]
  );

  const hasVehicleChanges = useMemo(() => {
    if (vehicleLoading || !initialVehicleForm) return false;
    return VEHICLE_FIELDS.some(
      (field) =>
        (vehicleForm[field] || '') !== (initialVehicleForm[field] || '')
    );
  }, [initialVehicleForm, vehicleForm, vehicleLoading]);

  return {
    vehicleForm,
    vehicleLoading,
    vehicleSaving,
    hasVehicleChanges,
    vehicleUploadingPhoto,
    vehiclePhotoName,
    vehicleFileInputRef,
    handleVehicleChange,
    handleVehicleNumericChange,
    handleVehiclePhotoClick,
    handleVehiclePhotoChange,
    handleVehicleSubmit,
  };
}