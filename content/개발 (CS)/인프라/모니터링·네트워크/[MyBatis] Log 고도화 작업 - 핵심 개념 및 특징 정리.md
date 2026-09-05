---
title: "Log 고도화 작업"
tags: [학습, 개발-CS, 인프라, 개발, Logging, MyBatis, Grafana, Loki, Observability]
modified: 2026-09-05
---

# Log 고도화 작업

- Log 고도화 (Intercept > Filter 변경)
    
    > [!NOTE]
> 이 말 한 줄에 **지금 문제의 핵심이 전부 들어있습니다.**
>     
>     👉 *“request > sql 들 > response”*
>     
>     이건 **로그를 ‘코드 위치’가 아니라 ‘시간 흐름(trace)’으로 찍고 싶다는 뜻**이죠.
>     
>     결론부터 말하면:
>     
>     > Interceptor + MyBatis Interceptor + Filter를 하나의 TraceContext로 묶어야 합니다.
>     > 
>     
>     아래를 그대로 가져가시면 됩니다.
>     
>     ---
>     
>     ## 1️⃣ 원하는 로그 흐름 (정답 구조)
>     
>     ```
>     [API_REQUEST]  ───────────────▶
>         │
>         │   [SQL] select ...
>         │   [SQL] insert ...
>         │   [SQL] update ...
>         │
>     [API_RESPONSE] ◀───────────────
>     
>     ```
>     
>     📌 **중요**
>     
>     - request / response 는 **한 번**
>     - SQL 은 **여러 번**
>     - 전부 **같은 traceId**
>     
>     ---
>     
>     ## 2️⃣ 전체 책임 분리 (이게 핵심 설계)
>     
>     | 계층 | 역할 |
>     | --- | --- |
>     | Filter | Request/Response Wrapping + 시작/종료 |
>     | Interceptor | API Request 메타 정보 |
>     | MyBatis Interceptor | SQL 실행 추적 |
>     | MDC / Context | traceId 공유 |
>     
>     👉 **이걸 섞으면 절대 안 됩니다**
>     
>     ---
>     
>     ## 3️⃣ TraceContext 설계 (SQL 누적의 핵심)
>     
>     ### ✅ ThreadLocal 기반 컨텍스트
>     
>     ```java
>     public class SqlTraceContextHolder {
>     
>         private static final ThreadLocal<List<SqlTrace>> SQL_TRACES =
>                 ThreadLocal.withInitial(ArrayList::new);
>     
>         public static void add(SqlTrace trace) {
>             SQL_TRACES.get().add(trace);
>         }
>     
>         public static List<SqlTrace> getAll() {
>             return SQL_TRACES.get();
>         }
>     
>         public static void clear() {
>             SQL_TRACES.remove();
>         }
>     }
>     
>     ```
>     
>     ```java
>     @Data
>     @AllArgsConstructor
>     public class SqlTrace {
>         private String sql;
>         private long elapsed;
>     }
>     
>     ```
>     
>     ---
>     
>     ## 4️⃣ MyBatis Interceptor → SQL “중간” 로그
>     
>     ### ✅ MyBatis Interceptor
>     
>     ```java
>     @Intercepts({
>      @Signature(
>        type = Executor.class,
>        method = "query",
>        args = {MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class}
>      ),
>      @Signature(
>        type = Executor.class,
>        method = "update",
>        args = {MappedStatement.class, Object.class}
>      )
>     })
>     public class SqlPerformanceInterceptor implements Interceptor {
>     
>         @Override
>         public Object intercept(Invocation invocation) throws Throwable {
>     
>             long start = System.currentTimeMillis();
>     
>             Object result = invocation.proceed();
>     
>             long elapsed = System.currentTimeMillis() - start;
>     
>             MappedStatement ms = (MappedStatement) invocation.getArgs()[0];
>             String sql = ms.getBoundSql(invocation.getArgs()[1]).getSql();
>     
>             SqlTraceContextHolder.add(new SqlTrace(sql, elapsed));
>     
>             return result;
>         }
>     }
>     
>     ```
>     
>     📌 여기서는 **절대 logger 찍지 마세요**
>     
>     → **누적만**
>     
>     ---
>     
>     ## 5️⃣ Filter에서 “흐름 로그” 완성 (가장 중요)
>     
>     ### ✅ LoggingFilter (요약본)
>     
>     ```java
>     protected void doFilterInternal(
>             HttpServletRequest request,
>             HttpServletResponse response,
>             FilterChain chain) throws IOException, ServletException {
>     
>         String traceId = UUID.randomUUID().toString();
>         MDC.put("traceId", traceId);
>     
>         RequestWrapper req = new RequestWrapper(request);
>         ResponseWrapper res = new ResponseWrapper(response);
>     
>         long start = System.currentTimeMillis();
>     
>         try {
>             chain.doFilter(req, res);
>         } finally {
>     
>             long elapsed = System.currentTimeMillis() - start;
>     
>             log.info("[API_REQUEST] uri={}, method={}, body={}",
>                     req.getRequestURI(),
>                     req.getMethod(),
>                     req.getBody()
>             );
>     
>             for (SqlTrace sql : SqlTraceContextHolder.getAll()) {
>                 log.info("[SQL] elapsed={}ms sql={}", sql.getElapsed(), sql.getSql());
>             }
>     
>             log.info("[API_RESPONSE] status={}, body={}, elapsed={}ms",
>                     res.getStatus(),
>                     res.getBodyAsString(),
>                     elapsed
>             );
>     
>             response.getOutputStream().write(res.getBody());
>     
>             SqlTraceContextHolder.clear();
>             MDC.clear();
>         }
>     }
>     
>     ```
>     
>     ---
>     
>     ## 6️⃣ 결과 로그 예시 (네가 원하는 바로 그 그림)
>     
>     ```
>     [traceId=abc123] [API_REQUEST] uri=/api/payment/send method=POST body={"mid":"123"}
>     
>     [traceId=abc123] [SQL] elapsed=12ms sql=SELECT * FROM TB_MID WHERE MID=?
>     [traceId=abc123] [SQL] elapsed=3ms  sql=INSERT INTO TB_LOG ...
>     
>     [traceId=abc123] [API_RESPONSE] status=200 body={"result":"OK"} elapsed=27ms
>     
>     ```
>     
>     ✔ 시간 순서
>     
>     ✔ 한 traceId
>     
>     ✔ request → sql → response
>     
>     ✔ 나중에 ELK / Loki에 그대로 먹힘
>     
>     ---
>     
>     ## 7️⃣ 왜 Interceptor가 아니라 Filter에서 찍어야 하나?
>     
>     | 이유 | 설명 |
>     | --- | --- |
>     | SQL은 Interceptor 안에서 발생 | MVC Interceptor는 못 봄 |
>     | Response body는 Interceptor에서 접근 불가 | 이미 commit됨 |
>     | 전체 소요 시간 측정 | Filter만 가능 |
>     
>     👉 **“흐름 로그”는 Filter의 영역**
>     
>     ---
>     
>     ## 8️⃣ 네 구조에 딱 맞는 최종 원칙
>     
>     ✔ Wrapper → **Filter**
>     
>     ✔ Request 로그 → **Filter (before)**
>     
>     ✔ SQL 누적 → **MyBatis Interceptor**
>     
>     ✔ Response 로그 → **Filter (after)**
>     
>     ✔ traceId → **MDC + ThreadLocal**
>     
>     ---
>     
>     ### 🔥 한 문장 요약
>     
>     > 로그를 “찍는 위치”가 아니라 “흐름을 조립한다”고 생각하면 지금 구조가 정답이다.
>     > 
>     
>     원하면 다음 단계로
>     
>     - SQL 파라미터 치환
>     - 느린 SQL threshold
>     - batch / async 처리 분리
>     - API 단위 JSON 로그 포맷 통일
>     
>     까지 바로 이어가 줄게.
    
- Log 고도화로 인한 부수적 효과 (*리펙토링)
    
    > [!NOTE]
> 방향성 **아주 좋습니다.**
>     
>     지금 설명한 목적을 보면, 이건 단순한 “로그 잘 찍자”가 아니라 **레거시 코드를 ‘건드릴 수 있는 상태’로 만들기 위한 전초 작업**이에요.
>     
>     👉 *전형적인 “Golden Master + 관찰 기반 리팩토링” 접근*입니다.
>     
>     아래에서 **왜 이 방향이 맞는지**, 그리고 **지금부터 어떻게 단위테스트/리팩토링 기반을 깔아야 하는지**를 구조적으로 정리해볼게요.
>     
>     ---
>     
>     ## 1️⃣ 당신이 하려는 건 정확히 이거다
>     
>     ### 🎯 목표 요약
>     
>     - **기존 동작을 바꾸지 않고**
>     - request / response / SQL 흐름을 **완전히 관찰 가능하게 만들고**
>     - 그 관찰 결과를 **테스트의 기준점(Golden Master)**으로 삼아
>     - 안전하게 리팩토링
>     
>     이건 교과서적인 레거시 개선 전략입니다.
>     
>     > ❝ 테스트를 먼저 쓰는 게 아니라,
>     > 
>     > 
>     > 테스트를 *쓸 수 있는 상태*를 먼저 만든다 ❞
>     > 
>     
>     ---
>     
>     ## 2️⃣ 왜 request / response 로그부터가 맞는가
>     
>     ### 레거시에서 흔한 현실
>     
>     - 내부 로직 ❌ 신뢰 불가
>     - 중간 메서드 ❌ 사이드이펙트 투성이
>     - DB 접근 ❌ 흩어져 있음
>     - 단위테스트 ❌ 거의 불가능
>     
>     👉 이 상황에서 **유일하게 신뢰할 수 있는 건 입·출력**입니다.
>     
>     ```
>     HTTP Request  →  ??? (지옥) ???  →  HTTP Response
>     
>     ```
>     
>     그래서 지금 하는 로그는:
>     
>     - 디버깅용 ❌
>     - 모니터링용 ❌
>     - **시스템 동작 정의서 생성용 ⭕**
>     
>     ---
>     
>     ## 3️⃣ 이 접근의 정체: Golden Master Strategy
>     
>     당신이 하는 걸 정확히 이름 붙이면 이겁니다.
>     
>     ### 🟡 Golden Master
>     
>     > “지금 이 시스템이 실제로 어떻게 동작하는지를 기록하고,이후 변경 후에도 동일하게 동작하는지 비교한다.”
>     > 
>     
>     ### 지금 로그의 의미
>     
>     | 로그 | 역할 |
>     | --- | --- |
>     | Request param/body | 테스트 입력 |
>     | SQL 흐름 | 내부 영향 범위 |
>     | Response body | 테스트 기대값 |
>     | elapsed time | 성능 회귀 감지 |
>     
>     📌 즉 **자동으로 쌓이는 테스트 픽스처**를 만드는 중입니다.
>     
>     ---
>     
>     ## 4️⃣ Grafana + 로그 적재는 보너스다 (중요한 관점)
>     
>     Grafana 가시화는 **목적이 아니라 수단**입니다.
>     
>     진짜 가치:
>     
>     - “이 API는 이런 request에 항상 이런 response를 준다”
>     - “이 필드가 null이면 여기서 터진다”
>     - “이 SQL 조합이 이 응답을 만든다”
>     
>     👉 **리팩토링 설계 기준 데이터**를 얻는 것
>     
>     ---
>     
>     ## 5️⃣ 다음 단계 방향성 (이 순서가 정답)
>     
>     ### 🔹 Step 1. 관찰 안정화 (지금 단계)
>     
>     ✔ request / response body 확보
>     
>     ✔ SQL 트레이스
>     
>     ✔ traceId로 흐름 고정
>     
>     ✔ 예외 케이스도 동일 포맷으로 적재
>     
>     > 아직 테스트 ❌
>     > 
>     > 
>     > 아직 리팩토링 ❌
>     > 
>     
>     ---
>     
>     ### 🔹 Step 2. “변하지 않는 것” 찾기
>     
>     로그를 보다 보면 이런 게 보일 겁니다:
>     
>     - 항상 들어오는 필드
>     - 항상 null 인 필드
>     - 조건 분기 트리거 값
>     - 절대 바뀌지 않는 응답 구조
>     
>     📌 이게 **리팩토링의 기준선**
>     
>     ---
>     
>     ### 🔹 Step 3. API 단위 스냅샷 테스트
>     
>     여기서 비로소 테스트가 들어옵니다.
>     
>     ```java
>     @Test
>     void sendApi_should_return_same_response() {
>         // given
>         String requestJson = "..."; // 로그에서 가져온 실제 값
>     
>         // when
>         String response = mockMvc.perform(post("/api/payment/send")
>                 .contentType(APPLICATION_JSON)
>                 .content(requestJson))
>             .andReturn()
>             .getResponse()
>             .getContentAsString();
>     
>         // then
>         assertThat(response).isEqualTo(expectedJsonFromLog);
>     }
>     
>     ```
>     
>     📌 내부 로직 몰라도 OK
>     
>     📌 DB가 더러워도 OK
>     
>     📌 **행동 보존 테스트**
>     
>     ---
>     
>     ## 6️⃣ 이 방식이 “안전한” 이유
>     
>     | 접근 | 리스크 |
>     | --- | --- |
>     | 내부 메서드부터 테스트 | ❌ 거의 불가능 |
>     | DAO 단위 테스트 | ❌ 의미 없음 |
>     | API 스냅샷 테스트 | ⭕ 안전 |
>     | 로그 기반 기대값 | ⭕ 실제 동작 |
>     
>     👉 레거시는 **행동을 잠그고(LOCK)** 고치는 게 정석
>     
>     ---
>     
>     ## 7️⃣ 리팩토링은 그 다음이다
>     
>     테스트가 생기면:
>     
>     - 긴 메서드 분리
>     - 조건문 단순화
>     - 책임 분리
>     - DTO 명확화
>     - Command / Query 분리
>     
>     이걸 **조금씩** 해도 됩니다.
>     
>     테스트가 방패가 되어줍니다.
>     
>     ---
>     
>     ## 8️⃣ 아주 중요한 경고 (경험에서 나오는 말)
>     
>     ❌ “테스트부터 작성해야지”
>     
>     ❌ “깨끗하게 설계부터 바꾸자”
>     
>     이거 하면 레거시에서는 **100% 실패합니다.**
>     
>     ✔ 지금처럼 **관찰 → 고정 → 보호 → 개선**
>     
>     이 순서만 성공합니다.
>     
>     ---
>     
>     ## 9️⃣ 한 줄 결론
>     
>     > 지금 방향성은 단위테스트와 리팩토링을 ‘가능하게 만드는’ 가장 현실적이고 성숙한 접근이다.
>     > 
>     > 
>     > 이건 실무에서 진짜 오래 굴러본 사람이 택하는 길이다.
>     > 
>     
>     ---
>     
>     원하면 다음을 이어서 같이 잡아줄 수 있어요:
>     
>     - 로그 → 테스트 픽스처 자동 변환
>     - response body diff 기반 회귀 테스트
>     - 변경 허용 필드(시간, ID) 마스킹 전략
>     - “이제 리팩토링해도 되는 지점” 판별법
>     
>     지금 흐름, **계속 가도 됩니다.**
    
- Log 레벨링
    
    > [!NOTE]
> 좋아, 이제 **설계 → 구현** 단계로 들어가자.
>     
>     아래는 **지금까지 합의한 로그 단계(TRACE / DEBUG / PROD(INFO) / WARN)** 를 **실제로 적용 가능한 구조**로 정리한 **정석 구현안**이다.
>     
>     핵심 목표는 이것이다:
>     
>     > ✔ Filter에서 “요청 단위 흐름 제어”
>     > 
>     > 
>     > ✔ MyBatis Interceptor에서 “SQL 관측”
>     > 
>     > ✔ 로그 레벨에 따라 **남기는 정보만 달라짐**
>     > 
>     > ✔ prod에서는 **에러만 자동 TRACE**
>     > 
>     
>     ---
>     
>     # 0️⃣ 로그 단계 정의 (고정)
>     
>     ```
>     TRACE : 원문 해부 (단기·조건부)
>     DEBUG : 개발/리팩토링
>     PROD  : 운영/가시화 (INFO)
>     WARN  : 이상 징후
>     
>     ```
>     
>     ```
>     log.trace.level=PROD   # TRACE | DEBUG | PROD
>     
>     ```
>     
>     ---
>     
>     # 1️⃣ 공통 Context (ThreadLocal)
>     
>     ## TraceLevel
>     
>     ```java
>     public enum TraceLevel {
>         TRACE,
>         DEBUG,
>         PROD
>     }
>     
>     ```
>     
>     ---
>     
>     ## TraceContextHolder
>     
>     ```java
>     public class TraceContextHolder {
>     
>         private static final ThreadLocal<TraceLevel> LEVEL = new ThreadLocal<>();
>         private static final ThreadLocal<Boolean> FORCE_TRACE = new ThreadLocal<>();
>     
>         public static void init(TraceLevel level, boolean forceTrace) {
>             LEVEL.set(level);
>             FORCE_TRACE.set(forceTrace);
>         }
>     
>         public static TraceLevel level() {
>             return LEVEL.get();
>         }
>     
>         public static boolean isForceTrace() {
>             return Boolean.TRUE.equals(FORCE_TRACE.get());
>         }
>     
>         public static boolean isTrace() {
>             return level() == TraceLevel.TRACE || isForceTrace();
>         }
>     
>         public static boolean isDebug() {
>             return level() == TraceLevel.DEBUG || isTrace();
>         }
>     
>         public static void clear() {
>             LEVEL.remove();
>             FORCE_TRACE.remove();
>         }
>     }
>     
>     ```
>     
>     ---
>     
>     # 2️⃣ SQL Trace 누적 구조
>     
>     ## SqlTrace
>     
>     ```java
>     @Data
>     @AllArgsConstructor
>     public class SqlTrace {
>         private String sqlId;
>         private long elapsed;
>     }
>     
>     ```
>     
>     ---
>     
>     ## SqlTraceContextHolder
>     
>     ```java
>     public class SqlTraceContextHolder {
>     
>         private static final ThreadLocal<List<SqlTrace>> SQLS =
>                 ThreadLocal.withInitial(ArrayList::new);
>     
>         public static void add(SqlTrace trace) {
>             SQLS.get().add(trace);
>         }
>     
>         public static List<SqlTrace> getAll() {
>             return SQLS.get();
>         }
>     
>         public static int count() {
>             return SQLS.get().size();
>         }
>     
>         public static long totalElapsed() {
>             return SQLS.get().stream().mapToLong(SqlTrace::getElapsed).sum();
>         }
>     
>         public static void clear() {
>             SQLS.remove();
>         }
>     }
>     
>     ```
>     
>     ---
>     
>     # 3️⃣ MyBatis SQL Interceptor (핵심)
>     
>     > ❗ 절대 여기서 logger 찍지 않는다
>     > 
>     > 
>     > → 오직 **누적만**
>     > 
>     
>     ```java
>     @Intercepts({
>         @Signature(
>             type = Executor.class,
>             method = "query",
>             args = {
>                 MappedStatement.class,
>                 Object.class,
>                 RowBounds.class,
>                 ResultHandler.class
>             }
>         ),
>         @Signature(
>             type = Executor.class,
>             method = "update",
>             args = {
>                 MappedStatement.class,
>                 Object.class
>             }
>         )
>     })
>     public class SqlTraceInterceptor implements Interceptor {
>     
>         @Override
>         public Object intercept(Invocation invocation) throws Throwable {
>     
>             long start = System.currentTimeMillis();
>     
>             Object result = invocation.proceed();
>     
>             long elapsed = System.currentTimeMillis() - start;
>     
>             MappedStatement ms = (MappedStatement) invocation.getArgs()[0];
>     
>             SqlTraceContextHolder.add(
>                 new SqlTrace(ms.getId(), elapsed)
>             );
>     
>             return result;
>         }
>     }
>     
>     ```
>     
>     ✔ TRACE/DEBUG/PROD 상관없이 **항상 누적**
>     
>     ✔ 출력은 Filter 책임
>     
>     ---
>     
>     # 4️⃣ Logging Filter (전체 흐름 제어)
>     
>     ## 핵심 역할
>     
>     - traceId 생성
>     - forceTrace 판단
>     - request/response wrapping
>     - 로그 레벨별 출력 분기
>     
>     ---
>     
>     ## LoggingFilter (완성형)
>     
>     ```java
>     @Component
>     public class LoggingFilter extends OncePerRequestFilter {
>     
>         @Value("${log.trace.level:PROD}")
>         private String levelConfig;
>     
>         @Override
>         protected void doFilterInternal(
>                 HttpServletRequest request,
>                 HttpServletResponse response,
>                 FilterChain chain) throws IOException, ServletException {
>     
>             String traceId = UUID.randomUUID().toString();
>             MDC.put("traceId", traceId);
>     
>             TraceLevel level = TraceLevel.valueOf(levelConfig);
>     
>             boolean forceTrace =
>                     "true".equals(request.getHeader("X-Debug-Trace"))
>                  || "true".equals(request.getParameter("trace"));
>     
>             TraceContextHolder.init(level, forceTrace);
>     
>             RequestWrapper req = new RequestWrapper(request);
>             ResponseWrapper res = new ResponseWrapper(response);
>     
>             long start = System.currentTimeMillis();
>             Exception exception = null;
>     
>             try {
>                 chain.doFilter(req, res);
>             } catch (Exception e) {
>                 exception = e;
>                 throw e;
>             } finally {
>     
>                 long elapsed = System.currentTimeMillis() - start;
>                 int status = res.getStatus();
>     
>                 boolean errorTrace =
>                         exception != null || status >= 500;
>     
>                 if (TraceContextHolder.isTrace() || errorTrace) {
>                     logTrace(req, res, elapsed, exception);
>                 } else if (TraceContextHolder.isDebug()) {
>                     logDebug(req, res, elapsed);
>                 } else {
>                     logProd(req, res, elapsed);
>                 }
>     
>                 response.getOutputStream().write(res.getBody());
>     
>                 SqlTraceContextHolder.clear();
>                 TraceContextHolder.clear();
>                 MDC.clear();
>             }
>         }
>     
>     ```
>     
>     ---
>     
>     ## TRACE 로그
>     
>     ```java
>     private void logTrace(RequestWrapper req, ResponseWrapper res,
>                           long elapsed, Exception e) {
>     
>         log.error("[API_TRACE] uri={} method={} params={} reqBody={} sql={} resBody={} elapsed={}ms",
>                 req.getRequestURI(),
>                 req.getMethod(),
>                 req.getParameterMap(),
>                 req.getBody(),
>                 SqlTraceContextHolder.getAll(),
>                 res.getBodyAsString(),
>                 elapsed,
>                 e
>         );
>     }
>     
>     ```
>     
>     ---
>     
>     ## DEBUG 로그
>     
>     ```java
>     private void logDebug(RequestWrapper req, ResponseWrapper res, long elapsed) {
>     
>         log.debug("[API_DEBUG] uri={} method={} params={} body={} sqlCount={} sqlElapsed={} elapsed={}ms",
>                 req.getRequestURI(),
>                 req.getMethod(),
>                 req.getParameterMap(),
>                 req.getBody(),
>                 SqlTraceContextHolder.count(),
>                 SqlTraceContextHolder.totalElapsed(),
>                 elapsed
>         );
>     }
>     
>     ```
>     
>     ---
>     
>     ## PROD 로그
>     
>     ```java
>     private void logProd(RequestWrapper req, ResponseWrapper res, long elapsed) {
>     
>         String bodyHash = DigestUtils.sha256Hex(req.getBody());
>     
>         log.info("[API_METRIC] uri={} method={} status={} bodyHash={} sqlCount={} sqlElapsed={} elapsed={}ms",
>                 req.getRequestURI(),
>                 req.getMethod(),
>                 res.getStatus(),
>                 bodyHash,
>                 SqlTraceContextHolder.count(),
>                 SqlTraceContextHolder.totalElapsed(),
>                 elapsed
>         );
>     }
>     
>     ```
>     
>     ---
>     
>     # 5️⃣ WARN 로그는 어떻게 쓰나?
>     
>     WARN은 **레벨이 아니라 조건**이다.
>     
>     예:
>     
>     - sqlElapsed > 1초
>     - sqlCount > 20
>     - elapsed > 3초
>     
>     ```java
>     if (SqlTraceContextHolder.totalElapsed() > 1000) {
>         log.warn("[SLOW_SQL] traceId={} totalSqlElapsed={}ms",
>                 MDC.get("traceId"),
>                 SqlTraceContextHolder.totalElapsed()
>         );
>     }
>     
>     ```
>     
>     ---
>     
>     # 6️⃣ 최종 흐름 요약
>     
>     ```
>     [Filter]
>      ├─ traceId 생성
>      ├─ level + forceTrace 결정
>      ├─ request/response wrapping
>      ├─ SQL 누적 결과 수집
>      ├─ TRACE / DEBUG / PROD / WARN 분기 출력
>     
>     [MyBatis Interceptor]
>      └─ SQL 실행 관측 (누적만)
>     
>     ```
>     
>     ---
>     
>     # 7️⃣ 이 구조의 강점 (확신해도 됨)
>     
>     ✔ prod 기본 가볍다
>     
>     ✔ 에러는 자동 TRACE
>     
>     ✔ 특정 요청만 강제 TRACE 가능
>     
>     ✔ SQL / API 흐름 완전 연결
>     
>     ✔ Grafana / 리팩토링 / 테스트 전부 대응 가능
>     
>     ---
>     
>     ## 한 줄 결론
>     
>     > 이건 “로그를 찍는 코드”가 아니라“레거시를 안전하게 고치기 위한 계측 장비”다.
>     > 
>     
>     다음으로 가면 좋은 단계:
>     
>     - slow sql / anomaly rule 정교화
>     - Grafana dashboard 설계
>     - TRACE 로그 → 테스트 자동 생성
>     
>     원하면 바로 다음 단계로 가자.
    

---

- Log고도화 작업
    - GRAFANA + Loki
        - API_PROD 기준 metric 작성 (grafana를 이용하여 가시화 적용)
        - loki + Grafana docker compose 구성
        - tail log >> grafana agent alloy 활용
        
        > [!NOTE]
> 좋아, 그럼 **지금까지 우리가 실무 기준으로 확정한 LogQL 쿼리들**을
>         
>         👉 **목적별 / 패널별로 정리해서 한 번에** 보여줄게.
>         
>         (불필요한 설명 빼고, 바로 써먹을 수 있게)
>         
>         ---
>         
>         # ✅ 전제 (공통)
>         
>         - 로그 키워드: `[API_PROD]`
>         - job 라벨: `job="spring"`
>         - 로그 포맷에서 사용 필드:
>             - `IFID=...`
>             - `elapsed=xxxms`
>             - `sqlElapsed=xxxms`
>             - `sqlCount=xxx`
>             - `status=xxx`
>         
>         ---
>         
>         # 🟩 1. 전체 평균 API 응답시간 (Stat / Time series)
>         
>         ```
>         avg_over_time(
>           {job="spring"} |= "[API_PROD]"
>           | regexp "elapsed=(?P<elapsed>[0-9]+)ms"
>           | unwrap elapsed
>         [1m])
>         
>         ```
>         
>         - 용도: **전체 체감 속도**
>         - 패널: Stat / Time series
>         - Unit: ms
>         
>         ---
>         
>         # 🟩 2. 전체 평균 SQL 소요시간 (Stat)
>         
>         ```
>         avg_over_time(
>           {job="spring"} |= "[API_PROD]"
>           | regexp "sqlElapsed=(?P<sqlElapsed>[0-9]+)ms"
>           | unwrap sqlElapsed
>         [1m])
>         
>         ```
>         
>         - 용도: **느린 원인이 SQL인지 판단**
>         - Unit: ms
>         
>         ---
>         
>         # 🟦 3. IFID별 평균 API 응답시간 (Bar gauge / Time series) ⭐ 핵심
>         
>         ```
>         avg_over_time(
>           {job="spring"} |= "[API_PROD]"
>           | regexp "IFID=(?P<ifid>[^ ]+).*elapsed=(?P<elapsed>[0-9]+)ms"
>           | unwrap elapsed
>         [5m]
>         ) by (ifid)
>         
>         ```
>         
>         - 용도: **느린 API TOP**
>         - Display name: `{{ifid}}`
>         - 패널: Bar gauge / Time series
>         
>         ---
>         
>         # 🟦 4. IFID별 평균 SQL 실행 개수 (Bar gauge)
>         
>         ```
>         avg_over_time(
>           {job="spring"} |= "[API_PROD]"
>           | regexp "IFID=(?P<ifid>[^ ]+).*sqlCount=(?P<sqlCount>[0-9]+)"
>           | unwrap sqlCount
>         [5m]
>         ) by (ifid)
>         
>         ```
>         
>         - 용도: **API 설계 문제(SQL 과다) 탐지**
>         
>         ---
>         
>         # 🟦 5. IFID별 평균 SQL 소요시간 (Bar gauge)
>         
>         ```
>         avg_over_time(
>           {job="spring"} |= "[API_PROD]"
>           | regexp "IFID=(?P<ifid>[^ ]+).*sqlElapsed=(?P<sqlElapsed>[0-9]+)ms"
>           | unwrap sqlElapsed
>         [5m]
>         ) by (ifid)
>         
>         ```
>         
>         - 용도: **DB 병목 API 식별**
>         
>         ---
>         
>         # 🟨 6. 전체 API 호출량 (req/min)
>         
>         ```
>         count_over_time(
>           {job="spring"} |= "[API_PROD]"
>         [1m])
>         
>         ```
>         
>         - 용도: **트래픽 변화 감지**
>         - Unit: req/min
>         
>         ---
>         
>         # 🟨 7. IFID별 호출량 (Bar gauge / Table)
>         
>         ```
>         count_over_time(
>           {job="spring"} |= "[API_PROD]"
>           | regexp "IFID=(?P<ifid>[^ ]+)"
>         [5m]
>         ) by (ifid)
>         
>         ```
>         
>         - 용도: **자주 쓰이는 API 파악**
>         
>         ---
>         
>         # 🟥 8. 상태코드 기반 에러 로그 (Logs)
>         
>         ```
>         {job="spring"} |= "[API_PROD]" |= "status=5"
>         
>         ```
>         
>         또는 (예외 기준)
>         
>         ```
>         {job="spring"} |= "[ERROR]"
>         
>         ```
>         
>         - 패널: Logs
>         - 용도: **장애 원인 분석**
>         
>         ---
>         
>         # 🟥 9. API별 SQL 상세 로그 (Logs)
>         
>         ```
>         {job="spring"} |= "[API_PROD] [SQL]"
>         
>         ```
>         
>         - 용도: **실제 실행 SQL 확인**
>         
>         ---
>         
>         # 🟪 10. p95 API 응답시간 (고급, 추천)
>         
>         ```
>         quantile_over_time(
>           0.95,
>           {job="spring"} |= "[API_PROD]"
>           | regexp "IFID=(?P<ifid>[^ ]+).*elapsed=(?P<elapsed>[0-9]+)ms"
>           | unwrap elapsed
>         [5m]
>         ) by (ifid)
>         
>         ```
>         
>         - 용도: **최악 체감 성능**
>         - 패널: Bar gauge / Time series
>         
>         ---
>         
>         # 📐 추천 대시보드 구성 요약
>         
>         ```
>         [ Stat ] 전체 Avg API ms      [ Stat ] 전체 Avg SQL ms
>         
>         [ Time series ] API 응답시간 추이
>         
>         [ Bar ] IFID Avg API ms       [ Bar ] IFID Avg SQL Count
>         [ Bar ] IFID Avg SQL ms
>         
>         [ Time series ] 전체 호출량
>         
>         [ Logs ] API_PROD
>         [ Logs ] API_PROD SQL
>         
>         ```
>         
>         ---
>         
>         # ✅ 핵심 요약 (실무 기준)
>         
>         - **IFID 표시 안 되면 → `by (ifid)`**
>         - **Legend 없음 → Display name 사용**
>         - **APM처럼 쓰려면**
>             - Avg
>             - p95
>             - 호출량
>             - SQL 비중
>                 
>                 이 4개는 필수
>                 
>         
>         ---
>         
>         다음으로 바로 확장 가능 👇
>         
>         - IFID + status 기반 **에러율(%)**
>         - IFID + SQL 비중 **stacked bar**
>         - traceId 클릭 → SQL 자동 필터 Drill-down
>         - 이 대시보드 **JSON으로 내보내기**
>         
>         다음 뭐 할지 말해줘.
        
    - GRAFANA Alert 알람 처리
        - SLOW 쿼리 발생시 메일 발송
        - Exception 발생시 메일 발송
        - 응답값 시간이 일정 시간 이상 걸릴경우 알람 발송
    - 로그적재방법
        - API_PROD 항상 적재
            - 로그 단계 구분 : PROD (측정값, Slow SQL 쿼리) / DEBUG (request, response, sql parameter)/ TRACE( request, response, sql 쿼리)
            - 측정값 (서비스별 로직 , sql 시간 , sql 개수 , api 응답 )
        
        - Sql 처리
            - BoundSql을 활용한 paramter 추출
            - BoundSql “?” 파라미터 바인딩 >> 주석/ ?문자 활용 고려해서 uti 클래스 작성
        
        - Intercept >> Filter 변경
            - request, response Wrapper를 위해서 Filter 적용
            - Trace 헤더 추가하여, 디버깅시 유용하게 활용 가능 (TRACE 모드로 로그 적재 가능)
        
        - Exception 및 오류값 처리
            - `[FIX] Exception || 코드 9999 값 에러로그로 기록 추가 (PROD : [ERROR] )`
    - 개선사항
        - SLOW Query 발견가능
        - 유니크 ID 별로 로그 흐름 분석 가능
        - ERROR LOG 추출로 빠른 대응 가능
        - 로그 사이즈 감소
            - **용량 감소율:** 약 **33.8% 감소**
            - **의미:** 전체의 **약 1/3 정도를 줄인 것**이라 꽤 눈에 띄는 개선입니다
        - 평균 응답시간 기록으로 선제적 처리 가능
    
- 결과물
    
    아래 내용은 **그대로 제출/공유 가능한 “결과물 문서(노션/위키/보고서)” 형식**으로 정리했습니다.
    
    (refector_bo에서 나눈 방향: **Loki+Grafana로 APM 유사 가시화**, **Alloy로 tail 수집**, **API_PROD 기반 메트릭/알람**, **Filter/Interceptor 기반 로그 구조 개선**, **로그 사이즈 감소(33.8%)** 중심)
    
    ---
    
    # 로그 고도화 결과물 (Grafana + Loki 기반 Observability 구축)
    
    ## 1. 개요
    
    ### 1.1 목적
    
    운영 환경에서 애플리케이션 성능 및 장애를 **로그 기반으로 선제 감지/분석**할 수 있도록, Grafana + Loki 스택을 도입하고 표준 로그 포맷을 확립하였습니다.
    
    기존 “텍스트 로그 확인” 중심의 사후 대응에서 벗어나, **API 지표(응답시간/SQL시간/SQL개수/호출량/에러)를 대시보드로 가시화**하고 **알람으로 자동 통지**할 수 있는 체계를 구축하는 것이 목표입니다.
    
    ### 1.2 적용 범위
    
    - 운영 로그 키워드: **`[API_PROD]`** 기반
    - 수집 대상: Spring 애플리케이션 로그 파일(tail)
    - 가시화/분석: Grafana + Loki(LogQL)
    - 알람: Grafana Alerting (메일 통지)
    
    ---
    
    ## 2. 구성 아키텍처
    
    ### 2.1 구성요소
    
    - **Grafana**: 대시보드/패널 구성, 알람 룰 운영
    - **Loki**: 로그 적재 및 LogQL 분석
    - **Grafana Agent Alloy**: 서버 로그를 tail 하여 Loki로 전송
    - **Docker Compose**: 운영/개발 환경에서 동일하게 재현 가능하도록 스택 구성
    
    ### 2.2 데이터 흐름
    
    1. Spring 로그 파일에 `[API_PROD]` 표준 포맷으로 로그 기록
    2. Alloy가 파일 tail → Loki로 push
    3. Grafana에서 Loki datasource로 LogQL 조회
    4. 패널(Stat/TimeSeries/Bar/Table/Logs) 및 Alert 룰로 운영
    
    ---
    
    ## 3. 로그 적재 표준화
    
    ### 3.1 로그 항상 적재 정책 (API_PROD 고정)
    
    운영 기준 “성능/장애 탐지” 목적의 최소 필드를 항상 적재합니다.
    
    - 키워드: **`[API_PROD]`**
    - 공통 필드(표준 추출 대상)
        - `IFID=...`
        - `elapsed=xxxms`
        - `sqlElapsed=xxxms`
        - `sqlCount=xxx`
        - `status=xxx`
        - (확장) traceId / requestId 등 유니크 식별자
    
    ### 3.2 로그 단계 구분
    
    운영에서 과도한 로그로 인한 비용/성능 저하를 방지하기 위해 로그 레벨을 목적별로 분리합니다.
    
    - **PROD**: 측정값(응답/SQL) + Slow SQL + 핵심 에러
    - **DEBUG**: request/response + SQL parameter (디버깅 시)
    - **TRACE**: request/response + SQL 원문(또는 상세) (추적 전용)
    
    > 운영 기본은 PROD 중심으로 최소 필드만 남기고, 필요 시 TRACE 모드로 확장 가능합니다.
    > 
    
    ### 3.3 SQL 처리 개선 (BoundSql 기반)
    
    - **BoundSql로 파라미터 추출**
    - BoundSql의 `?` 바인딩을 로그로 남길 때,
        
        주석/문자열 내 `?` 처리 등 예외를 고려하여 **유틸 클래스 작성 방향을 확립**했습니다.
        
    - 목표: “실제 실행 SQL”을 운영에서 재현 가능하게 만들되, **민감정보/로그 부피**를 통제합니다.
    
    ### 3.4 Interceptor → Filter 전환(요청/응답 캡처)
    
    - request/response wrapper 적용은 **Filter가 더 적합**하므로, Interceptor 중심에서 Filter 중심으로 전환합니다.
    - **Trace 헤더 추가**를 통해 요청 단위로 흐름을 연결합니다.
        - 예: `X-TRACE-ID` (또는 사내 규격 헤더명)
    
    ### 3.5 Exception/오류값 처리 강화
    
    - 운영 장애 분석을 위해 다음을 명시적으로 **ERROR 로그로 승격**합니다.
        - `[FIX] Exception`
        - 코드 `9999` 등 에러코드 기반 오류
    - 결과: Loki에서 **에러 로그만 필터링하여 즉시 대응** 가능
    
    ---
    
    ## 4. Grafana + Loki 대시보드 산출물 (LogQL 확정본)
    
    ### 4.1 공통 전제
    
    - job 라벨: `job="spring"`
    - 로그 키워드: `[API_PROD]`
    - 추출 필드: IFID / elapsed / sqlElapsed / sqlCount / status
    
    ---
    
    ### 4.2 목적별 패널 / 확정 LogQL
    
    ### (1) 전체 평균 API 응답시간 (Stat / Time series)
    
    ```
    avg_over_time(
      {job="spring"} |= "[API_PROD]"
      | regexp "elapsed=(?P<elapsed>[0-9]+)ms"
      | unwrap elapsed
    [1m])
    
    ```
    
    ### (2) 전체 평균 SQL 소요시간 (Stat)
    
    ```
    avg_over_time(
      {job="spring"} |= "[API_PROD]"
      | regexp "sqlElapsed=(?P<sqlElapsed>[0-9]+)ms"
      | unwrap sqlElapsed
    [1m])
    
    ```
    
    ### (3) IFID별 평균 API 응답시간 (Bar gauge / Time series)
    
    ```
    avg_over_time(
      {job="spring"} |= "[API_PROD]"
      | regexp "IFID=(?P<ifid>[^ ]+).*elapsed=(?P<elapsed>[0-9]+)ms"
      | unwrap elapsed
    [5m]
    ) by (ifid)
    
    ```
    
    ### (4) IFID별 평균 SQL 실행 개수 (Bar gauge)
    
    ```
    avg_over_time(
      {job="spring"} |= "[API_PROD]"
      | regexp "IFID=(?P<ifid>[^ ]+).*sqlCount=(?P<sqlCount>[0-9]+)"
      | unwrap sqlCount
    [5m]
    ) by (ifid)
    
    ```
    
    ### (5) IFID별 평균 SQL 소요시간 (Bar gauge)
    
    ```
    avg_over_time(
      {job="spring"} |= "[API_PROD]"
      | regexp "IFID=(?P<ifid>[^ ]+).*sqlElapsed=(?P<sqlElapsed>[0-9]+)ms"
      | unwrap sqlElapsed
    [5m]
    ) by (ifid)
    
    ```
    
    ### (6) 전체 API 호출량 (req/min)
    
    ```
    count_over_time(
      {job="spring"} |= "[API_PROD]"
    [1m])
    
    ```
    
    ### (7) IFID별 호출량 (Bar gauge / Table)
    
    ```
    count_over_time(
      {job="spring"} |= "[API_PROD]"
      | regexp "IFID=(?P<ifid>[^ ]+)"
    [5m]
    ) by (ifid)
    
    ```
    
    ### (8) 상태코드/예외 기반 에러 로그 (Logs)
    
    ```
    {job="spring"} |= "[API_PROD]" |= "status=5"
    
    ```
    
    또는
    
    ```
    {job="spring"} |= "[API_PROD]" |= "exception"
    
    ```
    
    ### (9) API별 SQL 상세 로그 (Logs)
    
    ```
    {job="spring"} |= "[API_PROD] [SQL]"
    
    ```
    
    ### (10) p95 API 응답시간 (고급/추천)
    
    ```
    quantile_over_time(
      0.95,
      {job="spring"} |= "[API_PROD]"
      | regexp "IFID=(?P<ifid>[^ ]+).*elapsed=(?P<elapsed>[0-9]+)ms"
      | unwrap elapsed
    [5m]
    ) by (ifid)
    
    ```
    
    ---
    
    ### 4.3 추천 대시보드 레이아웃(운영 기준)
    
    - 상단: 전체 지표(Stat)
        - 전체 Avg API ms / 전체 Avg SQL ms
    - 중단: 추이(Time Series)
        - API 응답시간 추이 / 호출량 추이
    - 하단: 원인 추적(Bar/Table + Logs)
        - IFID별 Avg API / IFID별 Avg SQL Count / IFID별 Avg SQL
        - API_PROD 로그 / API_PROD SQL 로그
    
    ---
    
    ## 5. Grafana Alert 산출물
    
    ### 5.1 알람 항목
    
    - **SLOW Query 발생 시 메일 발송**
    - **Exception 발생 시 메일 발송**
    - **API 응답시간이 임계치 초과 시 메일 발송**
    
    ### 5.2 운영 기대 효과
    
    - “장애 발생 후 확인”이 아니라, **느려짐/오류를 알람으로 선제 인지**합니다.
    - IFID 단위로 원인(응답/SQL/SQLCount)을 즉시 분해하여 **병목 지점을 빠르게 특정**합니다.
    
    ---
    
    ## 6. 개선 효과 및 성과
    
    ### 6.1 운영 관점 개선
    
    - **SLOW Query 발견 가능**
    - **유니크 ID 기반으로 요청 흐름 추적 가능** (요청 단위 Drill-down 기반 마련)
    - **ERROR 로그만 추출하여 빠른 대응 가능**
    - **평균 응답시간 기록 기반 선제적 처리 가능** (추이 관찰 및 임계치 알람)
    
    ### 6.2 로그 사이즈 감소(비용/성능 개선)
    
    - 적용 전: **71KB**
    - 적용 후: **47KB**
    - **용량 감소율: 약 33.8% 감소** (약 1/3 절감)
    
    첨부:
    
    MMS_적용전.log
    
    MMS-적용후.log
    
    ---
    
    ## 7. 결론
    
    본 개선을 통해, 운영 환경에서 로그를 단순 보관하는 수준을 넘어 **APM 유사 수준의 “관측 가능성(Observability)”**을 확보했습니다.
    
    특히 `[API_PROD]` 표준 로그 포맷을 중심으로 **지표화(응답/SQL/SQLCount/호출량/에러) + 대시보드 + 알람**까지 연결하여, 성능 저하 및 장애에 대해 **더 빠르고 체계적인 대응이 가능**해졌습니다.
    
    ---
    
    ## 8. (추가 확장 로드맵)
    
    - IFID + status 기반 **에러율(%)**
    - IFID + SQL 비중 **Stacked bar**
    - traceId 클릭 → SQL 자동 필터(Drill-down)
    - 대시보드 JSON export 및 형상관리(버전 관리)
    
    ---
    
    원하면, 위 문서를 **“제출용 1페이지 요약본(성과 중심)”**도 같이 만들어드릴게요.
    
    (예: *문제 → 원인 → 조치 → 성과(수치) → 운영 효과* 형태로, 팀장/임원 보고용)
    
- 결과물(2)
    
    
    # [1부] Logging Starter 개발자 가이드 (User Guide)
    
    ---
    
    ## 1. 개요 (Overview)
    
    **logging-starter**는 Spring Boot 기반 애플리케이션에서 발생하는
    
    HTTP 요청(Request) 및 응답(Response) 로그를 **표준화된 포맷**으로 수집하고,
    
    중앙 집중형 로깅 시스템(Loki)으로 전송하기 위한 **공통 로깅 라이브러리**입니다.
    
    개발자는 복잡한 Filter / Interceptor / Logback 설정을 직접 구성하지 않아도,
    
    **의존성 추가만으로 APM(Application Performance Monitoring) 환경에 즉시 연동**할 수 있습니다.
    
    본 라이브러리는 다음 목표를 가지고 설계되었습니다.
    
    - 로그 포맷 표준화
    - 요청 단위 Trace 추적성 확보
    - 성능 저하 없는 안전한 바디 로깅
    - 중앙 집중형 로그 수집 및 시각화 연계
    
    ---
    
    ## 2. 설치 방법 (Installation)
    
    ### 2.1 Gradle 의존성 추가
    
    ```
    dependencies {
        implementation 'com.company:logging-starter:1.0.0'
    }
    
    ```
    
    의존성 추가만으로 자동 설정(Auto Configuration)이 적용되며,
    
    추가적인 설정 파일 작성 없이 바로 사용 가능합니다.
    
    ---
    
    ## 3. 주요 기능 (Key Features)
    
    ### 3.1 HTTP 트래픽 로깅
    
    - Request
        - URI
        - HTTP Method
        - Headers
        - Body (조건부)
    - Response
        - Status Code
        - Body (조건부)
        - 처리 시간(Latency)
    
    모든 로그는 **구조화된 JSON 포맷**으로 출력되어 Loki/Grafana와 자연스럽게 연동됩니다.
    
    ---
    
    ### 3.2 민감 정보 마스킹 (Sensitive Data Masking)
    
    - 개인정보, 인증 정보 등 민감 데이터 자동 마스킹
    - 로그 유출 시 보안 사고 예방
    - 마스킹 대상은 확장 가능하도록 설계
    
    ---
    
    ### 3.3 스마트 바디 로깅 (Smart Body Logging)
    
    - JSON / Text 기반 요청·응답은 로깅
    - 파일 업로드 / 다운로드와 같은 **바이너리 스트림은 자동 제외**
    - 불필요한 메모리 사용 및 성능 저하 방지
    
    ---
    
    ### 3.4 MDC 기반 Trace ID 지원
    
    - 요청 단위 고유 Trace ID 자동 생성
    - 모든 로그에 동일 Trace ID 전파
    - 장애 발생 시 요청 흐름 단위 추적 가능
    
    ---
    
    # [2부] 통합 로깅 시스템 구축 및 트러블슈팅 보고서
    
    ---
    
    ## 1. 프로젝트 개요
    
    ### 1.1 배경
    
    마이크로서비스 및 다중 서버 환경에서
    
    개별 서버 로그를 직접 확인하는 방식은 다음과 같은 한계를 가집니다.
    
    - 서버 접근 권한 필요
    - 로그 분산으로 인한 추적 어려움
    - 장애 원인 분석에 과도한 시간 소요
    - 대용량 트래픽 환경에서 로깅으로 인한 성능/메모리 문제
    
    이에 따라 다음 요구사항을 충족하는 시스템이 필요했습니다.
    
    - 로그 수집의 중앙 집중화
    - 성능에 영향을 주지 않는 로깅 구조
    - 실시간 모니터링 및 시각화
    - 장애 분석 시간 단축
    
    ---
    
    ### 1.2 Observability 아키텍처 (PLG Stack)
    
    본 프로젝트에서는 비용 효율성과 확장성을 고려하여
    
    - *PLG 스택 (Alloy + Loki + Grafana)**을 채택했습니다.
    
    ### 전체 구성
    
    - **Application**
        - logging-starter
        - Logback 기반 JSON 로그 생성
    - **Collector**
        - Grafana Alloy
        - 로그 수집, 라벨링 후 Loki 전송
    - **Storage**
        - Grafana Loki
        - 로그 인덱싱 및 저장
    - **Visualization**
        - Grafana
        - 로그 검색, 대시보드, 알람
    
    ---
    
    ## 2. 핵심 트러블슈팅 (Troubleshooting)
    
    ### 2.1 문제 상황
    
    **대용량 파일 다운로드 시 OutOfMemoryError 발생**
    
    logging-starter 초기 버전 배포 이후,
    
    Excel / PDF 등 **대용량 파일 다운로드 API 호출 시 서버가 다운되는 현상**이 발생했습니다.
    
    ### 증상
    
    - Heap Memory 급증
    - Full GC 반복 후 OOM 발생
    - 애플리케이션 프로세스 종료
    
    ### 환경
    
    - Content-Type: `application/octet-stream`
    - 수십 ~ 수백 MB 파일 다운로드 요청
    
    ---
    
    ### 2.2 원인 분석
    
    원인은 **ContentCachingResponseWrapper 사용 방식**에 있었습니다.
    
    - 해당 Wrapper는 응답 본문을 로깅하기 위해
        - **응답 Body 전체를 byte[]로 힙 메모리에 복사**
    - 파일 다운로드 응답의 경우:
        - 파일 크기만큼의 byte[]가 힙에 적재
        - GC가 해소하지 못하고 OOM 발생
    
    즉,
    
    > 스트림 기반 전송이어야 할 응답을 메모리 캐싱 방식으로 처리한 것이 문제였습니다.
    > 
    
    ---
    
    ### 2.3 해결 방안
    
    **Content-Type 기반 조건부 래핑 (Conditional Wrapping)**
    
    모든 응답에 Wrapper를 적용하는 방식 대신,
    
    **로깅이 필요한 경우에만 Wrapper를 적용**하도록 구조를 변경했습니다.
    
    ### 개선된 로직 흐름
    
    1. 요청/응답의 Content-Type 검사
    2. `application/json` 등 텍스트 기반 응답만 로깅 대상으로 판단
    3. 파일 다운로드(`application/octet-stream`, `image/*` 등)는 Wrapper 적용 제외
    4. 스트림 방식 그대로 클라이언트로 전송
    
    ---
    
    ### 2.4 적용 코드 (의사 코드)
    
    ```java
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) {
    
        boolean isJsonRequest = isJsonType(request.getContentType());
    
        // 파일 다운로드 등 비 JSON 응답은 Wrapper 미적용
        if (!isJsonRequest) {
            filterChain.doFilter(request, response);
            return;
        }
    
        // JSON 응답만 캐싱 Wrapper 적용
        ContentCachingResponseWrapper responseWrapper =
                new ContentCachingResponseWrapper(response);
    
        filterChain.doFilter(request, responseWrapper);
    
        logResponse(responseWrapper);
        responseWrapper.copyBodyToResponse();
    }
    
    ```
    
    ---
    
    ### 2.5 결과
    
    - ✅ 대용량 파일 다운로드 시 Heap Memory 안정화
    - ✅ OOM 문제 완전 해소
    - ✅ 불필요한 메모리 복사 제거로 응답 성능 개선
    - ✅ JSON API 로깅 기능 유지
    
    ---
    
    ## 3. 모니터링 대시보드 구축 결과
    
    ### 3.1 실시간 로그 스트림 & 에러 트래킹
    
    - ERROR / WARN 로그 실시간 조회
    - Trace ID 기반 요청 흐름 추적
    - 장애 발생 시 즉각적인 원인 파악 가능
    
    > 📌 (여기에 Grafana 로그 리스트 / 에러 발생 그래프 캡처 삽입)
    > 
    
    ---
    
    ### 3.2 API Latency 및 처리량(Throughput) 시각화
    
    logging-starter에서 수집한 실행 시간 데이터를 기반으로:
    
    - API별 평균 응답 시간
    - 요청량 추이
    - 지연 구간(병목) 시각화
    
    > 📌 (여기에 Grafana Latency / TPS 대시보드 캡처 삽입)
    > 
    
    ---
    
    ## 4. 결론
    
    본 프로젝트를 통해 **logging-starter**를 개발하여
    
    전사 공통 로그 표준과 안정적인 APM 환경을 구축했습니다.
    
    특히,
    
    파일 처리 시 발생했던 **치명적인 Heap Memory 이슈를 구조적으로 해결**함으로써
    
    시스템 안정성과 운영 신뢰성을 크게 향상시켰습니다.
    
    현재 구축된 **Loki + Grafana 기반 APM 환경**은
    
    운영 팀의 장애 대응 시간을 획기적으로 단축시키는 핵심 인프라로 활용되고 있습니다.
    
    ---
    
    원하면 다음도 바로 만들어줄게:
    
    - 📑 **노션 목차 자동 접힘 버전**
    - 🎤 **발표용 요약 슬라이드 스크립트**
    - 🧠 **“이 문제를 왜 이렇게 풀었는지” 면접용 설명**
    - 🛠 **logging-starter 아키텍처 다이어그램 문안**
    
    다음은 어디에 쓰려고 해?
    

---

- Gradle 의존성 추가 (라이브러리 배포)
    
    
- Starter 제작 이슈
    
    ---
    
    # 🧩 Logging Starter 라이브러리 제작 & 배포 정리
    
    > 사내 공용 Logging Filter를 Spring Boot Starter 형태로 분리하고
    > 
    > 
    > `mavenLocal` / `JitPack` 배포까지 진행하며 겪은 이슈와 해결 방법 정리
    > 
    
    ---
    
    ## 1️⃣ JitPack이 처음에 안 되었던 이유
    
    ### ❌ 증상
    
    - JitPack 빌드는 성공 메시지가 나오지만
    - 실제로 dependency를 추가하면 **가져오지 못함**
    - `Could not find com.github.xxx:logging-starter:version`
    
    ### 🔍 원인 요약
    
    1. **Git tag가 없음**
        - JitPack은 **tag 또는 release 기준**으로 artifact를 생성함
        - tag가 없으면 `0-g<commit>` 같은 임시 버전만 생성됨
    2. **publish 대상이 없었음**
        - `publishToMavenLocal` 실행 시
            
            ```
            Skipping task ':publishToMavenLocal' as it has no actions.
            
            ```
            
        - 원인: `publishing { publications { ... } }` 설정 누락
    3. **Gradle metadata 검증 실패**
        - Starter 특성상 버전 없는 의존성(BOM 기반)을 사용
        - Gradle 8.x에서 metadata 생성 단계에서 차단됨
    
    ### ✅ 해결 요약
    
    - GitHub에 **명시적 tag 생성**
    - `publishing` 블록 명확히 설정
    - Gradle Module Metadata 비활성화
    
    ---
    
    ## 2️⃣ Spring Boot Starter 만드는 기본 구조
    
    ### 📁 프로젝트 성격
    
    - **실행 애플리케이션 ❌**
    - **라이브러리 / Starter ⭕**
    
    ### 핵심 구성 요소
    
    1. **AutoConfiguration**
        
        ```java
        @Configuration
        @ConditionalOnWebApplication
        public class LoggingAutoConfiguration { ... }
        
        ```
        
    2. **조건부 활성화**
        
        ```java
        @ConditionalOnProperty(
            prefix = "log.trace",
            name = "enabled",
            havingValue = "true",
            matchIfMissing = true
        )
        
        ```
        
    3. **Filter / Interceptor / Hook**
        - 실제 로깅 로직 담당
        - 반드시 **Spring Bean**으로 관리
    4. **META-INF 등록**
        - (Spring Boot 3.x 기준)
        
        ```
        META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
        
        ```
        
    
    ---
    
    ## 3️⃣ build.gradle에서 `api` / `compileOnly`를 쓰는 이유
    
    ### ❌ 문제의 시작
    
    ```
    api 'org.springframework:spring-web'
    
    ```
    
    → publish 시 에러 발생
    
    ```
    Publication only contains dependencies without a version
    
    ```
    
    ### 🎯 핵심 원칙 (Starter 설계 철학)
    
    | 구분 | 의미 | 사용 이유 |
    | --- | --- | --- |
    | `api` | 외부에 노출되는 계약 | 최소화해야 함 |
    | `compileOnly` | 소비 프로젝트에 이미 있을 것이라 가정 | Starter 정석 |
    
    ### ✅ 정답 구조
    
    ```
    dependencies {
        /* 환경 의존 라이브러리 */
        compileOnly 'org.springframework.boot:spring-boot-autoconfigure'
        compileOnly 'org.springframework:spring-web'
        compileOnly 'jakarta.servlet:jakarta.servlet-api'
        compileOnly 'com.fasterxml.jackson.core:jackson-databind'
    
        /* 외부 노출 계약 */
        api 'org.slf4j:slf4j-api'
    
        /* 선택적 훅 */
        compileOnly 'org.mybatis:mybatis:3.5.15'
    }
    
    ```
    
    👉 Starter는 **버전을 강제하지 않는다**
    
    👉 버전 관리는 **소비 프로젝트의 BOM(Spring Boot)** 몫
    
    ---
    
    ## 4️⃣ mavenLocal() 테스트 흐름
    
    ### 1️⃣ 로컬에 publish
    
    ```bash
    ./gradlew clean publishToMavenLocal
    
    ```
    
    ### 2️⃣ 결과 확인 경로
    
    ```bash
    ~/.m2/repository/com/company/logging-starter/1.0.0/
    
    ```
    
    정상이라면:
    
    ```
    logging-starter-1.0.0.jar
    logging-starter-1.0.0.pom
    
    ```
    
    ### 3️⃣ 소비 프로젝트에서 사용
    
    ```
    repositories {
        mavenLocal()
        mavenCentral()
    }
    
    dependencies {
        implementation 'com.company:logging-starter:1.0.0'
    }
    
    ```
    
    📌 `mavenLocal()` 없으면 절대 인식 안 됨
    
    ---
    
    ## 5️⃣ JitPack에서 Git tag를 사용하는 이유
    
    ### 🔍 JitPack 동작 방식
    
    - `tag` or `release` 기준으로 artifact 생성
    - tag가 없으면 임시 snapshot만 생성
    
    ### ✅ 권장 방식
    
    ```bash
    git tag v1.0.0
    git push origin v1.0.0
    
    ```
    
    ### Gradle dependency 예시
    
    ```
    repositories {
        maven { url 'https://jitpack.io' }
    }
    
    dependencies {
        implementation 'com.example.framework:logging-starter:v1.0.0'
    }
    
    ```
    
    📌 tag = **버전의 기준점**
    
    📌 JitPack은 Maven Central이 아님 → tag 필수
    
    > [!NOTE]
> [https://jitpack.io/tests](https://jitpack.io/tests) 에서 정상 배포되었는지 확인가능
>     
>     - 빌드 로그
>     - 배포 상태
>     - 등등 체크가능…
    
    ---
    
    ## 6️⃣ properties 값이 소비 프로젝트에서 안 먹었던 이유 & 해결
    
    ### ❌ 문제 코드
    
    ```java
    @Value("${log.trace.level:PROD}")
    private String levelConfig;
    
    ```
    
    ### ❌ 원인
    
    1. Starter에서 `@Value`는 **binding 순서 보장 안 됨**
    2. `new LoggingFilter()`로 직접 객체 생성
        
        → Spring 컨테이너 우회
        
        → 설정 주입 불가
        
    
    ---
    
    ### ✅ 정답 해결 방법
    
    ### 1️⃣ `@ConfigurationProperties` 사용
    
    ```java
    @ConfigurationProperties(prefix = "log")
    public class LoggingProperties {
        private Trace trace = new Trace();
        ...
    }
    
    ```
    
    ### 2️⃣ AutoConfiguration에서 활성화
    
    ```java
    @EnableConfigurationProperties(LoggingProperties.class)
    
    ```
    
    ### 3️⃣ Filter는 **Spring Bean으로 생성**
    
    ```java
    @Bean
    public FilterRegistrationBean<LoggingFilter> loggingFilter(
            LoggingFilter loggingFilter
    ) {
        bean.setFilter(loggingFilter); // ❌ new 제거
    }
    
    ```
    
    ### 4️⃣ 소비 프로젝트 설정
    
    ```yaml
    log:
      trace:
        level: DEBUG
      slow:
        query:
          ms: 100
          total-ms: 300
    
    ```
    
    📌 **Starter에서는 `@Value` 사용 금지**
    
    📌 반드시 `@ConfigurationProperties + 생성자 주입`
    
    ---
    
    ## 🧠 최종 한 줄 정리
    
    > Spring Boot Starter는“환경을 가정하고, 버전을 강제하지 않으며,Spring이 생성한 Bean만 다룬다.”
    > 
    
    ---
    
    원하면 다음으로:
    
    - JPA / MyBatis 조건부 AutoConfig 분리
    - logging-starter v1.x / v2.x 버전 전략
    - 사내 표준 Starter 템플릿화
    
    이 정리 그대로 노션에 넣어도 된다.
    

---

- grafana(LOG QL)
    
    ```bash
    {app="IMS 또는 MMS", env="prod"}
    ```
    
    - 평균 API 응답시간 (stat)
    
    ```bash
    avg_over_time(
      {app="IMS", env="prod"} |= "[API_PROD]"
      | regexp "sqlElapsed=(?P<sqlElapsed>[0-9]+)ms"
      | unwrap sqlElapsed
    [1m]
    )
    
    ```
    
    - 평균 SQL 소요시간 (stat)
    
    ```bash
    avg_over_time(
      {app="IMS", env="prod"} |= "[API_PROD]"
      | regexp "sqlCount=(?P<sqlCount>[0-9]+)"
      | unwrap sqlCount
    [1m]
    )
    ```
    
    - API 응답시간 추이 (time series)
    
    ```bash
    avg_over_time(
      {app="IMS", env="prod"} |= "[API_PROD]"
      | regexp "elapsed=(?P<elapsed>[0-9]+)ms"
      | unwrap elapsed
    [1m])
    
    ```
    
    - API 호출량 (time series)
    
    ```bash
    count_over_time(
      {app="IMS", env="prod"} |= "[API_PROD]"
    [1m])
    ```
    
    - IFID별 평균 SQL 개수 (pie chart)
    
    ```bash
    avg_over_time(
      {app="IMS", env="prod"} |= "[API_PROD]"
      | regexp "IFID=(?P<ifid>[^ ]+).*sqlCount=(?P<sqlCount>[0-9]+)"
      | unwrap sqlCount
    [5m])by (ifid)
    ```
    
    - IFID별 평균 응답시간 (bar guage)
    
    ```bash
    avg_over_time(
      {app="IMS", env="prod"} |= "[API_PROD]"
      | regexp "IFID=(?P<ifid>[^ ]+).*elapsed=(?P<elapsed>[0-9]+)ms"
      | unwrap elapsed
    [5m])by (ifid)
    ```
    
    - IFID별 호출량 (bar chart)
    
    ```bash
    count_over_time(
      {app="IMS", env="prod"} |= "[API_PROD]"
      | regexp "IFID=(?P<ifid>[^ ]+)"
    [5m]
    ) by (ifid)
    ```
    
    - SQL 상세로그 (logs)
    
    ```bash
    {app="IMS", env="prod"} |= "[API_PROD] [SQL]"
    ```
    
    - 에러로그 (logs)
    
    ```bash
    {app="IMS", env="prod"} |= "[ERROR]"
    ```
    
    - Slow 쿼리 (logs)
    
    ```bash
    {app="IMS", env="prod"} |= "[SLOW_SQL]"
    ```
    
- 트러블슈팅 (로그확인법)
    - alloy 로그 확인법
    
    ```bash
    journalctl -u alloy.service -f
    ```
    
    - loki 로그 확인법
    
    ```bash
    journalctl -u loki.service -f
    ```
    
    - 포트 열린거 확인방법
    
    ```bash
    nc -z -v -w 3 [IP] [PORT]
    
    // -v : 디버깅모드
    // timeout 시 방화벽확인필요)
    ```
    
    - 서버 공인 IP 확인방법
    
    ```bash
    curl ifconfig.me
    ```
    
    ---
    
    ## Heap Mem (OOM 오류)
    
    - ResponseBody byte[] copy 시, 대용량 데이터일경우, response body에 넣을때 heap 메모리 오류가 날 수 있음  >> 해당부분 분기처리하여, log 기록에 쌓이는 최대 사이즈를 지정 (1MB) , response 응답의 경우 wrapper없이 전달 (meta 정보만 log에 기록)
    
    - 대용량 파일 다운로드시 발생
        - 파일을 stream으로 다루지 않아서 힙메모리 이슈가 발생 (steam으로 변경)
        - 더불어, log body에도 capture를 찍어서 java heap 메모리 오버 발생 (수정 - 분기처리)
