const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Request failed');
  }

  return data;
}

export const getProducts = (params = new URLSearchParams()) => request(`/products?${params.toString()}`);

export const getCart = (userEmail) => request(`/cart/${encodeURIComponent(userEmail)}`);

export const addCartItem = (userEmail, productId, quantity = 1) =>
  request(`/cart/${encodeURIComponent(userEmail)}/add`, {
    method: 'POST',
    body: JSON.stringify({ productId, quantity }),
  });

export const removeCartItem = (userEmail, itemId) =>
  request(`/cart/${encodeURIComponent(userEmail)}/remove/${itemId}`, {
    method: 'DELETE',
  });

export const validateCoupon = (code, subtotal) =>
  request('/coupons/validate', {
    method: 'POST',
    body: JSON.stringify({ code, subtotal }),
  });

export const createOrderFromCart = (userEmail, orderData) =>
  request(`/orders/${encodeURIComponent(userEmail)}/create`, {
    method: 'POST',
    body: JSON.stringify(orderData),
  });

export const getOrders = (userEmail) => request(`/orders/${encodeURIComponent(userEmail)}`);

// ========== SUBSCRIPTION API CALLS ==========
export const getSubscriptionPlans = () => request('/subscription/plans');

export const createSubscription = (subscriptionData) =>
  request('/subscription/create', {
    method: 'POST',
    body: JSON.stringify(subscriptionData),
  });

export const getUserSubscription = (userEmail) => request(`/subscription/${encodeURIComponent(userEmail)}`);

export const cancelSubscription = (subscriptionId) =>
  request(`/subscription/${subscriptionId}/cancel`, {
    method: 'PUT',
  });

// ========== BREED VERIFICATION API CALLS ==========
export const submitBreedVerification = (verificationData) =>
  request('/breed-verification/submit', {
    method: 'POST',
    body: JSON.stringify(verificationData),
  });

export const getUserVerifications = (userId) => request(`/breed-verification/${encodeURIComponent(userId)}`);

export const getPendingVerifications = () => request('/breed-verification/admin/pending');

export const verifyBreed = (verificationId, status, notes, verifiedBy) =>
  request(`/breed-verification/verify/${verificationId}`, {
    method: 'PUT',
    body: JSON.stringify({ status, verificationNotes: notes, verifiedBy }),
  });
