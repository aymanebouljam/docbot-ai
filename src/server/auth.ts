import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const DEFAULT_AUTH_EMAIL = "demo@docbot.ai";
const DEFAULT_AUTH_PASSWORD = "docbot-demo-password";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize(credentials) {
        const configuredEmail = process.env.AUTH_EMAIL ?? DEFAULT_AUTH_EMAIL;
        const configuredPassword =
          process.env.AUTH_PASSWORD ?? DEFAULT_AUTH_PASSWORD;
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;

        if (email !== configuredEmail.toLowerCase()) {
          return null;
        }

        if (password !== configuredPassword) {
          return null;
        }

        return {
          id: "docbot-demo-user",
          name: "Demo User",
          email: configuredEmail,
        };
      },
    }),
  ],
  callbacks: {
    session({ session, token }) {
      if (session.user) {
        session.user.name = token.name ?? session.user.name;
        session.user.email = token.email ?? session.user.email;
      }

      return session;
    },
  },
};

export function getServerAuthSession() {
  return getServerSession(authOptions);
}

export function createUnauthorizedResponse() {
  return Response.json({ error: "Unauthorized." }, { status: 401 });
}
