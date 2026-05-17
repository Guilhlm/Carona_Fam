import api from './api';
import { unwrapApiData } from '../utils/apiResponse';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export async function listRides(queryParams = {}) {
  const { data: responseBody } = await api.get('/rides', { params: queryParams });
  return responseBody;
}

export async function getRideHistory() {
  const { data: responseBody } = await api.get('/rides/history');
  return unwrapApiData(responseBody) ?? [];
}

export async function createRide(rideData) {
  const { data: responseBody } = await api.post('/rides', rideData);
  return responseBody;
}

export async function requestRide(rideId) {
  const { data: responseBody } = await api.post(`/rides/${rideId}/request`);
  return responseBody;
}

export async function updateRideStatus(rideId, status) {
  const { data: responseBody } = await api.patch(`/rides/${rideId}/status`, { status });
  return responseBody;
}

export async function requestNewRide(payload) {
  const { data: responseBody } = await api.post('/rides/request', payload);
  return unwrapApiData(responseBody);
}

export async function listOpenRides() {
  const { data: responseBody } = await api.get('/rides/open');
  return unwrapApiData(responseBody) ?? [];
}

export async function getMyActiveRide() {
  const { data: responseBody } = await api.get('/rides/me/active');
  return unwrapApiData(responseBody) ?? null;
}

export async function getRideDetail(rideId) {
  const { data: responseBody } = await api.get(`/rides/${rideId}`);
  return unwrapApiData(responseBody);
}

export async function acceptOpenRide(rideId, vehicleId) {
  const requestBody = vehicleId ? { vehicleId } : {};
  const { data: responseBody } = await api.post(`/rides/${rideId}/accept`, requestBody);
  return unwrapApiData(responseBody);
}

export async function transitionRideStatus(rideId, status) {
  const { data: responseBody } = await api.patch(`/rides/${rideId}/status`, { status });
  return unwrapApiData(responseBody);
}

export async function cancelRideWithReason(rideId, reason) {
  const { data: responseBody } = await api.post(`/rides/${rideId}/cancel`, { reason });
  return unwrapApiData(responseBody);
}

function buildStreamUrl(streamPath) {
  const authToken = localStorage.getItem('token');
  const querySeparator = streamPath.includes('?') ? '&' : '?';
  const tokenSuffix = authToken ? `${querySeparator}token=${encodeURIComponent(authToken)}` : '';
  return `${API_BASE_URL}${streamPath}${tokenSuffix}`;
}

export function openRideStream(rideId) {
  return new EventSource(buildStreamUrl(`/rides/${rideId}/stream`));
}

export function openOpenRidesStream() {
  return new EventSource(buildStreamUrl('/rides/open/stream'));
}
