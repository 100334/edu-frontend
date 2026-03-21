import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import api, { testConnection, checkHealth, authAPI } from './services/api';
import './App.css';

// Import components
import Landing from './components/Auth/Landing';
import TeacherLogin from './components/Auth/TeacherLogin';
import LearnerLogin from './components/Auth/LearnerLogin';
import TeacherDashboard from './components/Teacher/TeacherDashboard';
import LearnerDashboard from './components/Learner/LearnerDashboard';
import ErrorBoundary from './components/common/ErrorBoundary';

const LoadingScreen = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: '#f7f4ef'
  }}>
    <div style={{
      width: '48px',
      height: '48px',
      border: '3px solid #ede9e1',
      borderTopColor: '#c9933a',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading...</p>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return null;
  }

  // Check role if specified
  if (allowedRole && user.role !== allowedRole) {
    navigate('/');
    return null;
  }

  return children;
};

function AppContent() {
  const [serverStatus, setServerStatus] = useState(null);
  const [isCheckingServer, setIsCheckingServer] = useState(true);

  useEffect(() => {
    const checkServer = async () => {
      setIsCheckingServer(true);
      
      try {
        console.log('🔍 Checking server connection...');
        console.log('API URL:', api.defaults.baseURL);
        
        const healthResult = await checkHealth();
        
        if (healthResult.success) {
          console.log('✅ Server connected:', healthResult.data);
          setServerStatus({ status: 'online', data: healthResult.data });
          toast.success('Connected to EduPortal server', {
            duration: 3000,
            icon: '🚀'
          });
        } else {
          console.warn('⚠️ Server connection failed:', healthResult.error);
          setServerStatus({ status: 'offline', error: healthResult.error });
          toast.error('Unable to connect to server. Please check your connection.', {
            duration: 5000,
            icon: '🔌'
          });
        }
      } catch (error) {
        console.error('❌ Server check error:', error);
        setServerStatus({ status: 'offline', error: error.message });
      } finally {
        setIsCheckingServer(false);
      }
    };

    checkServer();
  }, []);

  if (isCheckingServer) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#0f1923',
            color: '#fff',
            fontFamily: 'DM Sans, sans-serif',
            borderRadius: '10px',
            padding: '12px 16px',
          },
          success: {
            style: { background: '#1e7e4a' },
          },
          error: {
            style: { background: '#c0392b' },
            duration: 5000,
          },
        }}
      />
      
      <Routes>
        <Route path="/" element={<Landing setScreen={(screen) => {
          // Handle navigation
          const nav = useNavigate();
          nav(screen === 'teacher-login' ? '/teacher/login' : '/learner/login');
        }} serverStatus={serverStatus} />} />
        <Route path="/teacher/login" element={<TeacherLogin serverStatus={serverStatus} />} />
        <Route path="/learner/login" element={<LearnerLogin serverStatus={serverStatus} />} />
        
        <Route 
          path="/teacher/dashboard" 
          element={
            <ProtectedRoute allowedRole="teacher">
              <ErrorBoundary>
                <TeacherDashboard />
              </ErrorBoundary>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/learner/dashboard" 
          element={
            <ProtectedRoute allowedRole="learner">
              <ErrorBoundary>
                <LearnerDashboard />
              </ErrorBoundary>
            </ProtectedRoute>
          } 
        />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {serverStatus?.status === 'offline' && (
        <div style={{
          position: 'fixed',
          bottom: '16px',
          left: '16px',
          background: '#c0392b',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '8px',
          fontSize: '12px',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>🔴</span>
          <span>Offline Mode - Server not connected</span>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginLeft: '8px',
              padding: '4px 8px',
              background: 'white',
              color: '#c0392b',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            Retry
          </button>
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;