"use client";

import { useEffect, useMemo, useState } from "react";
import Badge from "@cloudscape-design/components/badge";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Checkbox from "@cloudscape-design/components/checkbox";
import Header from "@cloudscape-design/components/header";
import Modal from "@cloudscape-design/components/modal";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Tabs from "@cloudscape-design/components/tabs";
import TextFilter from "@cloudscape-design/components/text-filter";
import {
  DATA_SOURCE_CATEGORIES,
  DATA_SOURCE_CATEGORY_LABELS,
  type DataSourceCategory,
  type DataSourceEntry,
  type StoredDataSource,
} from "@/lib/data-source-catalog";

interface DataSourceSelectModalProps {
  visible: boolean;
  catalog: readonly StoredDataSource[];
  selectedIds: string[];
  onDismiss: () => void;
  onApply: (ids: string[]) => void;
}

function DataSourceRow({
  entry,
  checked,
  onToggle,
}: {
  entry: DataSourceEntry;
  checked: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <div
      onClick={() => onToggle(!checked)}
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        gap: 12,
        alignItems: "flex-start",
        border: checked
          ? "1px solid var(--color-border-item-selected, #539fe5)"
          : "1px solid var(--color-border-divider-default, #e9ebed)",
        borderRadius: 8,
        padding: 12,
        background: checked
          ? "var(--color-background-item-selected, #f2f8fd)"
          : "transparent",
        cursor: "pointer",
      }}
    >
      <Checkbox
        checked={checked}
        onChange={({ detail }) => onToggle(detail.checked)}
      />
      <div>
        <Box variant="strong">{entry.name}</Box>
        {entry.description && (
          <Box
            variant="small"
            color="text-body-secondary"
            margin={{ top: "xxs", bottom: "xs" }}
          >
            {entry.description}
          </Box>
        )}
        <SpaceBetween size="xxs" direction="horizontal">
          <Badge color="blue">
            {DATA_SOURCE_CATEGORY_LABELS[entry.category]}
          </Badge>
          {entry.tags.map((t) => (
            <Badge key={t}>{t}</Badge>
          ))}
        </SpaceBetween>
      </div>
    </div>
  );
}

export function DataSourceSelectModal({
  visible,
  catalog,
  selectedIds,
  onDismiss,
  onApply,
}: DataSourceSelectModalProps) {
  const [staged, setStaged] = useState<string[]>(selectedIds);
  const [filter, setFilter] = useState("");
  const [activeTab, setActiveTab] = useState<DataSourceCategory>(
    DATA_SOURCE_CATEGORIES[0],
  );

  useEffect(() => {
    if (visible) {
      setStaged(selectedIds);
      setFilter("");
    }
  }, [visible, selectedIds]);

  const grouped = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const match = (e: DataSourceEntry) =>
      !q ||
      e.name.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.tags.some((t) => t.toLowerCase().includes(q));
    const groups = Object.fromEntries(
      DATA_SOURCE_CATEGORIES.map((c) => [c, [] as DataSourceEntry[]]),
    ) as Record<DataSourceCategory, DataSourceEntry[]>;
    for (const stored of catalog) {
      if (match(stored.entry)) groups[stored.entry.category].push(stored.entry);
    }
    return groups;
  }, [catalog, filter]);

  const toggle = (id: string, on: boolean) => {
    setStaged((prev) => {
      const has = prev.includes(id);
      if (on && !has) return [...prev, id];
      if (!on && has) return prev.filter((x) => x !== id);
      return prev;
    });
  };

  const tabs = DATA_SOURCE_CATEGORIES.map((c) => {
    const items = grouped[c];
    const selectedInCat = items.filter((e) => staged.includes(e.id)).length;
    return {
      id: c,
      label: `${DATA_SOURCE_CATEGORY_LABELS[c]} (${items.length}${
        selectedInCat ? ` · ${selectedInCat} 선택` : ""
      })`,
      content:
        items.length === 0 ? (
          <Box padding="l" textAlign="center" color="text-body-secondary">
            {filter ? "검색 결과가 없습니다" : "등록된 항목이 없습니다"}
          </Box>
        ) : (
          <SpaceBetween size="xs">
            {items.map((entry) => (
              <DataSourceRow
                key={entry.id}
                entry={entry}
                checked={staged.includes(entry.id)}
                onToggle={(next) => toggle(entry.id, next)}
              />
            ))}
          </SpaceBetween>
        ),
    };
  });

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      size="large"
      header={
        <Header
          variant="h2"
          description="Agent가 활용할 데이터 소스를 카탈로그에서 선택하세요"
          counter={`(${staged.length}개 선택)`}
        >
          데이터 소스 선택
        </Header>
      }
      footer={
        <Box float="right">
          <SpaceBetween size="xs" direction="horizontal">
            <Button onClick={onDismiss}>취소</Button>
            <Button variant="primary" onClick={() => onApply(staged)}>
              적용
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <SpaceBetween size="m">
        <TextFilter
          filteringText={filter}
          filteringPlaceholder="이름·설명·태그 검색"
          onChange={({ detail }) => setFilter(detail.filteringText)}
          countText={`${catalog.length}개 중`}
        />
        <Tabs
          activeTabId={activeTab}
          onChange={({ detail }) =>
            setActiveTab(detail.activeTabId as DataSourceCategory)
          }
          tabs={tabs}
        />
      </SpaceBetween>
    </Modal>
  );
}
