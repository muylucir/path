"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Wizard from "@cloudscape-design/components/wizard";
import Spinner from "@cloudscape-design/components/spinner";
import Box from "@cloudscape-design/components/box";
import { Step1Form } from "@/components/steps/Step1Form";
import { Step2Readiness } from "@/components/steps/Step2Readiness";
import { Step3PatternAnalysis } from "@/components/steps/Step3PatternAnalysis";
import { Step3Results } from "@/components/steps/Step3Results";
import { AppLayoutShell } from "@/components/layout/AppLayoutShell";
import { useTokenUsage } from "@/lib/hooks/useTokenUsage";
import { useFlash } from "@/components/cloudscape/FlashbarProvider";
import type { FormValues } from "@/lib/schema";
import type {
  FormData,
  FeasibilityEvaluation,
  ImprovementPlans,
  ChatMessage,
  Analysis,
} from "@/lib/types";

export default function DesignWizardPage() {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [feasibility, setFeasibility] = useState<FeasibilityEvaluation | null>(null);
  const [improvementPlans, setImprovementPlans] = useState<ImprovementPlans>({});
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [specification, setSpecification] = useState<string>("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoadingNextStep, setIsLoadingNextStep] = useState(false);
  const [isRestored, setIsRestored] = useState(false);

  const { addUsage, resetUsage } = useTokenUsage();
  const { addFlash } = useFlash();

  // Refs for triggering step actions from Wizard navigation
  const step1SubmitRef = useRef<(() => void) | null>(null);
  const step2CompleteRef = useRef<(() => void) | null>(null);

  // Restore state from sessionStorage on mount
  useEffect(() => {
    let restoredStep = 0;

    const savedFormData = sessionStorage.getItem("formData");
    const savedFeasibility = sessionStorage.getItem("feasibility");
    const savedPlans = sessionStorage.getItem("improvementPlans");
    const savedAnalysis = sessionStorage.getItem("analysis");
    const savedChatHistory = sessionStorage.getItem("chatHistory");
    const savedSpec = sessionStorage.getItem("specification");
    const savedSessionId = sessionStorage.getItem("currentSessionId");

    if (savedFormData) {
      try {
        setFormData(JSON.parse(savedFormData));
        restoredStep = 1;
      } catch { /* ignore */ }
    }
    if (savedFeasibility) {
      try {
        setFeasibility(JSON.parse(savedFeasibility));
        restoredStep = 2;
      } catch { /* ignore */ }
    }
    if (savedPlans) {
      try { setImprovementPlans(JSON.parse(savedPlans)); } catch { /* ignore */ }
    }
    if (savedAnalysis) {
      try {
        setAnalysis(JSON.parse(savedAnalysis));
        restoredStep = 3;
      } catch { /* ignore */ }
    }
    if (savedChatHistory) {
      try { setChatHistory(JSON.parse(savedChatHistory)); } catch { /* ignore */ }
    }
    if (savedSpec) setSpecification(savedSpec);
    if (savedSessionId) setSessionId(savedSessionId);

    setActiveStepIndex(restoredStep);
    setIsRestored(true);
  }, []);

  // --- Step completion handlers ---

  const handleStep1Submit = useCallback((data: FormValues) => {
    const fd = data as FormData;
    setFormData(fd);
    sessionStorage.setItem("formData", JSON.stringify(fd));
    // Reset downstream state
    setFeasibility(null);
    setImprovementPlans({});
    setChatHistory([]);
    setAnalysis(null);
    setSpecification("");
    sessionStorage.removeItem("feasibility");
    sessionStorage.removeItem("improvementPlans");
    sessionStorage.removeItem("chatHistory");
    sessionStorage.removeItem("analysis");
    sessionStorage.removeItem("specification");
    setActiveStepIndex(1);
  }, []);

  const handleStep2Complete = useCallback((result: FeasibilityEvaluation, plans: ImprovementPlans) => {
    setFeasibility(result);
    setImprovementPlans(plans);
    sessionStorage.setItem("feasibility", JSON.stringify(result));
    sessionStorage.setItem("improvementPlans", JSON.stringify(plans));
    // Reset downstream state
    setChatHistory([]);
    setAnalysis(null);
    setSpecification("");
    sessionStorage.removeItem("chatHistory");
    sessionStorage.removeItem("analysis");
    sessionStorage.removeItem("specification");
    setIsLoadingNextStep(false);
    setActiveStepIndex(2);
  }, []);

  const handleFormDataUpdate = useCallback((updatedFormData: FormData) => {
    setFormData(updatedFormData);
    sessionStorage.setItem("formData", JSON.stringify(updatedFormData));
  }, []);

  const handleStep3Complete = useCallback((history: ChatMessage[], result: Analysis) => {
    setChatHistory(history);
    setAnalysis(result);
    sessionStorage.setItem("chatHistory", JSON.stringify(history));
    sessionStorage.setItem("analysis", JSON.stringify(result));
    setIsLoadingNextStep(false);
    setActiveStepIndex(3);
  }, []);

  // --- Navigation handler ---

  const handleNavigate = ({ detail }: { detail: { requestedStepIndex: number; reason: string } }) => {
    const { requestedStepIndex } = detail;

    // Backward navigation: always allowed
    if (requestedStepIndex < activeStepIndex) {
      setActiveStepIndex(requestedStepIndex);
      return;
    }

    // Forward navigation: validate current step
    switch (activeStepIndex) {
      case 0: // Step 1 → Step 2: trigger form validation
        if (step1SubmitRef.current) {
          step1SubmitRef.current(); // will call handleStep1Submit on success
        }
        return; // handleStep1Submit sets activeStepIndex

      case 1: // Step 2 → Step 3: trigger completion
        if (step2CompleteRef.current) {
          step2CompleteRef.current(); // will call handleStep2Complete
        }
        return;

      case 2: // Step 3 → Step 4: requires finalized analysis
        if (!analysis) return;
        setActiveStepIndex(requestedStepIndex);
        return;
    }
  };

  // --- Cancel / Submit handlers ---

  const handleCancel = () => {
    if (window.confirm("진행 중인 분석이 초기화됩니다. 계속하시겠습니까?")) {
      sessionStorage.clear();
      resetUsage();
      setFormData(null);
      setFeasibility(null);
      setImprovementPlans({});
      setChatHistory([]);
      setAnalysis(null);
      setSpecification("");
      setSessionId(null);
      setActiveStepIndex(0);
    }
  };

  const handleSave = useCallback(async (spec: string) => {
    try {
      // Read latest analysis from sessionStorage to avoid stale closure
      const savedAnalysisRaw = sessionStorage.getItem("analysis");
      const latestAnalysis: Analysis | null = savedAnalysisRaw ? JSON.parse(savedAnalysisRaw) : analysis;
      const a = latestAnalysis!;

      // Build full session body (shared by POST and PUT)
      const body = {
        pain_point: formData!.painPoint,
        input_type: a.input_type || formData!.inputType,
        process_steps: a.process_steps || formData!.processSteps,
        output_types: a.output_types || formData!.outputTypes,
        human_loop: formData!.humanLoop,
        error_tolerance: formData!.errorTolerance,
        user_input_type: formData!.inputType,
        user_process_steps: formData!.processSteps,
        user_output_types: formData!.outputTypes,
        data_source: formData!.additionalSources || "",
        additional_context: formData!.additionalContext || "",
        additional_sources: formData!.additionalSources || "",
        pattern: a.pattern,
        pattern_reason: a.pattern_reason,
        recommended_architecture: a.recommended_architecture ?? null,
        multi_agent_pattern: a.multi_agent_pattern ?? null,
        architecture_reason: a.architecture_reason ?? null,
        feasibility_breakdown: a.feasibility_breakdown,
        feasibility_score: a.feasibility_score,
        recommendation: a.recommendation,
        risks: a.risks,
        next_steps: a.next_steps,
        chat_history: chatHistory,
        specification: spec,
        feasibility_evaluation: feasibility ?? null,
        improvement_plans: improvementPlans,
        improved_feasibility: a.improved_feasibility ?? null,
        token_usage: (() => {
          try {
            const raw = sessionStorage.getItem("tokenUsage");
            return raw ? JSON.parse(raw) : null;
          } catch { return null; }
        })(),
      };

      if (sessionId) {
        // PUT: replace entire session (same session_id)
        const res = await fetch(`/api/sessions/${sessionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        addFlash("success", "세션이 업데이트되었습니다");
      } else {
        // POST: create new session
        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.session_id) {
          setSessionId(data.session_id);
          sessionStorage.setItem("currentSessionId", data.session_id);
        }
        addFlash("success", "세션이 저장되었습니다");
      }
    } catch (error) {
      console.error("Save error:", error);
      addFlash("error", "세션 저장에 실패했습니다");
    }
  }, [formData, feasibility, improvementPlans, chatHistory, analysis, sessionId, addFlash]);

  const handleSubmit = () => {
    const latestSpec = sessionStorage.getItem("specification") || specification;
    handleSave(latestSpec);
  };

  // Don't render until sessionStorage has been read
  if (!isRestored) {
    return (
      <AppLayoutShell contentType="wizard" breadcrumbs={[{ text: "에이전트 디자인", href: "/" }]}>
        <Box textAlign="center" padding={{ vertical: "xxxl" }}>
          <Spinner size="large" />
        </Box>
      </AppLayoutShell>
    );
  }

  return (
    <AppLayoutShell contentType="wizard" breadcrumbs={[{ text: "에이전트 디자인", href: "/" }]}>
      <Wizard
        activeStepIndex={activeStepIndex}
        isLoadingNextStep={isLoadingNextStep}
        allowSkipTo
        onNavigate={handleNavigate}
        onCancel={handleCancel}
        onSubmit={handleSubmit}
        i18nStrings={{
          stepNumberLabel: (n) => `Step ${n}`,
          collapsedStepsLabel: (n, total) => `Step ${n} / ${total}`,
          cancelButton: "취소",
          previousButton: "이전",
          nextButton: "다음",
          submitButton: "저장",
          optional: "선택",
        }}
        steps={[
          {
            title: "기본 정보 입력",
            description: "AI Agent 아이디어를 구조화합니다",
            content: (
              <Step1Form
                onSubmit={handleStep1Submit}
                initialData={formData as FormValues | undefined}
                submitRef={step1SubmitRef}
              />
            ),
          },
          {
            title: "준비도 점검",
            description: "데이터 접근성, 판단 명확성 등 5가지 항목을 점검합니다",
            content: formData ? (
              <Step2Readiness
                formData={formData}
                initialFeasibility={feasibility}
                initialImprovementPlans={improvementPlans}
                onComplete={handleStep2Complete}
                onFormDataUpdate={handleFormDataUpdate}
                onUsage={addUsage}
                onLoadingChange={setIsLoadingNextStep}
                completeRef={step2CompleteRef}
              />
            ) : (
              <Box textAlign="center" padding={{ vertical: "xxxl" }}>
                <Spinner size="large" />
              </Box>
            ),
          },
          {
            title: "패턴 분석",
            description: "적합한 Agent 구조를 분석합니다",
            content: formData && feasibility ? (
              <Step3PatternAnalysis
                formData={formData}
                feasibility={feasibility}
                improvementPlans={improvementPlans}
                onComplete={handleStep3Complete}
                onUsage={addUsage}
                onLoadingChange={setIsLoadingNextStep}
              />
            ) : (
              <Box textAlign="center" padding={{ vertical: "xxxl" }}>
                <Spinner size="large" />
              </Box>
            ),
          },
          {
            title: "결과 및 명세서",
            description: "분석 결과, 대화 내역, 구현 명세서를 확인합니다",
            content: analysis ? (
              <Step3Results
                analysis={analysis}
                chatHistory={chatHistory}
                formData={formData!}
                feasibility={feasibility}
                improvementPlans={improvementPlans}
                initialSpecification={specification}
                onSave={handleSave}
                onUsage={addUsage}
              />
            ) : (
              <Box textAlign="center" padding={{ vertical: "xxxl" }}>
                <Spinner size="large" />
              </Box>
            ),
          },
        ]}
      />
    </AppLayoutShell>
  );
}
