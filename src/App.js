import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import api, { testConnection, checkHealth, authAPI } from './services/api';
import './App.css';

// Import components
import TeacherLogin from './components/Auth/TeacherLogin';
import LearnerLogin from './components/Auth/LearnerLogin';
import AdminLogin from './components/Auth/AdminLogin';
import TeacherDashboard from './components/Teacher/TeacherDashboard';
import LearnerDashboard from './components/Learner/LearnerDashboard';
import ErrorBoundary from './components/common/ErrorBoundary';

// Import Admin Components
import AdminDashboard from './pages/admin/AdminDashboard';
import TeachersList from './components/Admin/TeachersList';
import LearnersList from './components/Admin/LearnersList';
import AddTeacher from './components/Admin/AddTeacher';
import AddLearner from './components/Admin/AddLearner';
import RegisterLearner from './components/Admin/RegisterLearner';
import RegisterTeacher from './components/Admin/RegisterTeacher';
import AdminClassManagement from './components/Admin/AdminClassManagement';
import AdminSubjectManagement from './components/Admin/AdminSubjectManagement';
import SecurityLogs from './components/Admin/SecurityLogs';
import QuizManagement from './components/Admin/QuizManagement';
import QuizResults from './components/Learner/QuizResults';

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

// Debug component to check authentication
const DebugAuth = () => {
  const { user, token } = useAuth();
  const [decodedToken, setDecodedToken] = useState(null);
  
  useEffect(() => {
    if (token) {
      try {
        const decoded = JSON.parse(atob(token));
        setDecodedToken(decoded);
      } catch (e) {
        console.error('Failed to decode token:', e);
      }
    }
  }, [token]);
  
  return (
    <div style={{ padding: '20px', background: '#f0f0f0', margin: '20px', borderRadius: '8px' }}>
      <h3>🔧 Debug Auth Info</h3>
      <p><strong>User:</strong> {user ? JSON.stringify(user) : 'No user'}</p>
      <p><strong>Token exists:</strong> {token ? 'Yes' : 'No'}</p>
      <p><strong>Token decoded:</strong> {decodedToken ? JSON.stringify(decodedToken) : 'N/A'}</p>
      <p><strong>User role:</strong> {user?.role || 'No role'}</p>
      <button onClick={() => {
        localStorage.clear();
        window.location.href = '/';
      }}>Clear Storage & Reload</button>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('ProtectedRoute check:', { user, loading, allowedRole });
    
    if (!loading && !user) {
      console.log('No user, redirecting to home');
      navigate('/');
      return;
    }
    
    if (!loading && user && allowedRole && user.role !== allowedRole) {
      console.log(`Wrong role: ${user.role} !== ${allowedRole}, redirecting`);
      if (user.role === 'teacher') {
        navigate('/teacher/dashboard');
      } else if (user.role === 'learner') {
        navigate('/learner/dashboard');
      } else if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  }, [user, loading, navigate, allowedRole]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return null;
  }

  if (allowedRole && user.role !== allowedRole) {
    return null;
  }

  return children;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return children;
};

// Wrapper component for AdminSubjectManagement to handle route params
const AdminSubjectManagementWrapper = () => {
  const { classId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const className = location.state?.className || 'Class';
  
  const handleBack = () => {
    navigate('/admin/class-management');
  };
  
  return (
    <AdminSubjectManagement
      user={user}
      classId={classId}
      className={className}
      onBack={handleBack}
    />
  );
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
        {/* Learner Login as Default Home Page */}
        <Route path="/" element={<LearnerLogin serverStatus={serverStatus} />} />
        <Route path="/teacher/login" element={<TeacherLogin serverStatus={serverStatus} />} />
        <Route path="/admin/login" element={<AdminLogin serverStatus={serverStatus} />} />
        <Route path="/debug" element={<DebugAuth />} />

        {/* Teacher Routes */}
        <Route 
          path="/teacher/dashboard" 
          element={
            <ProtectedRoute allowedRole="teacher">
              <ErrorBoundary><TeacherDashboard /></ErrorBoundary>
            </ProtectedRoute>
          } 
        />
        
        {/* Learner Routes */}
        <Route 
          path="/learner/dashboard" 
          element={
            <ProtectedRoute allowedRole="learner">
              <ErrorBoundary><LearnerDashboard /></ErrorBoundary>
            </ProtectedRoute>
          } 
        />

        {/* Learner Results Page */}
        <Route 
          path="/learner/results" 
          element={
            <ProtectedRoute allowedRole="learner">
              <ErrorBoundary><QuizResults /></ErrorBoundary>
            </ProtectedRoute>
          } 
        />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminRoute><ErrorBoundary><AdminDashboard /></ErrorBoundary></AdminRoute>} />
        <Route path="/admin/teachers" element={<AdminRoute><ErrorBoundary><TeachersList /></ErrorBoundary></AdminRoute>} />
        <Route path="/admin/learners" element={<AdminRoute><ErrorBoundary><LearnersList /></ErrorBoundary></AdminRoute>} />
        <Route path="/admin/add-teacher" element={<AdminRoute><ErrorBoundary><AddTeacher onSuccess={() => window.location.href = '/admin/teachers'} /></ErrorBoundary></AdminRoute>} />
        <Route path="/admin/register-teacher" element={<AdminRoute><ErrorBoundary><RegisterTeacher /></ErrorBoundary></AdminRoute>} />
        <Route path="/admin/add-learner" element={<AdminRoute><ErrorBoundary><AddLearner onSuccess={() => window.location.href = '/admin/learners'} /></ErrorBoundary></AdminRoute>} />
        <Route path="/admin/register-learner" element={<AdminRoute><ErrorBoundary><RegisterLearner /></ErrorBoundary></AdminRoute>} />
        <Route path="/admin/class-management" element={<AdminRoute><ErrorBoundary><AdminClassManagement /></ErrorBoundary></AdminRoute>} />
        <Route path="/admin/class/:classId/subjects" element={<AdminRoute><ErrorBoundary><AdminSubjectManagementWrapper /></ErrorBoundary></AdminRoute>} />
        <Route path="/admin/quiz-management" element={<AdminRoute><ErrorBoundary><QuizManagement /></ErrorBoundary></AdminRoute>} />
        <Route path="/admin/security-logs" element={<AdminRoute><ErrorBoundary><SecurityLogs /></ErrorBoundary></AdminRoute>} />
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* Offline Mode Indicator */}
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