'use client';

import { useState } from 'react';

declare global {
  interface Window {
    __FAHIMO_WIDGET_LOADER?: any;
  }
}

export default function TestWidgetPage() {
  const [businessId, setBusinessId] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  const loadWidget = () => {
    if (!businessId) return;
    
    // Remove existing widget if any
    const existing = document.getElementById('fahimo-widget-script');
    if (existing) existing.remove();
    const root = document.getElementById('fahimo-widget-root');
    if (root) root.remove();
    // Reset loader state
    if (window.__FAHIMO_WIDGET_LOADER) window.__FAHIMO_WIDGET_LOADER = undefined;

    const script = document.createElement('script');
    script.id = 'fahimo-widget-script';
    script.src = (process.env.NEXT_PUBLIC_API_URL || 'https://fahimo-api.onrender.com') + '/api/widget/loader.js';
    script.setAttribute('data-business-id', businessId);
    script.onload = () => setIsLoaded(true);
    document.body.appendChild(script);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Widget Test Page</h1>
        <p className="text-gray-600 mb-6">
          Enter a Business ID below to test the chat widget. 
          Make sure the API is running on port 3001.
        </p>

        <div className="flex gap-4 mb-8">
          <input
            type="text"
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value)}
            placeholder="Enter Business ID"
            className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            onClick={loadWidget}
            disabled={!businessId}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Load Widget
          </button>
        </div>

        <div className="border-t pt-6">
          <h2 className="font-semibold mb-2">Status:</h2>
          <div className="space-y-2 text-sm">
            <p>API URL: <code className="bg-gray-100 px-1 rounded">{process.env.NEXT_PUBLIC_API_URL || 'https://fahimo-api.onrender.com'}</code></p>
            <p>Widget Script: <code className="bg-gray-100 px-1 rounded">/api/widget/loader.js</code></p>
            <p>Loaded: {isLoaded ? '✅ Yes' : '❌ No'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
