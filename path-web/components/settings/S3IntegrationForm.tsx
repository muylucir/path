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
import type { S3Integration } from "@/lib/types";

interface S3IntegrationFormProps {
  integrationId: string | null;
  onSaved: () => void;
  onCancel: () => void;
}

export function S3IntegrationForm({
  integrationId,
  onSaved,
  onCancel,
}: S3IntegrationFormProps) {
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [bucketName, setBucketName] = useState("");
  const [region, setRegion] = useState("us-east-1");
  const [prefix, setPrefix] = useState("");
  const [accessType, setAccessType] = useState<"read" | "write" | "read-write">("read");

  const fetchIntegration = useCallback(async () => {
    if (!integrationId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/integrations/${integrationId}?full=true`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      const integration = data.integration as S3Integration;

      setName(integration.name);
      setDescription(integration.description || "");
      setBucketName(integration.config.bucketName);
      setRegion(integration.config.region);
      setPrefix(integration.config.prefix || "");
      setAccessType(integration.config.accessType);
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
      const payload = {
        type: "s3" as const,
        name,
        description,
        config: {
          bucketName,
          region,
          prefix: prefix || undefined,
          accessType,
        },
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">이름 *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Product Images Bucket"
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
          placeholder="제품 이미지 저장소"
          rows={2}
        />
      </div>

      {/* Bucket Name */}
      <div className="space-y-2">
        <Label htmlFor="bucketName">버킷명 *</Label>
        <Input
          id="bucketName"
          value={bucketName}
          onChange={(e) => setBucketName(e.target.value)}
          placeholder="my-bucket-name"
          required
        />
      </div>

      {/* Region */}
      <div className="space-y-2">
        <Label htmlFor="region">리전 *</Label>
        <Select value={region} onValueChange={setRegion}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
            <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
            <SelectItem value="eu-west-1">Europe (Ireland)</SelectItem>
            <SelectItem value="ap-northeast-1">Asia Pacific (Tokyo)</SelectItem>
            <SelectItem value="ap-northeast-2">Asia Pacific (Seoul)</SelectItem>
            <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Prefix */}
      <div className="space-y-2">
        <Label htmlFor="prefix">접두사 (폴더 경로)</Label>
        <Input
          id="prefix"
          value={prefix}
          onChange={(e) => setPrefix(e.target.value)}
          placeholder="uploads/images/"
        />
        <p className="text-xs text-slate-500">
          특정 폴더로 접근을 제한하려면 입력하세요
        </p>
      </div>

      {/* Access Type */}
      <div className="space-y-2">
        <Label htmlFor="accessType">접근 권한 *</Label>
        <Select
          value={accessType}
          onValueChange={(v) => setAccessType(v as typeof accessType)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="read">읽기 전용</SelectItem>
            <SelectItem value="write">쓰기 전용</SelectItem>
            <SelectItem value="read-write">읽기/쓰기</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" disabled={loading || !name || !bucketName}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {integrationId ? "수정" : "저장"}
        </Button>
      </div>
    </form>
  );
}
