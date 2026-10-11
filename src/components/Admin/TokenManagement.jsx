import React, { useState, useEffect, useCallback } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../../services/api';

const DURATION_OPTIONS = [
  { label: '1 week',   days: 7   },
  { label: '1 month',  days: 30  },
  { label: '2 months', days: 60  },
  { label: '3 months', days: 90  },
  { label: '6 months', days: 180 },
  { label: '1 year',   days: 365 },
];

const daysLeft = (expiresAt) => {
  if (!expiresAt) return null;
  return Math.ceil((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
};

const TokenManagement = () => {
  const [learners,      setLearners]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [generatingFor, setGeneratingFor] = useState(null);
  const [revokingFor,   setRevokingFor]   = useState(null);
  const [bulkRenewing,  setBulkRenewing]  = useState(false);
  const [search,        setSearch]        = useState('');
  const [filterStatus,  setFilterStatus]  = useState('all');
  const [duration,      setDuration]      = useState(30);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/api/admin/tokens', { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) setLearners(res.data.learners || []);
    } catch { toast.error('Could not load token data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const generate = async (learnerId) => {
    setGeneratingFor(learnerId);
    try {
      const token = localStorage.getItem('token');
      const res = await api.post('/api/admin/tokens/generate',
        { learner_id: learnerId, duration_days: duration },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        const exp = new Date(res.data.expires_at).toLocaleDateString('en', { dateStyle: 'medium' });
        toast.success(`Token: ${res.data.token}  ·  Expires ${exp}`);
        load();
      } else toast.error(res.data.message || 'Failed');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setGeneratingFor(null); }
  };

  const revoke = async (learnerId) => {
    setRevokingFor(learnerId);
    try {
      const token = localStorage.getItem('token');
      const res = await api.post('/api/admin/tokens/revoke',
        { learner_id: learnerId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) { toast.success('Token revoked'); load(); }
      else toast.error(res.data.message || 'Failed');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setRevokingFor(null); }
  };

  const bulkRenew = async () => {
    const toRenew = learners.filter(l => {
      const d = daysLeft(l.token_expires_at);
      return l.token_expired || (d !== null && d <= 3);
    });
    if (toRenew.length === 0) { toast('No tokens need renewal right now.'); return; }
    setBulkRenewing(true);
    let count = 0;
    for (const l of toRenew) {
      try {
        const token = localStorage.getItem('token');
        const res = await api.post('/api/admin/tokens/generate',
          { learner_id: l.id, duration_days: duration },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success) count++;
      } catch { /* skip */ }
    }
    toast.success(`Renewed ${count} token${count !== 1 ? 's' : ''}.`);
    setBulkRenewing(false);
    load();
  };

  const activeCount  = learners.filter(l => l.token_active).length;
  const expiredCount = learners.filter(l => l.token_expired).length;
  const noneCount    = learners.filter(l => !l.access_token).length;
  const soonCount    = learners.filter(l => { const d = daysLeft(l.token_expires_at); return l.token_active && d !== null && d <= 7; }).length;

  const filtered = learners.filter(l => {
    const matchSearch = !search ||
      l.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.reg_number?.toLowerCase().includes(search.toLowerCase());
    const d = daysLeft(l.token_expires_at);
    const matchStatus =
      filterStatus === 'all'     ? true :
      filterStatus === 'active'  ? l.token_active :
      filterStatus === 'soon'    ? (l.token_active && d !== null && d <= 7) :
      filterStatus === 'expired' ? l.token_expired :
      filterStatus === 'none'    ? !l.access_token : true;
    return matchSearch && matchStatus;
  });

  const durationLabel = DURATION_OPTIONS.find(o => o.days === duration)?.label || `${duration}d`;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#0A2540]">🎫 Access Tokens</h1>
        <p className="text-sm text-gray-500 mt-1">
          Issue subscription tokens to give learners access to lessons. Choose the period before issuing.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Active',       value: activeCount,  color: '#2E7D32', bg: '#E8F5E9', filter: 'active'  },
          { label: 'Expires Soon', value: soonCount,    color: '#E65100', bg: '#FFF3E0', filter: 'soon'    },
          { label: 'Expired',      value: expiredCount, color: '#C62828', bg: '#FFEBEE', filter: 'expired' },
          { label: 'No Token',     value: noneCount,    color: '#5A5A5A', bg: '#F5F5F5', filter: 'none'    },
        ].map(s => (
          <button key={s.label}
            onClick={() => setFilterStatus(f => f === s.filter ? 'all' : s.filter)}
            className={`rounded-xl border p-4 text-center transition hover:shadow-sm ${filterStatus === s.filter ? 'ring-2' : ''}`}
            style={{ backgroundColor: s.bg, borderColor: s.color + '30', outlineColor: s.color }}
          >
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[11px] font-semibold text-gray-500 uppercase mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or reg number…"
          className="flex-1 min-w-[180px] px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#006770]"
        />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#006770]">
          <option value="all">All learners</option>
          <option value="active">Active</option>
          <option value="soon">Expiring soon (≤7 days)</option>
          <option value="expired">Expired</option>
          <option value="none">No token</option>
        </select>

        {/* Period selector */}
        <div className="flex items-center gap-2 bg-[#f0faf9] border border-[#006770]/20 rounded-lg px-3 py-2">
          <span className="text-xs font-bold text-[#006770] whitespace-nowrap">📅 Period:</span>
          <select value={duration} onChange={e => setDuration(parseInt(e.target.value))}
            className="text-sm bg-transparent focus:outline-none font-semibold text-[#003B46]">
            {DURATION_OPTIONS.map(o => <option key={o.days} value={o.days}>{o.label}</option>)}
          </select>
        </div>

        {/* Bulk renew */}
        <button onClick={bulkRenew} disabled={bulkRenewing}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition disabled:opacity-50"
          title="Renew all expired or expiring within 3 days">
          {bulkRenewing
            ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Renewing…</>
            : `🔄 Bulk Renew (${durationLabel})`}
        </button>

        <button onClick={load} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
          <ArrowPathIcon className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#006770]/20 border-t-[#006770] rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <span className="text-4xl">🎫</span>
          <p className="text-sm text-gray-400 mt-2">No learners found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Learner', 'Form', 'Token', 'Status', 'Expires', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(learner => {
                  const isActive      = learner.token_active;
                  const isExpired     = learner.token_expired;
                  const hasToken      = !!learner.access_token;
                  const d             = daysLeft(learner.token_expires_at);
                  const expiringSoon  = isActive && d !== null && d <= 7;
                  const expiry        = learner.token_expires_at
                    ? new Date(learner.token_expires_at).toLocaleDateString('en', { dateStyle: 'medium' })
                    : '—';
                  return (
                    <tr key={learner.id} className={`transition ${expiringSoon ? 'bg-orange-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-[#003B46]">{learner.name}</p>
                        <p className="text-[10px] text-gray-400">{learner.reg_number}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-[#e0f7fa] text-[#006770] text-[10px] font-semibold rounded">{learner.form}</span>
                      </td>
                      <td className="px-4 py-3">
                        {hasToken
                          ? <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{learner.access_token}</span>
                          : <span className="text-[11px] text-gray-400 italic">No token</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                          expiringSoon ? 'bg-orange-100 text-orange-700' :
                          isActive     ? 'bg-green-100 text-green-700'  :
                          isExpired    ? 'bg-red-100 text-red-600'      :
                                         'bg-gray-100 text-gray-500'}`}>
                          {expiringSoon ? `⚠️ ${d}d left` : isActive ? '✓ Active' : isExpired ? 'Expired' : 'No token'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{expiry}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => generate(learner.id)} disabled={generatingFor === learner.id}
                            className="px-3 py-1.5 bg-[#006770] text-white rounded-lg text-[11px] font-semibold hover:bg-[#005a62] transition disabled:opacity-50 flex items-center gap-1 whitespace-nowrap">
                            {generatingFor === learner.id
                              ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              : hasToken ? `🔄 Renew (${durationLabel})` : `✨ Issue (${durationLabel})`}
                          </button>
                          {hasToken && (
                            <button onClick={() => revoke(learner.id)} disabled={revokingFor === learner.id}
                              className="px-2.5 py-1.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-[11px] font-semibold hover:bg-red-100 transition disabled:opacity-50">
                              {revokingFor === learner.id
                                ? <div className="w-3 h-3 border-2 border-red-200 border-t-red-500 rounded-full animate-spin" />
                                : '🚫'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <p className="text-xs font-bold text-amber-700 mb-1">How subscription tokens work</p>
        <ul className="text-[11px] text-amber-600 space-y-0.5 list-disc list-inside">
          <li>Select the subscription period (1 week, 1 month, etc.) before issuing.</li>
          <li>Token format: <span className="font-mono font-bold">EDU-2026-XXXXXX</span> — share with the learner.</li>
          <li>Tokens expiring within 7 days are highlighted in orange.</li>
          <li><strong>Bulk Renew</strong> renews all expired + expiring-within-3-days tokens at once.</li>
          <li>Revoking immediately removes the learner's access to all lessons.</li>
        </ul>
      </div>
    </div>
  );
};

export default TokenManagement;
