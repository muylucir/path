const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const { FaBrain, FaRocket, FaExclamationTriangle, FaCheckCircle, FaLightbulb, FaCogs } = require("react-icons/fa");

function renderIconSvg(IconComponent, color, size = 256) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
}

async function iconToBase64Png(IconComponent, color, size = 256) {
  const svg = renderIconSvg(IconComponent, color, size);
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + pngBuffer.toString("base64");
}

async function main() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9"; // 10" x 5.625"
  pres.author = "PATH";
  pres.title = "Effective Harnesses for Long-Running Agents";

  const slide = pres.addSlide();

  // === Colors ===
  const BG = "0F1419";
  const CARD_BG = "1A2332";
  const ACCENT_TEAL = "00D4AA";
  const ACCENT_BLUE = "4A9FE5";
  const ACCENT_ORANGE = "FF8C42";
  const ACCENT_RED = "FF6B6B";
  const TEXT_WHITE = "F0F4F8";
  const TEXT_LIGHT = "B8C5D6";
  const TEXT_MUTED = "7A8BA0";
  const TABLE_HEADER = "1E3A5F";
  const TABLE_ROW1 = "162030";
  const TABLE_ROW2 = "1A2738";
  const DIVIDER = "2A3A4F";

  // === Background ===
  slide.background = { color: BG };

  // === Top accent bar ===
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.06, fill: { color: ACCENT_TEAL }
  });

  // === Title area ===
  const iconBrain = await iconToBase64Png(FaBrain, "#00D4AA", 256);
  slide.addImage({ data: iconBrain, x: 0.45, y: 0.18, w: 0.32, h: 0.32 });

  slide.addText("Effective Harnesses for Long-Running Agents", {
    x: 0.85, y: 0.15, w: 7.5, h: 0.4,
    fontSize: 18, fontFace: "Arial", bold: true, color: TEXT_WHITE, margin: 0
  });

  slide.addText("Anthropic Engineering  |  AI Agent Continuity & Quality Patterns", {
    x: 0.85, y: 0.48, w: 7.5, h: 0.22,
    fontSize: 9, fontFace: "Arial", color: TEXT_MUTED, margin: 0
  });

  // === Thin divider under title ===
  slide.addShape(pres.shapes.LINE, {
    x: 0.45, y: 0.78, w: 9.1, h: 0, line: { color: DIVIDER, width: 0.5 }
  });

  // ================================================================
  // LEFT COLUMN (x: 0.45, w: 3.0)
  // ================================================================

  // --- Problem Section ---
  const iconWarning = await iconToBase64Png(FaExclamationTriangle, "#FF6B6B", 256);
  slide.addImage({ data: iconWarning, x: 0.45, y: 0.95, w: 0.22, h: 0.22 });
  slide.addText("PROBLEM", {
    x: 0.72, y: 0.95, w: 2, h: 0.24,
    fontSize: 10, fontFace: "Arial", bold: true, color: ACCENT_RED, margin: 0
  });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.45, y: 1.25, w: 3.0, h: 0.95,
    fill: { color: CARD_BG }, rectRadius: 0.05
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.45, y: 1.25, w: 0.06, h: 0.95, fill: { color: ACCENT_RED }
  });

  slide.addText([
    { text: "Context window 전환 시 에이전트의 기억 소실", options: { bold: true, color: TEXT_WHITE, fontSize: 9, breakLine: true } },
    { text: "", options: { fontSize: 4, breakLine: true } },
    { text: "- 상태 복구에 시간 낭비\n- 미완성 작업 방치\n- 프로젝트 조기 완료 선언", options: { color: TEXT_LIGHT, fontSize: 8 } }
  ], { x: 0.62, y: 1.3, w: 2.75, h: 0.85, valign: "top", margin: 0 });

  // --- Solution Section ---
  const iconRocket = await iconToBase64Png(FaRocket, "#00D4AA", 256);
  slide.addImage({ data: iconRocket, x: 0.45, y: 2.38, w: 0.22, h: 0.22 });
  slide.addText("2-STAGE SOLUTION", {
    x: 0.72, y: 2.38, w: 2.5, h: 0.24,
    fontSize: 10, fontFace: "Arial", bold: true, color: ACCENT_TEAL, margin: 0
  });

  // Initializer Agent card
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.45, y: 2.7, w: 3.0, h: 1.05,
    fill: { color: CARD_BG }, rectRadius: 0.05
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.45, y: 2.7, w: 0.06, h: 1.05, fill: { color: ACCENT_TEAL }
  });

  slide.addText([
    { text: "1  Initializer Agent ", options: { bold: true, color: ACCENT_TEAL, fontSize: 9, breakLine: true } },
    { text: "   (첫 세션 — 기반 구축)", options: { color: TEXT_MUTED, fontSize: 7.5, breakLine: true } },
    { text: "", options: { fontSize: 3, breakLine: true } },
    { text: "  init.sh  |  claude-progress.txt\n  Feature List (JSON)  |  초기 Git Commit", options: { color: TEXT_LIGHT, fontSize: 8 } }
  ], { x: 0.62, y: 2.72, w: 2.75, h: 1.0, valign: "top", margin: 0 });

  // Coding Agent card
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.45, y: 3.85, w: 3.0, h: 1.05,
    fill: { color: CARD_BG }, rectRadius: 0.05
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.45, y: 3.85, w: 0.06, h: 1.05, fill: { color: ACCENT_BLUE }
  });

  slide.addText([
    { text: "2  Coding Agent ", options: { bold: true, color: ACCENT_BLUE, fontSize: 9, breakLine: true } },
    { text: "   (반복 세션 — 점진적 구현)", options: { color: TEXT_MUTED, fontSize: 7.5, breakLine: true } },
    { text: "", options: { fontSize: 3, breakLine: true } },
    { text: "  Progress 읽기 → 미완성 기능 선택\n  → 구현 → E2E 테스트 → Git Commit", options: { color: TEXT_LIGHT, fontSize: 8 } }
  ], { x: 0.62, y: 3.87, w: 2.75, h: 1.0, valign: "top", margin: 0 });

  // ================================================================
  // MIDDLE COLUMN (x: 3.65, w: 3.2)
  // ================================================================

  // --- Failure Modes & Solutions ---
  const iconCogs = await iconToBase64Png(FaCogs, "#FF8C42", 256);
  slide.addImage({ data: iconCogs, x: 3.65, y: 0.95, w: 0.22, h: 0.22 });
  slide.addText("FAILURE MODES & SOLUTIONS", {
    x: 3.92, y: 0.95, w: 3.0, h: 0.24,
    fontSize: 10, fontFace: "Arial", bold: true, color: ACCENT_ORANGE, margin: 0
  });

  // Table
  const tableRows = [
    [
      { text: "Failure Mode", options: { fill: { color: TABLE_HEADER }, color: ACCENT_BLUE, bold: true, fontSize: 7.5, align: "center", fontFace: "Arial" } },
      { text: "Solution", options: { fill: { color: TABLE_HEADER }, color: ACCENT_TEAL, bold: true, fontSize: 7.5, align: "center", fontFace: "Arial" } }
    ],
    [
      { text: "프로젝트 조기 완료 선언", options: { fill: { color: TABLE_ROW1 }, color: TEXT_LIGHT, fontSize: 7.5, fontFace: "Arial" } },
      { text: "구조화된 Feature List (JSON)", options: { fill: { color: TABLE_ROW1 }, color: TEXT_WHITE, fontSize: 7.5, fontFace: "Arial" } }
    ],
    [
      { text: "버그 코드 + 문서 없음", options: { fill: { color: TABLE_ROW2 }, color: TEXT_LIGHT, fontSize: 7.5, fontFace: "Arial" } },
      { text: "Git commit + progress 파일", options: { fill: { color: TABLE_ROW2 }, color: TEXT_WHITE, fontSize: 7.5, fontFace: "Arial" } }
    ],
    [
      { text: "테스트 없이 완료 표시", options: { fill: { color: TABLE_ROW1 }, color: TEXT_LIGHT, fontSize: 7.5, fontFace: "Arial" } },
      { text: "E2E 브라우저 자동화 테스트", options: { fill: { color: TABLE_ROW1 }, color: TEXT_WHITE, fontSize: 7.5, fontFace: "Arial" } }
    ],
    [
      { text: "환경 셋업 시간 낭비", options: { fill: { color: TABLE_ROW2 }, color: TEXT_LIGHT, fontSize: 7.5, fontFace: "Arial" } },
      { text: "사전 작성 init.sh 스크립트", options: { fill: { color: TABLE_ROW2 }, color: TEXT_WHITE, fontSize: 7.5, fontFace: "Arial" } }
    ]
  ];

  slide.addTable(tableRows, {
    x: 3.65, y: 1.28, w: 3.2,
    colW: [1.5, 1.7],
    border: { pt: 0.5, color: DIVIDER },
    margin: [3, 5, 3, 5]
  });

  // --- Session Startup Routine ---
  const iconCheck = await iconToBase64Png(FaCheckCircle, "#4A9FE5", 256);
  slide.addImage({ data: iconCheck, x: 3.65, y: 2.72, w: 0.22, h: 0.22 });
  slide.addText("SESSION STARTUP ROUTINE", {
    x: 3.92, y: 2.72, w: 3.0, h: 0.24,
    fontSize: 10, fontFace: "Arial", bold: true, color: ACCENT_BLUE, margin: 0
  });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 3.65, y: 3.02, w: 3.2, h: 1.88,
    fill: { color: CARD_BG }, rectRadius: 0.05
  });

  const steps = [
    { num: "1", text: "pwd 로 작업 디렉토리 확인" },
    { num: "2", text: "Git log + progress 파일 읽기" },
    { num: "3", text: "우선순위 높은 미완성 기능 선택" },
    { num: "4", text: "개발 서버 시작 + Smoke Test" },
    { num: "5", text: "새 기능 작업 착수" },
  ];

  steps.forEach((step, i) => {
    const yPos = 3.1 + i * 0.34;
    // Number circle
    slide.addShape(pres.shapes.OVAL, {
      x: 3.82, y: yPos, w: 0.22, h: 0.22,
      fill: { color: ACCENT_BLUE }
    });
    slide.addText(step.num, {
      x: 3.82, y: yPos, w: 0.22, h: 0.22,
      fontSize: 7, fontFace: "Arial", bold: true, color: BG, align: "center", valign: "middle", margin: 0
    });
    // Step text
    slide.addText(step.text, {
      x: 4.12, y: yPos, w: 2.6, h: 0.22,
      fontSize: 8, fontFace: "Arial", color: TEXT_LIGHT, valign: "middle", margin: 0
    });
  });

  // ================================================================
  // RIGHT COLUMN (x: 7.05, w: 2.55)
  // ================================================================

  // --- Best Practices ---
  const iconLight = await iconToBase64Png(FaLightbulb, "#FFD93D", 256);
  slide.addImage({ data: iconLight, x: 7.05, y: 0.95, w: 0.22, h: 0.22 });
  slide.addText("BEST PRACTICES", {
    x: 7.32, y: 0.95, w: 2.2, h: 0.24,
    fontSize: 10, fontFace: "Arial", bold: true, color: "FFD93D", margin: 0
  });

  const practices = [
    { label: "Feature List는 JSON", desc: "Markdown보다 임의 수정에 강함" },
    { label: "세션당 1기능 구현", desc: "컨텍스트 소진 예방" },
    { label: "브라우저 자동화 테스트", desc: "Puppeteer MCP 활용" },
    { label: "강한 어조의 프롬프트", desc: "Feature List 삭제/수정 방지" },
  ];

  practices.forEach((p, i) => {
    const yPos = 1.28 + i * 0.58;
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 7.05, y: yPos, w: 2.5, h: 0.5,
      fill: { color: CARD_BG }, rectRadius: 0.05
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 7.05, y: yPos, w: 0.05, h: 0.5, fill: { color: "FFD93D" }
    });
    slide.addText([
      { text: p.label, options: { bold: true, color: TEXT_WHITE, fontSize: 8, breakLine: true } },
      { text: p.desc, options: { color: TEXT_MUTED, fontSize: 7 } }
    ], { x: 7.2, y: yPos + 0.04, w: 2.3, h: 0.44, valign: "top", margin: 0 });
  });

  // --- Key Insights ---
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 7.05, y: 3.7, w: 2.5, h: 1.2,
    fill: { color: "0D2137" }, rectRadius: 0.05,
    line: { color: ACCENT_TEAL, width: 1 }
  });

  slide.addText("KEY INSIGHTS", {
    x: 7.2, y: 3.78, w: 2.2, h: 0.22,
    fontSize: 9, fontFace: "Arial", bold: true, color: ACCENT_TEAL, margin: 0
  });

  const insights = [
    "기억은 코드에 남겨라",
    "작게 나눠서 진행하라",
    "구조로 통제하라",
    "테스트가 진실의 원천",
  ];

  insights.forEach((ins, i) => {
    const yPos = 4.05 + i * 0.2;
    slide.addText("  " + ins, {
      x: 7.2, y: yPos, w: 2.2, h: 0.18,
      fontSize: 7.5, fontFace: "Arial", color: TEXT_WHITE, margin: 0,
      bullet: { code: "25B8", color: ACCENT_TEAL }
    });
  });

  // === Bottom bar ===
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 5.15, w: 10, h: 0.475,
    fill: { color: "0A0E14" }
  });
  slide.addText("Source: anthropic.com/engineering/effective-harnesses-for-long-running-agents", {
    x: 0.45, y: 5.2, w: 6, h: 0.35,
    fontSize: 7, fontFace: "Arial", color: TEXT_MUTED, valign: "middle", margin: 0
  });

  // Save
  await pres.writeFile({ fileName: "/home/ec2-user/project/path/docs/effective-harnesses-summary.pptx" });
  console.log("PPTX created successfully");
}

main().catch(console.error);
