import React from 'react';
import { Route, Routes } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import RequireRole from '@/components/RequireRole';
import Dashboard from '../pages/Dashboard';
import Index from '../pages/Index';
import Login from '../pages/Login';
import NotFound from '../pages/NotFound';
import Products from '../pages/Products';
import Client from '@/pages/Client';
import ClientDetail from '@/pages/ClinetDetail';
import Invoices from '@/pages/Invoices';
import NewInvoise from '@/pages/NewInvoise';
import Buyer from '@/pages/Buyer';
import BuyerDetails from '@/pages/BuyerDetails';
import Purchases from '@/pages/Purchases';
import CreatePurchase from '@/pages/CreatePurchase';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Index />} />
          <Route
            path="dashboard"
            element={
              <RequireRole allowed={['ADMIN']}>
                <Dashboard />
              </RequireRole>
            }
          />
          <Route
            path="products"
            element={
              <RequireRole allowed={['ADMIN']}>
                <Products />
              </RequireRole>
            }
          />
          <Route
            path="clients"
            element={
              <RequireRole allowed={['ADMIN']}>
                <Client />
              </RequireRole>
            }
          />
          <Route
            path="clients/:id"
            element={
              <RequireRole allowed={['ADMIN']}>
                <ClientDetail />
              </RequireRole>
            }
          />
          <Route
            path="invoices"
            element={
              <RequireRole allowed={['ADMIN']}>
                <Invoices />
              </RequireRole>
            }
          />
          <Route
            path="invoices/new"
            element={
              <RequireRole allowed={['ADMIN']}>
                <NewInvoise />
              </RequireRole>
            }
          />
          <Route
            path="invoices/:id"
            element={
              <RequireRole allowed={['ADMIN']}>
                <NewInvoise />
              </RequireRole>
            }
          />
          <Route
            path="buyer"
            element={
              <RequireRole allowed={['ADMIN', 'SUB_ADMIN']}>
                <Buyer />
              </RequireRole>
            }
          />
          <Route
            path="buyer/:id"
            element={
              <RequireRole allowed={['ADMIN', 'SUB_ADMIN']}>
                <BuyerDetails />
              </RequireRole>
            }
          />
          <Route
            path="purchases"
            element={
              <RequireRole allowed={['ADMIN', 'SUB_ADMIN']}>
                <Purchases />
              </RequireRole>
            }
          />
          <Route
            path="purchases/create"
            element={
              <RequireRole allowed={['ADMIN', 'SUB_ADMIN']}>
                <CreatePurchase />
              </RequireRole>
            }
          />
          <Route
            path="purchases/:id"
            element={
              <RequireRole allowed={['ADMIN', 'SUB_ADMIN']}>
                <CreatePurchase />
              </RequireRole>
            }
          />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
