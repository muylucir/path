"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, Plus, Trash2, Code, Wand2 } from "lucide-react";
import type { MCPTemplate, MCPTool } from "@/lib/types";

// Form schema
const formSchema = z.object({
  name: z.string().min(1, "서버 이름을 입력해주세요"),
  description: z.string().optional(),
  mainPy: z.string().min(1, "Python 코드를 입력해주세요"),
  requirements: z.string(),
  tools: z.array(z.object({
    name: z.string(),
    description: z.string(),
    inputSchema: z.record(z.string(), z.unknown()).optional(),
  })),
});

type FormValues = z.infer<typeof formSchema>;

interface MCPServerFormProps {
  serverId?: string | null;
  templateId?: string | null;
  onSaved: () => void;
  onCancel: () => void;
}

// Default FastMCP code template
const DEFAULT_CODE = `from mcp.server.fastmcp import FastMCP

mcp = FastMCP("my-tools")

@mcp.tool()
def my_tool(param: str) -> str:
    """My custom tool.

    Args:
        param: A string parameter

    Returns:
        Result string
    """
    return f"Result: {param}"

if __name__ == "__main__":
    mcp.run(transport="streamable-http")
`;

const DEFAULT_REQUIREMENTS = `mcp>=1.0.0
fastmcp>=0.4.0`;

export function MCPServerForm({
  serverId,
  templateId,
  onSaved,
  onCancel,
}: MCPServerFormProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [template, setTemplate] = useState<MCPTemplate | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      mainPy: DEFAULT_CODE,
      requirements: DEFAULT_REQUIREMENTS,
      tools: [],
    },
  });

  // Load existing server or template
  useEffect(() => {
    if (serverId) {
      loadServer(serverId);
    } else if (templateId) {
      loadTemplate(templateId);
    }
  }, [serverId, templateId]);

  const loadServer = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/mcp-servers/${id}`);
      const data = await response.json();
      if (data.success && data.server) {
        const server = data.server;
        form.reset({
          name: server.name,
          description: server.description || "",
          mainPy: server.code?.mainPy || DEFAULT_CODE,
          requirements: server.code?.requirements || DEFAULT_REQUIREMENTS,
          tools: server.tools || [],
        });
      }
    } catch (error) {
      console.error("Failed to load server:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/mcp-servers/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: id }),
      });
      const data = await response.json();
      if (data.success && data.template) {
        const tmpl = data.template as MCPTemplate;
        setTemplate(tmpl);
        form.reset({
          name: tmpl.name,
          description: tmpl.description,
          mainPy: tmpl.code.mainPy,
          requirements: tmpl.code.requirements,
          tools: tmpl.tools,
        });
      }
    } catch (error) {
      console.error("Failed to load template:", error);
    } finally {
      setLoading(false);
    }
  };

  // Parse tools from code
  const parseToolsFromCode = (code: string): MCPTool[] => {
    const tools: MCPTool[] = [];
    // Simple regex to find @mcp.tool() decorated functions
    const toolRegex = /@mcp\.tool\(\)\s*(?:async\s+)?def\s+(\w+)\s*\([^)]*\)[^:]*:\s*(?:"""([^"]*?)"""|'''([^']*?)''')?/g;

    let match;
    while ((match = toolRegex.exec(code)) !== null) {
      const name = match[1];
      const docstring = match[2] || match[3] || "";
      const description = docstring.split("\n")[0].trim() || `${name} tool`;

      tools.push({
        name,
        description,
        inputSchema: {},
      });
    }

    return tools;
  };

  const handleParseTools = () => {
    setParsing(true);
    const code = form.getValues("mainPy");
    const tools = parseToolsFromCode(code);

    if (tools.length > 0) {
      form.setValue("tools", tools);
    } else {
      alert("코드에서 도구를 찾을 수 없습니다. @mcp.tool() 데코레이터를 사용했는지 확인하세요.");
    }
    setParsing(false);
  };

  const handleAddTool = () => {
    const currentTools = form.getValues("tools");
    form.setValue("tools", [
      ...currentTools,
      { name: "", description: "", inputSchema: {} },
    ]);
  };

  const handleRemoveTool = (index: number) => {
    const currentTools = form.getValues("tools");
    form.setValue("tools", currentTools.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const payload = {
        name: values.name,
        description: values.description,
        source: {
          type: templateId ? "template" : "self-hosted",
          templateId: templateId || undefined,
        },
        code: {
          mainPy: values.mainPy,
          requirements: values.requirements,
        },
        tools: values.tools,
      };

      const url = serverId
        ? `/api/mcp-servers/${serverId}`
        : "/api/mcp-servers";
      const method = serverId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        onSaved();
      } else {
        const data = await response.json();
        alert(`저장 실패: ${data.error}`);
      }
    } catch (error) {
      console.error("Failed to save:", error);
      alert("저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>서버 이름</FormLabel>
                <FormControl>
                  <Input placeholder="my-mcp-server" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>설명 (선택)</FormLabel>
                <FormControl>
                  <Input placeholder="MCP 서버에 대한 설명" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Template info if from template */}
        {template && (
          <Card className="bg-cyan-50 dark:bg-cyan-950 border-cyan-200 dark:border-cyan-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Code className="w-4 h-4 text-cyan-600" />
                <span className="font-medium text-cyan-700 dark:text-cyan-300">
                  템플릿: {template.name}
                </span>
              </div>
              <p className="text-sm text-cyan-600 dark:text-cyan-400">
                {template.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Code Editor */}
        <FormField
          control={form.control}
          name="mainPy"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Python 코드 (main.py)</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleParseTools}
                  disabled={parsing}
                >
                  {parsing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4 mr-2" />
                  )}
                  도구 자동 감지
                </Button>
              </div>
              <FormControl>
                <Textarea
                  {...field}
                  className="font-mono text-sm min-h-[400px] resize-y"
                  placeholder="FastMCP 코드를 입력하세요..."
                />
              </FormControl>
              <FormDescription>
                FastMCP를 사용하여 MCP 서버 코드를 작성하세요. @mcp.tool() 데코레이터로 도구를 정의합니다.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Requirements */}
        <FormField
          control={form.control}
          name="requirements"
          render={({ field }) => (
            <FormItem>
              <FormLabel>의존성 (requirements.txt)</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  className="font-mono text-sm min-h-[100px]"
                  placeholder="mcp>=1.0.0&#10;fastmcp>=0.4.0"
                />
              </FormControl>
              <FormDescription>
                필요한 Python 패키지를 한 줄에 하나씩 입력하세요.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tools */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>도구 목록</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddTool}
            >
              <Plus className="w-4 h-4 mr-1" />
              도구 추가
            </Button>
          </div>

          {form.watch("tools").length === 0 ? (
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-6 text-center">
              <p className="text-sm text-slate-500">
                등록된 도구가 없습니다. "도구 자동 감지" 또는 "도구 추가"를 클릭하세요.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {form.watch("tools").map((tool, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`tools.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">도구 이름</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="get_weather"
                                  className="h-9"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`tools.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">설명</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="날씨 정보를 조회합니다"
                                  className="h-9"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTool(index)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 mt-6"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Environment Variables hint */}
        {template?.defaultEnv && Object.keys(template.defaultEnv).length > 0 && (
          <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
            <CardContent className="pt-4">
              <h4 className="font-medium text-amber-700 dark:text-amber-300 mb-2">
                필요한 환경 변수
              </h4>
              <div className="flex flex-wrap gap-2">
                {Object.keys(template.defaultEnv).map((key) => (
                  <Badge key={key} variant="outline" className="font-mono text-xs">
                    {key}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                배포 시 이 환경 변수들을 설정해야 합니다.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            취소
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                저장 중...
              </>
            ) : (
              "저장"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
