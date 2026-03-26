import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

// Theme constants
const NAVY_PRIMARY = '#1A237E';
const AZURE_ACCENT = '#00B0FF';

const SecurityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalLogs, setTotalLogs] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [clearing, setClearing] = useState(false);
  
  const limit = 50;
  const observerRef = useRef();
  const lastLogRef = useRef();

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    // Set up intersection observer for infinite scroll
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
        loadMore();
      }
    });
    
    if (lastLogRef.current) {
      observerRef.current.observe(lastLogRef.current);
    }
    
    return () => observerRef.current?.disconnect();
  }, [hasMore, loadingMore, loading, logs]);

  const fetchLogs = useCallback(async (refresh = true, page = 0) => {
    if (refresh) {
      setLoading(true);
      setError(null);
      setCurrentPage(0);
    } else {
      if (loadingMore || !hasMore) return;
      setLoadingMore(true);
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required. Please login again.');
        setLoading(false);
        setLoadingMore(false);
        return;
      }
      
      const offset = page * limit;
      const response = await api.get(`/api/admin/audit-logs?limit=${limit}&offset=${offset}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const newLogs = response.data.logs || [];
        const total = response.data.total || 0;
        
        if (refresh) {
          setLogs(newLogs);
        } else {
          setLogs(prev => [...prev, ...newLogs]);
        }
        
        setTotalLogs(total);
        const hasMoreLogs = (page + 1) * limit < total;
        setHasMore(hasMoreLogs);
        setCurrentPage(page);
        
        console.log(`Loaded ${newLogs.length} logs, total ${total}`);
      } else {
        throw new Error(response.data.message || 'Failed to load logs');
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load logs';
      setError(errorMessage);
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error('Access denied. Please login again.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [limit, hasMore, loadingMore]);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading) return;
    const nextPage = currentPage + 1;
    fetchLogs(false, nextPage);
  }, [hasMore, loadingMore, loading, currentPage, fetchLogs]);

  const clearLogs = useCallback(async () => {
    const confirmed = window.confirm(
      'Clear Security Logs?\n\nThis will permanently delete all audit logs. This action cannot be undone and will be recorded.'
    );
    
    if (!confirmed) return;
    
    setClearing(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        setClearing(false);
        return;
      }
      
      const response = await api.delete('/api/admin/audit-logs/clear', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Logs cleared successfully');
        // Refresh the list
        fetchLogs(true, 0);
      } else {
        throw new Error(response.data.message || 'Failed to clear logs');
      }
    } catch (err) {
      console.error('Error clearing logs:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to clear logs';
      toast.error(errorMessage);
    } finally {
      setClearing(false);
    }
  }, [fetchLogs]);

  const formatDate = useCallback((dateStr) => {
    if (!dateStr) return 'Unknown';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffDays > 0) return `${diffDays}d ago`;
      if (diffHours > 0) return `${diffHours}h ago`;
      if (diffMins > 0) return `${diffMins}m ago`;
      return 'Just now';
    } catch (e) {
      return dateStr;
    }
  }, []);

  const getActionColor = useCallback((action) => {
    if (action.includes('DELETE')) return '#ef4444';
    if (action.includes('CREATE')) return '#10b981';
    if (action.includes('UPDATE')) return '#f59e0b';
    if (action.includes('LOGIN')) return '#3b82f6';
    return NAVY_PRIMARY;
  }, []);

  const getActionIcon = useCallback((action) => {
    if (action.includes('DELETE')) return '🗑️';
    if (action.includes('CREATE')) return '➕';
    if (action.includes('UPDATE')) return '✏️';
    if (action.includes('LOGIN')) return '🔑';
    return '🛡️';
  }, []);

  const handleRefresh = useCallback(() => {
    fetchLogs(true, 0);
  }, [fetchLogs]);

  if (loading && logs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-3xl mb-2 animate-pulse">🔒</div>
        <p className="text-gray-500">Loading security logs...</p>
      </div>
    );
  }

  if (error && logs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-[#c9933a] text-white rounded-lg hover:bg-[#b5822e] transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#0f1923]">Security Logs</h2>
          <p className="text-sm text-gray-500 mt-1">
            Monitor system security events and audit trails
          </p>
          {totalLogs > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              Total: {totalLogs} records
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {logs.length > 0 && !loading && (
            <button
              onClick={clearLogs}
              disabled={clearing}
              className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm font-medium flex items-center gap-2 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {clearing ? 'Clearing...' : 'Clear All'}
            </button>
          )}
          <button
            onClick={handleRefresh}
            disabled={loading || loadingMore}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition text-sm font-medium flex items-center gap-2 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Logs List */}
      {logs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <div className="text-5xl mb-4">🛡️</div>
          <p className="text-gray-500 mb-2">No logs found</p>
          <p className="text-sm text-gray-400">Security events will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log, index) => {
            const isLast = index === logs.length - 1;
            const actionColor = getActionColor(log.action || '');
            
            return (
              <div
                key={log.id || index}
                ref={isLast ? lastLogRef : null}
                className="bg-white border rounded-xl p-4 hover:shadow-md transition border-gray-200"
                style={{ borderLeftColor: actionColor, borderLeftWidth: '4px' }}
              >
                <div className="flex gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${actionColor}10` }}
                  >
                    <span className="text-2xl">{getActionIcon(log.action || '')}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1" style={{ color: actionColor }}>
                      {log.action || 'Unknown Action'}
                    </h3>
                    {log.details && (
                      <p className="text-gray-600 text-sm mb-2">{log.details}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{log.username || 'System'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{formatDate(log.created_at)}</span>
                      </div>
                      {log.ip_address && (
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4-3-9s1.34-9 3-9" />
                          </svg>
                          <span>{log.ip_address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Loading More Indicator */}
          {loadingMore && (
            <div className="text-center py-4">
              <div className="inline-block w-6 h-6 border-2 border-[#c9933a] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-gray-400 mt-2">Loading more...</p>
            </div>
          )}
          
          {/* No More Logs Message */}
          {!hasMore && logs.length > 0 && (
            <div className="text-center py-4">
              <p className="text-xs text-gray-400">No more logs to load</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SecurityLogs;