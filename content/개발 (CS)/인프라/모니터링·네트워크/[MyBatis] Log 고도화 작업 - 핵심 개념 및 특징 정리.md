---
title: "Log 고도화 작업"
tags: [학습, 개발-CS, 인프라, 개발, Logging, MyBatis, Grafana, Loki, Observability]
modified: 2026-09-05
---

# Log 고도화 작업

> [!NOTE]
> Spring + MyBatis 서버의 로그를 "코드 위치 기준" 산발적 로그에서 "요청 흐름(trace) 기준"
> 로그로 재설계하고, Loki + Grafana로 가시화한 뒤, 사내 공용 `logging-starter` 라이브러리로
> 배포하기까지의 작업 기록. 상위 설계 배경(왜 유료 APM 대신 Loki를 택했는지 등)은
> [Logging & MyBatis Quality Gate 통합 아키텍처]([MyBatis]%20Logging%20&%20MyBatis%20Quality%20Gate%20통합%20아%20-%20핵심%20개념%20및%20특징%20정리.md) 참고.

## 개요 (문제 → 접근 → 결과)

- **문제**: 기존 로그는 "코드 어디서 찍었는가"만 알 수 있을 뿐, 하나의 요청이 `request → SQL 여러 번 → response`로 이어지는 시간 흐름을 재구성할 수 없었다. 장애 시 로그를 뒤져도 어떤 요청이 어떤 SQL을 유발했는지 연결이 안 됐다.
- **접근**: Filter(요청/응답 캡처) + MyBatis Interceptor(SQL 관측) + ThreadLocal 기반 TraceContext를 하나의 traceId로 묶어, "같은 요청에서 발생한 SQL을 누적했다가 응답 시점에 한 번에" 흐름 순서대로 출력하도록 재설계했다. 이후 로그 레벨(TRACE/DEBUG/PROD/WARN)을 도입해 운영에서는 최소 정보만 남기고 필요할 때만 상세 추적이 가능하게 했다.
- **결과**: 로그 사이즈 약 33.8% 감소(71KB → 47KB), Grafana + Loki 기반 대시보드/알람 구축, 사내 공용 `logging-starter`로 라이브러리화하여 다른 프로젝트에서도 의존성 추가만으로 재사용 가능하게 만들었다. 라이브러리화 과정에서 겪은 JitPack 배포 실패, 대용량 파일 다운로드 시 OOM 이슈도 함께 해결했다(아래 트러블슈팅 참고).

## 1. 설계: 왜 Filter + MyBatis Interceptor 조합인가

로그를 "찍는 위치"가 아니라 "흐름을 조립한다"는 관점으로 접근한 것이 핵심이다. 이를 위해 책임을 계층별로 명확히 분리했다.

| 계층 | 역할 |
| --- | --- |
| Filter | Request/Response Wrapping, traceId 생성, 로그 시작/종료 |
| Interceptor(API) | API Request 메타 정보 |
| MyBatis Interceptor | SQL 실행 추적 (누적만, 로그 출력 X) |
| MDC / ThreadLocal | traceId·SQL 목록 공유 |

MyBatis Interceptor에서 SQL을 바로 로깅하지 않고 ThreadLocal에 누적만 하는 이유는, 이 시점에는 아직 request/response 컨텍스트를 알 수 없고, 최종 출력 순서(request → sql → response)를 보장하려면 응답이 끝나는 시점(Filter)에서 한 번에 조립해야 하기 때문이다.

```java
public class SqlTraceContextHolder {
    private static final ThreadLocal<List<SqlTrace>> SQL_TRACES =
            ThreadLocal.withInitial(ArrayList::new);

    public static void add(SqlTrace trace) { SQL_TRACES.get().add(trace); }
    public static List<SqlTrace> getAll() { return SQL_TRACES.get(); }
    public static void clear() { SQL_TRACES.remove(); }
}

@Data @AllArgsConstructor
public class SqlTrace {
    private String sql;
    private long elapsed;
}
```

```java
@Intercepts({
    @Signature(type = Executor.class, method = "query",
        args = {MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class}),
    @Signature(type = Executor.class, method = "update",
        args = {MappedStatement.class, Object.class})
})
public class SqlPerformanceInterceptor implements Interceptor {
    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        long start = System.currentTimeMillis();
        Object result = invocation.proceed();
        long elapsed = System.currentTimeMillis() - start;

        MappedStatement ms = (MappedStatement) invocation.getArgs()[0];
        String sql = ms.getBoundSql(invocation.getArgs()[1]).getSql();
        SqlTraceContextHolder.add(new SqlTrace(sql, elapsed)); // 누적만, logger 호출 없음

        return result;
    }
}
```

Filter는 요청 시작 시 traceId를 발급하고, 요청이 끝나는 시점(`finally`)에 request 로그 → 누적된 SQL 로그 → response 로그를 같은 traceId로 순서대로 출력한다.

```java
protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                 FilterChain chain) throws IOException, ServletException {
    String traceId = UUID.randomUUID().toString();
    MDC.put("traceId", traceId);

    RequestWrapper req = new RequestWrapper(request);
    ResponseWrapper res = new ResponseWrapper(response);
    long start = System.currentTimeMillis();

    try {
        chain.doFilter(req, res);
    } finally {
        long elapsed = System.currentTimeMillis() - start;

        log.info("[API_REQUEST] uri={}, method={}, body={}", req.getRequestURI(), req.getMethod(), req.getBody());
        for (SqlTrace sql : SqlTraceContextHolder.getAll()) {
            log.info("[SQL] elapsed={}ms sql={}", sql.getElapsed(), sql.getSql());
        }
        log.info("[API_RESPONSE] status={}, body={}, elapsed={}ms", res.getStatus(), res.getBodyAsString(), elapsed);

        response.getOutputStream().write(res.getBody());
        SqlTraceContextHolder.clear();
        MDC.clear();
    }
}
```

결과 로그 예시:

```
[traceId=abc123] [API_REQUEST] uri=/api/payment/send method=POST body={"mid":"123"}
[traceId=abc123] [SQL] elapsed=12ms sql=SELECT * FROM TB_MID WHERE MID=?
[traceId=abc123] [SQL] elapsed=3ms  sql=INSERT INTO TB_LOG ...
[traceId=abc123] [API_RESPONSE] status=200 body={"result":"OK"} elapsed=27ms
```

### 왜 (MyBatis/API) Interceptor가 아니라 Filter에서 최종 출력을 담당하는가

| 이유 | 설명 |
| --- | --- |
| SQL은 MyBatis Interceptor 안에서 발생 | Spring MVC Interceptor 시점에서는 SQL 정보를 알 수 없음 |
| Response body는 Interceptor에서 접근 불가 | 이미 커밋된 상태라 body를 읽을 수 없음 |
| 전체 소요 시간 측정 | 요청 시작~응답 종료까지를 감싸는 Filter에서만 가능 |

## 2. 부수 효과: 레거시 관찰 기반 리팩토링의 발판

이 작업은 단순히 "로그를 잘 찍자"가 아니라, 내부 로직을 신뢰하기 어려운 레거시 코드에서 **유일하게 신뢰할 수 있는 입·출력(request/response)을 근거로 삼아 안전하게 개선할 수 있는 기반**을 만드는 작업이기도 했다. 이른바 Golden Master 전략이다 — "지금 시스템이 실제로 어떻게 동작하는지 기록하고, 이후 변경 후에도 동일하게 동작하는지 비교"하는 접근이다.

- Request/SQL/Response 로그가 곧 테스트 픽스처(입력·기대값)가 된다.
- 단위테스트나 리팩토링을 먼저 시작하는 것이 아니라, "관찰 → (변하지 않는 것) 고정 → API 단위 스냅샷 테스트로 보호 → 그다음에 개선"하는 순서를 따른다. 레거시 코드에서는 이 순서를 지키지 않고 테스트/설계 정비부터 시작하면 실패하기 쉽다는 것이 실무적으로 확인된 경험칙이다.

## 3. 로그 레벨링 (TRACE / DEBUG / PROD / WARN)

운영에서 항상 상세 로그를 남기면 비용·성능 부담이 크므로, 목적별로 4단계를 정의했다.

```
TRACE : 원문 해부 (단기·조건부, 에러 발생 시 자동 승격 또는 특정 요청 강제 지정)
DEBUG : 개발/리팩토링 (request/response + SQL parameter)
PROD  : 운영 기본값 (측정값 위주: 응답시간, SQL시간/개수, Slow SQL, 핵심 에러)
WARN  : 이상 징후 (조건 기반: sqlElapsed > 1초, sqlCount > 20 등)
```

핵심 설계 포인트:

- MyBatis Interceptor는 레벨과 무관하게 **항상 SQL을 누적만** 하고, 실제로 무엇을 로그로 남길지는 Filter가 최종 결정한다(출력 책임의 단일화).
- 운영 기본은 PROD로 가볍게 유지하되, **예외 발생·5xx 응답 시 자동으로 TRACE 레벨로 승격**해 원인 파악에 필요한 정보를 놓치지 않는다.
- 특정 요청만 디버깅하고 싶을 때는 헤더(`X-Debug-Trace`)나 쿼리 파라미터로 강제 TRACE를 지정할 수 있다.
- WARN은 별도 레벨이라기보다 임계치 기반 "조건"에 가깝다(느린 SQL 등을 별도 키워드로 남겨 Loki에서 바로 필터링 가능하게 함).

```java
public enum TraceLevel { TRACE, DEBUG, PROD }

public class TraceContextHolder {
    private static final ThreadLocal<TraceLevel> LEVEL = new ThreadLocal<>();
    private static final ThreadLocal<Boolean> FORCE_TRACE = new ThreadLocal<>();

    public static void init(TraceLevel level, boolean forceTrace) { LEVEL.set(level); FORCE_TRACE.set(forceTrace); }
    public static boolean isForceTrace() { return Boolean.TRUE.equals(FORCE_TRACE.get()); }
    public static boolean isTrace() { return LEVEL.get() == TraceLevel.TRACE || isForceTrace(); }
    public static boolean isDebug() { return LEVEL.get() == TraceLevel.DEBUG || isTrace(); }
    public static void clear() { LEVEL.remove(); FORCE_TRACE.remove(); }
}
```

```java
// Filter의 finally 블록에서 레벨/에러 여부에 따라 분기
long elapsed = System.currentTimeMillis() - start;
boolean errorTrace = exception != null || res.getStatus() >= 500;

if (TraceContextHolder.isTrace() || errorTrace) {
    logTrace(req, res, elapsed, exception);   // uri/method/params/body/sql원문/응답 전체
} else if (TraceContextHolder.isDebug()) {
    logDebug(req, res, elapsed);              // + SQL parameter, sqlCount/sqlElapsed
} else {
    logProd(req, res, elapsed);               // bodyHash(민감정보 미노출) + 측정값만
}

// WARN: 조건 기반
if (SqlTraceContextHolder.totalElapsed() > 1000) {
    log.warn("[SLOW_SQL] traceId={} totalSqlElapsed={}ms", MDC.get("traceId"), SqlTraceContextHolder.totalElapsed());
}
```

PROD 로그는 개인정보/민감정보가 섞일 수 있는 body를 그대로 남기지 않고 `bodyHash`(해시값)만 남겨, 문제가 생겼을 때 TRACE로 승격해서 원문을 확인하는 2단계 구조를 취한다.

## 4. Grafana + Loki 가시화

로그 키워드 `[API_PROD]`를 기준으로 LogQL을 작성해 대시보드를 구성했다. 실제 운영에 적용한 쿼리는 `{app="IMS 또는 MMS", env="prod"}` 라벨을 기준으로 하며, 대표 패턴은 다음과 같다(전체 LogQL 문법 정리는 [LogQL 쿼리 문법 정리]([Spring]%20LogQL%20쿼리%20문법%20정리%20(필터·집계·rate·pattern)%20-%20핵심%20개념%20및%20특징%20정리.md) 참고).

```
# 전체 평균 API 응답시간 (Stat / Time series)
avg_over_time(
  {app="IMS", env="prod"} |= "[API_PROD]"
  | regexp "elapsed=(?P<elapsed>[0-9]+)ms"
  | unwrap elapsed
[1m])

# IFID(인터페이스 ID)별 평균 응답시간 — 느린 API TOP 파악용
avg_over_time(
  {app="IMS", env="prod"} |= "[API_PROD]"
  | regexp "IFID=(?P<ifid>[^ ]+).*elapsed=(?P<elapsed>[0-9]+)ms"
  | unwrap elapsed
[5m]) by (ifid)

# 상태코드 5xx / 에러 로그
{app="IMS", env="prod"} |= "[API_PROD]" |= "status=5"
{app="IMS", env="prod"} |= "[ERROR]"

# Slow Query 전용 키워드 (WARN 로그와 매칭)
{app="IMS", env="prod"} |= "[SLOW_SQL]"

# p95 API 응답시간 (평균만으로는 안 보이는 최악 체감 성능 파악)
quantile_over_time(0.95,
  {app="IMS", env="prod"} |= "[API_PROD]"
  | regexp "IFID=(?P<ifid>[^ ]+).*elapsed=(?P<elapsed>[0-9]+)ms"
  | unwrap elapsed
[5m]) by (ifid)
```

**대시보드 구성**: 상단(전체 Avg API/SQL ms), 중단(응답시간·호출량 추이 Time series), 하단(IFID별 Bar gauge + 원문 확인용 Logs 패널)으로 배치해, 이상 징후 발견 → IFID로 원인 API 특정 → 해당 SQL 원문 확인까지 한 화면에서 가능하게 했다.

**Grafana Alert**: Slow Query 발생 시, Exception 발생 시, API 응답시간이 임계치를 넘을 시 각각 메일로 통지하도록 구성해 "장애 발생 후 확인"이 아니라 "선제 인지"가 가능하게 했다.

## 5. 최종 성과

- 로그 사이즈 **약 33.8% 감소**(적용 전 71KB → 적용 후 47KB, 약 1/3 절감) — PROD 레벨을 측정값 위주로 최소화한 효과
- Slow Query를 사후 로그 분석이 아니라 알람으로 즉시 인지 가능
- traceId 기준으로 요청 단위 흐름(request → sql → response)을 그대로 추적 가능
- `[ERROR]` 키워드로 에러 로그만 즉시 필터링해 대응 시간 단축
- 평균 응답시간 추이를 근거로 성능 저하를 선제적으로 파악 가능

## 6. `logging-starter` 라이브러리화

동일한 Filter/Interceptor 설정을 프로젝트마다 반복 구현하지 않도록, 사내 공용 Spring Boot Starter로 분리해 배포했다. 소비 프로젝트는 의존성 추가만으로 표준 로깅이 자동 적용된다.

```groovy
dependencies {
    implementation 'com.company:logging-starter:1.0.0'
}
```

**주요 기능**: HTTP 요청/응답 구조화 로깅(JSON), 민감정보 자동 마스킹, 텍스트 기반 요청·응답만 로깅하고 파일 업/다운로드 같은 바이너리 스트림은 자동 제외(스마트 바디 로깅), MDC 기반 traceId 자동 전파.

### 트러블슈팅 A — JitPack 배포가 안 되던 이유

**증상**: JitPack 빌드는 성공 메시지가 뜨는데 실제로 의존성을 추가하면 `Could not find com.github.xxx:logging-starter:version`로 가져오지 못함.

**원인**:
1. Git tag/release가 없어 JitPack이 `0-g<commit>` 형태의 임시 버전만 생성
2. `publishing { publications { ... } }` 설정이 없어 `publishToMavenLocal`이 아무 동작도 하지 않음
3. Starter 특성상 버전 없는 BOM 기반 의존성을 쓰는데, Gradle 8.x의 Gradle Module Metadata 검증 단계에서 차단됨

**해결**: GitHub에 명시적 tag 생성(`git tag v1.0.0 && git push origin v1.0.0`) + `publishing` 블록 명시 + Gradle Module Metadata 비활성화. JitPack은 Maven Central과 달리 tag/release를 버전의 기준점으로 삼기 때문에 tag가 필수다. `https://jitpack.io/tests`에서 빌드 로그와 배포 상태를 확인할 수 있다.

### Starter 설계 원칙 — `api` 대신 `compileOnly`를 쓰는 이유

Starter가 의존성에 고정 버전을 강제하면(`api 'org.springframework:spring-web'`), publish 시 "Publication only contains dependencies without a version" 에러가 나고, 소비 프로젝트의 Spring Boot BOM과 버전이 충돌할 수 있다. 그래서 Starter는 실행 환경에 이미 존재할 것으로 가정되는 라이브러리는 `compileOnly`로 선언하고(버전 관리는 소비 프로젝트의 BOM에 위임), 외부에 노출해야 하는 최소 계약만 `api`로 선언한다.

```groovy
dependencies {
    compileOnly 'org.springframework.boot:spring-boot-autoconfigure'
    compileOnly 'org.springframework:spring-web'
    compileOnly 'jakarta.servlet:jakarta.servlet-api'
    compileOnly 'com.fasterxml.jackson.core:jackson-databind'
    compileOnly 'org.mybatis:mybatis:3.5.15'

    api 'org.slf4j:slf4j-api'
}
```

로컬 검증은 `./gradlew clean publishToMavenLocal` 후 `~/.m2/repository/...`에 jar/pom이 생성됐는지 확인하고, 소비 프로젝트 `repositories`에 `mavenLocal()`을 반드시 추가해야 인식된다.

### 트러블슈팅 B — 설정값(`application.yml`)이 소비 프로젝트에 반영되지 않던 이유

**증상**: `@Value("${log.trace.level:PROD}")`로 값을 주입받게 했는데, 소비 프로젝트의 `application.yml` 설정이 전혀 반영되지 않음.

**원인**: Starter 내부에서 `new LoggingFilter()`로 직접 객체를 생성하고 있었다 — 이렇게 하면 Spring 컨테이너를 우회하게 되어 `@Value` 바인딩 자체가 적용되지 않는다.

**해결**: `@Value` 대신 `@ConfigurationProperties`로 설정을 묶고, `LoggingFilter`는 반드시 `@Bean`으로 등록해 Spring이 생성/주입하도록 변경했다.

```java
@ConfigurationProperties(prefix = "log")
public class LoggingProperties {
    private Trace trace = new Trace();
    // ...
}

@EnableConfigurationProperties(LoggingProperties.class)
public class LoggingAutoConfiguration {
    @Bean
    public FilterRegistrationBean<LoggingFilter> loggingFilter(LoggingFilter loggingFilter) {
        // new LoggingFilter() 로 직접 생성하지 않는다 — Spring이 만든 Bean을 그대로 등록
        ...
    }
}
```

```yaml
log:
  trace:
    level: DEBUG
  slow:
    query:
      ms: 100
      total-ms: 300
```

**교훈**: Spring Boot Starter는 "환경을 가정하고, 버전을 강제하지 않으며, Spring이 생성한 Bean만 다룬다"는 원칙을 지켜야 한다 — Starter 안에서 `@Value`와 `new`로 직접 객체를 만드는 방식은 정상적으로 동작하지 않는다.

## 7. 운영 트러블슈팅 — 대용량 파일 다운로드 시 OutOfMemoryError

**증상**: `logging-starter` 배포 이후 Excel/PDF 등 대용량 파일 다운로드 API 호출 시 서버가 다운됐다. Heap 메모리가 급증하고 Full GC가 반복되다 결국 OOM으로 프로세스가 종료됐다.

**원인**: 응답을 로깅하기 위해 사용한 `ContentCachingResponseWrapper`가 응답 body 전체를 byte[]로 힙 메모리에 복사하는 방식이었다. 파일 다운로드처럼 원래 스트림으로 전송돼야 할 응답까지 이 방식으로 처리하다 보니, 파일 크기만큼의 byte[]가 힙에 계속 쌓여 GC가 감당하지 못했다.

**해결**: 모든 응답에 Wrapper를 무조건 적용하지 않고, Content-Type을 먼저 검사해 **텍스트/JSON 응답만 조건부로 Wrapper를 적용**하도록 변경했다. `application/octet-stream`, `image/*` 등 파일 응답은 Wrapper 없이 스트림 그대로 클라이언트에 전달한다.

```java
@Override
protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                 FilterChain filterChain) {
    boolean isJsonRequest = isJsonType(request.getContentType());

    if (!isJsonRequest) {
        // 파일 다운로드 등 비 JSON 응답은 Wrapper 미적용 — 스트림 그대로 전달
        filterChain.doFilter(request, response);
        return;
    }

    ContentCachingResponseWrapper responseWrapper = new ContentCachingResponseWrapper(response);
    filterChain.doFilter(request, responseWrapper);
    logResponse(responseWrapper);
    responseWrapper.copyBodyToResponse();
}
```

**결과**: 대용량 파일 다운로드 시 Heap 메모리가 안정화되고 OOM이 해소됐으며, 불필요한 메모리 복사가 사라져 응답 성능도 함께 개선됐다. JSON API에 대한 로깅 기능은 그대로 유지된다.

## 8. 운영 참고 — 로그/네트워크 확인 명령어

```bash
# Alloy(로그 수집기) 로그 확인
journalctl -u alloy.service -f

# Loki 로그 확인
journalctl -u loki.service -f

# 포트 개방 여부 확인 (timeout 시 방화벽 확인 필요)
nc -z -v -w 3 [IP] [PORT]

# 서버 공인 IP 확인
curl ifconfig.me
```
