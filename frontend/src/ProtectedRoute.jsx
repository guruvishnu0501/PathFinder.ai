import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';

function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  // While the context is checking for a token, don't render anything.
  // This prevents a brief flash of the login page on reload.
  if (loading) {
    return null; 
  }

  // If loading is finished and there is no user, redirect to the login page.
  if (!user) {
    return <Navigate to="/login" />;
  }

  // If loading is finished and a user exists, show the requested page.
  return children;
}

export default ProtectedRoute;

