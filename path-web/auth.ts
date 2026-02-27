import NextAuth from "next-auth";
import Cognito from "next-auth/providers/cognito";

// Placeholder secret for pre-deployment (when Cognito env vars are not set).
// Auth enforcement is skipped in middleware when authConfigured is false.
const PLACEHOLDER_SECRET = "path-agent-designer-placeholder-secret-not-for-production";

// Always include Cognito provider — NextAuth handles missing config gracefully
// at the provider level. The authConfigured flag controls middleware enforcement.
export const authConfigured =
  !!process.env.AUTH_SECRET &&
  !!process.env.COGNITO_CLIENT_ID &&
  !!process.env.COGNITO_ISSUER;

export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: false,
  providers: [
    Cognito({
      clientId: process.env.COGNITO_CLIENT_ID!,
      clientSecret: process.env.COGNITO_CLIENT_SECRET!,
      issuer: process.env.COGNITO_ISSUER!,
    }),
  ],
  secret: process.env.AUTH_SECRET || PLACEHOLDER_SECRET,
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    jwt({ token, account, profile }) {
      if (account && profile?.sub) {
        token.sub = profile.sub;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    signIn({ profile }) {
      // Require email verification (positive check)
      if (profile?.email_verified !== true) {
        return false;
      }
      return true;
    },
  },
});
