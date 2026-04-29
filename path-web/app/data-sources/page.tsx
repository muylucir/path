"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AppLayoutShell } from "@/components/layout/AppLayoutShell";
import { useFlash } from "@/components/cloudscape/FlashbarProvider";
import Alert from "@cloudscape-design/components/alert";
import Badge from "@cloudscape-design/components/badge";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Header from "@cloudscape-design/components/header";
import Modal from "@cloudscape-design/components/modal";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Table, { type TableProps } from "@cloudscape-design/components/table";
import TextFilter from "@cloudscape-design/components/text-filter";
import {
  DATA_SOURCE_CATEGORIES,
  DATA_SOURCE_CATEGORY_LABELS,
  type DataSourceCategory,
  type StoredDataSource,
} from "@/lib/data-source-catalog";

const COLUMNS: TableProps.ColumnDefinition<StoredDataSource>[] = [
  {
    id: "name",
    header: "이름",
    cell: (item) => item.entry.name,
    sortingComparator: (a, b) => a.entry.name.localeCompare(b.entry.name),
  },
  {
    id: "category",
    header: "카테고리",
    cell: (item) => (
      <Badge color="blue">
        {DATA_SOURCE_CATEGORY_LABELS[item.entry.category]}
      </Badge>
    ),
    width: 180,
  },
  {
    id: "description",
    header: "설명",
    cell: (item) =>
      item.entry.description.length > 120
        ? `${item.entry.description.slice(0, 120)}…`
        : item.entry.description,
  },
  {
    id: "tags",
    header: "태그",
    cell: (item) => (
      <SpaceBetween size="xxs" direction="horizontal">
        {item.entry.tags.slice(0, 4).map((t) => (
          <Badge key={t}>{t}</Badge>
        ))}
        {item.entry.tags.length > 4 && (
          <Box variant="small">{`+${item.entry.tags.length - 4}`}</Box>
        )}
      </SpaceBetween>
    ),
    width: 200,
  },
  {
    id: "auth_mode",
    header: "인증",
    cell: (item) => item.entry.auth_mode,
    width: 120,
  },
];

export default function DataSourcesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { addFlash } = useFlash();
  const userId = session?.user?.id;

  const [items, setItems] = useState<StoredDataSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [category, setCategory] = useState<DataSourceCategory | "all">("all");
  const [selected, setSelected] = useState<StoredDataSource[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/data-sources");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as { items: StoredDataSource[] };
      setItems(body.items);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "데이터 소스를 불러오지 못했습니다",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return items.filter((d) => {
      if (category !== "all" && d.entry.category !== category) return false;
      if (!q) return true;
      return (
        d.entry.name.toLowerCase().includes(q) ||
        d.entry.description.toLowerCase().includes(q) ||
        d.entry.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [items, filter, category]);

  const countsByCategory = useMemo(() => {
    const counts = Object.fromEntries(
      DATA_SOURCE_CATEGORIES.map((c) => [c, 0]),
    ) as Record<DataSourceCategory, number>;
    for (const d of items) counts[d.entry.category] += 1;
    return counts;
  }, [items]);

  const selectedOne = selected[0];
  const canEditSelected = !!selectedOne && selectedOne.owner_id === userId;

  const onDeleteConfirm = async () => {
    if (!selectedOne) return;
    try {
      const res = await fetch(`/api/data-sources/${selectedOne.entry.id}`, {
        method: "DELETE",
      });
      if (res.status === 204) {
        addFlash("success", "데이터 소스를 삭제했습니다");
        setDeleteOpen(false);
        setSelected([]);
        await load();
      } else {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
    } catch (err) {
      addFlash("error", err instanceof Error ? err.message : "삭제 실패");
    }
  };

  return (
    <AppLayoutShell
      breadcrumbs={[{ text: "데이터 소스", href: "/data-sources" }]}
    >
      <SpaceBetween size="l">
        {loadError && (
          <Alert type="error" header="로드 실패">
            {loadError}
          </Alert>
        )}

        <SpaceBetween size="xs" direction="horizontal">
          <CategoryChip
            label={`전체 (${items.length})`}
            active={category === "all"}
            onClick={() => setCategory("all")}
          />
          {DATA_SOURCE_CATEGORIES.map((c) => (
            <CategoryChip
              key={c}
              label={`${DATA_SOURCE_CATEGORY_LABELS[c]} (${countsByCategory[c]})`}
              active={category === c}
              onClick={() => setCategory(c)}
            />
          ))}
        </SpaceBetween>

        <Table
          loading={isLoading}
          loadingText="불러오는 중..."
          selectionType="single"
          selectedItems={selected}
          onSelectionChange={({ detail }) =>
            setSelected(detail.selectedItems)
          }
          columnDefinitions={COLUMNS}
          items={filtered}
          trackBy={(item) => item.entry.id}
          variant="container"
          header={
            <Header
              variant="h1"
              counter={`(${items.length})`}
              description="Agent가 활용할 데이터 소스 카탈로그. Step1에서 여기의 항목을 선택할 수 있습니다."
              actions={
                <SpaceBetween size="xs" direction="horizontal">
                  <Button
                    disabled={!canEditSelected}
                    onClick={() =>
                      selectedOne &&
                      router.push(`/data-sources/${selectedOne.entry.id}/edit`)
                    }
                  >
                    편집
                  </Button>
                  <Button
                    disabled={!canEditSelected}
                    onClick={() => setDeleteOpen(true)}
                  >
                    삭제
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => router.push("/data-sources/new")}
                  >
                    새 데이터 소스
                  </Button>
                </SpaceBetween>
              }
            >
              데이터 소스 카탈로그
            </Header>
          }
          filter={
            <TextFilter
              filteringText={filter}
              filteringPlaceholder="이름·설명·태그 검색"
              onChange={({ detail }) => setFilter(detail.filteringText)}
              countText={`${filtered.length}개`}
            />
          }
          empty={
            <Box textAlign="center" padding="m">
              <SpaceBetween size="xs">
                <Box variant="strong">등록된 데이터 소스가 없습니다</Box>
                <Button
                  variant="primary"
                  onClick={() => router.push("/data-sources/new")}
                >
                  첫 데이터 소스 만들기
                </Button>
              </SpaceBetween>
            </Box>
          }
        />

        <Modal
          visible={deleteOpen}
          onDismiss={() => setDeleteOpen(false)}
          header="데이터 소스 삭제"
          footer={
            <Box float="right">
              <SpaceBetween size="xs" direction="horizontal">
                <Button onClick={() => setDeleteOpen(false)}>취소</Button>
                <Button variant="primary" onClick={onDeleteConfirm}>
                  삭제
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          <p>
            <b>{selectedOne?.entry.name}</b>을(를) 삭제합니다. 이 작업은
            되돌릴 수 없습니다.
          </p>
        </Modal>
      </SpaceBetween>
    </AppLayoutShell>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: active
          ? "1px solid var(--color-border-item-selected, #539fe5)"
          : "1px solid var(--color-border-divider-default, #e9ebed)",
        borderRadius: 999,
        padding: "4px 12px",
        background: active
          ? "var(--color-background-item-selected, #f2f8fd)"
          : "transparent",
        cursor: "pointer",
        fontSize: 13,
      }}
    >
      {label}
    </button>
  );
}
