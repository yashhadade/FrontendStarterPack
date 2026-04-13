import React from 'react';
import { Route, Routes } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import Dashboard from '../pages/Dashboard';
import Index from '../pages/Index';
import Login from '../pages/Login';
import NotFound from '../pages/NotFound';
import Products from '../pages/Products';

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route element={<ProtectedRoute />}>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Index />} />
        <Route path="dashboard" element={<Dashboard />} />
      </Route>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Index />} />
        <Route path="products" element={<Products />} />
      </Route>
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes;
