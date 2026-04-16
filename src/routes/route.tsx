import React from 'react';
import { Route, Routes } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import Dashboard from '../pages/Dashboard';
import Index from '../pages/Index';
import Login from '../pages/Login';
import NotFound from '../pages/NotFound';
import Products from '../pages/Products';
import Client from '@/pages/Client';
import ClientDetail from '@/pages/ClinetDetail';
import Invoices from '@/pages/Invoices';
import NewInvoise from '@/pages/NewInvoise';

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
        <Route path="clients" element={<Client />} />
        <Route path="clients/:id" element={<ClientDetail />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="/invoices/new" element={<NewInvoise />} />
        <Route path="/invoices/:id" element={<NewInvoise />} />
      </Route>
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes;
