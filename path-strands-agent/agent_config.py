"""Centralized agent model configuration.

Each agent has a named profile with model_id, max_tokens, and temperature.
Environment variables override defaults:
  AGENT_DEFAULT_MODEL  -> default model for all agents
  AGENT_<NAME>_MODEL   -> override for a specific agent (e.g., AGENT_PROMPT_MODEL)
"""
import os

# Master default -- single place to switch Opus <-> Sonnet for all agents
DEFAULT_MODEL = os.environ.get(
    "AGENT_DEFAULT_MODEL",
    "global.anthropic.claude-sonnet-4-6",
)

AGENT_PROFILES: dict[str, dict] = {
    "feasibility": {
        "model_id": os.environ.get("AGENT_FEASIBILITY_MODEL", DEFAULT_MODEL),
        "max_tokens": 32_000,
        "temperature": 0.0,
    },
    "pattern_analyzer": {
        "model_id": os.environ.get("AGENT_PATTERN_MODEL", DEFAULT_MODEL),
        "max_tokens": 32_000,
        "temperature": 0.0,
    },
    "design": {
        "model_id": os.environ.get("AGENT_DESIGN_MODEL", DEFAULT_MODEL),
        "max_tokens": 32_000,
        "temperature": 0.0,
    },
    "diagram": {
        "model_id": os.environ.get("AGENT_DIAGRAM_MODEL", DEFAULT_MODEL),
        "max_tokens": 32_000,
        "temperature": 0.0,
    },
    "prompt_single": {
        "model_id": os.environ.get("AGENT_PROMPT_MODEL", DEFAULT_MODEL),
        "max_tokens": 32_000,
        "temperature": 0.0,
    },
    "prompt_parallel": {
        "model_id": os.environ.get("AGENT_PROMPT_MODEL", DEFAULT_MODEL),
        "max_tokens": 32_000,
        "temperature": 0.0,
    },
    "tool": {
        "model_id": os.environ.get("AGENT_TOOL_MODEL", DEFAULT_MODEL),
        "max_tokens": 32_000,
        "temperature": 0.0,
    },
}


def get_profile(name: str) -> dict:
    """Return a copy of the named profile. Raises KeyError if not found."""
    return dict(AGENT_PROFILES[name])
