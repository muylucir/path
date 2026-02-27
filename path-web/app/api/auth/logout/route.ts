import { NextResponse } from "next/server";

/**
 * Cognito federated logout.
 *
 * 1. Clears NextAuth session cookies
 * 2. Redirects to Cognito /logout endpoint to clear the Cognito browser session
 * 3. Cognito redirects back to the logout_uri (home page)
 */
export async function GET() {
  const cognitoDomain = process.env.COGNITO_DOMAIN;
  const clientId = process.env.COGNITO_CLIENT_ID;
  const baseUrl = (process.env.AUTH_URL || "https://path.workloom.net").replace(/\/+$/, "");
  const logoutUri = baseUrl + "/";

  if (!cognitoDomain || !clientId) {
    // Fallback: just redirect home (no Cognito session to clear)
    return NextResponse.redirect(logoutUri);
  }

  const cognitoLogoutUrl =
    `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;

  const response = NextResponse.redirect(cognitoLogoutUrl, 302);

  // Clear NextAuth session cookies
  const cookieNames = [
    "__Secure-authjs.session-token",
    "authjs.session-token",
    "__Secure-authjs.callback-url",
    "authjs.callback-url",
    "__Secure-authjs.csrf-token",
    "authjs.csrf-token",
  ];

  for (const name of cookieNames) {
    response.cookies.set(name, "", { maxAge: 0, path: "/" });
  }

  return response;
}
