#!/usr/bin/env node
import fetch from 'node-fetch';

const key = process.env.SYSTEM_MAINTENANCE_KEY;
const host = process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`;

if (!key) {
  console.error('Error: SYSTEM_MAINTENANCE_KEY is not set. Set it in the environment and retry.');
  process.exit(1);
}

(async () => {
  try {
    const resp = await fetch(`${host}/api/system/flush-cache/service`, {
      method: 'POST',
      headers: {
        'x-system-key': key,
        'Content-Type': 'application/json',
      },
    });

    const text = await resp.text();
    console.log('Status:', resp.status);
    console.log('Response:', text);
    process.exit(resp.ok ? 0 : 1);
  } catch (err) {
    console.error('Flush request failed:', err);
    process.exit(1);
  }
})();