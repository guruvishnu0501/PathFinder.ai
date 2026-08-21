import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import './App.css';

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    if(user) sessionStorage.removeItem(`pathfinderState_${user.email}`);
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">Pathfinder AI 🗺️</Link>
      <div className="nav-links">
        {user ? (
          <>
            <span className="nav-welcome">Welcome, {user.email}!</span>
            {user.role === 'admin' && <Link to="/admin" className="nav-button">Admin</Link>}
            <Link to="/profile" className="nav-button">Profile</Link> {/* <-- ADD THIS LINK */}
            <Link to="/history" className="nav-button">History</Link>
            <button onClick={handleLogout} className="nav-button">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-button">Login</Link>
            <Link to="/signup" className="nav-button signup">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;

