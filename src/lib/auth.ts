import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "./db";
import { User } from "@/models/User";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 }, // httpOnly cookie, not localStorage
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(c) {
        const email = typeof c?.email === "string" ? c.email.trim().toLowerCase() : "";
        const password = typeof c?.password === "string" ? c.password : "";
        if (!email || !password) return null;
        await connectDB();
        const u = await User.findOne({ email, status: "ACTIVE" });
        if (!u || !(await bcrypt.compare(password, u.passwordHash))) return null;
        return {
          id: String(u._id),
          email: u.email,
          name: u.name || u.email,
          role: u.role,
          orgId: u.organization ? String(u.organization) : "",
        } as any;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.orgId = (user as any).orgId;
      }
      return token;
    },
    session({ session, token }) {
      const u = session.user as any;
      u.role = token.role;
      u.orgId = token.orgId;
      u.id = token.sub;
      return session;
    },
  },
};
