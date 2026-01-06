"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Globe, Server, Database, HardDrive, Plus } from "lucide-react";
import { IntegrationList } from "@/components/settings/IntegrationList";
import { APIIntegrationForm } from "@/components/settings/APIIntegrationForm";
import { MCPIntegrationForm } from "@/components/settings/MCPIntegrationForm";
import { RAGIntegrationForm } from "@/components/settings/RAGIntegrationForm";
import { S3IntegrationForm } from "@/components/settings/S3IntegrationForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"api" | "mcp" | "rag" | "s3">("api");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAdd = () => {
    setEditingId(null);
    setIsFormOpen(true);
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setIsFormOpen(true);
  };

  const handleClose = () => {
    setIsFormOpen(false);
    setEditingId(null);
  };

  const handleSaved = () => {
    handleClose();
    setRefreshKey((k) => k + 1);
  };

  const tabConfig = {
    api: {
      icon: Globe,
      label: "API",
      description: "OpenAPI/REST API 통합을 등록합니다",
    },
    mcp: {
      icon: Server,
      label: "MCP",
      description: "Model Context Protocol 서버를 등록합니다",
    },
    rag: {
      icon: Database,
      label: "RAG",
      description: "Knowledge Base 및 벡터 DB를 등록합니다",
    },
    s3: {
      icon: HardDrive,
      label: "S3",
      description: "Amazon S3 버킷을 등록합니다",
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 돌아가기 버튼 */}
        <div className="mb-4">
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            돌아가기
          </Button>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              통합 설정
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              API, MCP, RAG, S3 통합을 등록하여 PATH 분석에 활용하세요
            </p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            통합 추가
          </Button>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "api" | "mcp" | "rag" | "s3")}
        >
          <TabsList className="grid w-full grid-cols-4 mb-6">
            {Object.entries(tabConfig).map(([key, config]) => (
              <TabsTrigger
                key={key}
                value={key}
                className="flex items-center gap-2"
              >
                <config.icon className="w-4 h-4" />
                {config.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(tabConfig).map(([key, config]) => (
            <TabsContent key={key} value={key}>
              <div className="mb-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {config.description}
                </p>
              </div>
              <IntegrationList
                key={`${key}-${refreshKey}`}
                type={key as "api" | "mcp" | "rag" | "s3"}
                onEdit={handleEdit}
                onRefresh={() => setRefreshKey((k) => k + 1)}
              />
            </TabsContent>
          ))}
        </Tabs>

        {/* Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "통합 수정" : `${tabConfig[activeTab].label} 통합 추가`}
              </DialogTitle>
            </DialogHeader>
            {activeTab === "api" && (
              <APIIntegrationForm
                integrationId={editingId}
                onSaved={handleSaved}
                onCancel={handleClose}
              />
            )}
            {activeTab === "mcp" && (
              <MCPIntegrationForm
                integrationId={editingId}
                onSaved={handleSaved}
                onCancel={handleClose}
              />
            )}
            {activeTab === "rag" && (
              <RAGIntegrationForm
                integrationId={editingId}
                onSaved={handleSaved}
                onCancel={handleClose}
              />
            )}
            {activeTab === "s3" && (
              <S3IntegrationForm
                integrationId={editingId}
                onSaved={handleSaved}
                onCancel={handleClose}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
