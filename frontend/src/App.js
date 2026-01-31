import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/DashBoard";
import LedgerPage from "./pages/LedgerPage";
import ProductForm from "./pages/ProductForm";

import { AuthContextProvider, AuthContext } from "./context/AuthContext";
import { ActivityContextProvider } from "./context/ActivityContext";
import { Toaster } from 'react-hot-toast';


const PrivateRoute = ({ children }) => {
  const { user } = React.useContext(AuthContext);
  return user ? children : <Navigate to="/login" replace />;
};

function App() {
  return (


    <AuthContextProvider>
      <ActivityContextProvider>
        <Routes>

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

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
            <Route path="products/form" element={<ProductForm />} />
          </Route>
      

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ActivityContextProvider>

      <div>
        <Toaster position="top-right" reverseOrder={false} />

      </div>

    </AuthContextProvider>
  );
}

export default App;
