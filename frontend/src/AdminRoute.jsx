import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';

function AdminRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  // While the context is checking for a token, render nothing to avoid flashes of content.
  if (loading) {
    return null; 
  }

  // If loading is finished and the user is not an admin, redirect them to the home page.
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  // If all checks pass, show the protected admin page.
  return children;
}

export default AdminRoute;

