---
title: "[JAVA 기술면접] Spring·Web 빈출 질문"
tags: [기술면접, JAVA 관련 기술면접, Spring, Spring Boot, JPA, 웹, 보안, 인증]
created: 2026-10-19
modified: 2026-10-19
---

# [JAVA 기술면접] Spring·Web 빈출 질문

> [!NOTE]
> Java–Web–Spring 면접에서 자주 나오는 질문을 영역별 표로 정리했다. 답변은 **한 줄 정의 → 핵심 이유 → 함정/실무 포인트** 순서로 외우면 꼬리 질문에 대응하기 쉽다.
> 개별 심화 주제는 [HTTP·REST와 요청 처리 흐름](기술면접/WEB/[JAVA%20기술면접]%20HTTP·REST와%20요청%20처리%20전체%20흐름.md), [동시성·락](기술면접/WEB/[JAVA%20기술면접]%20동시성·락%20—%20String%20계열·락%20종류·데드락.md), [멀티 DB 트랜잭션](기술면접/WEB/[JAVA%20기술면접]%20멀티%20DB%20트랜잭션%20—%20분산%20트랜잭션·XA·Saga.md) 문서를 참고.

---

## 1. Spring 핵심 (IoC · DI · Bean · AOP)

| 질문 | 답변 요지 |
| --- | --- |
| IoC / DI란? | **IoC**: 객체 생성과 의존 관계 연결의 제어권을 코드가 아니라 컨테이너가 가짐. **DI**: 필요한 의존 객체를 외부에서 주입. 결합도↓, 테스트(Mock 주입)·교체 용이. |
| DI 방식 3가지와 권장 방식? | 생성자 / 세터 / 필드 주입. **생성자 주입 권장**: 불변(`final`), 필수 의존성 누락을 컴파일 시점에 발견, 순환 참조를 기동 시 발견, 테스트 용이. 필드 주입은 테스트·불변성에 불리. |
| Bean 스코프? | `singleton`(기본, 컨테이너당 1개), `prototype`(요청마다 새로 생성), 웹: `request`, `session`, `application`. |
| 싱글톤 빈의 주의점? | 상태(필드)를 가지면 **스레드 간 공유로 경쟁 조건** 발생. 상태 없는(stateless) 설계가 원칙. |
| Bean 생성 주기? | 인스턴스화 → 의존성 주입 → `@PostConstruct`/`InitializingBean` → 사용 → `@PreDestroy`/`DisposableBean` → 소멸. |
| `@Component` vs `@Bean`? | `@Component`: 클래스에 붙여 컴포넌트 스캔으로 등록. `@Bean`: `@Configuration` 클래스의 메서드로 직접 등록(외부 라이브러리 객체, 복잡한 생성 로직). |
| `@Autowired` 동작 / 같은 타입 빈이 여럿이면? | 타입으로 먼저 찾고, 여러 개면 필드/파라미터 이름 → `@Qualifier` → `@Primary` 순으로 선택. 못 정하면 `NoUniqueBeanDefinitionException`. |
| 순환 참조? | A→B→A 의존. 생성자 주입이면 기동 실패(Spring Boot 2.6+는 기본 금지). 설계 분리가 근본 해결. |
| AOP란 / 어디에 쓰나? | 횡단 관심사(로깅, 트랜잭션, 보안, 성능 측정)를 핵심 로직에서 분리. 용어: Aspect, Advice, Pointcut, JoinPoint, Weaving. |
| Spring AOP 구현 방식? | **런타임 프록시**. 인터페이스 있으면 JDK 동적 프록시, 없으면 CGLIB(상속 기반, `final` 클래스/메서드는 불가). 메서드 실행 지점만 지원. |
| 내부 호출에서 AOP가 안 되는 이유? | `this` 호출은 프록시를 거치지 않음. 빈 분리로 해결. |
| BeanFactory vs ApplicationContext? | BeanFactory: 기본 컨테이너(지연 로딩). ApplicationContext: BeanFactory + 메시지/이벤트/환경/AOP 통합, 시작 시 싱글톤 즉시 생성. 실무는 ApplicationContext. |

---

## 2. Spring MVC · 웹 요청 처리

| 질문 | 답변 요지 |
| --- | --- |
| Spring MVC 요청 흐름? | Filter → **DispatcherServlet** → HandlerMapping → HandlerAdapter → Interceptor(pre) → Controller → (ViewResolver 또는 HttpMessageConverter) → Interceptor(post/after) → Filter. (상세는 [요청 처리 전체 흐름](기술면접/WEB/[JAVA%20기술면접]%20HTTP·REST와%20요청%20처리%20전체%20흐름.md)) |
| Filter / Interceptor / AOP 차이? | Filter: 서블릿 레벨, 모든 요청 앞뒤(인코딩·인증·XSS). Interceptor: MVC 레벨, 핸들러 전후(권한 체크·로깅). AOP: 메서드 레벨, 서비스 계층 횡단 로직. 실행 순서는 Filter → Interceptor → AOP. |
| `@Controller` vs `@RestController`? | `@RestController` = `@Controller` + `@ResponseBody`. 뷰 이름이 아니라 객체를 JSON 등으로 직렬화해 응답 본문에 씀. |
| `@RequestParam` / `@PathVariable` / `@RequestBody`? | 쿼리 파라미터·폼 / URL 경로 변수 / 요청 본문(JSON)을 객체로 변환(HttpMessageConverter, Jackson). |
| 예외 처리 방법? | `@ExceptionHandler`(컨트롤러), `@ControllerAdvice`/`@RestControllerAdvice`(전역), `ResponseStatusException`, 에러 응답 표준화(Problem Details, RFC 7807). |
| 입력 검증? | Bean Validation(`@Valid`, `@NotNull`, `@Size`...). 실패 시 `MethodArgumentNotValidException` → 전역 핸들러에서 400 응답. |
| DTO와 Entity를 왜 분리? | Entity를 직접 노출하면 API 스펙이 DB 구조에 종속, 민감 필드 노출, 지연 로딩/순환 참조 직렬화 문제. 계층별 책임 분리. |
| Spring MVC vs WebFlux? | MVC: 서블릿·블로킹·요청당 스레드. WebFlux: 리액티브·논블로킹·이벤트 루프(Netty), 적은 스레드로 많은 동시 연결. I/O 대기가 많고 전 구간이 논블로킹일 때 효과적. 블로킹 코드가 섞이면 이점 상실. |
| Servlet 컨테이너 스레드 모델? | Tomcat 워커 스레드 풀(기본 200)이 요청 하나당 스레드 하나를 배정. 스레드 풀이 차면 대기 큐 → 거절. |
| 세션 vs 쿠키 vs JWT? | 쿠키: 클라이언트 저장 소량 데이터. 세션: 서버가 상태 보관(세션 ID를 쿠키로 전달), 다중 서버면 Redis 등 필요. JWT: 서명된 토큰에 정보 포함, 서버는 무상태로 검증하지만 **폐기가 어렵고** 탈취 시 위험 → 짧은 만료 + Refresh Token. |
| CORS란? | 브라우저의 동일 출처 정책(SOP)을 서버 허용 헤더(`Access-Control-Allow-Origin`)로 완화. 서버 간 호출에는 해당 없음. 인증 정보(쿠키)를 쓰려면 `allowCredentials`와 구체적 Origin 필요. |
| CSRF / XSS / SQL Injection 방어? | CSRF: 토큰, SameSite 쿠키, (JWT를 헤더로 쓰면 영향 적음). XSS: 출력 이스케이프, CSP, HttpOnly 쿠키. SQLi: **PreparedStatement 바인딩**, 문자열 연결 금지, ORM 파라미터 바인딩. |
| Spring Security 기본 구조? | `SecurityFilterChain`(필터 체인) → 인증(`AuthenticationManager`/`Provider`, `UserDetailsService`) → 인가(`@PreAuthorize`, URL 규칙). 세션 기반이면 `SecurityContext`에 인증 정보 저장. |

---

## 3. Spring Boot

| 질문 | 답변 요지 |
| --- | --- |
| Spring Boot를 쓰는 이유? | 자동 설정(Auto-Configuration), 스타터 의존성, 내장 서버(Tomcat) 실행, Actuator 운영 지표 → 설정 부담 감소. |
| 자동 설정 원리? | `@SpringBootApplication` = `@Configuration` + `@EnableAutoConfiguration` + `@ComponentScan`. 클래스패스와 `@ConditionalOn...` 조건에 따라 AutoConfiguration 클래스들이 빈을 등록(`AutoConfiguration.imports` 목록 로드). |
| 설정 우선순위 / 프로필? | 명령행 인자 > 환경 변수 > `application-{profile}.yml` > `application.yml`. `spring.profiles.active`로 환경별 분리. |
| `@ConfigurationProperties`? | 설정 값을 타입 안전한 객체로 바인딩(`@Value`보다 묶음 관리에 유리). |
| Actuator? | `/actuator/health`, `metrics`, `prometheus` 등 운영 모니터링 엔드포인트. 외부 노출 시 보안 필요. |
| 테스트 종류? | 단위 테스트(JUnit + Mockito), 슬라이스 테스트(`@WebMvcTest`, `@DataJpaTest`), 통합 테스트(`@SpringBootTest`, Testcontainers). |

---

## 4. JPA · DB 접근

| 질문 | 답변 요지 |
| --- | --- |
| JPA / Hibernate / Spring Data JPA 관계? | JPA: ORM 표준 명세. Hibernate: 구현체. Spring Data JPA: Repository 추상화로 반복 코드 제거. |
| 영속성 컨텍스트란? | 엔티티를 관리하는 1차 캐시 공간. 이점: **1차 캐시, 동일성 보장, 쓰기 지연, 변경 감지(Dirty Checking), 지연 로딩**. 트랜잭션 범위와 일치하는 것이 기본. |
| 엔티티 상태? | 비영속(new) → 영속(managed) → 준영속(detached) → 삭제(removed). |
| **N+1 문제**와 해결? | 연관 엔티티를 지연 로딩하며 반복 조회해 쿼리가 1+N번 나가는 문제. 해결: `fetch join`, `@EntityGraph`, `@BatchSize`(`default_batch_fetch_size`), DTO 조회. (`fetch join`+페이징 제약 주의) |
| 지연 로딩 vs 즉시 로딩? | 실무는 **LAZY 기본**. EAGER는 예상치 못한 쿼리와 N+1을 유발. |
| `LazyInitializationException`? | 영속성 컨텍스트가 닫힌 뒤 지연 로딩 접근. 필요한 데이터를 트랜잭션 안에서 로딩(fetch join)하거나 DTO로 변환. |
| Open-In-View(OSIV)? | 요청 전체 동안 영속성 컨텍스트(커넥션)를 유지하는 설정. 지연 로딩 편의↑, 커넥션 점유 시간↑ → 트래픽 많은 서비스는 `false` 고려. |
| JPA vs MyBatis? | JPA: 객체 중심, 생산성, 복잡 쿼리는 어려움(QueryDSL로 보완). MyBatis: SQL 직접 제어, 복잡한 통계·튜닝에 유리, 매핑 코드 증가. |
| 커넥션 풀이란 / 크기는? | 커넥션 생성 비용을 줄이려 미리 만들어 재사용(HikariCP). 크기는 DB 동시 처리 능력과 스레드 수에 맞춘다. 무작정 늘리면 DB 부하·컨텍스트 스위칭만 증가. |
| 인덱스가 효과 없는 경우? | 컬럼 가공(함수/연산), 선행 와일드카드 `LIKE '%x'`, 타입 불일치, 복합 인덱스 선두 컬럼 미사용, 카디널리티가 낮은 컬럼. |
| 낙관적 락 vs 비관적 락? | 낙관적: `@Version`으로 충돌을 커밋 시점에 감지, 재시도. 비관적: `SELECT ... FOR UPDATE`로 선점. 충돌이 드물면 낙관적, 잦으면 비관적. |

---

## 5. Java 기본 (웹 개발자용 단골)

| 질문 | 답변 요지 |
| --- | --- |
| `==` vs `equals`? | `==`은 참조(주소) 비교, `equals`는 논리적 동등 비교(재정의 필요). |
| `equals`/`hashCode` 같이 재정의하는 이유? | 해시 컬렉션(HashMap/HashSet)은 `hashCode`로 버킷을 찾고 `equals`로 확인. 같은 객체는 같은 해시를 가져야 한다. |
| HashMap 동작 원리? | 해시로 버킷 결정, 충돌은 연결 리스트 → 길이 8 이상이면 트리(Java 8+). 로드 팩터 0.75 초과 시 resize(2배). 키는 불변 객체 권장. |
| ArrayList vs LinkedList? | ArrayList: 인덱스 접근 O(1), 중간 삽입/삭제 O(n). LinkedList: 접근 O(n), 삽입/삭제 위치를 알면 O(1). 실무는 대부분 ArrayList. |
| 인터페이스 vs 추상 클래스? | 인터페이스: 계약, 다중 구현, (default 메서드 가능). 추상 클래스: 상태·공통 구현 공유, 단일 상속. |
| JVM 메모리 구조? | Heap(Young: Eden/Survivor, Old), Metaspace(Java 8+), Stack(스레드별 프레임), PC Register, Native Method Stack. |
| GC 동작 / 종류? | Young에서 Minor GC, Old에서 Major/Full GC. 세대별 가설(대부분 객체는 빨리 죽음). G1(기본, Java 9+), ZGC/Shenandoah(저지연). Full GC·Stop-The-World 시간이 서비스 지연의 원인. |
| OOM 원인과 진단? | 메모리 누수(static 컬렉션, 캐시, ThreadLocal 미정리), 큰 결과 조회. `-XX:+HeapDumpOnOutOfMemoryError` → MAT/VisualVM으로 분석. |
| `final`, `finally`, `finalize`? | 상수/상속·재정의 금지 / 예외와 무관하게 실행되는 블록 / GC 직전 호출되는 소멸자(사용 금지, deprecated). |
| Checked vs Unchecked 예외? | Checked: 컴파일러가 처리 강제(`IOException`). Unchecked: `RuntimeException` 계열. Spring은 Unchecked 중심이며 트랜잭션도 기본적으로 Unchecked에서만 롤백. ([예외 노트](기술면접/WEB/[JAVA%20기술면접]%20예외.md)) |
| Stream / Optional 주의점? | Stream은 지연 평가·일회용, 병렬 스트림은 공용 ForkJoinPool 공유로 함부로 쓰지 않는다. Optional은 반환 타입용(필드/파라미터로 쓰지 않는다), `get()` 직접 호출 지양. |
| 제네릭 타입 소거? | 컴파일 후 타입 정보가 제거되어(런타임에 `List<String>`과 `List<Integer>` 구분 불가) `new T()`, `instanceof List<String>` 불가. |
| 직렬화 / `serialVersionUID`? | 객체를 바이트로 변환. 버전 UID가 다르면 역직렬화 실패. 보안·호환 문제로 JSON 등 명시적 포맷을 선호. |

---

## 6. 아키텍처 · 운영 단골

| 질문 | 답변 요지 |
| --- | --- |
| Monolith vs MSA? | 모놀리식: 단순, 배포 단위 하나, 트랜잭션 쉬움. MSA: 독립 배포·확장, 대신 분산 트랜잭션·네트워크 장애·운영 복잡도. 조직/도메인 규모에 맞춰 선택. |
| 서킷 브레이커 / 재시도 / 타임아웃? | 외부 호출 실패가 전파되지 않게 차단(Resilience4j). 재시도는 **멱등 요청에만**, 지수 백오프+지터. 타임아웃은 항상 명시. |
| 캐시 전략? | Cache-Aside(조회 시 채움), Write-Through, Write-Back. 이슈: 만료 시 폭주(Stampede), 정합성, 무효화. |
| 대용량 트래픽 대응 순서? | 병목 측정(APM·로그) → 캐시 → 쿼리/인덱스 → 읽기 분산(Replica) → 비동기화(MQ) → 수평 확장(Stateless 설계) → 샤딩. |
| REST API 설계 원칙? | 자원은 명사·복수형 URI, 행위는 HTTP 메서드, 올바른 상태 코드, 버전 관리(`/v1`), 페이징·필터 표준화, 멱등성 고려. |
| 로그/장애 대응? | 요청 추적 ID(MDC)로 흐름 추적, 구조화 로그, 지표(Prometheus)·알람, 스레드 덤프·힙 덤프로 사후 분석. |
| 무중단 배포? | Rolling, Blue-Green, Canary. DB 스키마는 하위 호환(Expand → Migrate → Contract)으로 변경. |
| 동기 vs 비동기, Blocking vs Non-blocking? | 동기/비동기는 결과를 **기다리는 방식**(호출자가 완료를 직접 확인하나, 통지받나), 블로킹/논블로킹은 **제어권 반환 여부**. 서로 다른 축이다. |

---

## 면접 답변 팁
1. **정의 → 이유 → 트레이드오프** 순서로 말한다. ("무엇이다" 뒤에 "왜 필요하고, 대신 무엇을 포기하나")
2. "항상/절대"라는 표현을 피하고 **상황에 따라 다르다**고 한 뒤 기준을 제시한다.
3. 프로젝트 경험과 연결한다. (예: "저는 이런 상황에서 이 방식을 선택했고 측정 결과 …")
4. 모르면 아는 범위에서 원리를 추론해 말하고, 단정하지 않는다.

## 관련 문서
- [HTTP·REST와 요청 처리 전체 흐름](기술면접/WEB/[JAVA%20기술면접]%20HTTP·REST와%20요청%20처리%20전체%20흐름.md)
- [동시성·락 — String 계열·락 종류·데드락](기술면접/WEB/[JAVA%20기술면접]%20동시성·락%20—%20String%20계열·락%20종류·데드락.md)
- [멀티 DB 트랜잭션 — 분산 트랜잭션·XA·Saga](기술면접/WEB/[JAVA%20기술면접]%20멀티%20DB%20트랜잭션%20—%20분산%20트랜잭션·XA·Saga.md)
- [예외](기술면접/WEB/[JAVA%20기술면접]%20예외.md)
- [성능튜닝](기술면접/WEB/[JAVA%20기술면접]%20%20성능튜닝.md)
