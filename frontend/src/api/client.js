import axios from 'axios';

const api = axios.create({
    baseURL: 'https://insureos-backend.vercel.app/api',
});

// Add a request interceptor to include the auth token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const forgotPassword = (data) => api.post('/auth/forgot-password', data);
export const resetPassword = (data) => api.post('/auth/reset-password', data);

export const getCustomers = (params) => api.get('/customers', { params });
export const createCustomer = (data) => api.post('/customers', data);
export const createPolicy = (data) => api.post('/policies', data);
export const getPoliciesByCustomer = (customerId) => api.get(`/customers/${customerId}/policies`);
export const searchPolicies = (params) => api.get('/policies/search', { params });
export const getDashboardStats = () => api.get('/dashboard/stats');

export default api;
