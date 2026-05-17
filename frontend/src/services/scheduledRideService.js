import api from './api';
import { unwrapApiData, unwrapApiList } from '../utils/apiResponse';

export function mapScheduledRideForRequest(ride) {
  if (!ride) return ride;
  const destinationCoords =
    ride.destinationCoords ||
    (ride.destinationLng != null && ride.destinationLat != null
      ? [Number(ride.destinationLng), Number(ride.destinationLat)]
      : null);
  const originCoords =
    ride.originCoords ||
    (ride.originLng != null && ride.originLat != null
      ? [Number(ride.originLng), Number(ride.originLat)]
      : null);
  return {
    ...ride,
    destinationCoords,
    originCoords,
  };
}

export async function createScheduledRide(payload) {
  const { data } = await api.post('/scheduled-rides', payload);
  return unwrapApiData(data);
}

export async function listMyScheduledRides() {
  const { data } = await api.get('/scheduled-rides/mine');
  return unwrapApiList(data);
}

export async function listJoinedScheduledRides() {
  const { data } = await api.get('/scheduled-rides/joined');
  return unwrapApiList(data);
}

export async function listOpenScheduledRides() {
  const { data } = await api.get('/scheduled-rides/open');
  return unwrapApiList(data);
}

export async function listAllScheduledRides() {
  const { data } = await api.get('/scheduled-rides/all');
  return unwrapApiList(data);
}

export async function getScheduledRideDetail(id) {
  const { data } = await api.get(`/scheduled-rides/${id}`);
  return unwrapApiData(data);
}

export async function joinScheduledRideAsCarona(id, payload) {
  const { data } = await api.post(`/scheduled-rides/${id}/join`, payload);
  return unwrapApiData(data);
}

export async function leaveScheduledRideAsCarona(id) {
  const { data } = await api.delete(`/scheduled-rides/${id}/join`);
  return unwrapApiData(data);
}

export async function convertScheduledRideToRide(id) {
  const { data } = await api.post(`/scheduled-rides/${id}/request`);
  return unwrapApiData(data);
}

export async function deleteScheduledRide(id) {
  const { data } = await api.delete(`/scheduled-rides/${id}`);
  return unwrapApiData(data);
}
