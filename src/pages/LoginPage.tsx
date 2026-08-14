import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Login } from '../components/auth/Login';

export const LoginPage: React.FC = () => {
  const { user } = useAuthStore();

  if (user) {
    return <Navigate to="/chat" replace />;
  }

  return <Login />;
};
