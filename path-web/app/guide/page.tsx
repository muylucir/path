"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Noto_Serif_KR } from "next/font/google";
import Link from "next/link";
import styles from "./guide.module.css";

const notoSerifKR = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap",
});

const TOC_ITEMS: { id: string; label: string; sub?: boolean }[] = [
  { id: "about", label: "P.A.T.H란?" },
  { id: "step1", label: "Step 1: 문제 구조화" },
  { id: "step2", label: "Step 2: 준비도 점검" },
  { id: "step2-items", label: "점검 항목", sub: true },
  { id: "step2-score", label: "종합 판정", sub: true },
  { id: "step2-retry", label: "재평가", sub: true },
  { id: "step3", label: "Step 3: 구현 방식 결정" },
  { id: "step4", label: "Step 4: 명세서 생성" },
  { id: "scenarios", label: "활용 시나리오" },
  { id: "results", label: "결과물 요약" },
  { id: "value", label: "핵심 가치" },
];

export default function GuidePage() {
  const [activeId, setActiveId] = useState("about");
  const mainRef = useRef<HTMLElement>(null);

  const handleScroll = useCallback(() => {
    let current = TOC_ITEMS[0].id;
    for (const item of TOC_ITEMS) {
      const el = document.getElementById(item.id);
      if (el && el.getBoundingClientRect().top <= 100) {
        current = item.id;
      }
    }
    setActiveId(current);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        {/* Sidebar TOC */}
        <aside className={styles.sidebar}>
          <div className={styles.tocTitle}>Contents</div>
          {TOC_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`${styles.tocLink} ${
                item.sub ? styles.tocLinkSub : ""
              } ${activeId === item.id ? styles.tocLinkActive : ""}`}
            >
              {item.label}
            </a>
          ))}
        </aside>

        {/* Main Content */}
        <main className={styles.main} ref={mainRef}>
          {/* Page Header */}
          <header className={styles.pageHeader}>
            <div className={styles.category}>Product Guide</div>
            <h1 className={`${styles.pageTitle} ${notoSerifKR.className}`}>
              P.A.T.H Agent Designer
            </h1>
            <p className={styles.lead}>
              AI Agent 아이디어를 검증하고, 개발팀이 바로 착수할 수 있는 구현 명세서를 자동 생성하는 도구
            </p>
            <div className={styles.headerDivider} />
          </header>

          {/* About */}
          <section className={styles.section} id="about">
            <h2 className={notoSerifKR.className}>P.A.T.H란?</h2>
            <p>
              <strong>P.A.T.H</strong> = <strong>P</strong>roblem &rarr;{" "}
              <strong>T</strong>echnical &rarr; <strong>A</strong>gent Pattern &rarr;{" "}
              <strong>H</strong>andoff
            </p>
            <p>
              AI Agent를 도입하려면 &ldquo;좋은 아이디어&rdquo;만으로는 부족합니다. 그 아이디어가 실현 가능한지,
              지금 바로 시작할 수 있는 상태인지, 어떤 구조로 만들어야 하는지를 먼저 확인해야 합니다. P.A.T.H는
              이 과정을 4단계로 안내합니다.
            </p>

            <div className={styles.flowBox}>
              <div className={styles.fl}>여러분의 아이디어</div>
              <div className={styles.fa}>&darr;</div>
              <div className={styles.fs}>
                <b>Step 1: Problem</b> &mdash; 문제를 구조화합니다
              </div>
              <div className={styles.fa}>&darr;</div>
              <div className={styles.fs}>
                <b>Step 2: Technical</b> &mdash; 준비 상태를 점검합니다
              </div>
              <div className={styles.fa}>&darr;</div>
              <div className={styles.fs}>
                <b>Step 3: Agent Pattern</b> &mdash; 구현 방식을 결정합니다
              </div>
              <div className={styles.fa}>&darr;</div>
              <div className={styles.fs}>
                <b>Step 4: Handoff</b> &mdash; 구현 명세서를 생성합니다
              </div>
              <div className={styles.fa}>&darr;</div>
              <div className={styles.fl}>개발팀에 전달할 수 있는 문서</div>
            </div>
          </section>

          <hr className={styles.hr} />

          {/* Step 1 */}
          <section className={styles.section} id="step1">
            <h2 className={notoSerifKR.className}>Step 1: Problem &mdash; 문제 구조화</h2>
            <p>
              &ldquo;이 업무를 자동화하고 싶다&rdquo;는 요구사항을, 기획팀과 개발팀이 같은 그림을 볼 수 있도록
              정리합니다.
            </p>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th>질문</th>
                  <th>예시</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>언제 시작되는 작업인가요?</td><td>고객 요청 시, 매일 오전 9시, 특정 조건 충족 시</td></tr>
                <tr><td>어떤 처리가 필요한가요?</td><td>데이터 수집, 분석/분류, 판단, 문서 생성, 검증, 실행</td></tr>
                <tr><td>최종 결과물은 무엇인가요?</td><td>의사결정, 보고서, 알림, 시스템 실행, 인사이트</td></tr>
                <tr><td>사람이 확인해야 하는 부분은?</td><td>없음, 최종 검토, 예외 상황만, 함께 협업</td></tr>
              </tbody>
            </table>
            <p>추가로 허용 가능한 오류 수준, 참고할 데이터 소스, 업무 맥락도 입력할 수 있습니다.</p>
            <div className={styles.takeaway}>
              <strong>이 단계를 거치면:</strong> 막연했던 요구사항이 구체적인 문제 정의로 바뀝니다. 기획팀이
              &ldquo;이걸 자동화하고 싶어요&rdquo;라고 말한 것을, 개발팀이 이해할 수 있는 형태로 변환합니다.
            </div>
          </section>

          <hr className={styles.hr} />

          {/* Step 2 */}
          <section className={styles.section} id="step2">
            <h2 className={notoSerifKR.className}>Step 2: Technical &mdash; 준비도 점검</h2>
            <p>
              아이디어가 좋아도, 데이터가 없거나 시스템 연동이 어려우면 프로젝트가 중간에 멈춥니다. AI가 5가지
              핵심 항목을 점검합니다.
            </p>

            <h3 id="step2-items">점검 항목</h3>
            <table className={styles.tableWide}>
              <thead>
                <tr>
                  <th>항목</th>
                  <th>준비됨 (8-10점)</th>
                  <th>보통 (4-7점)</th>
                  <th>부족 (0-3점)</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>데이터 접근성</td><td>API로 바로 가져올 수 있음</td><td>DB 직접 접근 필요</td><td>수기 데이터만 존재</td></tr>
                <tr><td>판단 명확성</td><td>명확한 규칙이 정리되어 있음</td><td>경험적으로는 알지만 문서화 안 됨</td><td>담당자의 감에 의존</td></tr>
                <tr><td>오류 허용도</td><td>틀려도 업무에 큰 지장 없음</td><td>90% 이상 정확해야 함</td><td>반드시 100% 정확해야 함</td></tr>
                <tr><td>응답 시간</td><td>몇 시간 걸려도 괜찮음</td><td>1분 이내 응답 필요</td><td>3초 이내 실시간 필요</td></tr>
                <tr><td>시스템 연동</td><td>독립적으로 실행 가능</td><td>3~5개 시스템과 연결 필요</td><td>레거시 시스템에 의존</td></tr>
              </tbody>
            </table>

            <h3 id="step2-score">종합 판정 (총 50점)</h3>
            <div className={styles.scoreGrid}>
              <div className={`${styles.scoreCard} ${styles.green}`}>
                <div className={styles.scRange}>40 &ndash; 50</div>
                <div className={styles.scLabel}>즉시 시작 가능</div>
                <div className={styles.scDesc}>프로토타입 개발을 바로 시작할 수 있습니다</div>
              </div>
              <div className={`${styles.scoreCard} ${styles.yellow}`}>
                <div className={styles.scRange}>30 &ndash; 40</div>
                <div className={styles.scLabel}>조건부 진행</div>
                <div className={styles.scDesc}>시작할 수 있지만 리스크 관리가 필요합니다</div>
              </div>
              <div className={`${styles.scoreCard} ${styles.orange}`}>
                <div className={styles.scRange}>20 &ndash; 30</div>
                <div className={styles.scLabel}>보완 후 재평가</div>
                <div className={styles.scDesc}>낮은 항목을 보완한 뒤 다시 점검하세요</div>
              </div>
              <div className={`${styles.scoreCard} ${styles.red}`}>
                <div className={styles.scRange}>0 &ndash; 20</div>
                <div className={styles.scLabel}>재검토 필요</div>
                <div className={styles.scDesc}>현재 상태로는 어렵습니다. 다른 접근을 고려하세요</div>
              </div>
            </div>

            <h3 id="step2-retry">재평가</h3>
            <p>점수가 낮은 항목에 개선 계획을 입력하면, 그 계획이 반영된 점수를 다시 받을 수 있습니다.</p>
            <div className={styles.exampleBox}>
              <b>예시)</b>
              <br />
              데이터 접근성 4점
              <br />
              &rarr; 개선 계획: &ldquo;ERP 시스템에 조회 API를 개발할 예정&rdquo;
              <br />
              &rarr; 재평가: 7점으로 상향
            </div>
            <div className={styles.takeaway}>
              <strong>이 단계를 거치면:</strong> 개발 2주차에 발견할 문제(&ldquo;이 데이터는 접근이 안
              됩니다&rdquo;, &ldquo;이건 사람이 꼭 봐야 합니다&rdquo;)를 프로젝트 시작 전에 파악할 수 있습니다.
            </div>
          </section>

          <hr className={styles.hr} />

          {/* Step 3 */}
          <section className={styles.section} id="step3">
            <h2 className={notoSerifKR.className}>
              Step 3: Agent Pattern &mdash; 구현 방식 결정
            </h2>
            <p>준비도 결과를 바탕으로, AI가 적합한 Agent 구조를 추천합니다.</p>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th>구조</th>
                  <th>적합한 경우</th>
                  <th>예시</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>단계적 추론형</td><td>정보를 모아서 판단해야 하는 업무</td><td>고객 문의 분석 &rarr; 답변 생성</td></tr>
                <tr><td>자가 검토형</td><td>결과물의 품질이 중요한 업무</td><td>보고서 작성 후 스스로 검토/수정</td></tr>
                <tr><td>도구 활용형</td><td>외부 시스템을 조회하거나 실행해야 하는 업무</td><td>DB 조회, API 호출, 파일 처리</td></tr>
                <tr><td>계획 수립형</td><td>여러 단계를 순서대로 처리해야 하는 업무</td><td>다단계 승인 프로세스</td></tr>
                <tr><td>다중 Agent 협업형</td><td>역할을 나눠야 할 만큼 복잡한 업무</td><td>분석 + 작성 + 검수를 각각 담당</td></tr>
                <tr><td>사람 검토 포함형</td><td>최종 판단에 사람이 필요한 업무</td><td>법무/재무 검토가 포함된 프로세스</td></tr>
              </tbody>
            </table>

            <p>추천 후에는 AI와 대화하며 결정을 다듬을 수 있습니다.</p>
            <ul className={styles.bullet}>
              <li>&ldquo;우리 업무는 실시간 처리가 중요한데, 이 방식이 맞나요?&rdquo;</li>
              <li>&ldquo;Agent를 여러 개 쓰는 게 왜 필요한 건가요?&rdquo;</li>
              <li>&ldquo;더 단순한 방식으로는 안 되나요?&rdquo;</li>
            </ul>
            <div className={styles.takeaway}>
              <strong>이 단계를 거치면:</strong> &ldquo;어떤 방식으로 만들 것인가&rdquo;에 대한 기술적 결정이
              내려지고, 그 이유도 함께 정리됩니다.
            </div>
          </section>

          <hr className={styles.hr} />

          {/* Step 4 */}
          <section className={styles.section} id="step4">
            <h2 className={notoSerifKR.className}>
              Step 4: Handoff &mdash; 구현 명세서 생성
            </h2>
            <p>4개의 전문 AI가 순차적으로 명세서를 작성합니다.</p>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th>순서</th>
                  <th>작성 내용</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>1단계</td><td>Agent 구조 설계 &mdash; 역할 분담, 처리 흐름, 상태 관리</td></tr>
                <tr><td>2단계</td><td>아키텍처 다이어그램 &mdash; 시각적 처리 흐름도</td></tr>
                <tr><td>3단계</td><td>구현 세부사항 &mdash; 프롬프트 설계, 도구 정의, 입출력 스펙</td></tr>
                <tr><td>4단계</td><td>최종 문서 통합 &mdash; 하나의 명세서로 조합</td></tr>
              </tbody>
            </table>

            <h4>명세서에 포함되는 내용</h4>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>섹션</th>
                  <th>설명</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>요약</td><td>프로젝트 개요, 핵심 결정 사항</td></tr>
                <tr><td>Agent 설계</td><td>선택된 구조와 선택 이유</td></tr>
                <tr><td>역할 정의</td><td>Agent별 담당 업무와 책임 범위</td></tr>
                <tr><td>처리 흐름</td><td>입력부터 출력까지의 단계별 흐름</td></tr>
                <tr><td>아키텍처 다이어그램</td><td>시각적 구조도</td></tr>
                <tr><td>구현 가이드</td><td>개발팀이 참고할 기술 세부사항</td></tr>
              </tbody>
            </table>
            <div className={styles.takeaway}>
              <strong>이 단계를 거치면:</strong> 기획서에 첨부하거나, 개발팀에 바로 전달하거나, 외부 개발사에
              요구사항으로 보낼 수 있는 문서가 만들어집니다.
            </div>
          </section>

          <hr className={styles.hr} />

          {/* Scenarios */}
          <section className={styles.section} id="scenarios">
            <h2 className={notoSerifKR.className}>활용 시나리오</h2>

            <h3>기획팀과 개발팀의 킥오프</h3>
            <p>
              <strong>상황:</strong> 기획팀이 &ldquo;고객 문의 자동 분류&rdquo;를 요청, 개발팀은 구체적인
              요구사항을 모름
            </p>
            <div className={styles.compare}>
              <div className={styles.colHeadWithout}>P.A.T.H 없이</div>
              <div className={styles.colHeadWith}>P.A.T.H 활용</div>
              <div className={styles.colRowWithout}><div className={styles.rowLabel}>시작</div>&ldquo;자동 분류해주세요&rdquo; (막연)</div>
              <div className={styles.colRowWith}><div className={styles.rowLabel}>시작</div>P.A.T.H로 문제 구조화</div>
              <div className={styles.colRowWithout}><div className={styles.rowLabel}>중간</div>개발 2주차에 &ldquo;분류 기준이 뭐죠?&rdquo;</div>
              <div className={styles.colRowWith}><div className={styles.rowLabel}>중간</div>킥오프에서 판단 명확성 5점 확인, 기준 정리 먼저 진행</div>
              <div className={styles.colRowWithout}><div className={styles.rowLabel}>결과</div>재작업, 일정 지연</div>
              <div className={styles.colRowWith}><div className={styles.rowLabel}>결과</div>준비된 상태에서 개발 시작</div>
            </div>

            <h3>자동화 후보 우선순위 결정</h3>
            <p>
              <strong>상황:</strong> 3개 업무 중 어떤 것을 먼저 자동화할지 결정해야 함
            </p>
            <div className={styles.compare}>
              <div className={styles.colHeadWithout}>P.A.T.H 없이</div>
              <div className={styles.colHeadWith}>P.A.T.H 활용</div>
              <div className={styles.colRowWithout}><div className={styles.rowLabel}>기준</div>&ldquo;이게 효과가 클 것 같다&rdquo; (감)</div>
              <div className={styles.colRowWith}><div className={styles.rowLabel}>기준</div>준비도 42점 / 28점 / 38점 (데이터)</div>
              <div className={styles.colRowWithout}><div className={styles.rowLabel}>발견</div>시작 후 &ldquo;데이터 접근이 안 된다&rdquo;</div>
              <div className={styles.colRowWith}><div className={styles.rowLabel}>발견</div>사전에 28점짜리의 병목 파악</div>
              <div className={styles.colRowWithout}><div className={styles.rowLabel}>결과</div>가장 어려운 것부터 시작해서 좌초</div>
              <div className={styles.colRowWith}><div className={styles.rowLabel}>결과</div>실현 가능성 높은 것부터 성과 축적</div>
            </div>

            <h3>경영진 PoC 제안</h3>
            <p>
              <strong>상황:</strong> AI Agent PoC 기획서를 경영진에게 보고해야 함
            </p>
            <div className={styles.compare}>
              <div className={styles.colHeadWithout}>P.A.T.H 없이</div>
              <div className={styles.colHeadWith}>P.A.T.H 활용</div>
              <div className={styles.colRowWithout}><div className={styles.rowLabel}>내용</div>&ldquo;AI가 자동으로 처리합니다&rdquo;</div>
              <div className={styles.colRowWith}><div className={styles.rowLabel}>내용</div>아키텍처 다이어그램 + 역할 정의 + 처리 흐름 첨부</div>
              <div className={styles.colRowWithout}><div className={styles.rowLabel}>반응</div>&ldquo;구체적으로 어떻게?&rdquo;</div>
              <div className={styles.colRowWith}><div className={styles.rowLabel}>반응</div>&ldquo;이 팀은 뭘 만들려는지 알고 있구나&rdquo;</div>
              <div className={styles.colRowWithout}><div className={styles.rowLabel}>결과</div>추가 질문 반복, 승인 지연</div>
              <div className={styles.colRowWith}><div className={styles.rowLabel}>결과</div>한 번에 승인</div>
            </div>

            <h3>외주 개발사에 요구사항 전달</h3>
            <p>
              <strong>상황:</strong> AI Agent 개발을 외부에 맡기려는데 요구사항 정의가 어려움
            </p>
            <div className={styles.compare}>
              <div className={styles.colHeadWithout}>P.A.T.H 없이</div>
              <div className={styles.colHeadWith}>P.A.T.H 활용</div>
              <div className={styles.colRowWithout}><div className={styles.rowLabel}>전달</div>&ldquo;AI로 문서 분석하는 것 만들어주세요&rdquo;</div>
              <div className={styles.colRowWith}><div className={styles.rowLabel}>전달</div>구현 명세서 전달 (구조, 입출력, 흐름)</div>
              <div className={styles.colRowWithout}><div className={styles.rowLabel}>소통</div>&ldquo;이건 아닌데요&rdquo; 반복</div>
              <div className={styles.colRowWith}><div className={styles.rowLabel}>소통</div>명세서 기준으로 논의</div>
              <div className={styles.colRowWithout}><div className={styles.rowLabel}>결과</div>기대와 다른 결과물</div>
              <div className={styles.colRowWith}><div className={styles.rowLabel}>결과</div>요구사항에 부합하는 결과물</div>
            </div>
          </section>

          <hr className={styles.hr} />

          {/* Results */}
          <section className={styles.section} id="results">
            <h2 className={notoSerifKR.className}>결과물 요약</h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>결과물</th>
                  <th>누가, 어디에 쓰는가</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>준비도 점수 (50점 만점)</td><td>프로젝트 매니저 &mdash; Go/No-Go 판단 근거</td></tr>
                <tr><td>항목별 진단 + 개선 방향</td><td>기획팀 &mdash; 사전 준비 항목 도출</td></tr>
                <tr><td>리스크 목록</td><td>프로젝트 전체 &mdash; 착수 전 위험 공유</td></tr>
                <tr><td>Agent 구조 추천 + 근거</td><td>개발팀 &mdash; 아키텍처 설계 출발점</td></tr>
                <tr><td>구현 명세서 (다이어그램 포함)</td><td>개발팀/외주사 &mdash; 개발 착수 문서, PoC 기획서 첨부</td></tr>
              </tbody>
            </table>
          </section>

          <hr className={styles.hr} />

          {/* Value */}
          <section className={styles.section} id="value">
            <h2 className={notoSerifKR.className}>P.A.T.H의 핵심 가치</h2>
            <div className={styles.closingBlock}>
              <div className={`${styles.cbLine} ${notoSerifKR.className}`}>
                만들기 전에, 만들 수 있는지 확인한다.
              </div>
              <div className={`${styles.cbLine} ${notoSerifKR.className}`}>
                만들 수 있다면, 어떻게 만들어야 하는지 정리한다.
              </div>
              <div className={`${styles.cbLine} ${notoSerifKR.className}`}>
                정리가 끝나면, 바로 시작할 수 있는 문서를 만든다.
              </div>
              <ul className={styles.cbBullets}>
                <li>
                  개발 착수 후 발견할 문제를 <strong>사전에</strong> 발견합니다
                </li>
                <li>
                  기획자와 개발팀이 <strong>같은 언어</strong>로 대화할 수 있게 합니다
                </li>
                <li>
                  아이디어에서 구현 계획까지의 <strong>간극을 메웁니다</strong>
                </li>
              </ul>
            </div>
          </section>

          {/* Link to intro */}
          <p style={{ marginTop: "2rem", textAlign: "center" }}>
            <Link href="/intro" className={styles.navLink}>
              &larr; P.A.T.H 소개 보기
            </Link>
          </p>
        </main>
      </div>

      <footer className={styles.footer}>P.A.T.H Agent Designer</footer>
    </div>
  );
}
