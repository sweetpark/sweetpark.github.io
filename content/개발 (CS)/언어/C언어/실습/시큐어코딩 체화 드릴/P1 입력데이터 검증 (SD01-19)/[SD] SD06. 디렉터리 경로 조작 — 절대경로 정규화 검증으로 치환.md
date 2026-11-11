---
title: "SD06. 디렉터리 경로 조작 — 절대경로 정규화 검증으로 치환"
description: "시큐어코딩 SD06 디렉터리 경로 조작 (CWE-22/23/36): 취약한 코드를 절대경로 정규화 검증 방식으로 바꾸는 치환을 요구사항서, pseudo code, 테스트 코드로 체화하는 드릴입니다."
tags: 
created: 2026-09-28
modified: 2026-11-11
---

# SD06. 디렉터리 경로 조작 — 절대경로 정규화 검증으로 치환

> [!TIP]
> - 이론: [Part 1-1. 삽입 계열 — 6. 디렉터리 경로 조작](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%201.%20입력데이터%20검증%20및%20표현/[시큐어코딩]%201-1.%20삽입%28Injection%29%20계열.md#6-디렉터리-경로-조작-cwe-222336)
> - 실습: [P051_sd06_pathtraversal](https://github.com/sweetpark/c-playgound/tree/main/drill/P051_sd06_pathtraversal) — `make P051` 로 채점

---

## 📌 한눈에 보기

| 항목 | 내용 |
|---|---|
| 취약점 | 디렉터리 경로 조작 |
| 치환 규칙 | **절대경로 정규화 검증으로 치환** |
| 공격 예 | `../secret.txt` → **sandbox 밖 `secret.txt` 의 실제 내용을 읽어낸다** |
| 원인 | 문자열을 그대로 이어붙여 상위 디렉터리로 빠져나간다 |
| 실습 문제 | [P051](https://github.com/sweetpark/c-playgound/tree/main/drill/P051_sd06_pathtraversal) |

---

## 1. 이론 요약

| 항목 | 내용 |
|---|---|
| **신뢰 경계** | 환경변수(`reportName`) → 검증 없이 → 파일 접근 경로 |
| **공격 시나리오** | `reportName` 에 `../../../etc/passwd` 를 넣으면 지정 디렉터리 밖 시스템 파일이 삭제된다. |
| **치환 규칙** | · URL 디코딩 → 절대경로 변환(canonicalize) → 허용 홈 경로 접두어 비교.<br>· 파일명은 가능하면 화이트리스트 매핑으로 치환. |
| **주의** | 경로는 "문자열 조합" 후가 아니라 "정규화(절대경로 변환)" 후에 검사하라. `..` 필터링만으로는 인코딩 우회를 못 막는다. |
| **자세한 설명** | [Part 1-1. 삽입 계열 — 6. 디렉터리 경로 조작](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%201.%20입력데이터%20검증%20및%20표현/[시큐어코딩]%201-1.%20삽입%28Injection%29%20계열.md#6-디렉터리-경로-조작-cwe-222336) (Bad/Good 전체 코드, 보충) |

```diff
- snprintf(out, out_size, "%s/%s", sandbox_root, rName);   /* 문자열 결합만, 정규화 없음 */
+ snprintf(joined, sizeof(joined), "%s/%s", sandbox_root, rName);
+ realpath(sandbox_root, real_sandbox);
+ realpath(joined, real_target);                            /* 절대경로로 정규화 */
+ if (접두어 비교 실패) return -1;                            /* sandbox 밖이면 거부 */
```

---

## 2. 재현 — 신뢰 경계와 공격 입력

**신뢰 경계** : 검증 없이 흘러가는 곳

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| `rName` | 외부(요청 파라미터) | 파일 열기 경로 |

**공격 입력표**

| 입력(`rName`) | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| `report1.txt` (정상) | sandbox 안의 파일 내용 | 정상 동작 |
| `../secret.txt` | **sandbox 밖 `secret.txt` 의 실제 내용을 읽어낸다** | 문자열을 그대로 이어붙여 상위 디렉터리로 빠져나간다 |

---

## 3. 주의해야 할 점

1. **`..` 문자열만 `strstr` 로 검사하고 넘어감**
	- `%2e%2e%2f`(URL 인코딩)나 `....//` 같은 변형에 뚫린다.
	- 반드시 **정규화 후** 비교해야 한다
1. **접두어 비교만 하고 다음 문자를 안 봄**
	- `/tmp/sandbox` 와 `/tmp/sandbox2` 는 `strncmp` 접두어 비교로는 구분이 안 된다
		- `sandbox2` 도 `sandbox` 로 시작하기 때문이다
1. **`realpath()` 반환값(`NULL`)을 확인 안 함**
	- 대상 파일이 없으면 `realpath` 가 실패한다.
	- 이 실패를 "sandbox 안"으로 오판하면 안 된다
1. **`_DEFAULT_SOURCE` 를 빼먹고 빌드 에러로 몇 분을 허비**
	- 이 프로젝트 Makefile은 `-std=c11 -pedantic` 이라 POSIX 확장 함수가 기본적으로 숨어 있다

---

## 4. 변형 (부록)

같은 치환 규칙을 다른 소재로 다시 치는 문제들이다. 저장소에는 변형 A 만 문제로 있다.

### 변형 B — 업로드 파일 삭제

`unlink()` 로 sandbox 안의 업로드 파일을 지우는 기능.
"삭제"라서 Bad의 결과가 훨씬 치명적임을 체감

### 변형 C — 심볼릭 링크가 섞인 sandbox

- sandbox 안에 sandbox 밖을 가리키는 심볼릭 링크가 있을 때도 Good이 막는지 확인(`realpath` 는 심볼릭 링크까지 풀어서 정규화하므로 원래 막혀야 한다
	- 직접 링크를 만들어 검증)

---

## 5. 실습 문제 (GitHub)

- 풀이·채점은 저장소에서: [c-playgound](https://github.com/sweetpark/c-playgound)
	- `make P051` 로 채점 (Bad 가 실제로 뚫린다는 시험 + Good 이 막는다는 시험)
	- Bad 는 `solution.c` 에 이미 들어 있고 Good 만 채운다. 풀고 난 뒤의 해설은 폴더의 `NOTE.md`

| 문제 | 다루는 이론 | 링크 |
|---|---|---|
| P051 `pathtraversal` | [§1](#1-이론-요약) 이론 요약, [§3](#3-주의해야-할-점) | [폴더](https://github.com/sweetpark/c-playgound/tree/main/drill/P051_sd06_pathtraversal) |

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD05. LDAP 삽입](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD05.%20LDAP%20삽입%20—%20영숫자%20화이트리스트로%20치환.md)
- [다음: SD07. LDAP 처리](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD07.%20LDAP%20처리%20—%20베이스%20DN%20상수%20고정으로%20치환.md)
