import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (token) {
      axios.get('http://127.0.0.1:8000/api/auth/me/', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        if (!localStorage.getItem('user_role')) {
          localStorage.setItem('user_role', res.data.is_staff ? 'admin' : 'user');
        }
        localStorage.setItem('user_name', res.data.username);
        setLoading(false);
      }).catch(() => {
        localStorage.removeItem('access_token');
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [token]);

  if (loading) return null;
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/*" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
