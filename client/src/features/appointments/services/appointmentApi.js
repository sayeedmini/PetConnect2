import axios from 'axios';
import { getToken } from '../../auth/utils/auth';

const API_BASE_URL = 'http://localhost:5000/api/appointments';

const getAuthHeaders = () => {
  const token = getToken();

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
};

export const getAvailableSlots = async (clinicId, date, options = {}) => {
  const response = await axios.get(`${API_BASE_URL}/available-slots`, {
    params: {
      clinicId,
      date,
      ...(options.excludeAppointmentId ? { excludeAppointmentId: options.excludeAppointmentId } : {}),
    },
    headers: getAuthHeaders(),
  });

  return response.data;
};

export const bookAppointment = async (payload) => {
  const response = await axios.post(API_BASE_URL, payload, {
    headers: getAuthHeaders(),
  });

  return response.data;
};

export const getMyAppointments = async (status = '') => {
  const response = await axios.get(`${API_BASE_URL}/my`, {
    params: status ? { status } : {},
    headers: getAuthHeaders(),
  });

  return response.data;
};

export const getAppointmentById = async (id) => {
  const response = await axios.get(`${API_BASE_URL}/${id}`, {
    headers: getAuthHeaders(),
  });

  return response.data;
};

export const cancelAppointment = async (id) => {
  const response = await axios.patch(
    `${API_BASE_URL}/${id}/cancel`,
    {},
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};

export const rescheduleAppointment = async (id, payload) => {
  const response = await axios.patch(`${API_BASE_URL}/${id}/reschedule`, payload, {
    headers: getAuthHeaders(),
  });

  return response.data;
};

export const completeAppointment = async (id) => {
  const response = await axios.patch(
    `${API_BASE_URL}/${id}/complete`,
    {},
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};
