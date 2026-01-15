import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import CustomerList from './pages/CustomerList';
import AddCustomer from './pages/AddCustomer';
import AddPolicy from './pages/AddPolicy';
import PolicySearch from './pages/PolicySearch';
import Analytics from './pages/Analytics';
import Login from './pages/Login';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<Layout />}>
          <Route index element={<CustomerList />} />
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
