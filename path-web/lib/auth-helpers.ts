import { auth, authConfigured } from "@/auth";

// Anonymous user ID used when auth is not configured (pre-deployment)
const ANONYMOUS_USER_ID = "anonymous";

export async function getAuthUserId(): Promise<string | null> {
  if (!authConfigured) {
    return ANONYMOUS_USER_ID;
  }
  const session = await auth();
  return session?.user?.id ?? null;
}
