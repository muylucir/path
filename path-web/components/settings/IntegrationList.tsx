"use client";

import { useEffect, useState } from "react";
import { IntegrationCard } from "./IntegrationCard";
import type { IntegrationListItem } from "@/lib/types";
import { Loader2 } from "lucide-react";

interface IntegrationListProps {
  type: "api" | "mcp" | "rag" | "s3";
  onEdit: (id: string) => void;
  onRefresh: () => void;
}

export function IntegrationList({ type, onEdit, onRefresh }: IntegrationListProps) {
  const [integrations, setIntegrations] = useState<IntegrationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchIntegrations();
  }, [type]);

  const fetchIntegrations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/integrations?type=${type}`);
      if (!response.ok) throw new Error("Failed to fetch integrations");
      const data = await response.json();
      setIntegrations(data.integrations || []);
    } catch (err) {
      setError("통합 목록을 불러오는데 실패했습니다");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/integrations/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      setIntegrations((prev) => prev.filter((item) => item.id !== id));
      onRefresh();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("삭제에 실패했습니다");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <button
          onClick={fetchIntegrations}
          className="mt-2 text-sm text-blue-500 hover:underline"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (integrations.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
        <p className="text-slate-500 dark:text-slate-400">
          등록된 통합이 없습니다
        </p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
          "통합 추가" 버튼을 눌러 새로운 통합을 등록하세요
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {integrations.map((integration) => (
        <IntegrationCard
          key={integration.id}
          integration={integration}
          onEdit={() => onEdit(integration.id)}
          onDelete={() => handleDelete(integration.id)}
        />
      ))}
    </div>
  );
}
