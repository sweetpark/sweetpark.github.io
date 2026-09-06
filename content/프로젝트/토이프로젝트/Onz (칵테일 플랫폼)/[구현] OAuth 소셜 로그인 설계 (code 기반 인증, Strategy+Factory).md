---
title: "OAuth 소셜 로그인 설계 (code 기반 인증, Strategy+Factory)"
tags: [학습, 토이프로젝트, Spring-Boot, OAuth, 보안]
created: 2026-09-05
modified: 2026-09-05
---

# OAuth 소셜 로그인 설계 (code 기반 인증, Strategy+Factory)

> [!NOTE]
> Google/Naver/Kakao/Apple 4개 프로바이더를 지원하는 소셜 로그인을, accessToken이 아닌 code 값 교환 방식으로 설계한 이유와 Provider 확장 구조를 정리했다.

## 왜 accessToken이 아닌 code 값을 주고받는가

클라이언트(모바일 앱)가 외부 인증 서버로부터 직접 accessToken을 받아 그대로 사용하는 방식 대신, **1회성 code 값만 클라이언트가 받고, code → accessToken 교환은 백엔드가 수행**하는 방식으로 설계했다.

이렇게 설계한 이유:

- **보안**: accessToken이 모바일 클라이언트에 저장되지 않으므로, 클라이언트 탈취 시에도 accessToken 자체가 노출되지 않는다.
- **변경 대응 비용**: 외부 인증 서버(구글/네이버/카카오)의 정책이 바뀌었을 때, 백엔드만 대응하면 된다. 프론트엔드가 직접 accessToken을 다루는 구조였다면 앱을 재배포해야 하는 상황이 발생할 수 있다.

## 전체 흐름

```text
[클라이언트]                          [내 서버(백엔드)]                    [외부 인증 서버 (Google/Naver/Kakao)]
   │  1. 로그인 요청                        │                                      │
   │ ─────────────────────────────────▶  │                                      │
   │                                      │                                      │
   │            (또는 클라이언트가 직접 외부 인증 서버로 로그인 후 code 수신)              │
   │ ◀────────────────────────────────────────────────────────────────────────  │
   │  2. code 값 전달                       │                                      │
   │ ─────────────────────────────────▶  │                                      │
   │                                      │  3. code로 accessToken 교환 요청        │
   │                                      │ ───────────────────────────────────▶ │
   │                                      │  4. accessToken 수신                  │
   │                                      │ ◀─────────────────────────────────── │
   │                                      │  5. accessToken으로 사용자 정보 요청    │
   │                                      │ ───────────────────────────────────▶ │
   │                                      │  6. 사용자 정보 수신                    │
   │                                      │ ◀─────────────────────────────────── │
   │  8. 자체 JWT 토큰 응답                  │  7. 자체 DB 저장/조회 (신규/기존회원)     │
   │ ◀─────────────────────────────────  │                                      │
```

## 프로바이더별 code → accessToken 교환 예시 (Kakao)

```text
1. code 발급 URL
GET https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}
```

```bash
# 2. code로 accessToken 발급
curl -v -X POST "https://kauth.kakao.com/oauth/token" \
    -H "Content-Type: application/x-www-form-urlencoded;charset=utf-8" \
    -d "grant_type=authorization_code" \
    -d "client_id=${REST_API_KEY}" \
    --data-urlencode "redirect_uri=${REDIRECT_URI}" \
    -d "code=${AUTHORIZE_CODE}"
```

다른 프로바이더(Google, Naver)도 code 발급 URL / accessToken 교환 URL / 사용자 정보 조회 URL 3종 세트로 동일한 패턴을 따른다. 공통 인터페이스로 추상화한 코드 예시는 [[Spring] Strategy+Factory로 다중 Provider 처리하기 - 핵심 개념 및 특징 정리]에 정리했다.

## Apple 로그인의 특이점

Apple은 다른 3개 프로바이더와 달리 클라이언트가 두 가지 값 중 하나를 선택해서 보낼 수 있도록 설계했다.

**방법 1) Authorization code 전달**

```json
{
  "provider": "apple",
  "code": "<authorization_code>"
}
```

**방법 2) Identity token(id_token) 직접 전달**

```json
{
  "provider": "apple",
  "accessToken": "<id_token>"
}
```

Apple ID 토큰은 JWT 형태로 발급되며, Apple이 공개하는 JWK(공개키)로 서명을 검증해야 한다.

- 공식 문서: [Generate and validate tokens (Apple Developer)](https://developer.apple.com/documentation/signinwithapplerestapi/generate-and-validate-tokens)
- 공개키 엔드포인트: `https://appleid.apple.com/auth/keys`

## Provider 확장 구조 (Strategy + Factory)

Kakao/Naver/Google/Apple마다 로그인 요청 URL, accessToken 교환 방식, 사용자 정보 응답 스키마가 모두 다르기 때문에, 공통 인터페이스로 추상화하고 요청 시점에 적절한 구현체를 팩토리로 선택하는 구조를 적용했다. 신규 프로바이더 추가 시 기존 컨트롤러/서비스 코드를 건드리지 않고 구현체 하나만 추가하면 되도록 설계한 것이 핵심이다.

이 패턴의 일반화된 설명(인터페이스 정의, 팩토리 코드 예시)은 아래 문서로 정리했다.

- [[Spring] Strategy+Factory로 다중 Provider 처리하기 - 핵심 개념 및 특징 정리]
- [[소셜로그인 #2] 소셜로그인 OAuth2.0 적용하기 (+디자인패턴 - 전략&팩토리)]

## 로그인/회원가입 API 흐름 요약

1. `POST /api/auth/social-login` — 기존 회원이면 즉시 JWT(Access/Refresh Token) 발급, 신규 회원이면 임시 code 값만 발급
2. `POST /api/auth/signup` — 1번에서 받은 code 값과 닉네임/약관 동의 정보를 전달받아 회원가입 처리 후 JWT 발급

세부 요청/응답 스펙은 [API 레퍼런스] 문서를 참고.

## 관련 문서

- [Onz API 레퍼런스]([API]%20Onz%20API%20레퍼런스.md) — 이 설계를 기반으로 실제 구현된 `/api/auth/social-login`, `/api/auth/signup` 엔드포인트의 세부 요청/응답 스펙
- [Onz 프로젝트 소개 및 기획]([개요]%20Onz%20프로젝트%20소개%20및%20기획.md) — 이 인증 설계가 적용된 Onz 프로젝트의 전체 기획 배경
- [Stream·Generic·Lambda로 중복 코드 제거]([리팩토링]%20Stream·Generic·Lambda로%20중복%20코드%20제거.md) — 이 문서의 Provider별 반복 로직 문제를 Strategy+Factory로 해결한 것처럼, 유사한 반복 코드 문제를 Stream/Generic/Lambda로 해결한 리팩토링 사례
- [[소셜로그인 #2] 소셜로그인 OAuth2.0 적용하기 (+디자인패턴 : 전략&팩토리)](../계정%20인증%20및%20인가/[소셜로그인%20%232]%20소셜로그인%20OAuth2.0%20적용하기%20(+디자인패턴%20-%20전략&팩토리).md) — Strategy+Factory 패턴을 처음 적용했던 다른 토이프로젝트의 소셜로그인 구현 글
- [(Spring) Strategy+Factory로 다중 Provider 처리하기 - 핵심 개념 및 특징 정리](../../../프레임워크/Spring%20Framework/실습_스프링MVC/[Spring]%20Strategy+Factory로%20다중%20Provider%20처리하기%20-%20핵심%20개념%20및%20특징%20정리.md) — 이 설계에서 사용한 Strategy+Factory 패턴을 일반화하여 정리한 문서
