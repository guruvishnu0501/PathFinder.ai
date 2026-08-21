import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import { API_BASE_URL } from './apiConfig';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import SkeletonLoader from './SkeletonLoader';
import './App.css';

function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        // Fetch profile and history data concurrently
        const [profileResponse, historyResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/profile`, config),
          axios.get(`${API_BASE_URL}/history`, config)
        ]);
        setProfile(profileResponse.data);
        // We only need the last 10 quizzes for the chart
        setHistory(historyResponse.data.slice(0, 10).reverse()); 
      } catch (err) {
        setError('Failed to fetch profile data.');
        console.error("Profile data fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // Format data for the chart
  const chartData = history.map(item => ({
    name: item.topic.substring(0, 15) + (item.topic.length > 15 ? '...' : ''), // Shorten long topic names
    score: (item.score / item.totalQuestions) * 100, // Calculate percentage score
  }));

  return (
    <div className="app">
      <header className="app-header">
        <h1>Your Profile</h1>
        <p>Track your learning progress and achievements.</p>
      </header>
      <main className="profile-container">
        {error && <p className="status-message error">{error}</p>}
        
        {loading ? (
            <SkeletonLoader type="stats" />
        ) : profile && (
          <div className="profile-stats">
            <div className="stat-card">
              <h3>Total Points</h3>
              <p>{profile.points}</p>
            </div>
            <div className="stat-card">
              <h3>Current Streak</h3>
              <p>{profile.streak} Days</p>
            </div>
          </div>
        )}

        <div className="chart-container">
            <h3>Recent Performance (%)</h3>
            {loading ? <SkeletonLoader type="chart" /> : (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="name" stroke="#a0a0a0" />
                        <YAxis stroke="#a0a0a0" />
                        <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }} />
                        <Legend />
                        <Bar dataKey="score" fill="#bb86fc" />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
      </main>
    </div>
  );
}

export default ProfilePage;

