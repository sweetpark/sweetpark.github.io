---
title: "Strategy+Factory로 다중 Provider 처리하기"
tags: [학습, 개발-CS, 언어, 디자인패턴, Spring]
modified: 2026-09-05
---

# Strategy+Factory로 다중 Provider 처리하기

> [!NOTE]
> Kakao/Naver/Google/Apple 등 Provider별로 제각각인 로직(대표적으로 소셜 로그인)을 하나의 공통 인터페이스로 감싸고, 신규 Provider 추가 시 기존 코드를 건드리지 않도록 Strategy + Factory 패턴으로 분리하는 방법.
> Onz(칵테일 플랫폼) 프로젝트의 "소셜로그인 디자인패턴" 노트와 "리펙토링" 노트의 "어댑터 패턴(소셜로그인)" 섹션(원문 표기는 "어댑터 패턴"이나 실제 구조는 Strategy+Factory)이 같은 내용을 다루고 있어 하나로 통합했다.

## 🧱 핵심 구조

- **전략 패턴(Strategy)**: Provider(Kakao/Naver/Google/Apple)별로 인증 로직 인터페이스를 하나로 묶어 구현체를 각각 분리
- **팩토리 패턴(Factory)**: 전략 패턴 인터페이스를 활용해 요청된 provider 이름으로 구현체를 선택/호출

공통 인터페이스가 강제하는 메서드:
- `getAccessToken()` — provider별 토큰 발급
- `getUserInfo()` — provider별 사용자 정보 조회
- `getMemberProviderId()`
- `createMember()`

## ⚙️ 전체 로그인 플로우

```text
[사용자]
   │
   │ ① 로그인 버튼 클릭 (Kakao / Google / Naver / Apple)
   ▼
[프론트엔드]
   │
   │ ② Provider 인증 페이지로 이동 (client_id, redirect_uri)
   ▼
[OAuth Provider]
   │
   │ ③ 사용자 동의 후 Authorization Code 반환
   ▼
[프론트엔드]
   │
   │ ④ Authorization Code + provider 전달
   ▼
[백엔드 서버]
   │
   │ ⑤ Access Token 요청 → Provider
   │ ⑥ 사용자 정보 요청 (Access Token 기반)
   ▼
[OAuth Provider]
   │
   │ ⑦ 사용자 정보 반환 (id, email, name 등)
   ▼
[백엔드 서버 내부]
   ├─⑧ 회원 존재 여부 확인
   │     ├─ 기존 회원 → JWT 발급 로직 실행
   │     └─ 신규 회원 → 회원 등록 로직 실행 → JWT 발급
   │
   └─⑨ 프론트엔드로 AccessToken / RefreshToken 응답
   ▼
[프론트엔드]
   │
   │ ⑩ 토큰 저장 후 로그인 완료
   ▼
[사용자] ✅ 로그인 세션 유지 및 서비스 이용
```

| 단계 | 주체 | 설명 |
| --- | --- | --- |
| ① | 사용자 | 카카오/구글/네이버/애플 로그인 버튼 클릭 |
| ② | 프론트엔드 | Provider 인증 페이지로 이동 (client_id, redirect_uri 전달) |
| ③ | Provider | 사용자 동의 후 Authorization Code를 프론트엔드로 전달 |
| ④ | 프론트엔드 → 백엔드 | Authorization Code + provider 이름 전달 |
| ⑤ | 백엔드 | Provider에 Access Token 요청 후 사용자 정보 획득 |
| ⑥ | 백엔드 | DB 조회 → 회원 존재 여부 분기 |
| ⑦ | 백엔드 | 기존 회원 → JWT 발급 / 신규 회원 → 등록 후 JWT 발급 |
| ⑧ | 백엔드 → 프론트 | AccessToken, RefreshToken 반환 |
| ⑨ | 프론트 | 로그인 완료 상태 유지 (세션/스토리지 저장) |

## ⚙️ 주요 클래스 구성 (예시)

| 역할 | 클래스(패키지) | 설명 |
| --- | --- | --- |
| Controller | `AuthController` | Authorization Code 수신 |
| Service | `OAuth2Service` | Provider별 로그인 로직 처리 |
| Strategy | `...services.auth.strategy.*` | 각 Provider별 로직 분리 |
| Factory | `SocialLoginFactory` | 요청된 provider 이름으로 Strategy 선택 |
| Token | `JwtTokenProvider` | Access/Refresh Token 발급 |
| Blacklist | `JwtAccessTokenBlackListService` | 로그아웃 시 토큰 차단 |

## ⚙️ 구현 메모

**환경 변수 및 발급 경로 예시** (실제 키/시크릿 값 없이 이름/경로만)

| Provider | 환경 변수 | 발급 경로 |
| --- | --- | --- |
| Kakao | `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`, `KAKAO_REDIRECT_URI` | Kakao Developers → 내 애플리케이션 → 플랫폼 → Redirect URI 등록 |
| Naver | `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`, `NAVER_REDIRECT_URI` | Naver Developers → 로그인 오픈 API 설정 |
| Google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` | Google Cloud Console → OAuth 2.0 Client ID 생성 |
| Apple | `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` | Apple Developer → Service ID, Key, Team 설정 |
| JWT | `JWT_SECRET` | 서버 토큰 서명용 비밀키(직접 생성) |

**API 요청 예시**

프론트 → 백엔드:
```http
POST /api/auth/social/login
Content-Type: application/json

{
  "provider": "kakao",
  "code": "AUTHORIZATION_CODE_FROM_PROVIDER"
}
```

백엔드 → 프론트:
```json
{
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token",
  "isNewUser": false
}
```

**Spring Security 설정 요약**
- `/api/auth/**` 경로는 `permitAll`
- 나머지 API는 JWT 인증 필요
- JWT 토큰 검증은 `JWTAuthenticationFilter`에서 수행
- 로그아웃 시 토큰은 블랙리스트 등록 후 만료 처리

## ⚙️ 구현 팁 (전략+팩토리 조합 시 실무 주의점)

- `x-www-form-urlencoded`로 요청을 보낼 때는 `MultiValueMap`을 사용해야 한다. 일반 `Map`을 쓰면 JSON body로 직렬화될 수 있다.
- `headers.setAccept()` vs `headers.setContentType()`
    - `setAccept()`: 클라이언트가 응답받기 원하는 구조 요청
    - `setContentType()`: 클라이언트가 보내는 구조
- 전략 패턴: Provider(naver/google 등)별로 별도 구현체 작성
- 팩토리 패턴: 전략 패턴 인터페이스를 활용 + provider별로 구현체를 선택해 호출

## 🔁 개선 제안

- Provider별 accessToken 요청 로직 중복 제거(공통 `OAuthClientService`로 통합)
- RefreshToken 만료 정책 개선
- Apple Private Key 주기적 Rotation
- 테스트용 MockOAuthServer 추가
