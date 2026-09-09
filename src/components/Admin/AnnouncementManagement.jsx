import React, { useState, useEffect, useCallback } from 'react';
import { MegaphoneIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../../services/api';

const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#00B4D8] focus:border-[#00B4D8] transition';

const AnnouncementManagement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetForm, setTargetForm] = useState('All');

  const loadAnnouncements = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/announcements');
      setAnnouncements(res.data?.announcements || []);
    } catch (err) {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const handlePost = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Please enter a title and message');
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await api.post('/api/admin/announcements', {
        title: title.trim(),
        message: message.trim(),
        target_form: targetForm
      });
      if (res.data.success) {
        toast.success(`Announcement sent to ${res.data.notified || 0} learner(s) ✔`);
        setTitle('');
        setMessage('');
        loadAnnouncements();
      } else {
        toast.error(res.data.message || 'Failed to post announcement');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString('en', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-xl lg:text-2xl font-bold text-[#0f1923] mb-1 flex items-center gap-2">
          <MegaphoneIcon className="w-6 h-6 text-[#00B4D8]" />
          Announcements
        </h1>
        <p className="text-sm text-gray-500">Send a message to learners' notifications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Post Form */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-200">
            <h2 className="font-semibold text-[#0f1923] text-sm lg:text-base">New Announcement</h2>
          </div>
          <div className="p-4 lg:p-6">
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. School closed on Friday"
                className={inp}
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your announcement..."
                rows={5}
                className={inp}
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Send To</label>
              <select value={targetForm} onChange={(e) => setTargetForm(e.target.value)} className={inp}>
                <option value="All">All Learners</option>
                <option value="Form 1">Form 1</option>
                <option value="Form 2">Form 2</option>
                <option value="Form 3">Form 3</option>
                <option value="Form 4">Form 4</option>
              </select>
            </div>
            <button
              onClick={handlePost}
              disabled={submitting || !title.trim() || !message.trim()}
              className="w-full px-4 py-2.5 bg-[#00B4D8] text-white rounded-lg hover:bg-[#009fbe] transition font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Sending...' : '📢 Post Announcement'}
            </button>
          </div>
        </div>

        {/* History */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-200">
            <h2 className="font-semibold text-[#0f1923] text-sm lg:text-base">Sent Announcements</h2>
          </div>
          <div className="max-h-[500px] overflow-y-auto divide-y divide-gray-100">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">Loading...</div>
            ) : announcements.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">No announcements sent yet</div>
            ) : announcements.map((item) => (
              <div key={item.id} className="px-4 lg:px-6 py-3 lg:py-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-gray-800">{item.title}</div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#00B4D8]/10 text-[#00B4D8] whitespace-nowrap">
                    {item.target_form || 'All'}
                  </span>
                </div>
                <div className="mt-1 text-sm text-gray-600">{item.message}</div>
                <div className="mt-1 text-xs text-gray-400">{formatDate(item.created_at)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementManagement;
