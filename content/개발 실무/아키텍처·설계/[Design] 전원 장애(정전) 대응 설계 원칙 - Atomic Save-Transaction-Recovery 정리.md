---
title: "[Design] 전원 장애(정전) 대응 설계 원칙"
tags: [학습, 개발실무, Design]
modified: 2026-09-05
---

# [Design] 전원 장애(정전) 대응 설계 원칙

> [!NOTE]
> 임베디드/엣지 장비(정전이 실제로 발생 가능한 환경)에서 소프트웨어가 정전에도 데이터 정합성을 잃지 않도록 설계하는 10가지 원칙. IoT 보안 인증(JC-STAR 등)에서 요구되는 항목이지만, 일반 서버 소프트웨어에도 그대로 적용 가능한 범용 설계 원칙이다.

## 📌 10가지 원칙

1. **설정파일 원자적(Atomic) 저장** — `config.json`을 바로 덮어쓰지 않는다. `config.tmp`에 전체 저장 완료 후 `File.Replace()`(또는 rename)로 교체한다. 저장 도중 정전이 나도 기존 파일이 반쪽짜리로 남지 않는다.
2. **DB Transaction 사용** — 여러 테이블에 걸친 저장(예: 사용자 생성 시 USER/ROLE/AUDIT 3개 테이블)은 반드시 `BEGIN ~ COMMIT`으로 묶는다. 정전 시 자동 Rollback되어 DB 무결성이 유지된다.
3. **감사로그 Flush** — 로그를 `WriteLine()`만 하면 OS 캐시에 머물러 있을 수 있다. `FileStream.Flush(true)` 또는 `AutoFlush=True`로 즉시 디스크에 반영한다.
4. **이벤트 완료 후 ACK** — 설정 저장 → DB Commit → Audit 저장까지 끝난 뒤에 ACK를 보낸다. 중간에 ACK를 먼저 보내면 상대는 완료로 오인할 수 있다.
5. **부분 Update 방지** — 패치 파일 여러 개(예: DLL 5개) 중 일부만 복사된 상태에서 정전이 나면 기동 실패로 이어진다. Temp 디렉터리에 전체 복사 → 검증 → 한 번에 rename하는 방식을 쓴다.
6. **Update Rollback** — 업데이트 전 백업을 만들고, 실패 시 자동으로 이전 상태로 복원(Restore)한다.
7. **시작 시 Recovery** — 기동 시 "지난 종료가 정상 종료였는가"를 확인한다(Normal Shutdown 플래그 등). 비정상 종료로 판단되면 Temp 삭제, Lock 해제, Session/Queue 복구 절차를 수행한다.
8. **Queue는 Disk에도 저장** — 제어 Queue를 메모리에만 두면 정전 시 모두 유실된다. Memory Queue + Disk Queue를 함께 쓴다.
9. **DB Connection Recovery** — 전원 복구 후 DB 커넥션을 자동으로 재연결(Reconnect)하도록 설계한다.
10. **Cache Recovery** — 메모리 캐시는 재기동 시 DB에서 다시 읽어 재구성(Rebuild)한다.

## 📌 인프라 레벨 보완 설정

| 영역 | 설정 |
| --- | --- |
| MySQL/MariaDB | `innodb_flush_log_at_trx_commit=1`(Commit마다 디스크 기록), `sync_binlog=1` |
| Windows/파일시스템 | NTFS + Write Cache + Flush, 필요 시 BitLocker로 저장매체 자체 보호 |

## 📌 비고

- 이 원칙들은 "정전"뿐 아니라 프로세스 kill, OOM Killer에 의한 강제 종료 등 **모든 종류의 비정상 종료**에 공통으로 적용되는 내구성(Durability) 설계 원칙이다.

## 관련 문서

- [(HTTP) 대용량 처리 비동기 Job 큐 설계 패턴 - 핵심 개념 및 특징 정리](./[HTTP]%20대용량%20처리%20비동기%20Job%20큐%20설계%20패턴%20-%20핵심%20개념%20및%20특징%20정리.md) — 8번 "Queue는 Disk에도 저장" 원칙을 실제 Job 큐 재기동 복구 설계에 적용한 사례
- [(Architecture) 가상 스레드(Virtual Thread) 기반 고가용성 분산 배치 엔진 설계 (Atomic CAS, 이중 큐, 자가 치유)](./[Architecture]%20가상%20스레드(Virtual%20Thread)%20기반%20고가용성%20분산%20배치%20엔진%20설계%20(Atomic%20CAS,%20이중%20큐,%20자가%20치유).md) — 7번 "시작 시 Recovery" 원칙을 자가 치유(Self-Healing) 아키텍처로 구체화한 심화 사례
- [(Spring Batch) 대용량 비즈니스 거래 대사·정산 배치 아키텍처와 장애 복구 패턴](./[Spring%20Batch]%20대용량%20데이터%20대사·정산%20배치%20아키텍처와%20장애%20복구%20패턴.md) — 배치가 도중에 죽었을 때(정전 포함) 재실행해도 안전하도록 만드는 멱등성 설계(4.2절)를 다루는 자매 노트