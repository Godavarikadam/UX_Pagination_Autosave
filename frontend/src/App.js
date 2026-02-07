import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/DashBoard";
import LedgerPage from "./pages/LedgerPage";
import ProductForm from "./pages/ProductForm";
import Approval from "./pages/Approval";

import { AuthContextProvider, AuthContext } from "./context/AuthContext";
import { ActivityContextProvider } from "./context/ActivityContext";
import { Toaster } from 'react-hot-toast';

// Basic Login Check
const PrivateRoute = ({ children }) => {
  const { user } = React.useContext(AuthContext);
  return user ? children : <Navigate to="/login" replace />;
};

// 🟢 ADD THIS: Admin Role Check
const AdminRoute = ({ children }) => {
  const { user } = React.useContext(AuthContext);
  const isAdmin = user?.role === 'admin'; 
  return isAdmin ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <AuthContextProvider>
      <ActivityContextProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Main Dashboard Layout */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="products" />} />

            <Route path="products" element={<LedgerPage />}>
              <Route path="add" element={<div />} />
              <Route path="edit/:productId" element={<div />} />
            </Route>

            {/* 🟢 UPDATED: Use AdminRoute and the correct component name */}
           <Route path="approvals" element={<Approval />}>
               <Route path=":productId/:requestId" element={<Approval />} />
            </Route>

            <Route path="products/form" element={<ProductForm />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ActivityContextProvider>

      <Toaster position="top-right" reverseOrder={false} />
    </AuthContextProvider>
  );
}

export default App;