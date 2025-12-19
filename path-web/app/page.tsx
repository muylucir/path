"use client";

import { Step1Form } from "@/components/steps/Step1Form";
import { Sidebar } from "@/components/layout/Sidebar";
import type { FormValues } from "@/lib/schema";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const handleSubmit = (data: FormValues) => {
    // Store form data in sessionStorage
    sessionStorage.setItem("formData", JSON.stringify(data));
    // Navigate to analysis page
    router.push("/analyze");
  };

  return (
    <div className="flex gap-6">
      <Sidebar />
      <div className="flex-1 max-w-4xl">
        <Step1Form onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
