"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FeasibilityRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/design"); }, [router]);
  return null;
}
