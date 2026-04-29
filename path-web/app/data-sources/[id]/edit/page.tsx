"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import { AppLayoutShell } from "@/components/layout/AppLayoutShell";
import {
  DataSourceForm,
  entryToFormValues,
  formValuesToPayload,
  type DataSourceFormValues,
} from "@/components/data-sources/DataSourceForm";
import type { StoredDataSource } from "@/lib/data-source-catalog";

export default function EditDataSourcePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id);

  const [initial, setInitial] = useState<DataSourceFormValues | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/data-sources/${encodeURIComponent(id)}`);
        if (res.status === 404) {
          if (!cancelled) setLoadError("데이터 소스를 찾을 수 없습니다");
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = (await res.json()) as { dataSource: StoredDataSource };
        if (!cancelled) setInitial(entryToFormValues(body.dataSource.entry));
      } catch (err) {
        if (!cancelled)
          setLoadError(err instanceof Error ? err.message : "로드 실패");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const onSubmit = async (values: DataSourceFormValues) => {
    setSubmitError(null);
    try {
      const res = await fetch(`/api/data-sources/${encodeURIComponent(id)}`, {
        method: "PUT",
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
      setSubmitError(err instanceof Error ? err.message : "저장 실패");
    }
  };

  return (
    <AppLayoutShell
      breadcrumbs={[
        { text: "데이터 소스", href: "/data-sources" },
        { text: id, href: `/data-sources/${id}/edit` },
      ]}
    >
      <Box padding={{ top: "s" }}>
        {loadError ? (
          <Alert type="error" header="로드 실패">
            {loadError}
          </Alert>
        ) : !initial ? (
          <Box padding="l">불러오는 중...</Box>
        ) : (
          <DataSourceForm
            mode="edit"
            initialValue={initial}
            onSubmit={onSubmit}
            onCancel={() => router.push("/data-sources")}
            submitError={submitError}
          />
        )}
      </Box>
    </AppLayoutShell>
  );
}
