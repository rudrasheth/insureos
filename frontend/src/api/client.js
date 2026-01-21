import axios from 'axios';

// Point to Convex HTTP Actions
// Determine base URL dynamically or fallback to known production URL
const BASE_URL = import.meta.env.VITE_CONVEX_URL
    ? (import.meta.env.VITE_CONVEX_URL.includes("convex.cloud")
        ? import.meta.env.VITE_CONVEX_URL.replace("convex.cloud", "convex.site")
        : import.meta.env.VITE_CONVEX_URL)
    // Fallback if VITE_CONVEX_URL is not set or local
    : "https://third-fly-393.convex.site";

const api = axios.create({
    baseURL: BASE_URL,
});

// Add a request interceptor to include the auth token
api.interceptors.request.use((config) => {
    // Prefer agent_session_token as the new standard
    const token = localStorage.getItem('agent_session_token') || localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth - now pointing to Convex HTTP Actions
export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
// Forgot/Reset not yet migrated to Convex, keep old generic or disable?
// For now, let's leave them but they might 404 if not implemented in Convex.
export const forgotPassword = (data) => api.post('/auth/forgot-password', data);
export const resetPassword = (data) => api.post('/auth/reset-password', data);

export const getCustomers = (params) => api.get('/customers', { params });
export const createCustomer = (data) => api.post('/customers', data);
export const createPolicy = (data) => api.post('/policies', data);
export const getPoliciesByCustomer = (customerId) => api.get(`/customers/${customerId}/policies`);
export const searchPolicies = (params) => api.get('/policies/search', { params });
export const getDashboardStats = () => api.get('/dashboard/stats');

export const calculateLoan = (data) => api.post('/loans/calculate', data);
export const simulatePrepayment = (data) => api.post('/loans/simulate', data);

// Loan detection from emails
export const syncGmail = () => api.post('/gmail/sync');
export const extractLoans = () => api.post('/loans/extract');
export const getLoans = () => api.get('/loans');

export default api;
