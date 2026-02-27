import { signIn } from "@/auth";
import { redirect } from "next/navigation";
import { AutoSubmit } from "./auto-submit";

async function cognitoSignIn(formData: FormData) {
  "use server";
  const callbackUrl = (formData.get("callbackUrl") as string) || "/design";
  await signIn("cognito", { redirectTo: callbackUrl });
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;

  if (params.error) {
    redirect(`/auth/error?error=${encodeURIComponent(params.error)}`);
  }

  const rawCallback = params.callbackUrl || "/design";
  const callbackUrl =
    rawCallback.startsWith("/") && !rawCallback.startsWith("//")
      ? rawCallback
      : "/design";

  return <AutoSubmit action={cognitoSignIn} callbackUrl={callbackUrl} />;
}
