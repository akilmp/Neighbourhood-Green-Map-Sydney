/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

interface TokenPayload { id: string; email: string }

const handler = NextAuth({
  providers: [
    Credentials({
      name: 'cookie',
      credentials: {},
      async authorize() {
        const token = cookies().get('token');
        if (!token) return null;
        const decoded = jwt.decode(token.value) as TokenPayload | null;
        if (!decoded) return null;
        return { id: decoded.id, email: decoded.email };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token }) {
      const cookie = cookies().get('token');
      if (cookie) {
        const decoded = jwt.decode(cookie.value) as TokenPayload | null;
        if (decoded) {
          (token as any).id = decoded.id;
          (token as any).email = decoded.email;
        }
      }
      return token;
    },
    async session({ session, token }) {
      const t = token as any;
      if (t.id) {
        (session as any).user = { id: t.id, email: t.email };
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
