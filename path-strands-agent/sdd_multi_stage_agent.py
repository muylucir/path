"""
SDD Multi-Stage Agent - PATH 명세서를 SDD 문서로 변환하는 6단계 Agent 파이프라인

순서:
  1. RequirementsAgent → requirements.md
  2. DesignAgent → design.md
  3. TasksAgent → tasks.md
  4-6. (병렬 실행)
     - StructureAgent → structure.md
     - TechAgent → tech.md
     - ProductAgent → product.md
"""

from strands import Agent
from strands.models import BedrockModel
from typing import Dict, Any, Optional, AsyncIterator
import json
import uuid
import os
from strands_tools import file_read
from agentskills import discover_skills, generate_skills_prompt
from strands_utils import strands_utils

# 임시 저장 디렉토리 기본 경로
SDD_TEMP_DIR = "/tmp"


class SDDRequirementsAgent:
    """1단계: Requirements 문서 생성 Agent"""

    def __init__(self):
        skills = discover_skills("./skills")
        skill_prompt = generate_skills_prompt(skills)

        system_prompt = """당신은 AI Agent 요구사항 분석 전문가입니다.
PATH Agent Specification을 분석하여 EARS 표기법의 Requirements Document를 생성합니다.

출력 언어: 한글 (코드/기술 용어는 영어 유지)"""
        enhanced_prompt = system_prompt + "\n" + skill_prompt

        self.agent = strands_utils.get_agent(
            system_prompts=enhanced_prompt,
            model_id="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
            max_tokens=32000,
            temperature=0.0,
            tools=[file_read]
        )

    def generate(self, spec_content: str) -> str:
        """PATH 명세서로부터 requirements.md 생성"""
        prompt = f"""다음 PATH Agent Specification을 기반으로 Requirements Document를 생성하세요:

<path_spec>
{spec_content}
</path_spec>

**필수 1단계**: file_read로 "sdd-generation" 스킬의 SKILL.md를 읽으세요.
**필수 2단계**: file_read로 "sdd-generation" 스킬의 references/template-requirements.md를 읽으세요.
**필수 3단계**: 템플릿의 지침을 정확히 따라 requirements.md 내용을 생성하세요.

**출력 형식**:
- 마크다운 형식
- "# Agent Requirements Document"로 시작
- Introduction, Glossary, Requirements 섹션 포함
- 모든 Agent에 대해 User Story와 Acceptance Criteria 포함
- EARS 표기법 사용: "WHEN [조건], THEN the System SHALL [행동]"
- 한글로 작성 (코드/기술용어는 영어)
"""
        result = self.agent(prompt)
        return result.message['content'][0]['text']


class SDDDesignAgent:
    """2단계: Design 문서 생성 Agent"""

    def __init__(self):
        skills = discover_skills("./skills")
        skill_prompt = generate_skills_prompt(skills)

        system_prompt = """당신은 AI Agent 아키텍처 설계 전문가입니다.
PATH 명세서와 Requirements를 기반으로 상세한 Design Document를 생성합니다.

출력 언어: 한글 (코드/기술 용어는 영어 유지)"""
        enhanced_prompt = system_prompt + "\n" + skill_prompt

        self.agent = strands_utils.get_agent(
            system_prompts=enhanced_prompt,
            model_id="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
            max_tokens=32000,
            temperature=0.0,
            tools=[file_read]
        )

    def generate(self, spec_content: str, requirements_content: str) -> str:
        """requirements.md를 기반으로 design.md 생성"""
        prompt = f"""다음 PATH 명세서와 Requirements를 기반으로 Design Document를 생성하세요:

<path_spec>
{spec_content}
</path_spec>

<requirements>
{requirements_content}
</requirements>

**필수 1단계**: file_read로 "sdd-generation" 스킬의 references/template-design.md를 읽으세요.
**필수 2단계**: 템플릿의 지침을 정확히 따라 design.md 내용을 생성하세요.

**중요**:
- PATH 명세서의 Mermaid 다이어그램을 그대로 복사
- Agent 인터페이스를 Python TypedDict로 정의
- Graph Builder 코드 포함
- Correctness Properties 섹션 포함
- Testing Strategy 섹션 포함 (Unit, Integration, E2E)
- 한글로 작성 (코드는 영어)
"""
        result = self.agent(prompt)
        return result.message['content'][0]['text']


class SDDTasksAgent:
    """3단계: Tasks 문서 생성 Agent"""

    def __init__(self):
        skills = discover_skills("./skills")
        skill_prompt = generate_skills_prompt(skills)

        system_prompt = """당신은 AI Agent 프로젝트 매니저입니다.
Design Document를 구체적인 Implementation Tasks로 분해합니다.

출력 언어: 한글 (코드/기술 용어는 영어 유지)"""
        enhanced_prompt = system_prompt + "\n" + skill_prompt

        self.agent = strands_utils.get_agent(
            system_prompts=enhanced_prompt,
            model_id="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
            max_tokens=32000,
            temperature=0.0,
            tools=[file_read]
        )

    def generate(self, spec_content: str, requirements_content: str, design_content: str) -> str:
        """design.md를 기반으로 tasks.md 생성"""
        prompt = f"""다음 문서들을 기반으로 Implementation Tasks를 생성하세요:

<path_spec>
{spec_content}
</path_spec>

<requirements>
{requirements_content}
</requirements>

<design>
{design_content}
</design>

**필수 1단계**: file_read로 "sdd-generation" 스킬의 references/template-tasks.md를 읽으세요.
**필수 2단계**: 템플릿의 Phase 구조를 따라 tasks.md 내용을 생성하세요.

**중요**:
- Phase 1-7 구조 유지
- 각 태스크에 체크박스 (- [ ])
- Checkpoint 태스크 포함
- Requirements traceability (_Requirements: ..._)
- AgentCore 태스크 항상 포함
- Human-in-Loop 태스크는 mode가 "Collaborate" 또는 "Supervised"일 때만 포함
- 한글로 작성 (태스크명, 상세 내용)
"""
        result = self.agent(prompt)
        return result.message['content'][0]['text']


class SDDStructureAgent:
    """4-1단계: structure.md 생성 Agent - 프로젝트 구조, 파일 조직, 명명 규칙"""

    def __init__(self):
        skills = discover_skills("./skills")
        skill_prompt = generate_skills_prompt(skills)

        system_prompt = """당신은 소프트웨어 아키텍트입니다.
AI Agent 프로젝트의 디렉토리 구조와 파일 조직을 설계합니다.

출력 언어: 한글 (코드/기술 용어는 영어 유지)"""
        enhanced_prompt = system_prompt + "\n" + skill_prompt

        self.agent = strands_utils.get_agent(
            system_prompts=enhanced_prompt,
            model_id="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
            max_tokens=32000,
            temperature=0.0,
            tools=[file_read]
        )

    def generate(self, spec_content: str, requirements_content: str, design_content: str) -> str:
        """structure.md 생성"""
        prompt = f"""다음 문서들을 기반으로 structure.md를 생성하세요:

<path_spec>
{spec_content}
</path_spec>

<requirements>
{requirements_content}
</requirements>

<design>
{design_content}
</design>

**필수 1단계**: file_read로 "sdd-generation" 스킬의 references/template-steering.md를 읽으세요.
**필수 2단계**: 템플릿에서 structure.md 섹션의 지침을 따라 문서를 생성하세요.

**structure.md 필수 포함 내용**:
- 프로젝트 디렉토리 구조 (tree 형식)
- 파일 명명 규칙 (naming conventions)
- 모듈/패키지 조직 방식
- 설정 파일 위치
- 테스트 파일 구조

**출력 형식**: 마크다운 문서 (structure.md 내용만 출력)
"""
        result = self.agent(prompt)
        return result.message['content'][0]['text']


class SDDTechAgent:
    """4-2단계: tech.md 생성 Agent - 기술 스택, 개발 명령어, 가이드라인"""

    def __init__(self):
        skills = discover_skills("./skills")
        skill_prompt = generate_skills_prompt(skills)

        system_prompt = """당신은 DevOps 및 기술 문서 전문가입니다.
AI Agent 프로젝트의 기술 스택과 개발 환경을 문서화합니다.

출력 언어: 한글 (코드/기술 용어는 영어 유지)"""
        enhanced_prompt = system_prompt + "\n" + skill_prompt

        self.agent = strands_utils.get_agent(
            system_prompts=enhanced_prompt,
            model_id="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
            max_tokens=32000,
            temperature=0.0,
            tools=[file_read]
        )

    def generate(self, spec_content: str, requirements_content: str, design_content: str) -> str:
        """tech.md 생성"""
        prompt = f"""다음 문서들을 기반으로 tech.md를 생성하세요:

<path_spec>
{spec_content}
</path_spec>

<requirements>
{requirements_content}
</requirements>

<design>
{design_content}
</design>

**필수 1단계**: file_read로 "sdd-generation" 스킬의 references/template-steering.md를 읽으세요.
**필수 2단계**: 템플릿에서 tech.md 섹션의 지침을 따라 문서를 생성하세요.

**tech.md 필수 포함 내용**:
- 기술 스택 (언어, 프레임워크, 라이브러리)
- 개발 환경 설정 명령어
- 빌드/실행/테스트 명령어
- 환경 변수 설정
- 의존성 관리
- 코딩 스타일 가이드라인

**출력 형식**: 마크다운 문서 (tech.md 내용만 출력)
"""
        result = self.agent(prompt)
        return result.message['content'][0]['text']


class SDDProductAgent:
    """4-3단계: product.md 생성 Agent - 제품 개요, Agent 역할, 비즈니스 규칙"""

    def __init__(self):
        skills = discover_skills("./skills")
        skill_prompt = generate_skills_prompt(skills)

        system_prompt = """당신은 프로덕트 매니저이자 기술 문서 작성자입니다.
AI Agent 제품의 목적, 기능, 비즈니스 규칙을 문서화합니다.

출력 언어: 한글 (코드/기술 용어는 영어 유지)"""
        enhanced_prompt = system_prompt + "\n" + skill_prompt

        self.agent = strands_utils.get_agent(
            system_prompts=enhanced_prompt,
            model_id="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
            max_tokens=32000,
            temperature=0.0,
            tools=[file_read]
        )

    def generate(self, spec_content: str, requirements_content: str, design_content: str) -> str:
        """product.md 생성"""
        prompt = f"""다음 문서들을 기반으로 product.md를 생성하세요:

<path_spec>
{spec_content}
</path_spec>

<requirements>
{requirements_content}
</requirements>

<design>
{design_content}
</design>

**필수 1단계**: file_read로 "sdd-generation" 스킬의 references/template-steering.md를 읽으세요.
**필수 2단계**: 템플릿에서 product.md 섹션의 지침을 따라 문서를 생성하세요.

**product.md 필수 포함 내용**:
- 제품 개요 및 목적
- 핵심 기능 설명
- Agent별 역할과 책임
- 사용자 워크플로우
- 비즈니스 규칙 및 제약사항
- 성공 지표 (KPI)

**출력 형식**: 마크다운 문서 (product.md 내용만 출력)
"""
        result = self.agent(prompt)
        return result.message['content'][0]['text']


class SDDAssemblerAgent:
    """5단계: 최종 조합 - LLM 없이 결과 조합"""

    def __init__(self):
        # LLM 불필요 - 단순 조합만 수행
        pass

    async def assemble_stream(
        self,
        requirements: str,
        design: str,
        tasks: str,
        steering: Dict[str, str]
    ) -> AsyncIterator[Dict[str, Any]]:
        """최종 결과 조합 및 스트리밍"""
        import asyncio

        # 결과 구조화
        result = {
            "specs": {
                "requirements.md": requirements,
                "design.md": design,
                "tasks.md": tasks
            },
            "steering": {
                "structure.md": steering.get('structure', ''),
                "tech.md": steering.get('tech', ''),
                "product.md": steering.get('product', '')
            }
        }

        # JSON 스트리밍
        result_json = json.dumps(result, ensure_ascii=False, indent=2)
        chunk_size = 200
        total_chunks = (len(result_json) + chunk_size - 1) // chunk_size

        for i in range(0, len(result_json), chunk_size):
            chunk = result_json[i:i+chunk_size]
            chunk_index = i // chunk_size
            progress = 90 + int((chunk_index / total_chunks) * 9)  # 90-99%
            yield {'text': chunk, 'progress': min(progress, 99)}
            await asyncio.sleep(0.01)


class SDDMultiStageAgent:
    """SDD 문서 생성 조율 - 6단계 파이프라인 (Steering 3개 병렬 실행)"""

    def __init__(self):
        self.requirements_agent = SDDRequirementsAgent()
        self.design_agent = SDDDesignAgent()
        self.tasks_agent = SDDTasksAgent()
        # Steering 문서별 개별 Agent
        self.structure_agent = SDDStructureAgent()
        self.tech_agent = SDDTechAgent()
        self.product_agent = SDDProductAgent()
        self.assembler_agent = SDDAssemblerAgent()

    def _create_session_dir(self, session_id: str, spec_content: str) -> str:
        """세션 디렉토리 생성 및 원본 spec 저장"""
        base_dir = f"{SDD_TEMP_DIR}/sdd-{session_id}"
        os.makedirs(f"{base_dir}/.kiro/specs", exist_ok=True)
        os.makedirs(f"{base_dir}/.kiro/steering", exist_ok=True)
        os.makedirs(f"{base_dir}/.kiro/path-spec", exist_ok=True)

        # 원본 spec 저장
        with open(f"{base_dir}/.kiro/path-spec/spec.md", "w", encoding="utf-8") as f:
            f.write(spec_content)

        return base_dir

    def _save_file(self, base_dir: str, subdir: str, filename: str, content: str):
        """파일 저장"""
        filepath = f"{base_dir}/.kiro/{subdir}/{filename}"
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)

    async def generate_sdd_stream(
        self,
        spec_content: str
    ) -> AsyncIterator[str]:
        """SDD 문서 생성 - keep-alive 포함 스트리밍 (Steering 병렬 실행) + /tmp 저장"""
        import asyncio

        # 세션 ID 생성 및 디렉토리 준비
        session_id = str(uuid.uuid4())

        try:
            base_dir = self._create_session_dir(session_id, spec_content)
            yield f"data: {json.dumps({'progress': 0, 'stage': '세션 준비 완료', 'session_id': session_id}, ensure_ascii=False)}\n\n"

            # Stage 1: Requirements (0-20%)
            yield f"data: {json.dumps({'progress': 2, 'stage': 'Requirements 생성 시작'}, ensure_ascii=False)}\n\n"
            task = asyncio.create_task(asyncio.to_thread(
                self.requirements_agent.generate, spec_content
            ))
            progress = 5
            while not task.done():
                await asyncio.sleep(3)
                if not task.done():
                    progress = min(progress + 5, 18)
                    yield f"data: {json.dumps({'progress': progress, 'stage': 'Requirements 생성 중...'}, ensure_ascii=False)}\n\n"
            requirements_result = await task
            self._save_file(base_dir, "specs", "requirements.md", requirements_result)
            yield f"data: {json.dumps({'progress': 20, 'stage': 'Requirements 생성 완료 (저장됨)'}, ensure_ascii=False)}\n\n"

            # Stage 2: Design (20-40%)
            yield f"data: {json.dumps({'progress': 22, 'stage': 'Design 생성 시작'}, ensure_ascii=False)}\n\n"
            task = asyncio.create_task(asyncio.to_thread(
                self.design_agent.generate, spec_content, requirements_result
            ))
            progress = 25
            while not task.done():
                await asyncio.sleep(3)
                if not task.done():
                    progress = min(progress + 5, 38)
                    yield f"data: {json.dumps({'progress': progress, 'stage': 'Design 생성 중...'}, ensure_ascii=False)}\n\n"
            design_result = await task
            self._save_file(base_dir, "specs", "design.md", design_result)
            yield f"data: {json.dumps({'progress': 40, 'stage': 'Design 생성 완료 (저장됨)'}, ensure_ascii=False)}\n\n"

            # Stage 3: Tasks (40-60%)
            yield f"data: {json.dumps({'progress': 42, 'stage': 'Tasks 생성 시작'}, ensure_ascii=False)}\n\n"
            task = asyncio.create_task(asyncio.to_thread(
                self.tasks_agent.generate, spec_content, requirements_result, design_result
            ))
            progress = 45
            while not task.done():
                await asyncio.sleep(3)
                if not task.done():
                    progress = min(progress + 5, 58)
                    yield f"data: {json.dumps({'progress': progress, 'stage': 'Tasks 생성 중...'}, ensure_ascii=False)}\n\n"
            tasks_result = await task
            self._save_file(base_dir, "specs", "tasks.md", tasks_result)
            yield f"data: {json.dumps({'progress': 60, 'stage': 'Tasks 생성 완료 (저장됨)'}, ensure_ascii=False)}\n\n"

            # Stage 4-6: Steering 문서 3개 병렬 실행 (60-95%)
            yield f"data: {json.dumps({'progress': 62, 'stage': 'Steering 문서 병렬 생성 시작 (structure, tech, product)'}, ensure_ascii=False)}\n\n"

            # 3개 Agent 병렬 실행
            structure_task = asyncio.create_task(asyncio.to_thread(
                self.structure_agent.generate, spec_content, requirements_result, design_result
            ))
            tech_task = asyncio.create_task(asyncio.to_thread(
                self.tech_agent.generate, spec_content, requirements_result, design_result
            ))
            product_task = asyncio.create_task(asyncio.to_thread(
                self.product_agent.generate, spec_content, requirements_result, design_result
            ))

            # 병렬 진행 상황 모니터링
            progress = 65
            completed = {"structure": False, "tech": False, "product": False}
            while not all(completed.values()):
                await asyncio.sleep(3)

                if structure_task.done() and not completed["structure"]:
                    completed["structure"] = True
                    structure_result = await structure_task
                    self._save_file(base_dir, "steering", "structure.md", structure_result)
                    yield f"data: {json.dumps({'progress': progress, 'stage': 'structure.md 생성 완료 (저장됨)'}, ensure_ascii=False)}\n\n"
                    progress = min(progress + 10, 90)

                if tech_task.done() and not completed["tech"]:
                    completed["tech"] = True
                    tech_result = await tech_task
                    self._save_file(base_dir, "steering", "tech.md", tech_result)
                    yield f"data: {json.dumps({'progress': progress, 'stage': 'tech.md 생성 완료 (저장됨)'}, ensure_ascii=False)}\n\n"
                    progress = min(progress + 10, 90)

                if product_task.done() and not completed["product"]:
                    completed["product"] = True
                    product_result = await product_task
                    self._save_file(base_dir, "steering", "product.md", product_result)
                    yield f"data: {json.dumps({'progress': progress, 'stage': 'product.md 생성 완료 (저장됨)'}, ensure_ascii=False)}\n\n"
                    progress = min(progress + 10, 90)

                if not all(completed.values()):
                    remaining = [k for k, v in completed.items() if not v]
                    remaining_str = ", ".join(remaining)
                    yield f"data: {json.dumps({'progress': progress, 'stage': f'생성 중: {remaining_str}'}, ensure_ascii=False)}\n\n"

            # 결과 변수 확보 (이미 저장됨)
            if not completed["structure"]:
                structure_result = await structure_task
            if not completed["tech"]:
                tech_result = await tech_task
            if not completed["product"]:
                product_result = await product_task

            yield f"data: {json.dumps({'progress': 95, 'stage': 'Steering 문서 모두 완료'}, ensure_ascii=False)}\n\n"

            # Stage 7: Assembly (95-100%)
            yield f"data: {json.dumps({'progress': 97, 'stage': '최종 조합'}, ensure_ascii=False)}\n\n"

            # 최종 결과 구조화
            final_result = {
                "specs": {
                    "requirements.md": requirements_result,
                    "design.md": design_result,
                    "tasks.md": tasks_result
                },
                "steering": {
                    "structure.md": structure_result,
                    "tech.md": tech_result,
                    "product.md": product_result
                }
            }

            # result는 /tmp에 저장되어 있으므로 session_id만 전송
            yield f"data: {json.dumps({'progress': 100, 'stage': '완료', 'session_id': session_id}, ensure_ascii=False)}\n\n"
            yield "data: [DONE]\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e), 'session_id': session_id}, ensure_ascii=False)}\n\n"

    def generate_sdd_sync(self, spec_content: str) -> Dict[str, Any]:
        """SDD 문서 생성 - 동기 방식 (ZIP 다운로드용)"""
        import concurrent.futures

        # Stage 1: Requirements
        requirements_result = self.requirements_agent.generate(spec_content)

        # Stage 2: Design
        design_result = self.design_agent.generate(spec_content, requirements_result)

        # Stage 3: Tasks
        tasks_result = self.tasks_agent.generate(spec_content, requirements_result, design_result)

        # Stage 4-6: Steering 문서 3개 병렬 실행
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            structure_future = executor.submit(
                self.structure_agent.generate, spec_content, requirements_result, design_result
            )
            tech_future = executor.submit(
                self.tech_agent.generate, spec_content, requirements_result, design_result
            )
            product_future = executor.submit(
                self.product_agent.generate, spec_content, requirements_result, design_result
            )

            structure_result = structure_future.result()
            tech_result = tech_future.result()
            product_result = product_future.result()

        return {
            "specs": {
                "requirements.md": requirements_result,
                "design.md": design_result,
                "tasks.md": tasks_result
            },
            "steering": {
                "structure.md": structure_result,
                "tech.md": tech_result,
                "product.md": product_result
            }
        }


# Global singleton
sdd_multi_stage_agent = SDDMultiStageAgent()
