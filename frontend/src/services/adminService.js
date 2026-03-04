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
