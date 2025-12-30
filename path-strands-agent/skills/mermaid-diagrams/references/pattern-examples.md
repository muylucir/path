# Strands Agent 패턴별 다이어그램

## 1. Sequential Pipeline (순차 파이프라인)

```mermaid
graph LR
    A[Research Agent] --> B[Analysis Agent]
    B --> C[Review Agent]
    C --> D[Report Agent]
```

## 2. Parallel Processing (병렬 처리)

```mermaid
graph TD
    A[Coordinator] --> B[Worker 1]
    A --> C[Worker 2]
    A --> D[Worker 3]
    B --> E[Aggregator]
    C --> E
    D --> E
```

## 3. Conditional Branching (조건부 분기)

```mermaid
graph TD
    A[Classifier] --> B{Classification}
    B -->|Technical| C[Tech Specialist]
    B -->|Business| D[Business Specialist]
    C --> E[Tech Report]
    D --> F[Business Report]
```

## 4. Reflection Pattern (피드백 루프)

```mermaid
graph TD
    A[Draft Writer] --> B[Reviewer]
    B --> C{Quality Check}
    C -->|Needs Revision| A
    C -->|Approved| D[Publisher]
```

## 5. Multi-Agent with Tools (도구 통합)

```mermaid
graph TD
    A[Orchestrator] --> B[Data Collector]
    B --> C[GitHub API]
    B --> D[LinkedIn API]
    B --> E[Resume Parser]
    C --> F[Analyzer]
    D --> F
    E --> F
    F --> G[Report Generator]
```

## 실전 예제: 이메일 자동화 Agent

```mermaid
graph TD
    Start([Email Trigger]) --> Classify[Classifier Agent]
    Classify --> Urgent{Urgent?}
    Urgent -->|Yes| Priority[Priority Handler]
    Urgent -->|No| Normal[Normal Handler]
    Priority --> Template[Template Retriever]
    Normal --> Template
    Template --> Generate[Response Generator]
    Generate --> Review[Quality Reviewer]
    Review --> Check{Quality > 70?}
    Check -->|No| Generate
    Check -->|Yes| Send[Send Email]
    Send --> End([Complete])

    style Start fill:#E3F2FD
    style End fill:#E8F5E9
    style Urgent fill:#FFF3E0
    style Check fill:#FFF3E0
```

## 실전 예제: AgentCore 통합

```mermaid
graph TD
    User([User Input]) --> Runtime[AgentCore Runtime]
    Runtime --> Memory[(AgentCore Memory)]
    Runtime --> Agent[Strands Agent]

    Agent --> Gateway[AgentCore Gateway]
    Gateway --> Tool1[Calculator]
    Gateway --> Tool2[Weather API]
    Gateway --> Tool3[Database]

    Agent --> Browser[AgentCore Browser]
    Agent --> CodeInt[Code Interpreter]

    Memory --> Agent
    Tool1 --> Agent
    Tool2 --> Agent
    Tool3 --> Agent
    Browser --> Agent
    CodeInt --> Agent

    Agent --> Response([Response])

    style Runtime fill:#E3F2FD,stroke:#1976D2,stroke-width:3px
    style Memory fill:#FFF3E0,stroke:#F57C00,stroke-width:2px
    style Gateway fill:#FFF3E0,stroke:#F57C00,stroke-width:2px
```
