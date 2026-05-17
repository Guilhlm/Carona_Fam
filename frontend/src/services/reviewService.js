import api from './api';
import { unwrapApiData } from '../utils/apiResponse';

export async function getRideReviewContext(rideId) {
  const { data: responseBody } = await api.get(`/reviews/ride/${rideId}/me`);
  return unwrapApiData(responseBody);
}

export async function submitRideReview(rideId, { rating, comment }) {
  const { data: responseBody } = await api.post(`/reviews/ride/${rideId}`, { rating, comment });
  return unwrapApiData(responseBody);
}
