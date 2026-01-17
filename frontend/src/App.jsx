import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import CustomerList from './pages/CustomerList';
import AddCustomer from './pages/AddCustomer';
import AddPolicy from './pages/AddPolicy';
import PolicySearch from './pages/PolicySearch';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import LoanOptimizer from './pages/LoanOptimizer';

import RequireAuth from './components/RequireAuth';

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/" element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }>
          <Route index element={<CustomerList />} />
          <Route path="optimizer" element={<LoanOptimizer />} />
          <Route path="add-customer" element={<AddCustomer />} />
          <Route path="add-policy" element={<AddPolicy />} />
          <Route path="search" element={<PolicySearch />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
