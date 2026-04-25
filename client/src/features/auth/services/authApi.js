import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api/auth',
});

export const registerUser = async (formData) => {
  const payload = {
    name: formData.name,
    email: formData.email,
    password: formData.password,
    role: formData.role,
  };

  const { data } = await API.post('/register', payload);
  return data;
};

export const loginUser = async (formData) => {
  const payload = {
    email: formData.email,
    password: formData.password,
  };

  const { data } = await API.post('/login', payload);
  return data;
};

export const getMe = async (token) => {
  const { data } = await API.get('/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

export default API;