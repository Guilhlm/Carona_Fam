import api from './api';

export async function listRides(params = {}) {
  const { data } = await api.get('/rides', { params });
  return data;
}

export async function getRideHistory() {
  const { data } = await api.get('/rides/history');
  return data.data || data;
}

export async function createRide(rideData) {
  const { data } = await api.post('/rides', rideData);
  return data;
}

export async function requestRide(rideId) {
  const { data } = await api.post(`/rides/${rideId}/request`);
  return data;
}

export async function updateRideStatus(rideId, status) {
  const { data } = await api.patch(`/rides/${rideId}/status`, { status });
  return data;
}
