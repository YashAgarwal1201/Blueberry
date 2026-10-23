import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTelemetry, getOrCreateDeviceId } from '../useTelemetry';
import apiClient from '@/services/apiInterceptors';

vi.mock('@/services/apiInterceptors', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('useTelemetry composable', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Device UUID Management', () => {
    it('generates and persists a new device UUID in localStorage when none exists', () => {
      expect(localStorage.getItem('blueberry_device_id')).toBeNull();
      const deviceId = getOrCreateDeviceId();
      expect(deviceId).toBeTruthy();
      expect(typeof deviceId).toBe('string');
      expect(localStorage.getItem('blueberry_device_id')).toBe(deviceId);
    });

    it('reuses existing device UUID from localStorage without generating a new one', () => {
      localStorage.setItem('blueberry_device_id', 'existing-device-uuid-1234');
      const deviceId = getOrCreateDeviceId();
      expect(deviceId).toBe('existing-device-uuid-1234');
    });
  });

  describe('Event Tracking Beacons', () => {
    it('sends page_view telemetry beacon with correct payload', async () => {
      localStorage.setItem('blueberry_device_id', 'test-device-uuid');
      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { success: true, recorded: true } });

      const { trackPageView } = useTelemetry();
      const recorded = await trackPageView('movie', 42);

      expect(apiClient.post).toHaveBeenCalledWith('telemetry/event', {
        media_type: 'movie',
        media_id: 42,
        event_type: 'page_view',
        device_id: 'test-device-uuid',
      });
      expect(recorded).toBe(true);
    });

    it('sends trailer_play telemetry beacon with correct payload', async () => {
      localStorage.setItem('blueberry_device_id', 'test-device-uuid');
      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { success: true, recorded: true } });

      const { trackTrailerPlay } = useTelemetry();
      const recorded = await trackTrailerPlay('movie', 99);

      expect(apiClient.post).toHaveBeenCalledWith('telemetry/event', {
        media_type: 'movie',
        media_id: 99,
        event_type: 'trailer_play',
        device_id: 'test-device-uuid',
      });
      expect(recorded).toBe(true);
    });

    it('sends search_click telemetry beacon with correct payload', async () => {
      localStorage.setItem('blueberry_device_id', 'test-device-uuid');
      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { success: true, recorded: true } });

      const { trackSearchClick } = useTelemetry();
      const recorded = await trackSearchClick('tv', 55);

      expect(apiClient.post).toHaveBeenCalledWith('telemetry/event', {
        media_type: 'tv',
        media_id: 55,
        event_type: 'search_click',
        device_id: 'test-device-uuid',
      });
      expect(recorded).toBe(true);
    });

    it('ignores invalid or non-positive media IDs without calling backend', async () => {
      const { trackPageView } = useTelemetry();

      const res1 = await trackPageView('movie', 0);
      const res2 = await trackPageView('movie', -5);
      const res3 = await trackPageView('movie', NaN);

      expect(apiClient.post).not.toHaveBeenCalled();
      expect(res1).toBe(false);
      expect(res2).toBe(false);
      expect(res3).toBe(false);
    });

    it('fails silently without throwing when backend network call errors', async () => {
      vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Network error'));

      const { trackPageView } = useTelemetry();
      const recorded = await trackPageView('movie', 12);

      expect(recorded).toBe(false);
    });
  });
});
