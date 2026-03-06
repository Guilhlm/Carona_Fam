import api from './api';

export async function listUsers(params = {}) {
  const { data } = await api.get('/admin/users', { params });
  return data.data || data;
}

export async function listDrivers(params = {}) {
  const { data } = await api.get('/admin/drivers', { params });
  return data.data || data;
}

export async function listRides(params = {}) {
  const { data } = await api.get('/admin/rides', { params });
  return data.data || data;
}

export async function blockUser(userId, block = true) {
  const { data } = await api.patch(`/admin/users/${userId}/block`, { block });
  return data.data || data;
}

export async function createUser(payload) {
  const { data } = await api.post('/admin/users', payload);
  return data.data || data;
}

export async function getUser(id) {
  const { data } = await api.get(`/admin/users/${id}`);
  return data.data || data;
}

export async function updateUser(id, payload) {
  const { data } = await api.patch(`/admin/users/${id}`, payload);
  return data.data || data;
}

export async function deleteUser(id) {
  const { data } = await api.delete(`/admin/users/${id}`);
  return data.data || data;
}

export async function listVehicles(params = {}) {
  const { data } = await api.get('/admin/vehicles', { params });
  return data.data || data;
}

export async function createVehicle(payload) {
  const { data } = await api.post('/admin/vehicles', payload);
  return data.data || data;
}

export async function getVehicle(id) {
  const { data } = await api.get(`/admin/vehicles/${id}`);
  return data.data || data;
}

export async function updateVehicle(id, payload) {
  const { data } = await api.patch(`/admin/vehicles/${id}`, payload);
  return data.data || data;
}

export async function deleteVehicle(id) {
  const { data } = await api.delete(`/admin/vehicles/${id}`);
  return data.data || data;
}

export async function createRide(payload) {
  const { data } = await api.post('/admin/rides', payload);
  return data.data || data;
}

export async function getRide(id) {
  const { data } = await api.get(`/admin/rides/${id}`);
  return data.data || data;
}

export async function updateRide(id, payload) {
  const { data } = await api.patch(`/admin/rides/${id}`, payload);
  return data.data || data;
}

export async function deleteRide(id) {
  const { data } = await api.delete(`/admin/rides/${id}`);
  return data.data || data;
}