// src/routes/telemetry.ts
import { Hono } from "hono";
import { optionalAuth } from "../middleware/authMiddleware";
import { recordTelemetryEvent } from "../services/telemetryService";
import type { AppEnv } from "../types";
import type { TelemetryEventRequest, TelemetryEventResponse } from "shared-types";

const router = new Hono<AppEnv>();

router.post("/event", optionalAuth, async (c) => {
  try {
    let body: Partial<TelemetryEventRequest>;
    try {
      body = await c.req.json();
    } catch {
      return c.json<TelemetryEventResponse>(
        {
          success: false,
          recorded: false,
          message: "Invalid JSON request body",
        },
        400,
      );
    }

    const user = c.get("user");
    const clientIp =
      c.req.header("cf-connecting-ip") ||
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
      c.req.header("x-real-ip") ||
      "127.0.0.1";

    const result = await recordTelemetryEvent({
      mediaType: body.media_type as "movie" | "tv",
      mediaId: Number(body.media_id),
      eventType: body.event_type as any,
      userId: user?.id,
      deviceId: body.device_id,
      clientIp,
    });

    if (!result.success) {
      return c.json<TelemetryEventResponse>(
        {
          success: false,
          recorded: false,
          message: result.error || "Failed to record event",
        },
        400,
      );
    }

    return c.json<TelemetryEventResponse>(
      {
        success: true,
        recorded: result.recorded,
        message: result.recorded ? "Event recorded" : "Event skipped due to cooldown",
      },
      200,
    );
  } catch (err: unknown) {
    console.error("[telemetryRoute] Error:", err);
    return c.json<TelemetryEventResponse>(
      {
        success: false,
        recorded: false,
        message: "Internal server error",
      },
      500,
    );
  }
});

export default router;
