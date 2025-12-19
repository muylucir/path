"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { DATA_SOURCE_TYPES } from "@/lib/constants";
import type { DataSource } from "@/lib/types";

interface DataSourceInputProps {
  dataSources: DataSource[];
  onChange: (dataSources: DataSource[]) => void;
  error?: string;
}

export function DataSourceInput({ dataSources, onChange, error }: DataSourceInputProps) {
  const addDataSource = () => {
    onChange([...dataSources, { type: "", description: "" }]);
  };

  const removeDataSource = (index: number) => {
    onChange(dataSources.filter((_, i) => i !== index));
  };

  const updateDataSource = (index: number, field: keyof DataSource, value: string) => {
    const updated = dataSources.map((source, i) =>
      i === index ? { ...source, [field]: value } : source
    );
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <Label>
        데이터 소스 <span className="text-red-500">*</span>
      </Label>
      
      {dataSources.map((source, index) => (
        <div key={index} className="flex gap-2">
          <div className="w-1/3">
            <Select
              value={source.type}
              onValueChange={(value) => updateDataSource(index, "type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="소스 타입" />
              </SelectTrigger>
              <SelectContent>
                {DATA_SOURCE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <Input
              value={source.description}
              onChange={(e) => updateDataSource(index, "description", e.target.value)}
              placeholder="예: Gmail API, DynamoDB users 테이블"
            />
          </div>
          
          {dataSources.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeDataSource(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addDataSource}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        데이터 소스 추가
      </Button>
      
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
