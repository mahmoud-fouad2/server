/**
 * Faheemly™ - Admin System Control Panel
 * Copyright © 2024-2025 Faheemly.com - All Rights Reserved
 */

'use client';

import { useState, useEffect } from 'react';

export default function AdminSystemPage() {
  const [activeTab, setActiveTab] = useState('ai-providers');
  const [loading, setLoading] = useState(false);
  
  // AI Providers State
  const [aiProviders, setAiProviders] = useState([]);
  
  // Feature Flags State
  const [featureFlags, setFeatureFlags] = useState([]);
  
  // System Health State
  const [systemHealth, setSystemHealth] = useState(null);

  useEffect(() => {
    if (activeTab === 'ai-providers') fetchAiProviders();
    if (activeTab === 'feature-flags') fetchFeatureFlags();
    if (activeTab === 'health') fetchSystemHealth();
  }, [activeTab]);

  const fetchAiProviders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/system/ai-providers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setAiProviders(data.data);
    } catch (error) {
      console.error('Failed to fetch AI providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeatureFlags = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/system/feature-flags', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setFeatureFlags(data.data);
    } catch (error) {
      console.error('Failed to fetch feature flags:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemHealth = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/system/health', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setSystemHealth(data.data);
    } catch (error) {
      console.error('Failed to fetch system health:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeatureFlag = async (flagName) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/system/feature-flags/${flagName}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchFeatureFlags();
    } catch (error) {
      console.error('Failed to toggle feature flag:', error);
    }
  };

  const tabs = [
    { id: 'ai-providers', label: '🤖 AI Providers', icon: '🤖' },
    { id: 'feature-flags', label: '🚩 Feature Flags', icon: '🚩' },
    { id: 'health', label: '📊 System Health', icon: '📊' },
    { id: 'settings', label: '⚙️ Settings', icon: '⚙️' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8" data-tour="system">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">⚙️ لوحة التحكم في النظام</h1>
          <p className="text-gray-600">سيطرة كاملة على جميع إعدادات Faheemly</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex gap-4 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  data-tour={tab.id}
                >
                  <span className="text-lg ml-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">جاري التحميل...</p>
              </div>
            ) : (
              <>
                {/* AI Providers Tab */}
                {activeTab === 'ai-providers' && (
                  <div data-tour="ai-providers">
                    <h2 className="text-xl font-bold mb-4">🤖 مزودي الذكاء الاصطناعي</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {aiProviders.length === 0 ? (
                        <p className="text-gray-500 col-span-2">لا توجد مزودات مضافة بعد</p>
                      ) : (
                        aiProviders.map((provider) => (
                          <div key={provider.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold">{provider.name}</h3>
                              <span className={`px-2 py-1 rounded text-xs ${
                                provider.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {provider.isActive ? '✅ نشط' : '⏸️ معطل'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">
                              Model: {provider.modelConfig?.model || 'N/A'}
                            </p>
                            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                              ⚙️ إعدادات
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Feature Flags Tab */}
                {activeTab === 'feature-flags' && (
                  <div data-tour="feature-flags">
                    <h2 className="text-xl font-bold mb-4">🚩 Feature Flags</h2>
                    <div className="space-y-3">
                      {featureFlags.length === 0 ? (
                        <p className="text-gray-500">لا توجد feature flags</p>
                      ) : (
                        featureFlags.map((flag) => (
                          <div key={flag.name} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div>
                              <h3 className="font-semibold">{flag.name}</h3>
                              <p className="text-sm text-gray-600">{flag.description || 'لا يوجد وصف'}</p>
                            </div>
                            <button
                              onClick={() => toggleFeatureFlag(flag.name)}
                              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                flag.isEnabled
                                  ? 'bg-green-600 text-white hover:bg-green-700'
                                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                              }`}
                            >
                              {flag.isEnabled ? '✅ مفعل' : '⏸️ معطل'}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* System Health Tab */}
                {activeTab === 'health' && (
                  <div data-tour="health">
                    <h2 className="text-xl font-bold mb-4">📊 صحة النظام</h2>
                    {systemHealth ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="text-3xl mb-2">💚</div>
                          <h3 className="font-semibold text-green-800">System Status</h3>
                          <p className="text-2xl font-bold text-green-600">Online</p>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="text-3xl mb-2">⚡</div>
                          <h3 className="font-semibold text-blue-800">Response Time</h3>
                          <p className="text-2xl font-bold text-blue-600">
                            {systemHealth.responseTime || 'N/A'}
                          </p>
                        </div>
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                          <div className="text-3xl mb-2">🗄️</div>
                          <h3 className="font-semibold text-purple-800">Database</h3>
                          <p className="text-2xl font-bold text-purple-600">Healthy</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">جاري التحميل...</p>
                    )}
                  </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">⚙️ الإعدادات العامة</h2>
                    <p className="text-gray-600">قريباً...</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
