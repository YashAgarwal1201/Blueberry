// backend/tests/telemetry.test.ts
import request from "supertest";
import app from "../src/index";
import db, { pruneStaleMediaEvents } from "../src/db";
import {
  clearCooldownCache,
  resolveCompositeIdentity,
  extractSubnet,
} from "../src/services/telemetryService";

describe("Telemetry & Behavioral Events (Phase 1)", () => {
  beforeAll(() => {
    // Insert dummy user to match the mocked auth session
    db.prepare(`
      INSERT OR IGNORE INTO "user" (id, name, email, emailVerified, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      'test-user-id',
      'Test User',
      'telemetry-test@example.com',
      1,
      new Date().toISOString(),
      new Date().toISOString()
    );
  });

  beforeEach(() => {
    clearCooldownCache();
    db.prepare("DELETE FROM media_events").run();
  });

  afterAll(() => {
    clearCooldownCache();
    db.prepare("DELETE FROM media_events").run();
    db.prepare(`DELETE FROM "user" WHERE id = 'test-user-id'`).run();
  });


  describe("Subnet & Identity Resolution", () => {
    it("extracts IPv4 subnets properly", () => {
      expect(extractSubnet("192.168.1.45")).toBe("192.168.1.0");
      expect(extractSubnet("10.0.5.210")).toBe("10.0.5.0");
      expect(extractSubnet("127.0.0.1")).toBe("localhost");
    });

    it("prioritizes authenticated user ID over device ID and IP", () => {
      const id = resolveCompositeIdentity("user_123", "dev_abc", "192.168.1.45");
      expect(id).toBe("auth:user_123");
    });

    it("generates distinct anonymous composite identities for different devices on the same IP (Shared Wi-Fi)", () => {
      const id1 = resolveCompositeIdentity(null, "device-laptop-1", "192.168.1.45");
      const id2 = resolveCompositeIdentity(null, "device-phone-2", "192.168.1.45");

      expect(id1.startsWith("anon:")).toBe(true);
      expect(id2.startsWith("anon:")).toBe(true);
      expect(id1).not.toBe(id2);
    });
  });

  describe("Validation & Error Handling", () => {
    it("rejects request with invalid media_type", async () => {
      const res = await request(app)
        .post("/api/telemetry/event")
        .send({
          media_type: "book",
          media_id: 1,
          event_type: "page_view",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.recorded).toBe(false);
      expect(res.body.message).toMatch(/Invalid media_type/);
    });

    it("rejects request with non-positive media_id", async () => {
      const res = await request(app)
        .post("/api/telemetry/event")
        .send({
          media_type: "movie",
          media_id: -10,
          event_type: "page_view",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Invalid media_id/);
    });

    it("rejects request with invalid event_type", async () => {
      const res = await request(app)
        .post("/api/telemetry/event")
        .send({
          media_type: "movie",
          media_id: 1,
          event_type: "purchase",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Invalid event_type/);
    });
  });

  describe("Event Ingestion & 2-Hour Cooldown Debounce", () => {
    it("successfully records page_view event and inserts into SQLite", async () => {
      const res = await request(app)
        .post("/api/telemetry/event")
        .set("X-Forwarded-For", "203.0.113.195")
        .send({
          media_type: "movie",
          media_id: 42,
          event_type: "page_view",
          device_id: "test-device-uuid-1",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.recorded).toBe(true);

      // Verify row in SQLite
      const rows = db
        .prepare("SELECT * FROM media_events WHERE media_type = 'movie' AND media_id = 42")
        .all() as any[];
      expect(rows.length).toBe(1);
      expect(rows[0].event_type).toBe("page_view");
      expect(rows[0].device_id).toBe("test-device-uuid-1");
    });

    it("skips recording on duplicate hit within cooldown window (debounce)", async () => {
      // First hit -> Recorded
      const res1 = await request(app)
        .post("/api/telemetry/event")
        .set("X-Forwarded-For", "203.0.113.195")
        .send({
          media_type: "movie",
          media_id: 100,
          event_type: "trailer_play",
          device_id: "test-device-uuid-2",
        });

      expect(res1.status).toBe(200);
      expect(res1.body.recorded).toBe(true);

      // Second immediate hit -> Skipped due to cooldown
      const res2 = await request(app)
        .post("/api/telemetry/event")
        .set("X-Forwarded-For", "203.0.113.195")
        .send({
          media_type: "movie",
          media_id: 100,
          event_type: "trailer_play",
          device_id: "test-device-uuid-2",
        });

      expect(res2.status).toBe(200);
      expect(res2.body.success).toBe(true);
      expect(res2.body.recorded).toBe(false);
      expect(res2.body.message).toMatch(/cooldown/);

      // Confirm only 1 row exists in SQLite
      const rows = db
        .prepare("SELECT * FROM media_events WHERE media_type = 'movie' AND media_id = 100")
        .all();
      expect(rows.length).toBe(1);
    });

    it("records different event types independently for the same media and device", async () => {
      // page_view
      const res1 = await request(app)
        .post("/api/telemetry/event")
        .send({
          media_type: "movie",
          media_id: 50,
          event_type: "page_view",
          device_id: "device-same",
        });
      expect(res1.body.recorded).toBe(true);

      // trailer_play (different event type -> allowed)
      const res2 = await request(app)
        .post("/api/telemetry/event")
        .send({
          media_type: "movie",
          media_id: 50,
          event_type: "trailer_play",
          device_id: "device-same",
        });
      expect(res2.body.recorded).toBe(true);

      // search_click (different event type -> allowed)
      const res3 = await request(app)
        .post("/api/telemetry/event")
        .send({
          media_type: "movie",
          media_id: 50,
          event_type: "search_click",
          device_id: "device-same",
        });
      expect(res3.body.recorded).toBe(true);

      const rows = db
        .prepare("SELECT * FROM media_events WHERE media_type = 'movie' AND media_id = 50")
        .all();
      expect(rows.length).toBe(3);
    });

    it("allows two devices on the same IP to both be counted (Shared Wi-Fi support)", async () => {
      const sharedIp = "198.51.100.12";

      // Device 1 (Anonymous roommate 1)
      const res1 = await request(app)
        .post("/api/telemetry/event")
        .set("x-test-user-id", "anonymous")
        .set("X-Forwarded-For", sharedIp)
        .send({
          media_type: "tv",
          media_id: 77,
          event_type: "page_view",
          device_id: "roommate-1-laptop",
        });
      expect(res1.body.recorded).toBe(true);

      // Device 2 on exact same IP (Anonymous roommate 2)
      const res2 = await request(app)
        .post("/api/telemetry/event")
        .set("x-test-user-id", "anonymous")
        .set("X-Forwarded-For", sharedIp)
        .send({
          media_type: "tv",
          media_id: 77,
          event_type: "page_view",
          device_id: "roommate-2-phone",
        });
      expect(res2.body.recorded).toBe(true);

      const rows = db
        .prepare("SELECT * FROM media_events WHERE media_type = 'tv' AND media_id = 77")
        .all();
      expect(rows.length).toBe(2);
    });

  });

  describe("Storage Pruning", () => {
    it("deletes records older than 30 days while retaining recent records", () => {
      // Insert fresh record (today)
      db.prepare(`
        INSERT INTO media_events (media_type, media_id, event_type, created_at)
        VALUES ('movie', 1, 'page_view', datetime('now'))
      `).run();

      // Insert 10-day old record (should be retained)
      db.prepare(`
        INSERT INTO media_events (media_type, media_id, event_type, created_at)
        VALUES ('movie', 2, 'page_view', datetime('now', '-10 days'))
      `).run();

      // Insert 35-day old record (should be pruned)
      db.prepare(`
        INSERT INTO media_events (media_type, media_id, event_type, created_at)
        VALUES ('movie', 3, 'page_view', datetime('now', '-35 days'))
      `).run();

      // Insert 60-day old record (should be pruned)
      db.prepare(`
        INSERT INTO media_events (media_type, media_id, event_type, created_at)
        VALUES ('movie', 4, 'page_view', datetime('now', '-60 days'))
      `).run();

      const prunedCount = pruneStaleMediaEvents(30);
      expect(prunedCount).toBe(2);

      const remaining = db.prepare("SELECT id, media_id FROM media_events").all() as any[];
      expect(remaining.length).toBe(2);
      const remainingIds = remaining.map((r) => r.media_id);
      expect(remainingIds).toContain(1);
      expect(remainingIds).toContain(2);
      expect(remainingIds).not.toContain(3);
      expect(remainingIds).not.toContain(4);
    });
  });
});
