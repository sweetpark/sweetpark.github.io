---
title: "GlueSQL 목차"
tags: [학습, 목차]
created: 2026-10-16
modified: 2026-10-16
---

> Rust 오픈소스 GlueSQL에 기여하며 정리한 포스팅. 번호 순서대로 보면 됩니다.

**위치**: [학습](학습%20목록.md) › [프로젝트](프로젝트/학습%20프로젝트%20목록.md) › [오픈소스](프로젝트/오픈소스/오픈소스%20목록.md) › GlueSQL  
**규모**: 포스팅 11개

## 포스팅

| 포스팅 | 설명 |
|---|---|
| [GlueSQL 프로젝트 구조와 필요 문법 개관](프로젝트/오픈소스/GlueSQL/1.%20[Rust]%20GlueSQL%20프로젝트%20구조와%20필요%20문법%20개관%20-%20핵심%20개념%20및%20특징%20정리.md) |  |
| [오픈소스 컨트리뷰션 실전 가이드(이슈 찾기~PR 작성, GlueSQL 사례)](프로젝트/오픈소스/GlueSQL/2.%20[Rust]%20오픈소스%20컨트리뷰션%20실전%20가이드%28이슈%20찾기부터%20PR%20작성까지,%20GlueSQL%20사례%29%20-%20핵심%20개념%20및%20특징%20정리.md) | "성장하며 열린" 오픈소스 프로젝트(GlueSQL)에 실제로 기여하면서 관찰한 것들을 정리한 실전 가이드. 일반론이 아니라 GitHub API로 최근 머지된 PR 30여 개를 직접 조회해서 확… |
| [CREATE TABLE 옵션 거부(early-return 검증, GlueSQL #1972)](프로젝트/오픈소스/GlueSQL/3.%20[Rust]%20CREATE%20TABLE%20옵션%20거부%28early-return%20검증,%20GlueSQL%20PR%201972%29%20-%20핵심%20개념%20및%20특징%20정리.md) | 내가 작업해서 머지한 PR #1972(2026-07-28 머지, 커밋 7c9009e) 기록. GlueSQL이 지원하지 않는 CREATE TABLE ... TEMPORARY / LIKE / CL… |
| [TranslateError Enum 타입화(strum·thiserror, GlueSQL #1975)](프로젝트/오픈소스/GlueSQL/4.%20[Rust]%20TranslateError%20Enum%20타입화%28strum·thiserror,%20GlueSQL%20Issue%201975%29%20-%20핵심%20개념%20및%20특징%20정리.md) | &'static str/String로 에러 사유를 표현하던 TranslateError의 variant들을 전용 enum + strum_macros::Display로 타입화한 리팩터링 기록. 이… |
| [file-storage 원자적 쓰기 설계와 모듈 분리(GlueSQL #2016)](프로젝트/오픈소스/GlueSQL/5.%20[Rust]%20file-storage%20원자적%20쓰기%20설계와%20모듈%20분리%28GlueSQL%20PR%202016%29%20-%20핵심%20개념%20및%20특징%20정리.md) | 진행 중인 PR #2016(브랜치 file-storage/atomic-writes) 기록. GlueSQL의 file-storage 백엔드가 행(row) 데이터를 File::create + wr… |
| [크래시 안전성 회귀 테스트 설계(GlueSQL #2016)](프로젝트/오픈소스/GlueSQL/6.%20[Rust]%20크래시%20안전성%20회귀%20테스트%20설계%28GlueSQL%20PR%202016%29%20-%20핵심%20개념%20및%20특징%20정리.md) | PR #2016에서 "원자적 쓰기로 바꿨다"는 주장을 코드로 증명하는 테스트를 설계한 기록. 핵심 질문은 "크래시/실패를 어떻게 결정적(deterministic)으로, CI에서도 안정적으로 재… |
| [오픈소스 PR 리뷰 대응기(CodeRabbit, GlueSQL #2016)](프로젝트/오픈소스/GlueSQL/7.%20[Rust]%20오픈소스%20PR%20리뷰%20대응기%28CodeRabbit,%20GlueSQL%20PR%202016%29%20-%20핵심%20개념%20및%20특징%20정리.md) | PR #2016에 자동 리뷰 봇(CodeRabbit)이 남긴 지적 3건 중, 어떤 것을 지금 고치고 어떤 것을 의도적으로 남겨뒀는지에 대한 판단 기록. 자동 리뷰라고 전부 반영하거나 전부 무시… |
| [file-storage 크래시 안전성 로드맵(GlueSQL #2016→#2017)](프로젝트/오픈소스/GlueSQL/8.%20[Rust]%20file-storage%20크래시%20안전성%20로드맵%28GlueSQL%202016→2017%29%20-%20핵심%20개념%20및%20특징%20정리.md) | file-storage 백엔드의 크래시 안전성을 개선하는 작업을 "row 파일 하나" → "statement 전체" → "스토리지 전체(마이그레이션)" 순으로 확장해가는 로드맵. PR #201… |
| [Decimal 값 동등비교 누락 수정 계획(Enum & Match, GlueSQL #1741)](프로젝트/오픈소스/GlueSQL/9.%20[Rust]%20Decimal%20값%20동등비교%20누락%20수정%20계획%28Enum%20&%20Match,%20GlueSQL%20Issue%201741%29%20-%20핵심%20개념%20및%20특징%20정리.md) | 아직 착수 전 — 이번 주 일요일 작업 예정. Claude Code로 PR #2016 리뷰 코멘트를 확인하던 중, 함께 후보를 찾다가 발견한 이슈. translate.rs가 아닌 core/sr… |
| [Option<T> TryFrom 매크로 확장 계획(매크로·제네릭, GlueSQL #1389)](프로젝트/오픈소스/GlueSQL/10.%20[Rust]%20Option%20타입%20TryFrom%20매크로%20확장%20계획%28매크로·제네릭,%20GlueSQL%20Issue%201389%29%20-%20핵심%20개념%20및%20특징%20정리.md) | 아직 착수 전 — 이번 주 일요일 작업 예정. 2024년에 열린 오래된 이슈라 재현 여부를 가장 먼저 확인해야 함(아래 "확인할 것" 참고). 셋 중 가장 개념적으로 흥미로운 케이스 — "당연… |
| [Glue::execute 배치 planning 수정 계획(소유권·제네릭 경계, GlueSQL #2009)](프로젝트/오픈소스/GlueSQL/11.%20[Rust]%20Glue%20execute%20배치%20planning%20수정%20계획%28소유권·제네릭경계,%20GlueSQL%20Issue%202009%29%20-%20핵심%20개념%20및%20특징%20정리.md) | 완료 (2026-09-20). TDD 사이클(RED → GREEN)로 진행: 이슈 본문의 재현 케이스를 테스트로 먼저 옮겨 실패를 확인한 뒤, core/src/glue.rs의 execute_w… |
