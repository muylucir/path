"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Box from "@cloudscape-design/components/box";
import { AppLayoutShell } from "@/components/layout/AppLayoutShell";
import {
  DataSourceForm,
  formValuesToPayload,
  type DataSourceFormValues,
} from "@/components/data-sources/DataSourceForm";

export default function NewDataSourcePage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const onSubmit = async (values: DataSourceFormValues) => {
    setSubmitError(null);
    try {
      const res = await fetch("/api/data-sources", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(formValuesToPayload(values)),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const detail = body?.details
          ? body.details
              .map((d: { path: string; message: string }) => `${d.path}: ${d.message}`)
              .join(", ")
          : body?.error ?? `HTTP ${res.status}`;
        throw new Error(detail);
      }
      router.push("/data-sources");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "등록 실패");
    }
  };

  return (
    <AppLayoutShell
      breadcrumbs={[
        { text: "데이터 소스", href: "/data-sources" },
        { text: "새 데이터 소스", href: "/data-sources/new" },
      ]}
    >
      <Box padding={{ top: "s" }}>
        <DataSourceForm
          mode="create"
          onSubmit={onSubmit}
          onCancel={() => router.push("/data-sources")}
          submitError={submitError}
        />
      </Box>
    </AppLayoutShell>
  );
}
