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
 * Returns a Tailwind CSS class string for a readiness badge based on color.
 */
export function getLevelBadgeClass(color: string): string {
  switch (color) {
    case "green":
      return "bg-green-100 text-green-800 border-green-200";
    case "blue":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "yellow":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "orange":
      return "bg-orange-100 text-orange-800 border-orange-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

/**
 * Returns a judgment badge label and variant based on total feasibility score (0-50 scale).
 */
export function getJudgmentBadge(score: number): { label: string; variant: string } {
  if (score >= 40) {
    return { label: "바로 진행", variant: "green" };
  }
  if (score >= 30) {
    return { label: "보완 후 진행", variant: "blue" };
  }
  if (score >= 20) {
    return { label: "재검토 권장", variant: "yellow" };
  }
  return { label: "준비 필요", variant: "orange" };
}
