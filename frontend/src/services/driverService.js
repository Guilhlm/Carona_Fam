import api from './api';

export async function listDrivers(params = {}) {
  const { data } = await api.get('/drivers', { params });
  return data?.data ?? data;
}

export async function getDriverById(id) {
  const { data } = await api.get(`/drivers/${id}`);
  return data;
}