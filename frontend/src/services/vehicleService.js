import api from './api';

export async function getMyVehicle() {
  const { data } = await api.get('/vehicles/me');
  return data.data;
}

export async function saveMyVehicle(payload) {
  const { data } = await api.put('/vehicles/me', payload);
  return data.data;
}