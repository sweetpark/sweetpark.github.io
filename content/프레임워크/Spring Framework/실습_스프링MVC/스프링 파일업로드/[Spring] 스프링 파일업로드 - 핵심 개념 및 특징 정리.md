---
title: "스프링 파일업로드"
tags: [학습, 개발-CS, 언어, Spring, 김영한]
created: 2026-02-04
modified: 2026-09-05
---

# 스프링 파일업로드

> [!NOTE]
> 순수 서블릿(HttpServletRequest) 방식과 스프링 MultipartFile 방식의 파일 업로드 비교 정리

> [!NOTE]
> 원문을 AI가 검토·보강함(사실 확인 권장).

## 🧱 기술 스택
- Servlet 3.0+ `HttpServletRequest` (`Part`, `getParts()`)
- Spring `MultipartFile` (`MultipartResolver`)

## ⚙️ 구현
- servlet (httpServletRequest) — 서블릿이 제공하는 멀티파트 파싱(`request.getParts()`)으로 직접 처리
- spring(Multipart) — 스프링이 `MultipartFile`로 감싸서 더 편리하게 제공(`@RequestParam MultipartFile file`)

### 참고
- 블로그: [gradualprecision.tistory.com/99](https://gradualprecision.tistory.com/99)

## 관련 문서

- [(Spring Framework) 파일 업로드](../../파일%20업로드.md) — 파일 업로드/다운로드 구현 및 application.properties 설정을 다루는 일반 개념 노트
- [(학습/프로젝트/토이프로젝트/파일 업로드&다운로드) [File I/O #5] MultiPartFile (Form데이터) 처리하기](../../../../프로젝트/토이프로젝트/파일%20업로드&다운로드/[File%20I-O%20#5]%20MultiPartFile%20(Form데이터)%20처리하기.md) — MultipartFile을 이용한 실전 업로드 처리 예제(InputStream, BufferedReader, transferTo 등)를 다루는 토이프로젝트 노트
