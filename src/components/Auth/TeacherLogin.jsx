import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const TeacherLogin = ({ serverStatus }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username || !password) {
      toast.error('Please enter both username and password');
      return;
    }

    setLoading(true);
    
    const result = await login({ username, password }, 'teacher');
    
    if (result.success) {
      toast.success('Welcome back, Teacher! 👨‍🏫');
      navigate('/teacher/dashboard');
    } else {
      toast.error(result.message || 'Login failed');
    }
    
    setLoading(false);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#f7f4ef',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '48px 40px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 12px 48px rgba(15,25,35,0.16)',
        border: '1px solid #d4cfc6'
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            color: '#6b7280',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            marginBottom: '20px'
          }}
        >
          ← Back
        </button>
        
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: '600',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            marginBottom: '10px',
            background: 'rgba(201,147,58,0.15)',
            color: '#c9933a'
          }}>
            Teacher Portal
          </div>
          <h2 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '28px',
            fontWeight: '700',
            color: '#0f1923'
          }}>
            Welcome back
          </h2>
        </div>
        
        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            disabled={loading}
          />
        </div>
        
        <button
          onClick={handleLogin}
          disabled={loading || serverStatus?.status === 'offline'}
          style={{
            width: '100%',
            padding: '14px',
            background: '#c9933a',
            color: '#0f1923',
            marginTop: '8px',
            border: 'none',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Signing in...' : 'Sign In as Teacher'}
        </button>
        
        <div style={{ marginTop: '16px', fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>
          Demo: teacher@eduportal.com / password123
        </div>
      </div>
    </div>
  );
};

export default TeacherLogin;