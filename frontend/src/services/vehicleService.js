import api from './api';

export async function getMyVehicle() {
  const { data } = await api.get('/vehicles/me');
  return data.data;
}

export async function getMyVehicles() {
  const { data } = await api.get('/vehicles/me/list');
  return data.data;
}

export async function saveMyVehicle(payload) {
  const { data } = await api.put('/vehicles/me', payload);
  return data.data;
}

export async function createNewVehicle(payload) {
  const { data } = await api.post('/vehicles/me', payload);
  return data.data;
}