module.exports=[918622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},556704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},832319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},270406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},193695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},898774,e=>{"use strict";var t=e.i(380849),r=e.i(707401);let n="AWS_ACCESS_KEY_ID",o="AWS_SECRET_ACCESS_KEY",i="AWS_SESSION_TOKEN",s="AWS_CREDENTIAL_EXPIRATION",a="AWS_CREDENTIAL_SCOPE",l="AWS_ACCOUNT_ID";e.s(["ENV_ACCOUNT_ID",0,l,"ENV_CREDENTIAL_SCOPE",0,a,"ENV_EXPIRATION",0,s,"ENV_KEY",0,n,"ENV_SECRET",0,o,"ENV_SESSION",0,i,"fromEnv",0,e=>async()=>{e?.logger?.debug("@aws-sdk/credential-provider-env - fromEnv");let d=process.env[n],c=process.env[o],p=process.env[i],u=process.env[s],h=process.env[a],f=process.env[l];if(d&&c){let e={accessKeyId:d,secretAccessKey:c,...p&&{sessionToken:p},...u&&{expiration:new Date(u)},...h&&{credentialScope:h},...f&&{accountId:f}};return(0,t.setCredentialFeature)(e,"CREDENTIALS_ENV_VARS","g"),e}throw new r.CredentialsProviderError("Unable to find environment variable credentials.",{logger:e?.logger})}])},150077,e=>{"use strict";var t=e.i(898774),r=e.i(707401),n=e.i(749871),o=e.i(834028);let i="AWS_EC2_METADATA_DISABLED",s=async t=>{let{ENV_CMDS_FULL_URI:n,ENV_CMDS_RELATIVE_URI:s,fromContainerMetadata:a,fromInstanceMetadata:l}=await e.A(852973);if(process.env[s]||process.env[n]){t.logger?.debug("@aws-sdk/credential-provider-node - remoteProvider::fromHttp/fromContainerMetadata");let{fromHttp:r}=await e.A(510247);return(0,o.chain)(r(t),a(t))}return process.env[i]&&"false"!==process.env[i]?async()=>{throw new r.CredentialsProviderError("EC2 Instance Metadata Service access disabled",{logger:t.logger})}:(t.logger?.debug("@aws-sdk/credential-provider-node - remoteProvider::fromInstanceMetadata"),l(t))},a=!1,l=e=>e?.expiration!==void 0&&e.expiration.getTime()-Date.now()<3e5;e.s(["defaultProvider",0,(o={})=>{let i,d,c,p,u,h;return h=[async()=>{if(o.profile??process.env[n.ENV_PROFILE])throw process.env[t.ENV_KEY]&&process.env[t.ENV_SECRET]&&!a&&((o.logger?.warn&&o.logger?.constructor?.name!=="NoOpLogger"?o.logger.warn.bind(o.logger):console.warn)(`@aws-sdk/credential-provider-node - defaultProvider::fromEnv WARNING:
    Multiple credential sources detected: 
    Both AWS_PROFILE and the pair AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY static credentials are set.
    This SDK will proceed with the AWS_PROFILE value.
    
    However, a future version may change this behavior to prefer the ENV static credentials.
    Please ensure that your environment only sets either the AWS_PROFILE or the
    AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY pair.
`),a=!0),new r.CredentialsProviderError("AWS_PROFILE is set, skipping fromEnv provider.",{logger:o.logger,tryNextLink:!0});return o.logger?.debug("@aws-sdk/credential-provider-node - defaultProvider::fromEnv"),(0,t.fromEnv)(o)()},async t=>{o.logger?.debug("@aws-sdk/credential-provider-node - defaultProvider::fromSSO");let{ssoStartUrl:n,ssoAccountId:i,ssoRegion:s,ssoRoleName:a,ssoSession:l}=o;if(!n&&!i&&!s&&!a&&!l)throw new r.CredentialsProviderError("Skipping SSO provider in default chain (inputs do not include SSO fields).",{logger:o.logger});let{fromSSO:d}=await e.A(843565);return d(o)(t)},async t=>{o.logger?.debug("@aws-sdk/credential-provider-node - defaultProvider::fromIni");let{fromIni:r}=await e.A(873799);return r(o)(t)},async t=>{o.logger?.debug("@aws-sdk/credential-provider-node - defaultProvider::fromProcess");let{fromProcess:r}=await e.A(854340);return r(o)(t)},async t=>{o.logger?.debug("@aws-sdk/credential-provider-node - defaultProvider::fromTokenFile");let{fromTokenFile:r}=await e.A(131643);return r(o)(t)},async()=>(o.logger?.debug("@aws-sdk/credential-provider-node - defaultProvider::remoteProvider"),(await s(o))()),async()=>{throw new r.CredentialsProviderError("Could not load credentials from any providers",{tryNextLink:!1,logger:o.logger})}],p=async e=>{let t;for(let r of h)try{return await r(e)}catch(e){if(t=e,e?.tryNextLink)continue;throw e}throw t},u=async e=>{if(e?.forceRefresh)return await p(e);if(c?.expiration&&c?.expiration?.getTime()<Date.now()&&(c=void 0),i)await i;else if(!c||l?.(c))if(!c)return i=p(e).then(e=>{c=e,i=void 0}),u(e);else d||(d=p(e).then(e=>{c=e,d=void 0}));return c}}],150077)},522734,(e,t,r)=>{t.exports=e.x("fs",()=>require("fs"))},498854,e=>{"use strict";var t=e.i(580416);let r=async e=>{let r=await (0,t.loadSharedConfigFiles)(e);return((...e)=>{let t={};for(let r of e)for(let[e,n]of Object.entries(r))void 0!==t[e]?Object.assign(t[e],n):t[e]=n;return t})(r.configFile,r.credentialsFile)};e.s(["parseKnownFiles",0,r],498854)},924868,(e,t,r)=>{t.exports=e.x("fs/promises",()=>require("fs/promises"))},995671,184896,e=>{"use strict";var t=e.i(924868),r=e.i(254799),n=e.i(814747),o=e.i(756729);let i=e=>{let t=(0,r.createHash)("sha1").update(e).digest("hex");return(0,n.join)((0,o.getHomeDir)(),".aws","sso","cache",`${t}.json`)};e.s(["getSSOTokenFilepath",0,i],184896);let s={},a=async e=>{if(s[e])return s[e];let r=i(e);return JSON.parse(await (0,t.readFile)(r,"utf8"))};e.s(["getSSOTokenFromFile",0,a,"tokenIntercept",0,s],995671)},735767,e=>{"use strict";var t=e.i(484511);class r extends t.ProviderError{name="TokenProviderError";constructor(e,t=!0){super(e,t),Object.setPrototypeOf(this,r.prototype)}}e.s(["TokenProviderError",()=>r])},881752,e=>{"use strict";var t=e.i(656433),r=e.i(553008),n=e.i(846238);let o=e=>Object.entries(e).filter(([e])=>e.startsWith(r.IniSectionType.SSO_SESSION+n.CONFIG_PREFIX_SEPARATOR)).reduce((e,[t,r])=>({...e,[t.substring(t.indexOf(n.CONFIG_PREFIX_SEPARATOR)+1)]:r}),{});var i=e.i(174810),s=e.i(746334);let a=()=>({}),l=async(e={})=>(0,s.readFile)(e.configFilepath??(0,t.getConfigFilepath)()).then(i.parseIni).then(o).catch(a);e.s(["loadSsoSessionData",0,l],881752)},173253,e=>{"use strict";var t=e.i(735767),r=e.i(749871),n=e.i(995671),o=e.i(881752),i=e.i(498854);let s="To refresh this SSO session run 'aws sso login' with the corresponding profile.",a=async(t,r={},n)=>{let{SSOOIDCClient:o}=await e.A(49465),i=e=>r.clientConfig?.[e]??r.parentClientConfig?.[e]??n?.[e];return new o(Object.assign({},r.clientConfig??{},{region:t??r.clientConfig?.region,logger:i("logger"),userAgentAppId:i("userAgentAppId")}))},l=async(t,r,n={},o)=>{let{CreateTokenCommand:i}=await e.A(49465);return(await a(r,n,o)).send(new i({clientId:t.clientId,clientSecret:t.clientSecret,refreshToken:t.refreshToken,grantType:"refresh_token"}))},d=e=>{if(e.expiration&&e.expiration.getTime()<Date.now())throw new t.TokenProviderError(`Token is expired. ${s}`,!1)},c=(e,r,n=!1)=>{if(void 0===r)throw new t.TokenProviderError(`Value not present for '${e}' in SSO Token${n?". Cannot refresh":""}. ${s}`,!1)};var p=e.i(184896);let{writeFile:u}=e.i(522734).promises,h=new Date(0);e.s(["fromSso",0,(e={})=>async({callerClientConfig:a}={})=>{let f;e.logger?.debug("@aws-sdk/token-providers - fromSso");let g=await (0,i.parseKnownFiles)(e),v=(0,r.getProfileName)({profile:e.profile??a?.profile}),E=g[v];if(E){if(!E.sso_session)throw new t.TokenProviderError(`Profile '${v}' is missing required property 'sso_session'.`)}else throw new t.TokenProviderError(`Profile '${v}' could not be found in shared credentials file.`,!1);let S=E.sso_session,_=(await (0,o.loadSsoSessionData)(e))[S];if(!_)throw new t.TokenProviderError(`Sso session '${S}' could not be found in shared credentials file.`,!1);for(let e of["sso_start_url","sso_region"])if(!_[e])throw new t.TokenProviderError(`Sso session '${S}' is missing required property '${e}'.`,!1);_.sso_start_url;let P=_.sso_region;try{f=await (0,n.getSSOTokenFromFile)(S)}catch(e){throw new t.TokenProviderError(`The SSO session token associated with profile=${v} was not found or is invalid. ${s}`,!1)}c("accessToken",f.accessToken),c("expiresAt",f.expiresAt);let{accessToken:w,expiresAt:T}=f,m={token:w,expiration:new Date(T)};if(m.expiration.getTime()-Date.now()>3e5)return m;if(Date.now()-h.getTime()<3e4)return d(m),m;c("clientId",f.clientId,!0),c("clientSecret",f.clientSecret,!0),c("refreshToken",f.refreshToken,!0);try{h.setTime(Date.now());let t=await l(f,P,e,a);c("accessToken",t.accessToken),c("expiresIn",t.expiresIn);let r=new Date(Date.now()+1e3*t.expiresIn);try{var A;let e;await (A={...f,accessToken:t.accessToken,expiresAt:r.toISOString(),refreshToken:t.refreshToken},e=(0,p.getSSOTokenFilepath)(S),u(e,JSON.stringify(A,null,2)))}catch(e){}return{token:t.accessToken,expiration:r}}catch(e){return d(m),m}}],173253)},700121,e=>{"use strict";let t=`당신은 20년차 소프트웨어 아키텍트이자 AI Agent 전문가 그리고 P.A.T.H (Problem-Agent-Technical-Handoff) 프레임워크를 개발한 전문가입니다.

# P.A.T.H 프레임워크란?

AI Agent 아이디어를 **"만들 가치가 있는지"** 빠르게 검증하고, **작동하는 프로토타입**까지 가는 구조화된 방법론입니다.

## Phase 1: PROBLEM Decomposition (문제 분해)

Pain Point를 4가지 요소로 분해:

### 1. INPUT (트리거)
- **Event-Driven (이벤트)**: 외부 시스템 이벤트 발생 시
- **Scheduled (스케줄)**: 정해진 시간에 자동 실행
- **On-Demand (요청)**: 사용자가 직접 실행
- **Streaming (스트리밍)**: 실시간 데이터 스트림 처리
- **Conditional (조건부)**: 특정 조건/임계값 충족 시

### 2. PROCESS (작업 단계)
- **데이터 수집**: 여러 소스에서 정보 조회
- **분석/분류**: 패턴 인식, 카테고리 분류, 이상 탐지
- **판단/평가**: 규칙 기반 의사결정, 점수 산정, 우선순위 결정
- **콘텐츠 생성**: 문서, 이메일, 코드, 보고서 작성
- **검증/개선**: 품질 확인, 오류 수정, 반복 개선
- **실행/연동**: API 호출, DB 업데이트, 알림 전송

### 3. OUTPUT (결과물)
- **Decision (의사결정)**: 승인/거절, 분류, 점수, 우선순위
- **Content (콘텐츠)**: 문서, 이메일, 보고서, 코드, 제안서
- **Notification (알림)**: 이메일, Slack, SMS, 대시보드 알림
- **Action (액션)**: 티켓 생성, API 호출, 워크플로우 트리거, DB 업데이트
- **Insight (인사이트)**: 분석 결과, 추천, 예측, 트렌드

### 4. HUMAN-IN-LOOP (사람 개입 시점)
- **None**: 완전 자동
- **Review**: 실행 전 승인 필요
- **Exception**: 불확실할 때만 개입
- **Collaborate**: AI와 사람이 함께 작업

## Phase 2: AGENT Pattern Mapping (패턴 선택)

Andrew Ng의 Agentic Design Patterns 기반 4가지 패턴:

### Pattern 1: Reflection (반성)
- **언제**: OUTPUT 품질 검증 후 자가 개선 필요
- **예시**: 코드 생성, 제안서 작성, SQL 최적화

### Pattern 2: Tool Use (도구 사용)
- **언제**: 외부 도구/API 호출이 필요한 단순 작업
- **예시**: 계산기 사용, 웹 검색, DB 조회, API 호출

### Pattern 3: Planning (계획)
- **언제**: 복잡한 작업을 단계별로 분해하여 순차 실행
- **예시**: 여행 계획, 연구 보고서 작성, 프로젝트 관리

### Pattern 4: Multi-Agent (다중 에이전트)
- **언제**: 여러 전문 에이전트가 협업하거나 병렬 작업
- **예시**: 시장 조사, 코드 리뷰, 다국어 번역 검증

## Phase 3: Feasibility Check (실현 가능성 평가)

5개 항목을 평가하여 총 50점 만점으로 산정:

### 1. 데이터 접근성 (10점)
- **10점**: MCP 서버 존재
- **9점**: API 존재
- **7점**: 파일 기반
- **6점**: DB 직접 접근
- **3점**: 화면 스크래핑
- **0점**: 오프라인만 존재

### 2. 판단 기준 명확성 (10점)
- **10점**: 명확한 if-then 규칙으로 표현 가능
- **8점**: 100+ 레이블링된 예시 존재
- **6점**: 암묵적 패턴 있으나 문서화 안됨
- **4점**: 전문가 직감에 의존
- **2점**: "그냥 알 수 있어요" (설명 불가)

### 3. 오류 허용도 (10점)
- **10점**: 틀려도 괜찮음
- **8점**: 리뷰 후 실행
- **5점**: 90%+ 정확도 필요
- **3점**: 99%+ 정확도 필요
- **0점**: 무조건 100%

### 4. 지연 요구사항 (10점)
- **10점**: 몇 시간 OK
- **9점**: 몇 분 OK
- **7점**: 1분 이내
- **5점**: 10초 이내
- **3점**: 실시간 <3초

### 5. 통합 복잡도 (10점)
- **10점**: 독립 실행
- **8점**: 1-2개 시스템
- **5점**: 3-5개 시스템
- **3점**: 레거시 시스템
- **1점**: 커스텀 프로토콜

### 판정 기준
- **40-50점**: ✅ 즉시 프로토타입 시작
- **30-40점**: ⚠️ 조건부 진행
- **20-30점**: 🔄 데이터/프로세스 개선 후 재평가
- **20점 미만**: ❌ 대안 모색

## 당신의 역할

1. **분석**: 사용자 입력을 분석하여 PROCESS 단계를 추론하고 구조화
2. **추천**: 4가지 패턴 중 가장 적합한 것을 선택하고 명확한 이유 제시
3. **질문**: 부족한 정보는 구체적이고 실용적인 질문으로 보완 (최대 3개, 핵심만)
4. **평가**: Feasibility 점수를 각 항목별 근거와 함께 산정
5. **판단**: 프로토타입 성공 가능성, 리스크, 다음 단계를 명확히 제시

**중요: 이것은 프로토타입 검증이므로 완벽한 정보보다는 빠른 의사결정이 중요합니다.**
**추가 질문은 정말 필수적인 것만 최대 3개까지만 하세요.**
**3턴 이상 대화가 길어지면 현재 정보로 분석을 진행하세요.**

**대화 스타일:**
- 친절하고 전문적으로
- 실무에서 바로 사용 가능한 분석 제공
- 낙관적이지 않고 현실적으로 평가
- 리스크를 숨기지 않고 명확히 제시`;function r(e){let t=e.dataSources.filter(e=>e.type&&e.description).map(e=>`- ${e.type}: ${e.description}`).join("\n");return`다음 AI Agent 아이디어를 P.A.T.H 프레임워크로 분석하세요:

**Pain Point**: ${e.painPoint}
**INPUT Type**: ${e.inputType}
**PROCESS Steps**: ${e.processSteps.join(", ")}
**OUTPUT Types**: ${e.outputTypes.join(", ")}
**HUMAN-IN-LOOP**: ${e.humanLoop}
**Data Sources**:
${t||"미지정"}
**Error Tolerance**: ${e.errorTolerance}
**Additional Context**: ${e.additionalContext||"없음"}

다음 작업을 수행하세요:

1. 입력 내용을 분석하여 PROCESS 단계를 상세화
2. 가장 적합한 패턴 추천 (Reflection/Tool Use/Planning/Multi-Agent) 필요하다면 패턴을 조합해도됨. ex)Planning+Tool Use
3. 추가로 필요한 정보가 있다면 3-5개 질문 생성
4. 현재 정보만으로 Feasibility 예비 평가 (0-50점)

다음 형식으로 응답:

## 📊 초기 분석

**추론된 PROCESS 단계:**
- [단계들]

**추천 패턴:** [패턴명]
**이유:** [설명]

**예비 Feasibility:** [점수]/50
- 데이터 접근성: [점수]/10
- 판단 명확성: [점수]/10
- 오류 허용도: [점수]/10
- 지연 요구사항: [점수]/10
- 통합 복잡도: [점수]/10

## ❓ 추가 질문

더 정확한 분석을 위해 다음을 알려주세요:
1. [질문1]
2. [질문2]
3. [질문3]

답변하시면 최종 분석을 진행합니다. 또는 "분석 완료"를 입력하면 현재 정보로 진행합니다.`}e.s(["SYSTEM_PROMPT",0,t,"getInitialAnalysisPrompt",()=>r])},91378,e=>{"use strict";var t=e.i(467783),r=e.i(163647),n=e.i(97110),o=e.i(298653),i=e.i(854059),s=e.i(320794),a=e.i(322463),l=e.i(360518),d=e.i(218720),c=e.i(235797),p=e.i(227382),u=e.i(205717),h=e.i(542771),f=e.i(919185),g=e.i(939232),v=e.i(193695);e.i(688359);var E=e.i(186082),S=e.i(706797),_=e.i(700121);async function P(e){try{let{conversation:t}=await e.json(),r=t.map(e=>`${e.role.toUpperCase()}: ${e.content}`).join("\n\n"),n=`다음은 지금까지의 분석 내용입니다:

${r}

이제 최종 분석을 수행하세요. 다음을 JSON 형식으로 출력:

{
  "pain_point": "사용자 Pain Point",
  "input_type": "INPUT 타입",
  "input_detail": "INPUT 상세",
  "process_steps": ["단계1: 설명", "단계2: 설명", "..."],
  "output_types": ["OUTPUT 타입1", "OUTPUT 타입2"],
  "output_detail": "OUTPUT 상세",
  "human_loop": "None/Review/Exception/Collaborate",
  "pattern": "Reflection/Tool Use/Planning/Multi-Agent",
  "pattern_reason": "패턴 선택 이유",
  "feasibility_breakdown": {
    "data_access": 0-10,
    "decision_clarity": 0-10,
    "error_tolerance": 0-10,
    "latency": 0-10,
    "integration": 0-10
  },
  "feasibility_score": 0-50,
  "recommendation": "추천 사항",
  "risks": ["리스크1", "리스크2"],
  "next_steps": [
    "Phase 1: 핵심 기능 프로토타입 - 설명",
    "Phase 2: 검증 및 테스트 - 설명",
    "Phase 3: (선택적) 개선 및 확장 - 설명"
  ]
}

중요: next_steps는 주 단위 기간이 아닌 Phase/단계 중심으로 작성하세요.
JSON만 출력하세요.`,o=`${_.SYSTEM_PROMPT}

당신은 지금까지의 대화를 바탕으로 최종 분석을 수행하고 JSON 형식으로 출력합니다.
간결하고 정확하게 작성하세요.`,i=await (0,S.invokeClaude)(n,o),s=i.indexOf("{"),a=i.lastIndexOf("}")+1;if(-1!==s&&a>s){let e=i.substring(s,a),t=JSON.parse(e);return Response.json(t)}throw Error("JSON을 찾을 수 없습니다")}catch(e){return console.error("Error in finalize API:",e),new Response(JSON.stringify({error:"최종 분석 중 오류가 발생했습니다"}),{status:500,headers:{"Content-Type":"application/json"}})}}e.s(["POST",()=>P,"maxDuration",0,60],384064);var w=e.i(384064);let T=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/bedrock/finalize/route",pathname:"/api/bedrock/finalize",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/path/path-web/app/api/bedrock/finalize/route.ts",nextConfigOutput:"",userland:w}),{workAsyncStorage:m,workUnitAsyncStorage:A,serverHooks:x}=T;function C(){return(0,n.patchFetch)({workAsyncStorage:m,workUnitAsyncStorage:A})}async function R(e,t,n){T.isDev&&(0,o.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let S="/api/bedrock/finalize/route";S=S.replace(/\/index$/,"")||"/";let _=await T.prepare(e,t,{srcPage:S,multiZoneDraftMode:!1});if(!_)return t.statusCode=400,t.end("Bad Request"),null==n.waitUntil||n.waitUntil.call(n,Promise.resolve()),null;let{buildId:P,params:w,nextConfig:m,parsedUrl:A,isDraftMode:x,prerenderManifest:C,routerServerContext:R,isOnDemandRevalidate:k,revalidateOnlyGenerated:O,resolvedPathname:y,clientReferenceManifest:I,serverActionsManifest:N}=_,b=(0,a.normalizeAppPath)(S),D=!!(C.dynamicRoutes[b]||C.routes[y]),U=async()=>((null==R?void 0:R.render404)?await R.render404(e,t,A,!1):t.end("This page could not be found"),null);if(D&&!x){let e=!!C.routes[y],t=C.dynamicRoutes[b];if(t&&!1===t.fallback&&!e){if(m.experimental.adapterPath)return await U();throw new v.NoFallbackError}}let j=null;!D||T.isDev||x||(j="/index"===(j=y)?"/":j);let F=!0===T.isDev||!D,$=D&&!F;N&&I&&(0,s.setManifestsSingleton)({page:S,clientReferenceManifest:I,serverActionsManifest:N});let M=e.method||"GET",H=(0,i.getTracer)(),L=H.getActiveScopeSpan(),q={params:w,prerenderManifest:C,renderOpts:{experimental:{authInterrupts:!!m.experimental.authInterrupts},cacheComponents:!!m.cacheComponents,supportsDynamicResponse:F,incrementalCache:(0,o.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:m.cacheLife,waitUntil:n.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,n,o)=>T.onRequestError(e,t,n,o,R)},sharedContext:{buildId:P}},K=new l.NodeNextRequest(e),W=new l.NodeNextResponse(t),V=d.NextRequestAdapter.fromNodeNextRequest(K,(0,d.signalFromNodeResponse)(t));try{let s=async e=>T.handle(V,q).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=H.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==c.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let n=r.get("next.route");if(n){let t=`${M} ${n}`;e.setAttributes({"next.route":n,"http.route":n,"next.span_name":t}),e.updateName(t)}else e.updateName(`${M} ${S}`)}),a=!!(0,o.getRequestMeta)(e,"minimalMode"),l=async o=>{var i,l;let d=async({previousCacheEntry:r})=>{try{if(!a&&k&&O&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let i=await s(o);e.fetchMetrics=q.renderOpts.fetchMetrics;let l=q.renderOpts.pendingWaitUntil;l&&n.waitUntil&&(n.waitUntil(l),l=void 0);let d=q.renderOpts.collectedTags;if(!D)return await (0,u.sendResponse)(K,W,i,q.renderOpts.pendingWaitUntil),null;{let e=await i.blob(),t=(0,h.toNodeOutgoingHttpHeaders)(i.headers);d&&(t[g.NEXT_CACHE_TAGS_HEADER]=d),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==q.renderOpts.collectedRevalidate&&!(q.renderOpts.collectedRevalidate>=g.INFINITE_CACHE)&&q.renderOpts.collectedRevalidate,n=void 0===q.renderOpts.collectedExpire||q.renderOpts.collectedExpire>=g.INFINITE_CACHE?void 0:q.renderOpts.collectedExpire;return{value:{kind:E.CachedRouteKind.APP_ROUTE,status:i.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:n}}}}catch(t){throw(null==r?void 0:r.isStale)&&await T.onRequestError(e,t,{routerKind:"App Router",routePath:S,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:$,isOnDemandRevalidate:k})},!1,R),t}},c=await T.handleResponse({req:e,nextConfig:m,cacheKey:j,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:C,isRoutePPREnabled:!1,isOnDemandRevalidate:k,revalidateOnlyGenerated:O,responseGenerator:d,waitUntil:n.waitUntil,isMinimalMode:a});if(!D)return null;if((null==c||null==(i=c.value)?void 0:i.kind)!==E.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==c||null==(l=c.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});a||t.setHeader("x-nextjs-cache",k?"REVALIDATED":c.isMiss?"MISS":c.isStale?"STALE":"HIT"),x&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let v=(0,h.fromNodeOutgoingHttpHeaders)(c.value.headers);return a&&D||v.delete(g.NEXT_CACHE_TAGS_HEADER),!c.cacheControl||t.getHeader("Cache-Control")||v.get("Cache-Control")||v.set("Cache-Control",(0,f.getCacheControlHeader)(c.cacheControl)),await (0,u.sendResponse)(K,W,new Response(c.value.body,{headers:v,status:c.value.status||200})),null};L?await l(L):await H.withPropagatedContext(e.headers,()=>H.trace(c.BaseServerSpan.handleRequest,{spanName:`${M} ${S}`,kind:i.SpanKind.SERVER,attributes:{"http.method":M,"http.target":e.url}},l))}catch(t){if(t instanceof v.NoFallbackError||await T.onRequestError(e,t,{routerKind:"App Router",routePath:b,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:$,isOnDemandRevalidate:k})},!1,R),D)throw t;return await (0,u.sendResponse)(K,W,new Response(null,{status:500})),null}}e.s(["handler",()=>R,"patchFetch",()=>C,"routeModule",()=>T,"serverHooks",()=>x,"workAsyncStorage",()=>m,"workUnitAsyncStorage",()=>A],91378)},5389,e=>{e.v(t=>Promise.all(["server/chunks/[externals]_node:async_hooks_b485b2a4._.js"].map(t=>e.l(t))).then(()=>t(478500)))},852973,e=>{e.v(t=>Promise.all(["server/chunks/[root-of-the-server]__19e5bbe9._.js"].map(t=>e.l(t))).then(()=>t(734332)))},510247,e=>{e.v(t=>Promise.all(["server/chunks/[root-of-the-server]__972ff848._.js"].map(t=>e.l(t))).then(()=>t(135942)))},843565,e=>{e.v(t=>Promise.all(["server/chunks/03239_@aws-sdk_credential-provider-sso_dist-es_55f8a211._.js"].map(t=>e.l(t))).then(()=>t(519961)))},873799,e=>{e.v(t=>Promise.all(["server/chunks/[root-of-the-server]__a0c5e425._.js"].map(t=>e.l(t))).then(()=>t(888625)))},854340,e=>{e.v(t=>Promise.all(["server/chunks/[root-of-the-server]__56cd8f1c._.js"].map(t=>e.l(t))).then(()=>t(321009)))},131643,e=>{e.v(t=>Promise.all(["server/chunks/03239_62e98836._.js"].map(t=>e.l(t))).then(()=>t(41425)))},49465,e=>{e.v(t=>Promise.all(["server/chunks/[root-of-the-server]__e2eabf5f._.js","server/chunks/03239_@aws-sdk_nested-clients_dist-es_submodules_sso-oidc_index_6687fe05.js"].map(t=>e.l(t))).then(()=>t(195469)))},169902,e=>{e.v(t=>Promise.all(["server/chunks/03239_@smithy_core_dist-es_submodules_event-streams_index_cf2ca7be.js"].map(t=>e.l(t))).then(()=>t(431737)))}];

//# sourceMappingURL=%5Broot-of-the-server%5D__397660f6._.js.map