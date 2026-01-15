import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:4001/api',
});

export const getCustomers = (params) => api.get('/customers', { params });
export const createCustomer = (data) => api.post('/customers', data);
export const createPolicy = (data) => api.post('/policies', data);
export const getPoliciesByCustomer = (customerId) => api.get(`/customers/${customerId}/policies`);
export const searchPolicies = (params) => api.get('/policies/search', { params });

export default api;
