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
import { getStorageItem } from '@/utils/storageUtils';
import Buyer from '@/pages/Buyer';

const AppRoutes = () => {
  const userInfo = getStorageItem('user');
  const user = JSON.parse(userInfo || '{}');
  const userRole = user.role;
  return (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route element={<ProtectedRoute />}>
      {userRole === 'ADMIN' && <Route path="/" element={<AppLayout />}>
        <Route index element={<Index />} />
        <Route path="dashboard" element={<Dashboard />} />
      </Route>}
      {userRole === 'ADMIN' && <Route path="/" element={<AppLayout />}>
        <Route index element={<Index />} />
        <Route path="products" element={<Products />} />
        <Route path="clients" element={<Client />} />
        <Route path="clients/:id" element={<ClientDetail />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="/invoices/new" element={<NewInvoise />} />
        <Route path="/invoices/:id" element={<NewInvoise />} />
      </Route>
      }
      {(userRole === 'SUB_ADMIN' || userRole === 'ADMIN') && <Route path="/" element={<AppLayout />}>
        <Route index element={<Index />} />
        <Route path="buyer" element={<Buyer />} />
      </Route>}
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
)};

export default AppRoutes;
