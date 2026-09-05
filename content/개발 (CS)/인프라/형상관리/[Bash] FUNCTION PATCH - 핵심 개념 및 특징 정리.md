---
title: "[FUNCTION] PATCH"
tags: [학습, 개발-CS, 인프라, 형상관리, 개발]
modified: 2026-09-05
---

# [FUNCTION] PATCH

> [!NOTE]
> `patch` 명령으로 diff 파일을 적용해 코드 변경분을 병합하는 방법과 `-p[num]` 경로 옵션 정리.

## 📌 개념

- **patch란?** 일부 업데이트된 코드(diff)를 원본에 merge 하는 작업.
- **inputfile**: diff 파일을 의미(patch가 적용되어야 하는 `---`/`+++` 파일). diff를 어디서 떴든 inputfile 역할을 한다.

## 💻 예시

```bash
patch -p[num] -i [inputfile]
# p[num]에서 p 는 diff 파일에 존재하는 경로를 의미
# [num]은 diff 경로에서 몇 단계 상대경로를 잘라낼지 지정
# ex) p0 : diff (/home/sola/script/...) -> home 경로부터 읽기 시작
# ex) p1 : diff (/home/sola/script/...) -> sola 경로부터 읽기 시작
# 주의) 잘못 지정하면 원하는 위치에 patch가 적용되지 않을 수 있음
```
