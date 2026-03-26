"""
Pydantic schemas for PATH Agent Designer — LLM 출력 검증 및 타입 강제

LLM이 score를 "8" (문자열)로 반환하는 등의 타입 불일치를 자동 변환하고,
필수 필드 누락/잘못된 값을 조기에 감지한다.
"""

from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional


class FeasibilityItemDetail(BaseModel):
    """개별 Feasibility 평가 항목 (점수 + 근거 + 신뢰도)"""
    score: int = Field(ge=0, le=10)
    reason: str
    current_state: str
    confidence: Optional[str] = None
    information_gaps: Optional[list[str]] = None
    # 재평가 전용
    changed: Optional[bool] = None
    change_reason: Optional[str] = None

    @field_validator("score", mode="before")
    @classmethod
    def coerce_score(cls, v):
        if isinstance(v, str):
            return int(v)
        if isinstance(v, float):
            return int(v)
        return v

    @field_validator("confidence", mode="before")
    @classmethod
    def validate_confidence(cls, v):
        if v is None:
            return v
        v = str(v).lower().strip()
        if v not in ("high", "medium", "low"):
            return None
        return v


class LayerHints(BaseModel):
    """3계층 택소노미 힌트 (내부용)"""
    agent_patterns: list[str] = Field(default_factory=list)
    llm_workflows: list[str] = Field(default_factory=list)
    agentic_workflow: Optional[str] = None


class DesignSignals(BaseModel):
    """설계 신호 — 내부 분석용, 프론트엔드에 노출하지 않음.
    PatternAnalyzerAgent의 컨텍스트로 전달되어 초기 분석 품질을 높인다."""
    reasoning_characteristics: list[str] = Field(default_factory=list)
    collaboration_characteristics: list[str] = Field(default_factory=list)
    layer_hints: Optional[LayerHints] = None
    rationale: str = ""


class FeasibilityEvaluation(BaseModel):
    """Step 2: Feasibility 평가 전체 결과"""
    feasibility_breakdown: dict[str, FeasibilityItemDetail]
    autonomy_requirement: Optional[FeasibilityItemDetail] = None
    feasibility_score: int = Field(ge=0, le=50)
    judgment: str
    weak_items: list[dict] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)
    summary: str
    # 내부용: 패턴 분석 에이전트의 컨텍스트로 활용 (프론트엔드 미노출)
    design_signals: Optional[DesignSignals] = None
    # 재평가 전용
    previous_score: Optional[int] = None
    score_change: Optional[int] = None

    @field_validator("feasibility_score", mode="before")
    @classmethod
    def coerce_feasibility_score(cls, v):
        if isinstance(v, str):
            return int(v)
        if isinstance(v, float):
            return int(v)
        return v

    @field_validator("previous_score", "score_change", mode="before")
    @classmethod
    def coerce_optional_int(cls, v):
        if v is None:
            return v
        if isinstance(v, str):
            return int(v)
        if isinstance(v, float):
            return int(v)
        return v

    @model_validator(mode="after")
    def validate_score_sum(self):
        """feasibility_score가 5개 항목 합계와 일치하는지 검증 (±2 허용)"""
        expected_keys = {"data_access", "decision_clarity", "error_tolerance", "latency", "integration"}
        actual_keys = set(self.feasibility_breakdown.keys())
        if expected_keys.issubset(actual_keys):
            total = sum(self.feasibility_breakdown[k].score for k in expected_keys)
            if abs(total - self.feasibility_score) > 2:
                self.feasibility_score = total
        return self


class ImprovedFeasibilityItem(BaseModel):
    """개선된 Feasibility 개별 항목"""
    original_score: int
    improved_score: int
    improvement_reason: str = ""

    @field_validator("original_score", "improved_score", mode="before")
    @classmethod
    def coerce_score(cls, v):
        if isinstance(v, str):
            return int(v)
        if isinstance(v, float):
            return int(v)
        return v


class ImprovedFeasibility(BaseModel):
    """Step 3 finalize: 개선된 Feasibility 점수"""
    score: int
    score_change: int
    breakdown: Optional[dict[str, ImprovedFeasibilityItem]] = None
    summary: str = ""

    @field_validator("score", "score_change", mode="before")
    @classmethod
    def coerce_int(cls, v):
        if isinstance(v, str):
            return int(v)
        if isinstance(v, float):
            return int(v)
        return v


class UpdatedAutonomy(BaseModel):
    """대화 후 재판단된 자율성 점수"""
    score: int = Field(ge=0, le=10)
    reason: str = ""

    @field_validator("score", mode="before")
    @classmethod
    def coerce_score(cls, v):
        if isinstance(v, str):
            return int(v)
        if isinstance(v, float):
            return int(v)
        return v


class ThreeAxisScores(BaseModel):
    """3축 점수 평가 결과 (싱글/멀티 에이전트 판단 근거)"""
    axis1_tool_complexity: int = Field(ge=0, le=2)
    axis2_role_separation: int = Field(ge=0, le=2)
    axis3_flow_complexity: int = Field(ge=0, le=2)
    total: int = Field(ge=0, le=6)
    reasoning: str = ""

    @field_validator("axis1_tool_complexity", "axis2_role_separation",
                     "axis3_flow_complexity", "total", mode="before")
    @classmethod
    def coerce_score(cls, v):
        if isinstance(v, str):
            return int(v)
        if isinstance(v, float):
            return int(v)
        return v

    @model_validator(mode="after")
    def validate_total(self):
        """total이 3축 합산과 일치하지 않으면 자동 교정"""
        expected = self.axis1_tool_complexity + self.axis2_role_separation + self.axis3_flow_complexity
        if self.total != expected:
            self.total = expected
        return self


class PatternAnalysis(BaseModel):
    """Step 3 finalize: 패턴 확정 결과"""
    pain_point: str
    input_type: str
    input_detail: Optional[str] = None
    process_steps: list[str] = Field(default_factory=list)
    output_types: list[str] = Field(default_factory=list)
    output_detail: Optional[str] = None
    human_loop: str = ""
    pattern: str
    recommended_architecture: str
    multi_agent_pattern: Optional[str] = None
    automation_level: str
    automation_level_reason: Optional[str] = None
    updated_autonomy: Optional[UpdatedAutonomy] = None
    three_axis_scores: Optional[ThreeAxisScores] = None
    architecture_reason: Optional[str] = None
    pattern_reason: str = ""
    feasibility_breakdown: dict
    feasibility_score: int
    improved_feasibility: Optional[ImprovedFeasibility] = None
    recommendation: str = ""
    risks: list[str] = Field(default_factory=list)
    next_steps: list[str] = Field(default_factory=list)

    @field_validator("feasibility_score", mode="before")
    @classmethod
    def coerce_score(cls, v):
        if isinstance(v, str):
            return int(v)
        if isinstance(v, float):
            return int(v)
        return v

    @field_validator("recommended_architecture", mode="before")
    @classmethod
    def normalize_architecture(cls, v):
        v = str(v).lower().strip()
        if "multi" in v or "distributed" in v or "team" in v or "collaborative" in v:
            return "multi-agent"
        if "single" in v or "solo" in v or "mono" in v:
            return "single-agent"
        # 어느 쪽에도 매칭되지 않으면 원본 유지 (Pydantic이 검증)
        return v

    @field_validator("automation_level", mode="before")
    @classmethod
    def normalize_automation(cls, v):
        v = str(v).lower().strip()
        if "agentic" in v or "autonomous" in v or "agent-driven" in v:
            return "agentic-ai"
        if "assisted" in v or "pipeline" in v or "workflow" in v:
            return "ai-assisted-workflow"
        return v

    @field_validator("improved_feasibility", mode="before")
    @classmethod
    def validate_improved(cls, v):
        if v is None:
            return None
        if not isinstance(v, dict):
            return None
        # score와 score_change가 변환 가능한지 확인
        try:
            int(v.get("score", 0))
            int(v.get("score_change", 0))
        except (ValueError, TypeError):
            return None
        return v
