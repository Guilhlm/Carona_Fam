import api from './api';

export async function listUsers(params = {}) {
  const { data } = await api.get('/admin/users', { params });
  return data.data || data;
}

export async function listRides(params = {}) {
  const { data } = await api.get('/admin/rides', { params });
  // Backend envia { success: true, data: { data: rides, pagination } } — retornar o payload interno
  return data?.data != null ? data.data : data;
}

export async function cancelRide(rideId) {
  const { data } = await api.patch(`/admin/rides/${rideId}/cancel`);
  return data?.data ?? data;
}

export async function listDrivers(params = {}) {
  const { data } = await api.get('/admin/drivers', { params });
  return data.data || data;
}

export async function listVehicles(params = {}) {
  const { data } = await api.get('/admin/vehicles', { params });
  return data.data || data;
}

export async function disableVehicle(vehicleId, disable = true, disabledReason) {
  const { data } = await api.patch(`/admin/vehicles/${vehicleId}/disable`, {
    disable,
    disabledReason,
  });
  return data.data || data;
}

export async function listReviews(params = {}) {
  const { data } = await api.get('/admin/reviews', { params });
  return data.data || data;
}

export async function disableReview(reviewId, disable = true, disabledReason) {
  const { data } = await api.patch(`/admin/reviews/${reviewId}/disable`, {
    disable,
    disabledReason,
  });
  return data.data || data;
}

export async function blockUser(userId, block = true, blockReason) {
  const { data } = await api.patch(`/admin/users/${userId}/block`, { block, blockReason });
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