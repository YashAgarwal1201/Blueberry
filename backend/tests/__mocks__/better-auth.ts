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
    getSession: jest.fn().mockResolvedValue({
      session: { id: 'test-session-id' },
      user: { id: 'test-user-id', name: 'Test User' }
    }),
  },
});
