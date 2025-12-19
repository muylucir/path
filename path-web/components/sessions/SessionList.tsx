"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SessionCard } from "./SessionCard";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Loader2 } from "lucide-react";
import type { SessionListItem } from "@/lib/types";

export function SessionList() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen && sessions.length === 0) {
      loadSessions();
    }
  }, [isOpen]);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/sessions");
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error("Error loading sessions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoad = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      const session = await response.json();

      // Store in sessionStorage
      sessionStorage.setItem("formData", JSON.stringify({
        painPoint: session.pain_point,
        inputType: session.input_type,
        processSteps: session.process_steps,
        outputType: session.output_type,
        humanLoop: session.human_loop,
        dataSource: session.data_source,
        errorTolerance: session.error_tolerance,
        additionalContext: session.additional_context,
      }));
      sessionStorage.setItem("chatHistory", JSON.stringify(session.chat_history));
      sessionStorage.setItem("analysis", JSON.stringify({
        pain_point: session.pain_point,
        input_type: session.input_type,
        process_steps: session.process_steps,
        output_types: [session.output_type],
        human_loop: session.human_loop,
        pattern: session.pattern,
        pattern_reason: session.pattern_reason,
        feasibility_breakdown: session.feasibility_breakdown,
        feasibility_score: session.feasibility_score,
        recommendation: session.recommendation,
        risks: session.risks,
        next_steps: session.next_steps,
      }));

      router.push("/results");
    } catch (error) {
      console.error("Error loading session:", error);
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm("이 세션을 삭제하시겠습니까?")) return;

    try {
      await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
    } catch (error) {
      console.error("Error deleting session:", error);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-accent rounded-md">
        <span className="text-sm font-medium">📂 이전 세션 불러오기</span>
        <ChevronDown className="h-4 w-4" />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : sessions.length > 0 ? (
          sessions.map((session) => (
            <SessionCard
              key={session.session_id}
              session={session}
              onLoad={handleLoad}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center p-4">
            저장된 세션이 없습니다.
          </p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
