import api from './api';

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  return data.data;
}

export async function register(userData) {
  const { data } = await api.post('/auth/register', userData);
  return data.data;
}
