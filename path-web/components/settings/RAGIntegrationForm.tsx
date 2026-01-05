"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { RAGIntegration } from "@/lib/types";

interface RAGIntegrationFormProps {
  integrationId: string | null;
  onSaved: () => void;
  onCancel: () => void;
}

export function RAGIntegrationForm({
  integrationId,
  onSaved,
  onCancel,
}: RAGIntegrationFormProps) {
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [provider, setProvider] = useState<"bedrock-kb" | "pinecone" | "opensearch">("bedrock-kb");

  // Bedrock KB
  const [knowledgeBaseId, setKnowledgeBaseId] = useState("");
  const [region, setRegion] = useState("us-east-1");

  // Pinecone
  const [pineconeApiKey, setPineconeApiKey] = useState("");
  const [pineconeEnvironment, setPineconeEnvironment] = useState("");
  const [pineconeIndexName, setPineconeIndexName] = useState("");

  // OpenSearch
  const [opensearchEndpoint, setOpensearchEndpoint] = useState("");
  const [opensearchIndexName, setOpensearchIndexName] = useState("");
  const [opensearchUsername, setOpensearchUsername] = useState("");
  const [opensearchPassword, setOpensearchPassword] = useState("");

  const fetchIntegration = useCallback(async () => {
    if (!integrationId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/integrations/${integrationId}?full=true`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      const integration = data.integration as RAGIntegration;

      setName(integration.name);
      setDescription(integration.description || "");
      setProvider(integration.config.provider);

      if (integration.config.bedrockKb) {
        setKnowledgeBaseId(integration.config.bedrockKb.knowledgeBaseId);
        setRegion(integration.config.bedrockKb.region);
      }

      if (integration.config.pinecone) {
        setPineconeApiKey(integration.config.pinecone.apiKey || "");
        setPineconeEnvironment(integration.config.pinecone.environment);
        setPineconeIndexName(integration.config.pinecone.indexName);
      }

      if (integration.config.opensearch) {
        setOpensearchEndpoint(integration.config.opensearch.endpoint);
        setOpensearchIndexName(integration.config.opensearch.indexName);
        setOpensearchUsername(integration.config.opensearch.username || "");
        setOpensearchPassword(integration.config.opensearch.password || "");
      }
    } catch (err) {
      console.error("Failed to fetch integration:", err);
    } finally {
      setLoading(false);
    }
  }, [integrationId]);

  useEffect(() => {
    if (integrationId) {
      fetchIntegration();
    }
  }, [integrationId, fetchIntegration]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const config: RAGIntegration["config"] = {
        provider,
      };

      if (provider === "bedrock-kb") {
        config.bedrockKb = {
          knowledgeBaseId,
          region,
        };
      } else if (provider === "pinecone") {
        config.pinecone = {
          apiKey: pineconeApiKey || undefined,
          environment: pineconeEnvironment,
          indexName: pineconeIndexName,
        };
      } else if (provider === "opensearch") {
        config.opensearch = {
          endpoint: opensearchEndpoint,
          indexName: opensearchIndexName,
          username: opensearchUsername || undefined,
          password: opensearchPassword || undefined,
        };
      }

      const payload = {
        type: "rag" as const,
        name,
        description,
        config,
      };

      const url = integrationId
        ? `/api/integrations/${integrationId}`
        : "/api/integrations";
      const method = integrationId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save");
      onSaved();
    } catch (err) {
      console.error("Failed to save:", err);
      alert("저장에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const isValid = () => {
    if (!name) return false;

    if (provider === "bedrock-kb") {
      return !!knowledgeBaseId && !!region;
    } else if (provider === "pinecone") {
      return !!pineconeEnvironment && !!pineconeIndexName;
    } else if (provider === "opensearch") {
      return !!opensearchEndpoint && !!opensearchIndexName;
    }

    return false;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">이름 *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Product Knowledge Base"
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">설명</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="제품 정보 검색을 위한 Knowledge Base"
          rows={2}
        />
      </div>

      {/* Provider */}
      <div className="space-y-2">
        <Label htmlFor="provider">Provider *</Label>
        <Select
          value={provider}
          onValueChange={(v) => setProvider(v as typeof provider)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bedrock-kb">Amazon Bedrock Knowledge Base</SelectItem>
            <SelectItem value="pinecone">Pinecone</SelectItem>
            <SelectItem value="opensearch">OpenSearch</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bedrock KB Config */}
      {provider === "bedrock-kb" && (
        <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="knowledgeBaseId">Knowledge Base ID *</Label>
            <Input
              id="knowledgeBaseId"
              value={knowledgeBaseId}
              onChange={(e) => setKnowledgeBaseId(e.target.value)}
              placeholder="XXXXXXXXXX"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="region">Region</Label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                <SelectItem value="eu-west-1">Europe (Ireland)</SelectItem>
                <SelectItem value="ap-northeast-1">Asia Pacific (Tokyo)</SelectItem>
                <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Pinecone Config */}
      {provider === "pinecone" && (
        <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="pineconeEnvironment">Environment *</Label>
            <Input
              id="pineconeEnvironment"
              value={pineconeEnvironment}
              onChange={(e) => setPineconeEnvironment(e.target.value)}
              placeholder="us-east-1-aws"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pineconeIndexName">Index Name *</Label>
            <Input
              id="pineconeIndexName"
              value={pineconeIndexName}
              onChange={(e) => setPineconeIndexName(e.target.value)}
              placeholder="my-index"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pineconeApiKey">API Key</Label>
            <Input
              id="pineconeApiKey"
              type="password"
              value={pineconeApiKey}
              onChange={(e) => setPineconeApiKey(e.target.value)}
              placeholder="pcsk_..."
            />
            <p className="text-xs text-slate-500">
              저장하지 않으면 환경변수를 사용합니다
            </p>
          </div>
        </div>
      )}

      {/* OpenSearch Config */}
      {provider === "opensearch" && (
        <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="opensearchEndpoint">Endpoint *</Label>
            <Input
              id="opensearchEndpoint"
              value={opensearchEndpoint}
              onChange={(e) => setOpensearchEndpoint(e.target.value)}
              placeholder="https://search-xxx.us-east-1.es.amazonaws.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="opensearchIndexName">Index Name *</Label>
            <Input
              id="opensearchIndexName"
              value={opensearchIndexName}
              onChange={(e) => setOpensearchIndexName(e.target.value)}
              placeholder="my-index"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="opensearchUsername">Username</Label>
            <Input
              id="opensearchUsername"
              value={opensearchUsername}
              onChange={(e) => setOpensearchUsername(e.target.value)}
              placeholder="admin"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="opensearchPassword">Password</Label>
            <Input
              id="opensearchPassword"
              type="password"
              value={opensearchPassword}
              onChange={(e) => setOpensearchPassword(e.target.value)}
              placeholder="..."
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" disabled={loading || !isValid()}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {integrationId ? "수정" : "저장"}
        </Button>
      </div>
    </form>
  );
}
