---
title: "Part 7. API 오용"
tags: 
created: 2026-09-28
modified: 2026-09-28
---

# Part 7. API 오용

> 58개 중 **5개**. 의도된 사용에 반하는 방법으로 API를 사용하거나, 보안에 취약한 API를 사용하여 발생하는 보안약점.
> **관통 질문**: 이 함수는 애초에 안전하게 쓸 수 있는 함수인가? — 아니라면 고쳐 쓰지 말고 금지·치환하라.
> 전체 치환 목록은 → [부록 — 위험함수 치환표](%5B시큐어코딩%5D%20부록%20—%20위험함수%20치환표·암호화%20기준표·PQC%20전환.md)

---

## 1. DNS lookup에 의존한 보안결정 `CWE-247`

> **신뢰 경계**: `gethostbyname()` 조회 결과 → 위조 가능성 검토 없이 → 신뢰 사이트 판정
> ⚠️ "이름은 속일 수 있다". 보안 판정의 기준 값은 DNS가 개입하지 않는 값으로 잡아라.

**공격 시나리오**: 로컬 DNS 캐시가 조작(포이즈닝)되면 신뢰 사이트 목록 검사를 우회당해, 계약서 등 민감 데이터가 공격자 IP로 전송될 수 있다.

❌ **Bad**
```c
trustedSites.insert("www.trust.com");         /* 도메인명 기준 */
hostent *record = gethostbyname();            /* DNS 조회 의존 */
if (trustedSites.count(targetSite) > 0) SendContract(ip_address);
```

✅ **Good**
```c
trustedSiteIPs.insert("232.234.89.52");       /* IP 기준 */
if (trustedSiteIPs.count(targetSiteIp) > 0) SendContract(targetSiteIp);  /* DNS 개입 없음 */
```

**치환 규칙**: 보안결정에서 도메인명 DNS lookup 금지 → IP 주소 화이트리스트를 신뢰 기준으로 사용(IP도 위조 가능하지만 호스트 이름보다 낫다).

---

## 2. 위험하다고 알려진 함수 사용 `CWE-242`

> **신뢰 경계**: (해당 없음 — 함수 호출 자체가 결함)
> ⚠️ "고칠 수 없는 함수"는 감싸지 말고 목록으로 금지하고 치환하라.

**공격 시나리오**: `gets()` 는 입력 크기를 점검하지 않아 호출만으로 버퍼 오버플로우가 성립하고, `vfork()` 는 부모 프로세스 공간을 오염시킨다 — 입력값 검증과 무관하게 함수 사용 자체가 취약점이다.

❌ **Bad**
```c
gets(buf);                 /* 크기 제한 없는 입력 */
pid_t pid = vfork();       /* 자식이 부모 공간을 빌려 씀 */
```

✅ **Good**
```c
fgets(buf, BUFSIZE, stdin);  /* 할당된 메모리 이내에서만 입력받음 */
pid_t pid = fork();          /* 부모와 별도 공간 사용 */
```

**치환 규칙**: 전체 목록은 [부록 — 위험함수 치환표](%5B시큐어코딩%5D%20부록%20—%20위험함수%20치환표·암호화%20기준표·PQC%20전환.md) 참고, 컴파일 경고·정적분석으로 금지 함수 목록을 강제.

---

## 3. 작업 디렉터리 변경 없는 chroot Jail 생성 `CWE-243`

> **신뢰 경계**: `chroot()` 호출 → `chdir("/")` 없이 → 여전히 jail 밖 작업 디렉터리
> ⚠️ chroot()는 절반의 격리다. chdir("/")가 없으면 jail은 열린 문이다.

**공격 시나리오**: chroot 이후에도 작업 디렉터리가 jail 밖에 남아 있으면 클라이언트가 `../../etc/passwd` 같은 상대 경로로 시스템 파일에 접근한다.

❌ **Bad**
```c
chroot("/var/ftproot");         /* 작업 디렉터리는 그대로 */
fgets(filename, sizeof(filename), network);
localfile = fopen(filename, "r");    /* ../../etc/passwd 접근 가능 */
```

✅ **Good**
```c
chroot("/var/ftproot");
chdir("/");                     /* 새 루트 밑으로 변경 */
fgets(filename, sizeof(filename), network);
localfile = fopen(filename, "r");
```

**치환 규칙**: `chroot()` 와 `chdir("/")` 를 항상 한 쌍으로 호출(반환값 검사 포함), jail 내부는 최소 파일만.

---

## 4. 오용: 문자열 관리 `CWE-251`

> **신뢰 경계**: 멀티바이트 문자열 → 크기 인자 없이 → `_mbscpy`/`_mbscat`
> ⚠️ 멀티바이트 문자열은 "글자 수 ≠ 바이트 수". 크기 인자 없는 _mbsXXX 계열은 전면 금지.

**공격 시나리오**: 크기 인자가 없는 `_mbscpy`/`_mbscat` 등은 인코딩이 어긋난 입력에서 대상 버퍼 경계를 넘겨 메모리를 덮어쓰고 임의 코드 실행으로 이어질 수 있다.

❌ **Bad**
```c
_mbscpy(str1, str2);                       /* 크기 인자 없음 */
_mbscat(firstName, lastName);
```

✅ **Good**
```c
_mbscpy_s(str1, size, str2);               /* 버퍼 크기 명시 */
_mbscat_s(firstName, sizeof(firstName), lastName);
```

**치환 규칙**: `_mbsXXX()` 계열 금지 → 크기 인자를 받는 `_s` 계열로 치환, 대상 버퍼 크기를 상수로 명시.

---

## 5. 다중 스레드 프로그램에서 getlogin() 사용 `CWE-558`

> **신뢰 경계**: `getlogin()` 정적 버퍼(스레드 간 공유) → 검사 없이 → 권한 판정
> ⚠️ 멀티스레드에서 "정적 버퍼 반환 함수"는 전부 _r 버전으로. 권한 판정 값은 지역 버퍼에 고정하라.

**공격 시나리오**: 반환 값이 다른 스레드에 의해 바뀔 수 있으므로 이 값을 근거로 권한 부여나 계정 정보 다운로드를 수행하면 타 사용자 정보 유출·권한 상승이 발생한다.

❌ **Bad**
```c
struct passwd *pwd = getpwnam(getlogin());       /* 반환 버퍼가 스레드 간 공유 */
if (isTrustedGroup(pwd->pw_gid)) return 1;
```

✅ **Good**
```c
char id[MAX];
if (getlogin_r(id, MAX) != 0) return 0;          /* 지역 버퍼 + 실패 처리 */
pwd = getpwnam(id);
return isTrustedGroup(pwd->pw_gid) ? 1 : 0;
```

**치환 규칙**: `getlogin()` 등 정적 버퍼 반환 함수는 `_r` 버전으로, 호출자 소유 버퍼·크기를 전달하고 실패를 반드시 처리.

**`_r` 버전이 없는 경우**: 스레드 safe 한 함수가 제공되지 않으면 **lock(뮤텍스)으로 호출~사용 구간 전체를 직렬화**해야 한다. 정적 버퍼를 돌려주는 함수는 호출만 감싸면 부족하고, 반환 값을 지역 버퍼에 복사한 뒤에야 unlock 한다.

```c
static pthread_mutex_t login_lock = PTHREAD_MUTEX_INITIALIZER;

char id[MAX];
pthread_mutex_lock(&login_lock);
char *p = getlogin();                            /* _r 버전 없음 → lock 안에서 호출 */
if (p == NULL) { pthread_mutex_unlock(&login_lock); return 0; }
strncpy(id, p, MAX - 1);  id[MAX - 1] = '\0';    /* 지역 버퍼로 복사 후 */
pthread_mutex_unlock(&login_lock);               /* unlock (모든 경로에서) */
```

- 같은 함수를 호출하는 **모든 코드 경로가 동일한 lock** 을 써야 효과가 있다.
- 모든 반환 경로(에러 포함)에서 unlock 하고, lock 보유 중 오래 걸리는 작업은 피한다.

---

## Part 7 미니 체크리스트

- [ ] 보안 판정(신뢰 사이트 등)이 DNS lookup 결과에 의존하는가
- [ ] `gets`/`vfork`/`_mbscpy`/`strcpy` 등 [위험함수 치환표](%5B시큐어코딩%5D%20부록%20—%20위험함수%20치환표·암호화%20기준표·PQC%20전환.md) 상의 함수가 신규 코드에 있는가
- [ ] `chroot()` 뒤에 `chdir("/")` 가 반드시 따라오는가
- [ ] 멀티스레드 환경에서 정적 버퍼를 반환하는 함수(`getlogin`, `strtok`, `ctime` 등)를 `_r` 버전 없이 쓰는가 (`_r` 버전이 없으면 lock 으로 호출~복사 구간을 보호했는가)

---

## 관련 노트

- [시큐어코딩가이드 목록](시큐어코딩가이드%20목록.md)
- [Part 6. 캡슐화](%5B시큐어코딩%5D%20Part%206.%20캡슐화.md)
- [부록 — 위험함수 치환표·암호화 기준표·PQC 전환](%5B시큐어코딩%5D%20부록%20—%20위험함수%20치환표·암호화%20기준표·PQC%20전환.md)
