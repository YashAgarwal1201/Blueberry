export const betterAuth = () => ({
  handler: jest.fn().mockImplementation(() => {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
  api: {
    signInEmail: jest.fn(),
    signUpEmail: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn().mockImplementation(async (opts?: { headers?: any }) => {
      let customUserId: string | null | undefined;
      if (opts?.headers) {
        if (typeof opts.headers.get === "function") {
          customUserId = opts.headers.get("x-test-user-id");
        } else if (typeof opts.headers === "object") {
          customUserId = opts.headers["x-test-user-id"];
        }
      }
      if (customUserId === "none" || customUserId === "anonymous") {
        return null;
      }
      const userId = customUserId || "test-user-id";
      return {
        session: { id: `session-${userId}` },
        user: { id: userId, name: `User ${userId}`, role: "admin" }
      };
    }),
  },
});
