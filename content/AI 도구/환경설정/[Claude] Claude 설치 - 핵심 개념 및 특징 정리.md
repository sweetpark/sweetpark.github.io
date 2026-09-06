---
title: "Claude 설치"
tags: [학습, AI-도구, 환경설정, AI-환경설정, Claude]
created: 2026-04-13
modified: 2026-09-05
---

# Claude 설치

> [!NOTE]
> Claude Code CLI를 설치하는 5가지 방법을 정리한 것. 공식 설치 스크립트(curl/irm)는 Node.js 런타임을 자체적으로 내장해서 배포하므로 Node를 별도로 깔지 않아도 되고, NPM 방식은 기존 Node.js 패키지 매니저 생태계를 그대로 활용하고 싶을 때(버전 관리, 사내 프록시 레지스트리 등) 선택하는 방식이라 Node 설치가 선행되어야 한다.
>
> 이 문서 작성 시점 기준으로 설치되는 CLI의 구체적인 버전 번호는 기재되어 있지 않다(설치 스크립트는 항상 최신 릴리스를 받아온다). 설치 후 `claude --version`으로 실제 설치된 버전을 확인하고, 필요하면 원본 기록에 병기할 것.

| OS | Node 설치 여부 | 명령어 |
| --- | --- | --- |
| 윈도우 | X | curl -fsSL [https://claude.ai/install.cmd](https://claude.ai/install.cmd) -o install.cmd && install.cmd && del install.cmd |
| 윈도우 (PowerShell) | X | irm [https://claude.ai/install.ps1](https://claude.ai/install.ps1) | iex |
| MacOS, Linux, WSL | X | curl -fsSL [https://claude.ai/install.sh](https://claude.ai/install.sh) | bash |
| Homebrew (Mac OS) | X | brew install --cask claude-code |
| NPM 설치 | O | npm install -g @anthropic-ai/claude-code |

# Claude 실행

설치가 끝나면 터미널에서 `claude` 명령어로 실행할 수 있다.

```sql
>> claude
```
