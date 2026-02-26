import { signIn } from "@/auth";
import { AutoSubmitForm } from "./auto-submit";

async function cognitoSignIn(formData: FormData) {
  "use server";
  const callbackUrl = (formData.get("callbackUrl") as string) || "/";
  await signIn("cognito", { redirectTo: callbackUrl });
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;

  if (params.error) {
    const { redirect } = await import("next/navigation");
    redirect(`/auth/error?error=${encodeURIComponent(params.error)}`);
  }

  const rawCallback = params.callbackUrl || "/";
  const callbackUrl =
    rawCallback.startsWith("/") && !rawCallback.startsWith("//")
      ? rawCallback
      : "/";

  return <AutoSubmitForm action={cognitoSignIn} callbackUrl={callbackUrl} />;
}
