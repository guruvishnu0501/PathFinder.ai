import { Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';
import Navbar from './Navbar';
import ProtectedRoute from './ProtectedRoute';
import ConstellationBackground from './ConstellationBackground';
import HistoryPage from './HistoryPage';
import AdminDashboard from './AdminDashboard';
import AdminRoute from './AdminRoute';
import ProfilePage from './ProfilePage';
import './App.css';

function App() {
  return (
    <>
      <ConstellationBackground />
      <Navbar />
      <div className="app-container">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        </Routes>
      </div>
    </>
  );
}

export default App;

