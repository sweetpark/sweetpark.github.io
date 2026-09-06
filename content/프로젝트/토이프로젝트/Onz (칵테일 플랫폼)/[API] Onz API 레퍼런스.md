---
title: "Onz API 레퍼런스"
tags: [학습, 토이프로젝트, Spring-Boot, JPA, OAuth, API]
created: 2026-09-05
modified: 2026-09-05
---

# Onz API 레퍼런스

> [!NOTE]
> Onz 백엔드가 제공하는 API 엔드포인트를 기능별로 정리한 참고 문서. 원본은 Notion에 32개 개별 문서로 나뉘어 있던 것을 하나로 통합했으며, 예시 응답에 포함되어 있던 JWT 토큰과 Google Places API 키는 모두 가짜 값으로 치환했다.

## 회원 / 인증

| Method | Endpoint | 설명 |
| --- | --- | --- |
| POST | `/api/auth/social-login` | 외부 소셜 인증(Google/Naver/Kakao/Apple) 결과로 로그인 또는 신규회원 판별 |
| POST | `/api/auth/signup` | 소셜 로그인 신규회원의 최초 회원가입(닉네임, 약관 동의) |
| POST | `/api/auth/refresh` | Refresh Token으로 Access/Refresh Token 재발급 |
| POST | `/api/auth/logout` | 서버에 저장된 Refresh Token 삭제 |
| GET | `/api/get/member` | 로그인한 회원 본인 정보 조회 |
| PUT | `/api/update/member` | 회원 정보(성별·닉네임·이름·주소·나이·약관동의) 수정 |
| DELETE | `/api/delete/member` | 회원 탈퇴 |
| POST | `/api/upload/profile` | 프로필 사진 업로드 (multipart/form-data) |
| GET | `/api/profile` | 프로필 사진 조회 |

### 소셜 로그인 / 회원가입 흐름 예시

로그인 요청(`social-login`)에서 provider별 요청 바디는 아래와 같다. Apple만 인증 방식이 두 가지(code / id_token)로 분기하는 점에 유의한다.

```json
// 일반 provider (naver/google/kakao)
{
  "provider": "naver",
  "code": "<code>",
  "state": "<state>",
  "accessToken": "<accessToken>"
}
```

```json
// apple - 방법 1 (authorization code)
{ "provider": "apple", "code": "<authorization_code>" }
```

```json
// apple - 방법 2 (identity token)
{ "provider": "apple", "accessToken": "<id_token>" }
```

기존 회원 로그인 성공 응답 (토큰 값은 예시로 대체):

```json
{
  "code": 1,
  "msg": "success",
  "data": {
    "accessToken": "Bearer eyJhbGciOiJIUzI1NiJ9.<payload>.<signature>",
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9.<payload>.<signature>",
    "type": "token"
  }
}
```

신규 회원인 경우 (토큰 대신 임시 code 발급, 이후 `/api/auth/signup`으로 가입 완료):

```json
{
  "code": 1,
  "msg": "success",
  "data": {
    "code": "<signup_code_uuid>",
    "type": "signup"
  }
}
```

`/api/auth/refresh`는 헤더의 `Refresh-Token` 값을 검증해 새 토큰 쌍을 내려준다.

```text
[Header] Refresh-Token: <refresh_token>
```

```json
{
  "code": 1,
  "msg": "access token , refresh token create",
  "data": {
    "accessToken": "Bearer eyJhbGciOiJIUzI1NiJ9.<payload>.<signature>",
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9.<payload>.<signature>"
  }
}
```

> 이 세 응답은 원본 Notion 문서에 2025년 2월 발급된 실제 JWT 값이 그대로 남아 있어(만료 여부와 무관하게) 위와 같이 가짜 값으로 전면 치환했다. 자세한 설계 배경은 [[구현] OAuth 소셜 로그인 설계 (code 기반 인증, Strategy+Factory)] 참고.

## 가게 조회

| Method | Endpoint | 설명 |
| --- | --- | --- |
| GET | `/api/bar/{id}` | 가게 상세 정보 조회 (Google Places 사진 참조 포함) |
| GET | `/api/location/filter?areaCodes=...` | 지역 코드 필터로 가게 목록 조회 (예: `GANGNAM`, `HONGDAE`) |
| GET | `/api/location/nearby?x={lng}&y={lat}` | 현재 위치 기준 가까운 가게 조회 |

가게 상세/목록 응답에는 Google Places API의 사진 참조 URL(`photos/.../media?...&key=...`)이 포함되는데, 원본에 있던 실제 API 키는 모두 `key=<YOUR_API_KEY>` 형태로 치환했다.

## 검색

| Method | Endpoint | 설명 |
| --- | --- | --- |
| GET | `/api/search/keyword?search={keyword}` | 키워드 검색 |
| GET | `/api/search/searchlog` | 최근 검색 기록 조회 |
| GET | `/api/search/suggestions?query={query}` | 검색어 자동완성 추천 |

## 칵테일 조회 (칵테일 백과)

| Method | Endpoint | 설명 |
| --- | --- | --- |
| GET | `/api/public/cocktails?page=0&size=5` | 칵테일 전체 목록 페이징 조회 |
| GET | `/api/public/cocktail` | 칵테일 개별 조회 |
| GET | `/api/public/cocktail/personalize` | 맛/도수 조건 기반 맞춤 칵테일 조회 |
| GET | `/api/public/cocktail/taste/detail` | 칵테일 맛 세부 조회 |
| GET | `/api/pulbic/cocktail/taste/category` | 칵테일 맛 카테고리 조회 (경로에 `pulbic` 오타가 원본 그대로 남아있음) |

칵테일 목록 응답은 `abv_band`(도수 밴드), `taste_level`, `seasons`, `ingredients`, `tags`(GLASS/MOOD/FLAVOR/BASE) 등을 구조화된 필드로 내려준다. 데이터 분류 기준은 [[구현] 칵테일 데이터 모델 및 분류] 참고.

## 나의 리스트

로그인한 사용자가 가게를 태그(대표/서브: `LOCATION`, `MOOD`) 기준으로 묶어 관리하는 "나의 리스트" 기능이다.

| Method | Endpoint | 설명 |
| --- | --- | --- |
| GET | `/api/list` | 리스트 추가 시 선택 가능한 모든 태그 조회 |
| POST | `/api/list` | 새 리스트 추가 |
| GET | `/api/list/{id}` | 리스트 수정 화면 진입 시 현재 리스트의 태그 조회 |
| PATCH | `/api/list` | 리스트 태그 정보 수정 |
| DELETE | `/api/list/{id}` | 리스트 삭제 |
| GET | `/api/list/all` | 내 리스트 전체 조회 |
| GET | `/api/list/{id}/item` | 특정 리스트에 속한 가게들 조회 |

## 북마크

| Method | Endpoint | 설명 |
| --- | --- | --- |
| GET | `/api/list/all` | 북마크 버튼 클릭 시 내 리스트 목록 조회 (비로그인 시 `code: -1`) |
| POST | `/api/item/public/all` | 선택한 가게를 리스트에 추가 |
| GET | `/api/item/public/all` | 메인 화면에서 북마크한 가게 전체 조회 (비로그인 시 `code: -1`) |
| PUT | `/api/item/move` | 북마크한 가게를 다른 리스트로 이동 |
| DELETE | `/api/item` | 리스트에서 가게 삭제 |

> 원본 Notion 문서 기준으로 일부 북마크 관련 URI가 서로 겹치거나(예: 추가/전체조회가 같은 경로를 GET/POST로만 구분) 오탈자가 섞여 있었는데, 위 표는 각 문서의 설명과 요청 방식을 근거로 정리한 결과다.

## 관련 문서

- [OAuth 소셜 로그인 설계 (code 기반 인증, Strategy+Factory)]([구현]%20OAuth%20소셜%20로그인%20설계%20(code%20기반%20인증,%20Strategy+Factory).md) — 위 회원/인증 API의 설계 배경(왜 accessToken이 아닌 code 값을 주고받는지 등)
- [Onz 프로젝트 소개 및 기획]([개요]%20Onz%20프로젝트%20소개%20및%20기획.md) — 이 API들이 구현하는 Onz 프로젝트의 전체 기획
- [칵테일 데이터 모델 및 분류]([구현]%20칵테일%20데이터%20모델%20및%20분류.md) — 위 칵테일 조회 API가 반환하는 `abv_band`/`taste_level` 등 필드의 분류 기준
