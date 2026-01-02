import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

// Fake user for UI demo (no database required)
const FAKE_USER = {
  id: 'fake-user-1',
  email: 'demo@forge.com',
  name: 'Demo User',
  role: 'SUPER_ADMIN' as const,
  password: 'demo123', // No hashing needed for demo
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Simple fake authentication - no database needed
        if (
          credentials.email === FAKE_USER.email &&
          credentials.password === FAKE_USER.password
        ) {
          return {
            id: FAKE_USER.id,
            email: FAKE_USER.email,
            name: FAKE_USER.name,
            role: FAKE_USER.role,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'forge-secret-key-change-in-production',
  trustHost: true,
});
