import NextAuth from "next-auth";
import type { Adapter } from "next-auth/adapters";
import Credentials from "next-auth/providers/credentials";
import type { EmailConfig } from "next-auth/providers";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { sendMagicLink } from "@/lib/email";

/**
 * Dev-only password-less login (pick a seeded account by email). Enabled only
 * when AUTH_DEV_LOGIN=true AND NODE_ENV is not "production". Never set
 * AUTH_DEV_LOGIN in a deployed environment.
 */
export const devLoginEnabled =
  process.env.AUTH_DEV_LOGIN === "true" && process.env.NODE_ENV !== "production";

const magicLink: EmailConfig = {
  id: "email",
  type: "email",
  name: "Email",
  from: process.env.EMAIL_FROM,
  maxAge: 24 * 60 * 60,
  async sendVerificationRequest({ identifier, url }) {
    await sendMagicLink(identifier, url);
  },
};

const providers = [
  magicLink,
  ...(devLoginEnabled
    ? [
        Credentials({
          id: "dev-login",
          name: "Dev login",
          credentials: { email: { label: "Email", type: "email" } },
          async authorize(credentials) {
            const email = String(credentials?.email ?? "").trim().toLowerCase();
            if (!email) return null;
            const user = await prisma.user.findUnique({ where: { email } });
            return user ? { id: user.id, email: user.email, name: user.name } : null;
          },
        }),
      ]
    : []),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  // The generated Prisma 7 client lives in src/generated; the adapter only needs
  // the model delegates, so the cast is safe.
  adapter: PrismaAdapter(prisma as never) as Adapter,
  // JWT sessions so the dev credentials provider works alongside magic links.
  // Role/tier/verified are always re-read from the DB (see src/lib/session.ts).
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/signin",
    verifyRequest: "/signin/check-email",
    error: "/signin",
  },
  providers,
  callbacks: {
    async signIn({ user, account, email }) {
      // Accounts are created by the Join flow. A magic link is only sent to an
      // email that already belongs to a member. Unknown emails land on the same
      // "check your email" page (nothing is sent) so the form can't be used to
      // find out whether someone is a member.
      if (account?.provider === "email" && email?.verificationRequest) {
        const address = user.email?.toLowerCase();
        const existing = address
          ? await prisma.user.findUnique({ where: { email: address }, select: { id: true } })
          : null;
        if (!existing) return "/signin/check-email";
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token.sub && session.user) session.user.id = token.sub;
      return session;
    },
  },
});
