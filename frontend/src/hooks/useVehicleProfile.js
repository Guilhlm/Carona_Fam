import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getMyVehicles, saveMyVehicle, createNewVehicle } from '../services/vehicleService';

const emptyVehicleForm = {
  id: '',
  brand: '',
  model: '',
  plate: '',
  year: '',
  capacityTotal: '',
  photoUrl: '',
  isDisabled: false,
  disabledReason: '',
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
  isDisabled: !!vehicle?.isDisabled,
  disabledReason: vehicle?.disabledReason || '',
});

export function useVehicleProfile() {
  const { user } = useAuth();
  const { showToast, hideToast } = useToast();

  const [vehicleForm, setVehicleForm] = useState(emptyVehicleForm);
  const [initialVehicleForm, setInitialVehicleForm] = useState(null);
  const [vehiclesList, setVehiclesList] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [vehicleLoading, setVehicleLoading] = useState(true);
  const [vehicleSaving, setVehicleSaving] = useState(false);
  const [vehicleUploadingPhoto, setVehicleUploadingPhoto] = useState(false);
  const [vehiclePhotoName, setVehiclePhotoName] = useState('');
  const vehicleFileInputRef = useRef(null);
  const [isAddingNewVehicle, setIsAddingNewVehicle] = useState(false);
  const [blockedVehiclePlate, setBlockedVehiclePlate] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadVehicles() {
      setVehicleLoading(true);

      try {
        if (!user || user.role !== 'DRIVER') {
          if (isMounted) {
            setVehicleForm(emptyVehicleForm);
            setInitialVehicleForm(null);
            setVehiclesList([]);
            setSelectedVehicleId('');
          }
          return;
        }

        const vehicles = await getMyVehicles();
        if (!isMounted) return;

        if (vehicles && vehicles.length > 0) {
          setVehiclesList(vehicles);
          const primary = vehicles[0];
          setSelectedVehicleId(primary.id);
          const normalized = normalizeVehicleToForm(primary);
          setVehicleForm(normalized);
          setInitialVehicleForm(normalized);
          setIsAddingNewVehicle(false);
          setBlockedVehiclePlate('');
        } else {
          setVehiclesList([]);
          setSelectedVehicleId('');
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

    loadVehicles();

    return () => {
      isMounted = false;
    };
  }, [showToast, user]);

  const handleVehicleSelect = useCallback((vehicleId) => {
    setSelectedVehicleId(vehicleId);
    const vehicle = vehiclesList.find((v) => v.id === vehicleId);
    if (vehicle) {
      const normalized = normalizeVehicleToForm(vehicle);
      setVehicleForm(normalized);
      setInitialVehicleForm(normalized);
      setIsAddingNewVehicle(false);
      setBlockedVehiclePlate('');
      setVehiclePhotoName('');
    }
  }, [vehiclesList]);

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

  const handleNewVehicleClick = useCallback(() => {
    setBlockedVehiclePlate(vehicleForm.plate?.trim().toUpperCase() || '');
    setIsAddingNewVehicle(true);
    setVehicleForm({ ...emptyVehicleForm });
    setInitialVehicleForm({ ...emptyVehicleForm });
    setVehiclePhotoName('');
  }, [vehicleForm.plate]);

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
          const payload = { photoUrl: base64 };
          if (vehicleForm.id) payload.id = vehicleForm.id;
          const saved = await saveMyVehicle(payload);
          const fromServer = normalizeVehicleToForm(saved);
          setVehicleForm((prev) => ({
            ...prev,
            id: fromServer.id || prev.id,
            photoUrl: fromServer.photoUrl,
            brand: fromServer.brand || prev.brand,
            model: fromServer.model || prev.model,
            plate: fromServer.plate || prev.plate,
            year: fromServer.year || prev.year,
            capacityTotal: fromServer.capacityTotal || prev.capacityTotal,
            isDisabled: fromServer.isDisabled,
            disabledReason: fromServer.disabledReason,
          }));
          setInitialVehicleForm(fromServer);
          setVehiclePhotoName(file.name);
          setVehiclesList((prev) =>
            prev.map((v) =>
              v.id === fromServer.id ? { ...v, photoUrl: fromServer.photoUrl } : v
            )
          );
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

      if (isAddingNewVehicle && blockedVehiclePlate && plate === blockedVehiclePlate) {
        showToast(
          'Não é possível cadastrar um veículo com a mesma placa do carro bloqueado.',
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
        if (!isAddingNewVehicle && vehicleForm.id) {
          payload.id = vehicleForm.id;
        }

        const saved = isAddingNewVehicle
          ? await createNewVehicle(payload)
          : await saveMyVehicle(payload);
        const normalized = normalizeVehicleToForm(saved);

        setVehicleForm(normalized);
        setInitialVehicleForm(normalized);
        setIsAddingNewVehicle(false);
        setBlockedVehiclePlate('');
        setSelectedVehicleId(normalized.id);
        if (isAddingNewVehicle) {
          const updated = await getMyVehicles();
          setVehiclesList(updated || []);
        }
        hideToast();
        showToast(
          isAddingNewVehicle
            ? 'Novo veículo cadastrado com sucesso.'
            : 'Dados do veículo atualizados com sucesso.',
          'success'
        );
      } catch (err) {
        const message =
          err.response?.data?.error ||
          'Não foi possível atualizar os dados do veículo.';
        showToast(message, 'error');
      } finally {
        setVehicleSaving(false);
      }
    },
    [hideToast, showToast, user, vehicleForm, isAddingNewVehicle, blockedVehiclePlate]
  );

  const hasVehicleChanges = useMemo(() => {
    if (vehicleLoading || !initialVehicleForm) return false;
    return VEHICLE_FIELDS.some(
      (field) => (vehicleForm[field] || '') !== (initialVehicleForm[field] || '')
    );
  }, [initialVehicleForm, vehicleForm, vehicleLoading]);

  const vehicleSelectOptions = useMemo(
    () =>
      vehiclesList.map((v) => ({
        value: v.id,
        label: [v.brand, v.model, v.plate].filter(Boolean).join(' · ') || 'Veículo',
        isDisabled: !!v.isDisabled,
      })),
    [vehiclesList]
  );

  return {
    vehicleForm,
    vehicleLoading,
    vehicleSaving,
    hasVehicleChanges,
    vehicleUploadingPhoto,
    vehiclePhotoName,
    vehicleFileInputRef,
    isAddingNewVehicle,
    vehiclesList,
    selectedVehicleId,
    vehicleSelectOptions,
    handleVehicleChange,
    handleVehicleNumericChange,
    handleVehiclePhotoClick,
    handleVehiclePhotoChange,
    handleVehicleSubmit,
    handleNewVehicleClick,
    handleVehicleSelect,
  };
}