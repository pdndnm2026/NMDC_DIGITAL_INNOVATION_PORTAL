import { handleClientApi } from './clientApi.js';

let isClientMode = false;

export async function fetchApi<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  // If static client mode has already been activated, immediately route locally
  if (isClientMode) {
    return handleClientApi<T>(endpoint, options);
  }

  try {
    const res = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    const contentType = res.headers.get('content-type') || '';

    // If server returned HTML (Netlify SPA fallback) or server is missing (404/502/503)
    if (contentType.includes('text/html') || res.status === 404 || res.status === 502 || res.status === 503) {
      console.warn(`[NMDC Portal] Backend endpoint ${endpoint} unavailable (status ${res.status}, ${contentType}). Activating client standalone engine for Netlify.`);
      isClientMode = true;
      return handleClientApi<T>(endpoint, options);
    }

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || errJson.message || `Request failed with status ${res.status}`);
    }

    return res.json();
  } catch (networkError) {
    console.warn(`[NMDC Portal] Fetch to ${endpoint} failed. Activating client standalone engine for Netlify:`, networkError);
    isClientMode = true;
    return handleClientApi<T>(endpoint, options);
  }
}

