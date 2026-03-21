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


class FeasibilityEvaluation(BaseModel):
    """Step 2: Feasibility 평가 전체 결과"""
    feasibility_breakdown: dict[str, FeasibilityItemDetail]
    autonomy_requirement: Optional[FeasibilityItemDetail] = None
    feasibility_score: int = Field(ge=0, le=50)
    judgment: str
    weak_items: list[dict] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)
    summary: str
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
        if "multi" in v:
            return "multi-agent"
        return "single-agent"

    @field_validator("automation_level", mode="before")
    @classmethod
    def normalize_automation(cls, v):
        v = str(v).lower().strip()
        if "agentic" in v:
            return "agentic-ai"
        return "ai-assisted-workflow"

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
