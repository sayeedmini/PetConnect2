import axios from 'axios';
import { getToken } from '../../auth/utils/auth';

const API_BASE_URL = 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = getToken();

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
};

export const getClinicReviews = async (clinicId, includeRejected = false) => {
  const response = await axios.get(`${API_BASE_URL}/clinics/${clinicId}/reviews`, {
    params: includeRejected ? { includeRejected: true } : {},
    headers: includeRejected ? getAuthHeaders() : {},
  });

  return response.data;
};

export const getMyClinicReview = async (clinicId) => {
  const response = await axios.get(`${API_BASE_URL}/clinics/${clinicId}/reviews/me`, {
    headers: getAuthHeaders(),
  });

  return response.data;
};

export const createClinicReview = async (clinicId, payload) => {
  const response = await axios.post(`${API_BASE_URL}/clinics/${clinicId}/reviews`, payload, {
    headers: getAuthHeaders(),
  });

  return response.data;
};

export const updateReview = async (reviewId, payload) => {
  const response = await axios.patch(`${API_BASE_URL}/reviews/${reviewId}`, payload, {
    headers: getAuthHeaders(),
  });

  return response.data;
};

export const moderateReview = async (reviewId, payload) => {
  const response = await axios.patch(`${API_BASE_URL}/reviews/${reviewId}/moderate`, payload, {
    headers: getAuthHeaders(),
  });

  return response.data;
};
