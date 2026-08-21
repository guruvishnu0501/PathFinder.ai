import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import SkeletonLoader from './SkeletonLoader';
import './App.css';

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) { setLoading(false); return; }
      setLoading(true);
      setError('');
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [usersResponse, resultsResponse] = await Promise.all([
          axios.get('http://localhost:8001/admin/users', config),
          axios.get('http://localhost:8001/admin/results', config)
        ]);
        setUsers(usersResponse.data);
        setResults(resultsResponse.data);
      } catch (err) {
        setError('Failed to fetch admin data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Admin Dashboard</h1>
        <p>View all user and quiz data.</p>
      </header>
      <main className="admin-container">
        {error && <p className="status-message error">{error}</p>}
        <div className="admin-section">
          <h2>Registered Users ({users.length})</h2>
          {loading ? <SkeletonLoader type="table-row" count={3} /> : (
            <table className="admin-table">
              <thead><tr><th>Email</th><th>Role</th></tr></thead>
              <tbody>{users.map(u => <tr key={u._id}><td>{u.email}</td><td>{u.role}</td></tr>)}</tbody>
            </table>
          )}
        </div>
        <div className="admin-section">
          <h2>All Quiz Results ({results.length})</h2>
          {loading ? <SkeletonLoader type="table-row" count={5} /> : (
            <table className="admin-table">
              <thead><tr><th>User Email</th><th>Topic</th><th>Score</th><th>Date</th></tr></thead>
              <tbody>
                {results.map(r => {
                  const user = users.find(u => u._id === r.user_id);
                  return (
                    <tr key={r._id}>
                      <td>{user ? user.email : 'Unknown'}</td>
                      <td>{r.topic}</td>
                      <td>{r.score}/{r.totalQuestions}</td>
                      <td>{new Date(r.completedAt).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;