import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { 
  Cog6ToothIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    schoolInfo: {
      name: 'EduPortal Academy',
      email: 'admin@eduportal.com',
      phone: '+265 123 456 789',
      address: '123 Education Street, Lilongwe, Malawi',
      website: 'www.eduportal.com',
      motto: 'Excellence in Education'
    },
    academic: {
      currentYear: '2024-2025',
      currentTerm: 'Term 2',
      termStart: '2024-09-01',
      termEnd: '2024-12-15',
      nextTermStart: '2025-01-08'
    },
    registration: {
      format: 'EDU-YYYY-XXXX',
      prefix: 'EDU',
      yearDigits: 4,
      sequentialDigits: 4
    },
    preferences: {
      enableNotifications: true,
      maintenanceMode: false,
      allowTeacherReports: true,
      allowParentAccess: false,
      autoBackup: true
    }
  });

  const [activeTab, setActiveTab] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState({});

  useEffect(() => {
    // Store original settings for change detection
    setOriginalSettings(JSON.parse(JSON.stringify(settings)));
  }, []);

  useEffect(() => {
    // Check if changes have been made
    const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasChanges(changed);
  }, [settings, originalSettings]);

  const handleSave = () => {
    // Simulate API call
    setTimeout(() => {
      setOriginalSettings(JSON.parse(JSON.stringify(settings)));
      toast.success('Settings saved successfully!', {
        icon: '✅',
        duration: 3000
      });
    }, 500);
  };

  const handleReset = () => {
    setSettings(JSON.parse(JSON.stringify(originalSettings)));
    toast.info('Settings reset to last saved state');
  };

  const handleSchoolInfoChange = (field, value) => {
    setSettings({
      ...settings,
      schoolInfo: {
        ...settings.schoolInfo,
        [field]: value
      }
    });
  };

  const handleAcademicChange = (field, value) => {
    setSettings({
      ...settings,
      academic: {
        ...settings.academic,
        [field]: value
      }
    });
  };

  const handleRegistrationChange = (field, value) => {
    setSettings({
      ...settings,
      registration: {
        ...settings.registration,
        [field]: value
      }
    });
  };

  const handlePreferenceChange = (field, value) => {
    setSettings({
      ...settings,
      preferences: {
        ...settings.preferences,
        [field]: value
      }
    });
  };

  const tabs = [
    { id: 'general', name: 'General', icon: BuildingOfficeIcon },
    { id: 'academic', name: 'Academic', icon: CalendarIcon },
    { id: 'registration', name: 'Registration', icon: Cog6ToothIcon },
    { id: 'preferences', name: 'Preferences', icon: Cog6ToothIcon }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header with Save Indicator */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="font-serif text-3xl font-bold text-ink mb-2">System Settings</h1>
            <p className="text-gray-500">Configure your institution settings and preferences</p>
          </div>
          
          {hasChanges && (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-sm">
                <ExclamationTriangleIcon className="w-4 h-4" />
                Unsaved changes
              </span>
              <button
                onClick={handleReset}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Reset
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-ink text-white rounded-lg hover:bg-ink/90 transition-colors text-sm flex items-center gap-2"
              >
                <CheckCircleIcon className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          )}
        </div>

        {/* Tabs Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-ink text-ink'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Settings Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* General Settings Tab */}
            {activeTab === 'general' && (
              <>
                {/* School Information */}
                <div className="bg-white rounded-xl border-2 border-ink/10 p-6">
                  <h2 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
                    <BuildingOfficeIcon className="w-5 h-5" />
                    School Information
                  </h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          School Name
                        </label>
                        <input
                          type="text"
                          value={settings.schoolInfo.name}
                          onChange={(e) => handleSchoolInfoChange('name', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          School Motto
                        </label>
                        <input
                          type="text"
                          value={settings.schoolInfo.motto}
                          onChange={(e) => handleSchoolInfoChange('motto', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink/20"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address
                        </label>
                        <div className="relative">
                          <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="email"
                            value={settings.schoolInfo.email}
                            onChange={(e) => handleSchoolInfoChange('email', e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink/20"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        <div className="relative">
                          <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="tel"
                            value={settings.schoolInfo.phone}
                            onChange={(e) => handleSchoolInfoChange('phone', e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink/20"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address
                        </label>
                        <input
                          type="text"
                          value={settings.schoolInfo.address}
                          onChange={(e) => handleSchoolInfoChange('address', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Website
                      </label>
                      <div className="relative">
                        <GlobeAltIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="url"
                          value={settings.schoolInfo.website}
                          onChange={(e) => handleSchoolInfoChange('website', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink/20"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Academic Settings Tab */}
            {activeTab === 'academic' && (
              <div className="bg-white rounded-xl border-2 border-ink/10 p-6">
                <h2 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Academic Calendar
                </h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Academic Year
                      </label>
                      <select
                        value={settings.academic.currentYear}
                        onChange={(e) => handleAcademicChange('currentYear', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink/20"
                      >
                        <option>2023-2024</option>
                        <option>2024-2025</option>
                        <option>2025-2026</option>
                        <option>2026-2027</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Term
                      </label>
                      <select
                        value={settings.academic.currentTerm}
                        onChange={(e) => handleAcademicChange('currentTerm', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink/20"
                      >
                        <option>Term 1</option>
                        <option>Term 2</option>
                        <option>Term 3</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Term Start Date
                      </label>
                      <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="date"
                          value={settings.academic.termStart}
                          onChange={(e) => handleAcademicChange('termStart', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink/20"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Term End Date
                      </label>
                      <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="date"
                          value={settings.academic.termEnd}
                          onChange={(e) => handleAcademicChange('termEnd', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink/20"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Next Term Start
                    </label>
                    <div className="relative">
                      <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        value={settings.academic.nextTermStart}
                        onChange={(e) => handleAcademicChange('nextTermStart', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink/20"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Registration Settings Tab */}
            {activeTab === 'registration' && (
              <div className="bg-white rounded-xl border-2 border-ink/10 p-6">
                <h2 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
                  <Cog6ToothIcon className="w-5 h-5" />
                  Registration Number Format
                </h2>
                
                <div className="space-y-4">
                  <div className="bg-ink/5 p-4 rounded-lg border border-ink/10">
                    <p className="text-sm font-medium text-ink mb-2">Current Format</p>
                    <p className="font-mono text-lg text-ink">{settings.registration.format}</p>
                    <p className="text-xs text-gray-500 mt-1">Example: EDU-2024-0001</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prefix
                      </label>
                      <input
                        type="text"
                        value={settings.registration.prefix}
                        onChange={(e) => handleRegistrationChange('prefix', e.target.value.toUpperCase())}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-ink font-mono"
                        maxLength="5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Year Digits
                      </label>
                      <input
                        type="number"
                        value={settings.registration.yearDigits}
                        onChange={(e) => handleRegistrationChange('yearDigits', parseInt(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-ink"
                        min="2"
                        max="4"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sequential Digits
                      </label>
                      <input
                        type="number"
                        value={settings.registration.sequentialDigits}
                        onChange={(e) => handleRegistrationChange('sequentialDigits', parseInt(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-ink"
                        min="3"
                        max="6"
                      />
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <span className="font-semibold">Preview:</span>{' '}
                      <span className="font-mono">
                        {settings.registration.prefix}-{new Date().getFullYear()}-0001
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="bg-white rounded-xl border-2 border-ink/10 p-6">
                <h2 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
                  <Cog6ToothIcon className="w-5 h-5" />
                  System Preferences
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-ink">Enable Notifications</p>
                      <p className="text-xs text-gray-500">Send email notifications for system events</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.preferences.enableNotifications}
                        onChange={(e) => handlePreferenceChange('enableNotifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ink/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ink"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-ink">Maintenance Mode</p>
                      <p className="text-xs text-gray-500">Temporarily disable user access</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.preferences.maintenanceMode}
                        onChange={(e) => handlePreferenceChange('maintenanceMode', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ink/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-ink">Allow Teacher Reports</p>
                      <p className="text-xs text-gray-500">Teachers can generate academic reports</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.preferences.allowTeacherReports}
                        onChange={(e) => handlePreferenceChange('allowTeacherReports', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ink/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ink"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-ink">Auto Backup</p>
                      <p className="text-xs text-gray-500">Automatically backup system data daily</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.preferences.autoBackup}
                        onChange={(e) => handlePreferenceChange('autoBackup', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ink/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ink"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Settings */}
          <div className="space-y-6">
            {/* Security Card */}
            <div className="bg-white rounded-xl border-2 border-ink/10 p-6">
              <h2 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
                <ShieldCheckIcon className="w-5 h-5" />
                Security
              </h2>
              <div className="space-y-3">
                <button className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-700 border border-gray-200">
                  Change Admin Password
                </button>
                <button className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-700 border border-gray-200">
                  Two-Factor Authentication
                </button>
                <button className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-700 border border-gray-200">
                  Session Management
                </button>
                <button className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-700 border border-gray-200">
                  Audit Logs
                </button>
              </div>
            </div>

            {/* System Status Card */}
            <div className="bg-white rounded-xl border-2 border-ink/10 p-6">
              <h2 className="text-lg font-semibold text-ink mb-4">System Status</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Database</span>
                  <span className="flex items-center gap-1 text-green-600">
                    <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                    Connected
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">API</span>
                  <span className="flex items-center gap-1 text-green-600">
                    <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                    Online
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Last Backup</span>
                  <span className="text-sm text-gray-900">Today, 02:00 AM</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Users</span>
                  <span className="text-sm text-gray-900">24</span>
                </div>
              </div>
            </div>

            {/* Save Button (Mobile) */}
            {hasChanges && (
              <div className="lg:hidden">
                <button
                  onClick={handleSave}
                  className="w-full py-3 bg-ink text-white rounded-lg hover:bg-ink/90 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}