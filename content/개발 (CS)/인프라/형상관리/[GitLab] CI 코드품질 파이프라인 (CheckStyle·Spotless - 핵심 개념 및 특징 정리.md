---
title: "CI 코드품질 파이프라인 (CheckStyle·Spotless·SpotBugs)"
tags: [학습, 개발-CS, 인프라, CI, 코드품질]
modified: 2026-09-05
---

# CI 코드품질 파이프라인 (CheckStyle·Spotless·SpotBugs)

> [!NOTE]
> Java 프로젝트에 CheckStyle(컨벤션 검사) · Spotless(포맷 자동화) · SpotBugs(버그/보안 탐지) 3종을 도입하고, GitLab CI로 MR 시점에 강제하는 파이프라인 설계. 실무(MMS/IMS 프로젝트 적용)에서 일반화.

---

## 왜 3개를 역할별로 나누는가

| 도구 | 역할 | 로컬 | CI(MR) |
|---|---|---|---|
| CheckStyle | 코딩 컨벤션 실시간 안내(Linter) | 실시간 경고(Warning), 빌드 안 막음 | 리포팅(참고용, 차단 안 함) |
| Spotless | 포맷 표준 강제(Formatter) | 수동 실행(`spotlessApply`) | 미준수 시 **자동 수정 커밋** |
| SpotBugs | 잠재 버그·보안 취약점 최종 차단(Bug Finder) | 수동 정밀 분석(`spotbugsMain`) | 버그 발견 시 **MR 실패** |

핵심 설계 원칙: **"로컬은 자율 점검, CI는 최종 보증"**. 세 도구 모두 `./gradlew build`(check 태스크)에는 포함시키지 않는다 — 로컬 빌드 속도를 지키고, 검사는 명시적 실행이나 CI에서만 하도록 분리한다.

---

## 1. CheckStyle — 컨벤션 검사

```groovy
checkstyle {
    toolVersion = '10.12.0'
    configFile = file("config/checkstyle/checkstyle.xml")
    ignoreFailures = true   // 위반이 있어도 빌드/커밋을 막지 않음(경고만)
    maxWarnings = 100       // 경고 100건 초과 시에만 빌드 실패
}
```

`checkstyle.xml`에 담는 대표 규칙군:

- **명명 규칙**: 패키지 소문자, 클래스 PascalCase, 메서드/변수 camelCase, 상수 UPPER_SNAKE_CASE
- **Import**: 와일드카드 import 금지(`AvoidStarImport`), 미사용 import 금지(`UnusedImports`)
- **포맷**: 4칸 들여쓰기, 120자 줄 길이 제한(package/import/URL 제외)
- **블록**: `if`/`for`/`while` 단일 문장도 중괄호 필수(`NeedBraces`)
- **코딩 스타일**: `equals` 재정의 시 `hashCode`도 필수(`EqualsHashCode`), `switch`문 `default` 필수(`MissingSwitchDefault`), 필드명과 동일한 지역변수 선언 금지(`HiddenField`)
- **Javadoc**: public 메서드/클래스에 Javadoc 필수(단, param/return 태그는 선택적으로 완화 가능)

> IDE 플러그인(IntelliJ의 CheckStyle-IDEA)에 같은 `checkstyle.xml`을 등록하면 편집 중 실시간으로 위반이 노란 경고로 표시된다.

---

## 2. Spotless — 포맷 자동 수정

`origin/main` 대비 **변경된 파일만** 검사·수정하는 `ratchetFrom` 방식이 핵심이다 — 기존 코드 전체에 포맷을 강제하면 대규모 diff가 발생하므로, 새로 건드리는 파일만 표준을 맞춘다.

```groovy
spotless {
    ratchetFrom 'origin/main'
    java {
        palantirJavaFormat()       // 표준 포맷터
        removeUnusedImports()
        trimTrailingWhitespace()
        endWithNewline()
    }
    // HTML/JS 등 다른 파일 타입도 Prettier로 동일하게 적용 가능
}
```

| 명령어 | 동작 |
|---|---|
| `./gradlew spotlessApply` | 변경 파일 포맷 **자동 수정** |
| `./gradlew spotlessCheck` | 위반 여부만 검사(수정 없음), 위반 시 BUILD FAILED |

> Windows 콘솔에서 `spotlessCheck` 출력이 인코딩 문제로 깨질 수 있다 — 결과 확인이 어려우면 `spotlessApply`를 바로 실행하는 쪽이 실용적이다.

---

## 3. SpotBugs — 버그·보안 취약점 탐지

컴파일된 바이트코드를 분석하므로 **컴파일이 성공해야** 리포트가 생성된다. `findsecbugs-plugin`을 추가하면 OWASP 기준 보안 취약점(Path Traversal, CRLF Injection 등)도 함께 잡는다.

```groovy
spotbugs {
    ignoreFailures = true      // 로컬은 버그 발견해도 빌드 성공(리포트만 생성)
    toolVersion = '4.8.4'
}
dependencies {
    spotbugsPlugins 'com.h3xstream.findsecbugs:findsecbugs-plugin:1.14.0'
}
// check 태스크에서 SpotBugs 제외 → 로컬 빌드 시 자동 실행 안 됨
tasks.named("check") {
    dependsOn.removeIf { it.name.contains("spotbugs") }
}
```

리포트는 `build/reports/spotbugs/main.html`(브라우저용) / `main.xml`(CI 파싱용) 두 형태로 생성한다. 확인 우선순위:

```text
1. Summary에서 High priority 개수 확인
2. SECURITY 카테고리 전체 확인(PATH_TRAVERSAL_IN, CRLF_INJECTION_LOGS 등)
3. MALICIOUS_CODE(EI_EXPOSE_REP2 등) → BAD_PRACTICE 순 검토
4. STYLE/EXPERIMENTAL은 여유 있을 때
```

### 특정 클래스만 분석(변경분만) — CI에서 필수

전체 코드베이스를 매 MR마다 분석하면 느리다. `git diff`로 변경된 `.java`만 추출해 `-PonlyAnalyze`로 넘긴다.

```bash
CHANGED_CLASSES=$(git diff --name-only origin/main...HEAD \
  | grep '\.java$' \
  | sed 's|src/main/java/||;s|src/test/java/||;s|\.java$||;s|/|.|g' \
  | tr '\n' ',' | sed 's/,$//')

[ -z "$CHANGED_CLASSES" ] && exit 0   # 변경 파일 없으면 스킵

./gradlew classes testClasses
./gradlew spotbugsMain spotbugsTest -PonlyAnalyze="$CHANGED_CLASSES"
```

```groovy
// build.gradle — onlyAnalyze 프로퍼티를 받으면 그 클래스만 활성화
if (project.hasProperty('onlyAnalyze')) {
    spotbugsMain { onlyAnalyze = project.property('onlyAnalyze').toString().split(",") as List }
}
```

### 특정 경고 억제 — 어노테이션 vs 필터

| 방법 | 언제 | 예시 |
|---|---|---|
| `@SuppressFBWarnings(value="...", justification="...")` | 코드 수정 권한 있고 특정 경고만 억제 | 필드/메서드/클래스 단위, **justification 필수** |
| `spotbugs-exclude.xml` | 레거시/외부 연동 클래스, 패키지 단위 대량 제외 | `<Match><Class name="..."/></Match>` |

```java
@SuppressFBWarnings(
        value = "SQL_INJECTION_JDBC",
        justification = "쿼리 파라미터는 화이트리스트 검증 후 전달되므로 인젝션 불가")
public List<Map> selectDynamic(String column) { ... }
```

`@SuppressFBWarnings`는 SpotBugs 전용이며 `compileOnly` 의존성이라 런타임/컴파일/IntelliJ 자체 인스펙션에는 영향을 주지 않는다. IntelliJ 경고까지 같이 없애려면 표준 `@SuppressWarnings`를 병행한다.

`exclude.xml` 작성 시 클래스명에 `.java`를 붙이면 매칭되지 않는다는 점, `<Match>` 블록 내부는 AND, 블록 간에는 OR로 동작한다는 점에 주의한다. **원칙: 제외 범위는 최대한 좁게** — 클래스/패키지 전체를 제외하면 이후 실제 보안 버그가 생겨도 탐지되지 않는다.

---

## 4. GitLab CI 파이프라인 — MR 워크플로우

```yaml
workflow:
  rules:
    - if: '$CI_COMMIT_TITLE =~ /^auto: spotless apply$/'
      when: never   # 자동 포맷 커밋이 파이프라인을 재트리거하지 않도록 무한 루프 방지
    - when: always
```

```text
MR 생성/업데이트
      │
      ├─ spotless job: spotlessApply 실행
      │    └─ 수정 발생 시 auto commit + push → 그대로 MR에 반영, SUCCESS
      │
      └─ spotbugs job: 변경된 .java만 분석 (두 Job은 병렬)
           ├─ 버그 없음 → SUCCESS
           └─ 버그 있음 → MR 코멘트 자동 등록 + exit 1(FAILED, merge 차단)
```

`spotless`는 실패해도 커밋을 자동으로 만들어 스스로 문제를 해결하지만, `spotbugs`는 **발견 즉시 merge를 차단**한다 — 포맷은 자동 교정 가능하지만 버그는 사람이 판단해야 하기 때문이다.

### 긴급 비활성화(장애 대응)

CI 자체 장애 등으로 일시적으로 검사를 건너뛰어야 하면 두 Job을 통째로 주석 처리하고 `placeholder` stage로 대체한다. 문제 해결 후 반드시 원복해야 한다.

---

## 5. 로컬 개발 권장 순서 (MR 올리기 전)

```text
코드 작성
    │
STEP 1  ./gradlew spotlessApply     ← 포맷 자동 수정
    │
STEP 2  ./gradlew spotbugsMain      ← 버그 검사, build/reports/spotbugs/main.html 확인
    │
STEP 3  git commit & push
    │
GitLab CI 자동 실행(MR 생성 시)
```

이 순서를 지키면 CI 파이프라인 실패로 되돌아오는 왕복을 대부분 예방할 수 있다.

## 🔗 관련
- [(MyBatis) Log 고도화 작업 - 핵심 개념 및 특징 정리](../%EB%AA%A8%EB%8B%88%ED%84%B0%EB%A7%81%C2%B7%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC/[MyBatis]%20Log%20%EA%B3%A0%EB%8F%84%ED%99%94%20%EC%9E%91%EC%97%85%20-%20%ED%95%B5%EC%8B%AC%20%EA%B0%9C%EB%85%90%20%EB%B0%8F%20%ED%8A%B9%EC%A7%95%20%EC%A0%95%EB%A6%AC.md)
