import axios from 'axios';
import { getToken } from '../../auth/utils/auth';

const API_BASE_URL = 'http://localhost:5000/api/vets';

const getAuthHeaders = () => {
  const token = getToken();

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
};

export const getAllVets = async (filters = {}) => {
  const response = await axios.get(API_BASE_URL, { params: filters });
  return response.data;
};

export const getVetById = async (id) => {
  const response = await axios.get(`${API_BASE_URL}/${id}`);
  return response.data;
};

export const createVet = async (vetData) => {
  const response = await axios.post(API_BASE_URL, vetData, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const updateVet = async (id, vetData) => {
  const response = await axios.put(`${API_BASE_URL}/${id}`, vetData, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const deleteVet = async (id) => {
  const response = await axios.delete(`${API_BASE_URL}/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};