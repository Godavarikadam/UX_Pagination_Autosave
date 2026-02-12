import { api } from './api';

export const getProducts = (page = 1, limit = 25) => {
  return api.get(`/products?page=${page}&limit=${limit}`);
};

export const updateProduct = (productId, data) => {
  return api.patch(`/products/${productId}`, data);
};


export const addProduct = (data) => {
  return api.post('/products', data);
};


export const deleteProduct = (productId) => {
  return api.delete(`/products/${productId}`);
};


export const getSettings = () => {
  return api.get('/settings');
};

export const requestApproval = (payload) => {
  return api.post('/products/approvals/request', payload);
};