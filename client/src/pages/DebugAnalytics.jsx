/**
 * DEBUG PAGE - Analytics Testing
 * REMOVE THIS FILE AFTER DEBUGGING
 *
 * Access at: /debug-analytics
 * Tests analytics configuration and event tracking
 */

import { useState } from 'react';
import { trackEvent } from '../utils/analytics';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function DebugAnalytics() {
  const [serverCheck, setServerCheck] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkServerEnv = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/debug/env-check`);
      const data = await response.json();
      setServerCheck(data);
    } catch (error) {
      setServerCheck({ error: error.message });
    }
    setLoading(false);
  };

  const testAnalyticsEvent = async () => {
    setLoading(true);
    try {
      // Test tracking a simple event
      await trackEvent('session_start', {
        test: true,
        timestamp: new Date().toISOString(),
      });
      setTestResult({ success: true, message: 'Event sent successfully' });
    } catch (error) {
      setTestResult({ success: false, error: error.message });
    }
    setLoading(false);
  };

  const clientEnv = {
    VITE_ANALYTICS_API_KEY: import.meta.env.VITE_ANALYTICS_API_KEY ? {
      exists: true,
      length: import.meta.env.VITE_ANALYTICS_API_KEY.length,
      first4: import.meta.env.VITE_ANALYTICS_API_KEY.substring(0, 4),
      last4: import.meta.env.VITE_ANALYTICS_API_KEY.slice(-4),
    } : {
      exists: false,
    },
    VITE_API_URL: import.meta.env.VITE_API_URL,
    hostname: window.location.hostname,
    isProduction: window.location.hostname === 'codescribeai.com' ||
                   window.location.hostname.includes('vercel.app'),
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Analytics Debug Page</h1>
      <p style={{ color: 'red' }}>⚠️ REMOVE THIS PAGE AFTER DEBUGGING</p>

      <hr />

      <h2>Client Environment</h2>
      <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
        {JSON.stringify(clientEnv, null, 2)}
      </pre>

      <hr />

      <h2>Server Environment Check</h2>
      <button onClick={checkServerEnv} disabled={loading}>
        {loading ? 'Checking...' : 'Check Server Environment'}
      </button>
      {serverCheck && (
        <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto', marginTop: '10px' }}>
          {JSON.stringify(serverCheck, null, 2)}
        </pre>
      )}

      <hr />

      <h2>Test Analytics Event</h2>
      <button onClick={testAnalyticsEvent} disabled={loading}>
        {loading ? 'Sending...' : 'Send Test Event (session_start)'}
      </button>
      {testResult && (
        <pre style={{
          background: testResult.success ? '#d4edda' : '#f8d7da',
          padding: '10px',
          overflow: 'auto',
          marginTop: '10px',
          border: `1px solid ${testResult.success ? '#c3e6cb' : '#f5c6cb'}`,
        }}>
          {JSON.stringify(testResult, null, 2)}
        </pre>
      )}

      <hr />

      <h2>Expected Results</h2>
      <ul>
        <li>
          <strong>Client VITE_ANALYTICS_API_KEY:</strong> Should exist (exists: true)
        </li>
        <li>
          <strong>Server ANALYTICS_API_KEY:</strong> Should exist (exists: true)
        </li>
        <li>
          <strong>Keys should match:</strong> first4 and last4 should be identical on both sides
        </li>
        <li>
          <strong>isProduction:</strong> Should be true on codescribeai.com or *.vercel.app
        </li>
        <li>
          <strong>Test event:</strong> Should succeed with no errors
        </li>
      </ul>

      <hr />

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Client key missing:</strong> Add VITE_ANALYTICS_API_KEY to Vercel client env vars
        </li>
        <li>
          <strong>Server key missing:</strong> Add ANALYTICS_API_KEY to Vercel server env vars
        </li>
        <li>
          <strong>Keys don't match:</strong> Make sure both use the same value
        </li>
        <li>
          <strong>Test event fails with 401:</strong> Keys don't match or client key missing
        </li>
        <li>
          <strong>Test event fails with 500:</strong> Server error, check Vercel logs
        </li>
      </ul>

      <p style={{ marginTop: '20px', padding: '10px', background: '#fff3cd', border: '1px solid #ffc107' }}>
        <strong>After debugging:</strong> Remove this file and the debug routes from server/src/routes/debug-env.js
      </p>
    </div>
  );
}
