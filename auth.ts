/** Auth.js (next-auth v5). Sign-in proves who you are; lib/rights decides what you may see, on every request, from the database. */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyLogin } from "@/lib/auth/verify-login";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 12 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {}, code: {} },
      async authorize(c) {
        const r = await verifyLogin(String(c.email ?? ""), String(c.password ?? ""), String(c.code ?? ""), { audit: false });
        return r.ok ? { id: r.email, email: r.email } : null;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) { if (user?.email) token.email = user.email; return token; },
    session({ session, token }) { if (token.email) session.user.email = token.email; return session; },
  },
});
