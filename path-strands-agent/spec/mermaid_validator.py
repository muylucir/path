"""Mermaid 다이어그램 문법 검증기 (Python only, Node.js 의존 없음)"""

import re
from typing import Dict, List, Tuple


class MermaidValidator:
    """Mermaid 다이어그램 문법 검증기"""

    # 지원하는 다이어그램 타입 선언 키워드
    DIAGRAM_TYPES = [
        'graph', 'flowchart', 'sequenceDiagram', 'classDiagram',
        'stateDiagram', 'stateDiagram-v2', 'erDiagram', 'gantt',
        'pie', 'journey', 'gitGraph', 'mindmap', 'timeline',
        'quadrantChart', 'sankey-beta', 'xychart-beta',
    ]

    def validate(self, content: str) -> Tuple[bool, List[str]]:
        """Mermaid 다이어그램 검증.

        Args:
            content: Mermaid 코드 블록을 포함한 전체 텍스트

        Returns:
            (is_valid, errors) 튜플. is_valid=True이면 errors는 빈 리스트.
        """
        errors: List[str] = []
        mermaid_blocks = self._extract_mermaid_blocks(content)

        if not mermaid_blocks:
            return (True, [])  # Mermaid 블록이 없으면 검증 스킵

        for i, block in enumerate(mermaid_blocks, 1):
            block_errors = []
            block_errors.extend(self._check_diagram_type(block))
            block_errors.extend(self._check_bracket_pairs(block))
            block_errors.extend(self._check_special_chars(block))
            block_errors.extend(self._check_activate_deactivate(block))

            for err in block_errors:
                errors.append(f"[블록 {i}] {err}")

        return (len(errors) == 0, errors)

    def _extract_mermaid_blocks(self, content: str) -> List[str]:
        """```mermaid ... ``` 코드 블록 추출"""
        pattern = r'```mermaid\s*\n(.*?)```'
        return re.findall(pattern, content, re.DOTALL)

    def _check_diagram_type(self, block: str) -> List[str]:
        """다이어그램 타입 선언 확인"""
        first_line = block.strip().split('\n')[0].strip()
        has_type = any(first_line.startswith(dt) for dt in self.DIAGRAM_TYPES)
        if not has_type:
            return [f"다이어그램 타입 선언 누락. 첫 줄: '{first_line[:50]}'. "
                    f"graph/flowchart/sequenceDiagram 등으로 시작해야 합니다."]
        return []

    def _strip_comments(self, block: str) -> str:
        """Mermaid %% 주석 제거"""
        return re.sub(r'%%.*$', '', block, flags=re.MULTILINE)

    def _check_bracket_pairs(self, block: str) -> List[str]:
        """괄호 짝 확인 ({}, [], ())"""
        errors = []
        pairs = {'{': '}', '[': ']', '(': ')'}

        # 주석, 따옴표 안의 내용 제거
        cleaned = self._strip_comments(block)
        cleaned = re.sub(r'"[^"]*"', '', cleaned)
        cleaned = re.sub(r"'[^']*'", '', cleaned)

        for open_char, close_char in pairs.items():
            open_count = cleaned.count(open_char)
            close_count = cleaned.count(close_char)
            if open_count != close_count:
                errors.append(
                    f"'{open_char}{close_char}' 짝 불일치: "
                    f"열기 {open_count}개, 닫기 {close_count}개"
                )
        return errors

    def _check_special_chars(self, block: str) -> List[str]:
        """노드 텍스트 내 특수문자 따옴표 미사용 감지"""
        errors = []
        cleaned = self._strip_comments(block)

        # 노드 정의 패턴: 대괄호/중괄호/소괄호 안의 텍스트 (따옴표 없는 경우만)
        node_patterns = [
            r'\[([^\]"]+)\]',   # [text]
            r'\{([^}"]+)\}',    # {text}
            r'\(([^)"]+)\)',    # (text)
        ]
        # 2글자 특수문자를 먼저 검사하여 >=/<=를 >/<보다 우선 감지
        special_chars_multi = ['>=', '<=']
        special_chars_single = ['&', '?']

        for pattern in node_patterns:
            matches = re.finditer(pattern, cleaned)
            for match in matches:
                text = match.group(1)
                found = None
                # 2글자 특수문자 먼저
                for sc in special_chars_multi:
                    if sc in text:
                        found = sc
                        break
                # 단독 > < 는 >=/<= 이 없을 때만 검사
                if not found:
                    for sc in ('>', '<'):
                        if sc in text and '>=' not in text and '<=' not in text:
                            found = sc
                            break
                # 나머지 단일문자
                if not found:
                    for sc in special_chars_single:
                        if sc in text:
                            found = sc
                            break
                if found:
                    errors.append(
                        f"노드 텍스트에 특수문자 '{found}' 발견 (따옴표 필요): "
                        f"'{text[:60]}'"
                    )
        return errors

    def _check_activate_deactivate(self, block: str) -> List[str]:
        """Sequence Diagram activate/deactivate 쌍 확인 (명시적 + 인라인 +/- 문법)

        인라인 문법 의미:
        - A->>+B: msg -> B(타겟)를 activate
        - B-->>-A: msg -> B(소스)를 deactivate
        """
        if not block.strip().startswith('sequenceDiagram'):
            return []

        errors = []
        activate_counts: Dict[str, int] = {}
        deactivate_counts: Dict[str, int] = {}

        # 인라인 메시지 파싱: SOURCE ARROW MODIFIER TARGET: MESSAGE
        # ARROW: ->> / -->> / -x / --x / -> / -->
        # MODIFIER: + (activate target) / - (deactivate source) / 없음
        inline_msg_re = re.compile(
            r'^(\S+?)\s*'          # SOURCE
            r'(?:--?>>?|--?x)'     # ARROW (non-capturing)
            r'([+-]?)'             # MODIFIER
            r'(\S+?)'             # TARGET
            r'\s*:'                # colon
        )

        for line in block.split('\n'):
            line = line.strip()

            # 명시적 activate/deactivate
            activate_match = re.match(r'activate\s+(\S+)', line)
            deactivate_match = re.match(r'deactivate\s+(\S+)', line)

            if activate_match:
                p = activate_match.group(1)
                activate_counts[p] = activate_counts.get(p, 0) + 1
            elif deactivate_match:
                p = deactivate_match.group(1)
                deactivate_counts[p] = deactivate_counts.get(p, 0) + 1
            else:
                # 인라인 +/- 문법
                m = inline_msg_re.match(line)
                if m:
                    source, modifier, target = m.group(1), m.group(2), m.group(3)
                    if modifier == '+':
                        # + -> activate TARGET
                        activate_counts[target] = activate_counts.get(target, 0) + 1
                    elif modifier == '-':
                        # - -> deactivate SOURCE
                        deactivate_counts[source] = deactivate_counts.get(source, 0) + 1

        all_participants = set(activate_counts.keys()) | set(deactivate_counts.keys())
        for participant in all_participants:
            act = activate_counts.get(participant, 0)
            deact = deactivate_counts.get(participant, 0)
            if act != deact:
                errors.append(
                    f"Sequence Diagram '{participant}': "
                    f"activate {act}회, deactivate {deact}회 (불일치)"
                )

        return errors
