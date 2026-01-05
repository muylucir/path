"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Globe, Server, Database, Settings2 } from "lucide-react";
import Link from "next/link";
import type { IntegrationListItem } from "@/lib/types";

interface IntegrationPickerProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function IntegrationPicker({
  selectedIds,
  onSelectionChange,
}: IntegrationPickerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState<{
    api: IntegrationListItem[];
    mcp: IntegrationListItem[];
    rag: IntegrationListItem[];
  }>({ api: [], mcp: [], rag: [] });
  const [localSelection, setLocalSelection] = useState<string[]>(selectedIds);

  useEffect(() => {
    if (open) {
      fetchIntegrations();
      setLocalSelection(selectedIds);
    }
  }, [open, selectedIds]);

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/integrations");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      const items = data.integrations || [];

      setIntegrations({
        api: items.filter((i: IntegrationListItem) => i.type === "api"),
        mcp: items.filter((i: IntegrationListItem) => i.type === "mcp"),
        rag: items.filter((i: IntegrationListItem) => i.type === "rag"),
      });
    } catch (err) {
      console.error("Failed to fetch integrations:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    setLocalSelection((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    onSelectionChange(localSelection);
    setOpen(false);
  };

  const totalCount = integrations.api.length + integrations.mcp.length + integrations.rag.length;
  const selectedCount = selectedIds.length;

  const typeConfig = {
    api: { icon: Globe, label: "API", color: "bg-blue-100 text-blue-700" },
    mcp: { icon: Server, label: "MCP", color: "bg-purple-100 text-purple-700" },
    rag: { icon: Database, label: "RAG", color: "bg-emerald-100 text-emerald-700" },
  };

  const renderIntegrationList = (items: IntegrationListItem[], type: "api" | "mcp" | "rag") => {
    if (items.length === 0) {
      return (
        <div className="text-center py-8 text-slate-500">
          <p className="text-sm">등록된 {typeConfig[type].label} 통합이 없습니다</p>
          <Link href="/settings" className="text-xs text-blue-500 hover:underline mt-1 inline-block">
            설정 페이지에서 등록하기
          </Link>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              localSelection.includes(item.id)
                ? "border-primary bg-primary/5"
                : "border-slate-200 hover:border-slate-300"
            }`}
            onClick={() => toggleSelection(item.id)}
          >
            <Checkbox
              checked={localSelection.includes(item.id)}
              onCheckedChange={() => toggleSelection(item.id)}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.name}</p>
              {item.description && (
                <p className="text-xs text-slate-500 truncate">{item.description}</p>
              )}
            </div>
            <Badge variant="outline" className={typeConfig[type].color}>
              {typeConfig[type].label}
            </Badge>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          등록된 통합에서 선택
          {selectedCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {selectedCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>통합 선택</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : totalCount === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500 mb-2">등록된 통합이 없습니다</p>
            <Link href="/settings">
              <Button variant="outline" size="sm">
                설정 페이지로 이동
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <Tabs defaultValue="api" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="api" className="gap-1">
                  <Globe className="w-3 h-3" />
                  API ({integrations.api.length})
                </TabsTrigger>
                <TabsTrigger value="mcp" className="gap-1">
                  <Server className="w-3 h-3" />
                  MCP ({integrations.mcp.length})
                </TabsTrigger>
                <TabsTrigger value="rag" className="gap-1">
                  <Database className="w-3 h-3" />
                  RAG ({integrations.rag.length})
                </TabsTrigger>
              </TabsList>
              <div className="mt-4 max-h-[300px] overflow-y-auto">
                <TabsContent value="api" className="mt-0">
                  {renderIntegrationList(integrations.api, "api")}
                </TabsContent>
                <TabsContent value="mcp" className="mt-0">
                  {renderIntegrationList(integrations.mcp, "mcp")}
                </TabsContent>
                <TabsContent value="rag" className="mt-0">
                  {renderIntegrationList(integrations.rag, "rag")}
                </TabsContent>
              </div>
            </Tabs>

            <div className="flex justify-between items-center pt-4 border-t">
              <span className="text-sm text-slate-500">
                {localSelection.length}개 선택됨
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  취소
                </Button>
                <Button onClick={handleConfirm}>확인</Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
