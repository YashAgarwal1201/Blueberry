// src/composables/useTelemetry.ts
import apiClient from '@/services/apiInterceptors';
import type { TelemetryEventType, TelemetryEventRequest, TelemetryEventResponse } from 'shared-types';

const DEVICE_ID_KEY = 'blueberry_device_id';

/**
 * Retrieves the persistent client device UUID from localStorage.
 * If not present or running in SSR/testing environments, generates a new UUID and persists it.
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined' || !window.localStorage) {
    return 'anon-device';
  }

  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      deviceId = crypto.randomUUID();
    } else {
      deviceId = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
    }
    try {
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    } catch (e) {
      console.warn('[useTelemetry] Failed to persist device ID to localStorage:', e);
    }
  }
  return deviceId;
}

export function useTelemetry() {
  /**
   * Dispatches a non-blocking fire-and-forget telemetry beacon to the backend.
   */
  const sendEvent = async (
    mediaType: 'movie' | 'tv',
    mediaId: number,
    eventType: TelemetryEventType,
  ): Promise<boolean> => {
    if (!mediaId || isNaN(mediaId) || mediaId <= 0) {
      return false;
    }

    try {
      const deviceId = getOrCreateDeviceId();
      const payload: TelemetryEventRequest = {
        media_type: mediaType,
        media_id: mediaId,
        event_type: eventType,
        device_id: deviceId,
      };

      const res = await apiClient.post<TelemetryEventResponse>('telemetry/event', payload);
      return res.data?.recorded ?? false;
    } catch {
      // Telemetry failures are strictly non-fatal and should never disrupt user UX
      return false;
    }
  };

  const trackPageView = (mediaType: 'movie' | 'tv', mediaId: number) => {
    return sendEvent(mediaType, mediaId, 'page_view');
  };

  const trackTrailerPlay = (mediaType: 'movie' | 'tv', mediaId: number) => {
    return sendEvent(mediaType, mediaId, 'trailer_play');
  };

  const trackSearchClick = (mediaType: 'movie' | 'tv', mediaId: number) => {
    return sendEvent(mediaType, mediaId, 'search_click');
  };

  return {
    getOrCreateDeviceId,
    sendEvent,
    trackPageView,
    trackTrailerPlay,
    trackSearchClick,
  };
}
