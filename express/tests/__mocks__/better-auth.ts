export const betterAuth = () => ({
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
