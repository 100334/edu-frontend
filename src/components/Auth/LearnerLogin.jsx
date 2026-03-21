import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const LearnerLogin = ({ serverStatus }) => {
  const [name, setName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!name || !regNumber) {
      setError('Please enter both name and registration number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await login({ name, regNumber }, 'learner');
      
      if (result.success) {
        toast.success(`Welcome back, ${result.user.name}! 🎒`);
        navigate('/learner/dashboard');
      } else {
        setError(result.message || 'Invalid credentials');
        toast.error(result.message || 'Login failed');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Connection failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/');
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
          onClick={handleBack} 
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
            background: 'rgba(26,107,107,0.12)', 
            color: '#1a6b6b' 
          }}>
            Learner Portal
          </div>
          <h2 style={{ 
            fontFamily: 'Playfair Display, serif', 
            fontSize: '28px', 
            fontWeight: '700', 
            color: '#0f1923' 
          }}>
            Hello, student!
          </h2>
        </div>
        
        <div className="form-group">
          <label>Full Name</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Enter your full name" 
            disabled={loading}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          />
        </div>
        
        <div className="form-group">
          <label>Registration Number</label>
          <input 
            type="text" 
            value={regNumber} 
            onChange={(e) => setRegNumber(e.target.value)} 
            placeholder="e.g., EDU-2024-0001" 
            style={{ fontFamily: 'monospace' }} 
            disabled={loading}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          />
        </div>
        
        <button 
          onClick={handleLogin} 
          disabled={loading || serverStatus?.status === 'offline'} 
          style={{ 
            width: '100%', 
            padding: '14px', 
            background: '#1a6b6b', 
            color: 'white', 
            marginTop: '8px', 
            border: 'none', 
            borderRadius: '10px', 
            fontSize: '15px', 
            fontWeight: '600', 
            cursor: loading ? 'not-allowed' : 'pointer', 
            opacity: loading ? 0.7 : 1 
          }}
        >
          {loading ? 'Signing in...' : 'Sign In as Learner'}
        </button>
        
        {error && (
          <div style={{ 
            color: '#c0392b', 
            fontSize: '13px', 
            marginTop: '10px', 
            textAlign: 'center' 
          }}>
            {error}
          </div>
        )}
        
        {serverStatus?.status === 'offline' && (
          <div style={{ 
            marginTop: '16px', 
            padding: '10px', 
            background: '#f8d7da', 
            borderRadius: '8px',
            fontSize: '12px',
            color: '#721c24',
            textAlign: 'center'
          }}>
            🔌 Server is offline. Please check your connection.
          </div>
        )}
        
        <div style={{ 
          marginTop: '16px', 
          fontSize: '12px', 
          color: '#6b7280', 
          textAlign: 'center' 
        }}>
          Demo: Violet Ulaya / EDU-2026-0001
        </div>
      </div>
    </div>
  );
};

export default LearnerLogin;