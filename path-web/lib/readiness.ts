import { READINESS_LEVELS } from "@/lib/constants";

export interface ReadinessLevel {
  level: string;
  icon: string;
  label: string;
  color: string;
  minScore: number;
  description: string;
}

/**
 * Returns the readiness level for a given score (0-10 scale).
 */
export function getReadinessLevel(score: number): ReadinessLevel {
  if (score >= READINESS_LEVELS.READY.min) {
    return {
      level: "READY",
      icon: READINESS_LEVELS.READY.icon,
      label: READINESS_LEVELS.READY.label,
      color: READINESS_LEVELS.READY.color,
      minScore: READINESS_LEVELS.READY.min,
      description: READINESS_LEVELS.READY.description,
    };
  }
  if (score >= READINESS_LEVELS.GOOD.min) {
    return {
      level: "GOOD",
      icon: READINESS_LEVELS.GOOD.icon,
      label: READINESS_LEVELS.GOOD.label,
      color: READINESS_LEVELS.GOOD.color,
      minScore: READINESS_LEVELS.GOOD.min,
      description: READINESS_LEVELS.GOOD.description,
    };
  }
  if (score >= READINESS_LEVELS.NEEDS_WORK.min) {
    return {
      level: "NEEDS_WORK",
      icon: READINESS_LEVELS.NEEDS_WORK.icon,
      label: READINESS_LEVELS.NEEDS_WORK.label,
      color: READINESS_LEVELS.NEEDS_WORK.color,
      minScore: READINESS_LEVELS.NEEDS_WORK.min,
      description: READINESS_LEVELS.NEEDS_WORK.description,
    };
  }
  return {
    level: "PREPARE",
    icon: READINESS_LEVELS.PREPARE.icon,
    label: READINESS_LEVELS.PREPARE.label,
    color: READINESS_LEVELS.PREPARE.color,
    minScore: READINESS_LEVELS.PREPARE.min,
    description: READINESS_LEVELS.PREPARE.description,
  };
}

/**
 * Maps a readiness color to a Cloudscape StatusIndicator type.
 */
export function getStatusIndicatorType(color: string): "success" | "info" | "warning" | "error" {
  switch (color) {
    case "green":
      return "success";
    case "blue":
      return "info";
    case "yellow":
      return "warning";
    case "orange":
      return "error";
    default:
      return "info";
  }
}

/**
 * Returns a judgment badge label and StatusIndicator type based on total feasibility score (0-50 scale).
 */
export function getJudgmentBadge(score: number): { label: string; type: "success" | "info" | "warning" | "error" } {
  if (score >= 40) {
    return { label: "바로 진행", type: "success" };
  }
  if (score >= 30) {
    return { label: "보완 후 진행", type: "info" };
  }
  if (score >= 20) {
    return { label: "재검토 권장", type: "warning" };
  }
  return { label: "준비 필요", type: "error" };
}
