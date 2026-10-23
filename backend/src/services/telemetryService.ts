// src/services/telemetryService.ts
import crypto from "crypto";
import db, { mediaEvents as mediaEventsTable } from "../db";
import type { TelemetryEventType } from "shared-types";

const TELEMETRY_SECRET = process.env.TELEMETRY_SECRET || "blueberry_telemetry_entropy_secret";
const COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours sliding window
const MAX_CACHE_SIZE = 50_000;

// In-memory sliding cooldown cache: key -> timestamp ms
const cooldownCache = new Map<string, number>();

/**
 * Normalizes an IP address to its network subnet to prevent bot cycling
 * while preserving privacy (never stores raw IP).
 */
export function extractSubnet(ip?: string | null): string {
  if (!ip || ip === "127.0.0.1" || ip === "::1") return "localhost";

  // IPv4: keep first 3 octets (e.g. 192.168.1.0)
  if (ip.includes(".")) {
    const parts = ip.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
  }

  // IPv6: keep first 4 blocks (/64)
  if (ip.includes(":")) {
    const parts = ip.split(":");
    return parts.slice(0, 4).join(":") + "::";
  }

  return ip;
}

/**
 * Computes a privacy-respecting composite identity:
 * 1. Logged in -> auth:userId
 * 2. Anonymous with device_id -> anon:HMAC(device_id + subnet)
 * 3. Fallback -> ip:HMAC(subnet)
 */
export function resolveCompositeIdentity(
  userId?: string | null,
  deviceId?: string | null,
  clientIp?: string | null,
): string {
  if (userId && userId.trim()) {
    return `auth:${userId.trim()}`;
  }

  const subnet = extractSubnet(clientIp);

  if (deviceId && deviceId.trim()) {
    const hmac = crypto
      .createHmac("sha256", TELEMETRY_SECRET)
      .update(`${deviceId.trim()}:${subnet}`)
      .digest("hex")
      .slice(0, 32);
    return `anon:${hmac}`;
  }

  const fallbackHmac = crypto
    .createHmac("sha256", TELEMETRY_SECRET)
    .update(subnet)
    .digest("hex")
    .slice(0, 32);
  return `ip:${fallbackHmac}`;
}

export interface RecordTelemetryParams {
  mediaType: "movie" | "tv";
  mediaId: number;
  eventType: TelemetryEventType;
  userId?: string | null;
  deviceId?: string | null;
  clientIp?: string | null;
}

export interface RecordTelemetryResult {
  success: boolean;
  recorded: boolean;
  reason?: string;
  error?: string;
}

/**
 * Ingests a telemetry event with the dynamic multi-tier identity cascade and sliding cooldown.
 */
export async function recordTelemetryEvent(
  params: RecordTelemetryParams,
): Promise<RecordTelemetryResult> {
  const { mediaType, mediaId, eventType, userId, deviceId, clientIp } = params;

  // Validate inputs
  if (mediaType !== "movie" && mediaType !== "tv") {
    return { success: false, recorded: false, error: "Invalid media_type. Must be 'movie' or 'tv'." };
  }

  if (!Number.isInteger(mediaId) || mediaId <= 0) {
    return { success: false, recorded: false, error: "Invalid media_id. Must be a positive integer." };
  }

  const allowedEvents: TelemetryEventType[] = ["page_view", "trailer_play", "search_click"];
  if (!allowedEvents.includes(eventType)) {
    return {
      success: false,
      recorded: false,
      error: `Invalid event_type. Must be one of: ${allowedEvents.join(", ")}.`,
    };
  }

  // Resolve multi-tier composite identity
  const identity = resolveCompositeIdentity(userId, deviceId, clientIp);
  const cacheKey = `${identity}:${mediaType}:${mediaId}:${eventType}`;
  const now = Date.now();

  // Check sliding 2-hour debounce window
  const lastRecorded = cooldownCache.get(cacheKey);
  if (lastRecorded && now - lastRecorded < COOLDOWN_MS) {
    return { success: true, recorded: false, reason: "cooldown" };
  }

  // Insert into SQLite media_events table
  try {
    db.insert(mediaEventsTable)
      .values({
        media_type: mediaType,
        media_id: mediaId,
        user_id: userId && userId.trim() ? userId.trim() : null,
        device_id: deviceId && deviceId.trim() ? deviceId.trim() : null,
        event_type: eventType,
      })
      .run();

    cooldownCache.set(cacheKey, now);

    // Evict stale cooldown entries if cache grows large
    if (cooldownCache.size > MAX_CACHE_SIZE) {
      pruneCooldownCache();
    }

    return { success: true, recorded: true };
  } catch (err: any) {
    // If foreign key failed because user_id no longer exists, retry with user_id: null
    if (err?.code === "SQLITE_CONSTRAINT_FOREIGNKEY" && userId) {
      try {
        db.insert(mediaEventsTable)
          .values({
            media_type: mediaType,
            media_id: mediaId,
            user_id: null,
            device_id: deviceId && deviceId.trim() ? deviceId.trim() : null,
            event_type: eventType,
          })
          .run();
        cooldownCache.set(cacheKey, now);
        return { success: true, recorded: true };
      } catch (retryErr) {
        console.error("[telemetryService] Failed fallback insert:", retryErr);
      }
    }

    console.error("[telemetryService] Failed to insert media event:", err);
    return { success: false, recorded: false, error: "Database error recording event." };
  }
}

/**
 * Evicts cooldown entries older than COOLDOWN_MS.
 */
export function pruneCooldownCache(): number {
  const now = Date.now();
  let deleted = 0;
  for (const [key, timestamp] of cooldownCache.entries()) {
    if (now - timestamp >= COOLDOWN_MS) {
      cooldownCache.delete(key);
      deleted++;
    }
  }
  return deleted;
}

/**
 * Clears the cooldown cache (useful in unit tests).
 */
export function clearCooldownCache(): void {
  cooldownCache.clear();
}

/**
 * Returns the current cooldown cache size (useful for test assertions).
 */
export function getCooldownCacheSize(): number {
  return cooldownCache.size;
}
