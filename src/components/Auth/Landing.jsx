import React from 'react';
import { useNavigate } from 'react-router-dom';

const Landing = ({ serverStatus }) => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f1923',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        background: serverStatus?.status === 'online' ? '#1e7e4a' : '#c0392b',
        color: 'white',
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        zIndex: 10
      }}>
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'white',
          display: 'inline-block'
        }} />
        {serverStatus?.status === 'online' ? 'Server Online' : 'Server Offline'}
      </div>

      <div style={{
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
        padding: '60px 40px',
        maxWidth: '480px',
        width: '90%'
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          background: '#c9933a',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontFamily: 'Playfair Display, serif',
          fontSize: '28px',
          fontWeight: '900',
          color: '#0f1923',
          boxShadow: '0 0 0 8px rgba(201,147,58,0.15), 0 0 0 16px rgba(201,147,58,0.07)'
        }}>
          E
        </div>
        <h1 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '42px',
          fontWeight: '900',
          color: '#f7f4ef',
          letterSpacing: '-1px',
          lineHeight: '1.1',
          marginBottom: '10px'
        }}>
          EduPortal
        </h1>
        <p style={{
          color: 'rgba(247,244,239,0.5)',
          fontSize: '14px',
          letterSpacing: '3px',
          textTransform: 'uppercase',
          marginBottom: '48px',
          fontWeight: '500'
        }}>
          School Management System
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <button
            onClick={() => navigate('/teacher/login')}
            disabled={serverStatus?.status !== 'online'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '18px 24px',
              borderRadius: '12px',
              border: 'none',
              cursor: serverStatus?.status === 'online' ? 'pointer' : 'not-allowed',
              fontSize: '15px',
              fontWeight: '600',
              transition: 'transform 0.18s, box-shadow 0.18s',
              textAlign: 'left',
              background: serverStatus?.status === 'online' ? '#c9933a' : '#6b7280',
              color: serverStatus?.status === 'online' ? '#0f1923' : '#f7f4ef',
              opacity: serverStatus?.status === 'online' ? 1 : 0.6
            }}
          >
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              flexShrink: 0
            }}>
              👩‍🏫
            </div>
            <div>
              <div>Teacher Login</div>
              <div style={{ fontSize: '12px', opacity: 0.7, fontWeight: 400, marginTop: '2px' }}>
                Manage learners, reports & attendance
              </div>
            </div>
          </button>
          
          <button
            onClick={() => navigate('/learner/login')}
            disabled={serverStatus?.status !== 'online'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '18px 24px',
              borderRadius: '12px',
              border: 'none',
              cursor: serverStatus?.status === 'online' ? 'pointer' : 'not-allowed',
              fontSize: '15px',
              fontWeight: '600',
              transition: 'transform 0.18s, box-shadow 0.18s',
              textAlign: 'left',
              background: serverStatus?.status === 'online' ? '#1a6b6b' : '#6b7280',
              color: '#f7f4ef',
              opacity: serverStatus?.status === 'online' ? 1 : 0.6
            }}
          >
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              flexShrink: 0
            }}>
              🎒
            </div>
            <div>
              <div>Learner Login</div>
              <div style={{ fontSize: '12px', opacity: 0.7, fontWeight: 400, marginTop: '2px' }}>
                View your report card & attendance
              </div>
            </div>
          </button>
        </div>
        
        {serverStatus?.status === 'offline' && (
          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: 'rgba(192,57,43,0.2)',
            borderRadius: '12px',
            border: '1px solid rgba(192,57,43,0.3)'
          }}>
            <div style={{ color: '#e8b96a', fontSize: '14px', marginBottom: '8px' }}>
              ⚠️ Server is offline or waking up
            </div>
            <div style={{ color: '#f7f4ef', fontSize: '12px', marginBottom: '12px' }}>
              Render free tier may take 30-60 seconds to wake up
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 20px',
                background: '#c9933a',
                border: 'none',
                borderRadius: '8px',
                color: '#0f1923',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              🔄 Retry Connection
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Landing;