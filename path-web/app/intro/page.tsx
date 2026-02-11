import { Noto_Serif_KR } from "next/font/google";
import Link from "next/link";
import type { Metadata } from "next";
import styles from "./intro.module.css";

const notoSerifKR = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "소개 | P.A.T.H Agent Designer",
  description:
    "AI Agent, 좋은 건 알겠는데 우리 업무에 되는 건가요? P.A.T.H Agent Designer 소개",
};

export default function IntroPage() {
  return (
    <div className={styles.page}>
      {/* Hero */}
      <header className={styles.hero}>
        <div className={styles.category}>P.A.T.H Agent Designer</div>
        <h1 className={`${styles.heroTitle} ${notoSerifKR.className}`}>
          AI Agent, 좋은 건 알겠는데<br />우리 업무에 되는 건가요?
        </h1>
        <p className={styles.subtitle}>
          어떤 업무에 적용할지, 지금 우리 데이터와 시스템으로 가능한 건지, 어떤 구조로 만들어야 하는지.
          개발에 들어가기 전에 확인해야 할 것들을 점검하고, 바로 시작할 수 있는 문서를 만듭니다.
        </p>
        <div className={styles.divider} />
      </header>

      {/* Article */}
      <article className={styles.article}>
        {/* Section 1 */}
        <h2 className={notoSerifKR.className}>흔한 시작</h2>
        <p>&ldquo;우리도 AI Agent 도입해보고 싶은데요.&rdquo;</p>
        <p>여기까지는 좋습니다. 문제는 그 다음입니다.</p>
        <p>
          어떤 업무에 적용할지, 지금 우리 데이터와 시스템으로 가능한 건지, Agent를 어떤 구조로 만들어야 하는지 —
          물어볼 데가 마땅치 않습니다. 그렇다고 일단 개발부터 시작하자니, 몇 주 지나서야 &ldquo;이 데이터는 접근이
          안 된다&rdquo;, &ldquo;이 판단은 사람이 꼭 봐야 한다&rdquo;는 걸 알게 되는 경우가 너무 많습니다.
        </p>
        <p>P.A.T.H Agent Designer는 그 간극을 메우기 위해 만들어졌습니다.</p>

        <hr className={styles.hr} />

        {/* Section 2 */}
        <h2 className={notoSerifKR.className}>P.A.T.H가 하는 일</h2>
        <p>
          P.A.T.H는 <strong>Problem &rarr; Technical &rarr; Agent Pattern &rarr; Handoff</strong> 4단계를 따릅니다.
        </p>
        <p>
          여러분이 가진 AI Agent 아이디어를 입력하면, AI가 그 아이디어의 <strong>실현 가능성을 점검</strong>하고,{" "}
          <strong>어떤 구조로 만들어야 하는지 분석</strong>한 뒤,{" "}
          <strong>개발팀이 바로 착수할 수 있는 구현 명세서</strong>까지 생성합니다.
        </p>

        <div className={styles.flowDiagram}>
          <div className={styles.flowStart}>여러분의 아이디어</div>
          <div className={styles.flowArrow}>&darr;</div>
          <div className={styles.flowStep}>
            <span className={styles.stepLabel}>Step 1: 문제 구조화</span> — &ldquo;무엇을, 어떻게 자동화할 것인가&rdquo;를 정리합니다
          </div>
          <div className={styles.flowArrow}>&darr;</div>
          <div className={styles.flowStep}>
            <span className={styles.stepLabel}>Step 2: 준비도 점검</span> — &ldquo;지금 바로 시작할 수 있는 상태인가&rdquo;를 확인합니다
          </div>
          <div className={styles.flowArrow}>&darr;</div>
          <div className={styles.flowStep}>
            <span className={styles.stepLabel}>Step 3: 패턴 분석</span> — &ldquo;어떤 방식으로 만들어야 하는가&rdquo;를 결정합니다
          </div>
          <div className={styles.flowArrow}>&darr;</div>
          <div className={styles.flowStep}>
            <span className={styles.stepLabel}>Step 4: 명세서 생성</span> — &ldquo;개발팀에 전달할 구현 계획서&rdquo;를 만듭니다
          </div>
          <div className={styles.flowArrow}>&darr;</div>
          <div className={styles.flowEnd}>개발 착수 가능한 문서</div>
        </div>

        <hr className={styles.hr} />

        {/* Section 3 */}
        <h2 className={notoSerifKR.className}>각 단계에서 일어나는 일</h2>

        <h3>Step 1. 문제를 정리합니다</h3>
        <p>
          &ldquo;견적서 작성을 자동화하고 싶다&rdquo;는 요구사항을 그대로 개발팀에 던지면, 서로 다른 그림을 그리게
          됩니다. P.A.T.H는 이 요구사항을 몇 가지 질문으로 분해합니다.
        </p>
        <ul className={styles.bulletList}>
          <li>이 작업은 언제 시작되나요? (고객 요청이 들어올 때? 매일 정해진 시간에?)</li>
          <li>어떤 처리가 필요한가요? (데이터를 모아야 하나요? 분석? 판단? 문서 생성?)</li>
          <li>최종 결과물은 무엇인가요? (보고서? 알림? 실행?)</li>
          <li>중간에 사람이 확인해야 하는 부분이 있나요?</li>
        </ul>
        <p>
          이 과정을 거치면, 기획자와 개발팀이 <strong>같은 그림</strong>을 보고 이야기할 수 있게 됩니다.
        </p>

        <h3>Step 2. 지금 시작할 수 있는 상태인지 점검합니다</h3>
        <p>아이디어가 좋아도 준비가 안 되면 프로젝트가 중간에 멈춥니다. AI가 5가지 항목을 점검합니다.</p>

        <table className={styles.checkTable}>
          <thead>
            <tr>
              <th>점검 항목</th>
              <th>확인하는 것</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>데이터 접근성</td><td>필요한 데이터를 시스템에서 가져올 수 있는가?</td></tr>
            <tr><td>판단 명확성</td><td>&ldquo;이럴 때는 이렇게 한다&rdquo;는 기준이 정리되어 있는가?</td></tr>
            <tr><td>오류 허용도</td><td>AI가 실수했을 때 업무에 미치는 영향은?</td></tr>
            <tr><td>응답 시간</td><td>결과가 나오기까지 기다릴 수 있는 시간은?</td></tr>
            <tr><td>시스템 연동</td><td>기존 시스템과 연결하는 데 어려움은 없는가?</td></tr>
          </tbody>
        </table>

        <p>
          각 항목을 10점 만점으로 평가하여, 총 50점 기준으로 판정합니다. 40점 이상이면 바로 시작할 수 있고, 30점
          미만이면 보완이 필요합니다.
        </p>
        <p>
          여기서 중요한 건 <strong>재평가</strong> 기능입니다. 점수가 낮은 항목이 있으면 &ldquo;이렇게 보완할
          예정입니다&rdquo;라는 계획을 입력하고 다시 평가받을 수 있습니다. 예를 들어 데이터 접근성이 낮으면 &ldquo;내부
          API를 개발할 예정&rdquo;이라고 입력하면, 그 계획이 반영된 점수를 확인할 수 있습니다.
        </p>

        <h3>Step 3. 어떤 방식으로 만들어야 하는지 결정합니다</h3>
        <p>
          준비도 결과를 바탕으로 AI가 적합한 Agent 구조를 추천합니다. 단순한 추천으로 끝나지 않고, AI와 대화하며
          &ldquo;왜 이 방식인지&rdquo;, &ldquo;우리 상황에 더 맞는 방법은 없는지&rdquo;를 확인할 수 있습니다.
        </p>
        <p>Agent 하나로 충분한지, 여러 Agent가 역할을 나눠서 처리해야 하는지도 여기서 결정됩니다.</p>

        <h3>Step 4. 개발팀에 전달할 명세서가 나옵니다</h3>
        <p>
          분석이 끝나면 구현 명세서가 자동으로 생성됩니다. Agent의 역할 분담, 처리 흐름 다이어그램, 필요한 도구
          정의까지 포함되어 있어서, 개발팀이 &ldquo;뭘 만들어야 하는지&rdquo; 바로 파악할 수 있습니다.
        </p>

        <hr className={styles.hr} />

        {/* Section 4: Scenarios */}
        <h2 className={notoSerifKR.className}>이런 상황에서 쓸 수 있습니다</h2>

        <div className={styles.scenario}>
          <h4>기획과 개발의 킥오프 미팅</h4>
          <p>
            기획팀에서 &ldquo;고객 문의 자동 분류 시스템을 만들고 싶다&rdquo;는 요구사항을 가져왔습니다. 개발팀은
            &ldquo;가능은 한데, 구체적으로 뭘 원하시는 건지 모르겠다&rdquo;고 합니다. P.A.T.H로 아이디어를 입력하면,
            기획팀의 막연한 요구사항이 구조화된 문제 정의로 바뀝니다. 준비도 점검에서 &ldquo;고객 문의 데이터가 API로
            접근 가능한가?&rdquo;를 확인하고, &ldquo;분류 기준이 명확한가?&rdquo;를 점검합니다. 이 결과를 놓고
            기획팀과 개발팀이 같은 테이블에서 이야기할 수 있습니다.
          </p>
        </div>

        <div className={styles.scenario}>
          <h4>여러 자동화 후보 중 우선순위를 정해야 할 때</h4>
          <p>
            &ldquo;견적서 자동 작성&rdquo;, &ldquo;고객 문의 분류&rdquo;, &ldquo;일일 보고서 생성&rdquo; — 세 가지
            후보가 있는데 뭐부터 해야 할지 모르겠습니다. 각각을 P.A.T.H로 돌려보면, 준비도 점수가 42점, 28점,
            38점으로 나옵니다. 28점짜리는 데이터 접근성에서 막히고 있다는 것도 알 수 있습니다. &ldquo;느낌&rdquo;이
            아니라 근거를 가지고 우선순위를 정할 수 있습니다.
          </p>
        </div>

        <div className={styles.scenario}>
          <h4>PoC 기획서를 작성해야 할 때</h4>
          <p>
            경영진에게 AI Agent PoC를 제안해야 합니다. &ldquo;AI가 자동으로 처리합니다&rdquo;라고 쓰면 &ldquo;구체적으로
            어떻게?&rdquo;라는 질문이 돌아옵니다. P.A.T.H가 생성한 명세서에는 Agent 아키텍처 다이어그램, 역할 분담,
            처리 흐름이 포함되어 있습니다. 이걸 기획서에 첨부하면, &ldquo;이 팀은 뭘 만들려는지 명확하게 알고
            있다&rdquo;는 인상을 줄 수 있습니다.
          </p>
        </div>

        <div className={styles.scenario}>
          <h4>외부 개발사에 요구사항을 전달해야 할 때</h4>
          <p>
            AI Agent 개발을 외주로 진행하려는데, 요구사항 정의서가 부실하면 결과물도 기대와 다르게 나옵니다. P.A.T.H가
            생성하는 명세서는 Agent 구조, 입출력 정의, 처리 흐름이 구체적으로 정리되어 있어서, 개발사와의 소통
            기준점으로 쓸 수 있습니다.
          </p>
        </div>

        <hr className={styles.hr} />

        {/* Section 5: Results */}
        <h2 className={notoSerifKR.className}>P.A.T.H를 통해 얻는 것</h2>

        <table className={styles.resultsTable}>
          <thead>
            <tr>
              <th>결과물</th>
              <th>활용</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>준비도 점수 (50점 만점)</td><td>&ldquo;지금 시작해도 되는가?&rdquo;에 대한 객관적 근거</td></tr>
            <tr><td>항목별 진단과 개선 방향</td><td>부족한 부분을 사전에 파악하고 대비</td></tr>
            <tr><td>리스크 목록</td><td>프로젝트 시작 전에 위험 요소 공유</td></tr>
            <tr><td>Agent 구조 추천</td><td>개발팀과 아키텍처 논의의 출발점</td></tr>
            <tr><td>구현 명세서</td><td>개발 착수, PoC 기획서, 외주 요구사항 전달에 활용</td></tr>
          </tbody>
        </table>

        <hr className={styles.hr} />

        {/* Section 6: Closing */}
        <div className={styles.closing}>
          <p className={notoSerifKR.className}>P.A.T.H는 AI Agent를 대신 만들어주는 도구가 아닙니다.</p>
          <p className={`${notoSerifKR.className} ${styles.closingHighlight}`}>
            만들기 전에 확인해야 할 것들을 빠짐없이 점검하고, 개발팀이 바로 움직일 수 있는 문서를 만들어주는 도구입니다.
          </p>
          <p className={notoSerifKR.className}>
            개발 착수 후에 발견할 문제를 미리 발견하고, 기획자와 개발팀이 같은 언어로 대화할 수 있게 합니다.
          </p>
          <p className={styles.closingLastLine}>
            &ldquo;AI로 뭔가 해보고 싶다&rdquo;에서 &ldquo;이렇게 만들면 된다&rdquo;까지. 그 사이의 간극을 P.A.T.H가
            메웁니다.
          </p>
        </div>

        {/* Link to Guide */}
        <p style={{ marginTop: "2rem", textAlign: "center" }}>
          <Link href="/guide" className={styles.navLink}>
            단계별 상세 가이드 보기 &rarr;
          </Link>
        </p>
      </article>

      <footer className={styles.footer}>P.A.T.H Agent Designer</footer>
    </div>
  );
}
