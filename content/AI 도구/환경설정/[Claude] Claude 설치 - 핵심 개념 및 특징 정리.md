---
title: "Claude 설치"
tags: [학습, AI-도구, 환경설정, AI-환경설정, Claude]
created: 2026-04-13
modified: 2026-09-05
---

# Claude 설치

| OS | Node 설치 여부 | 명령어 |
| --- | --- | --- |
| 윈도우 | X | curl -fsSL [https://claude.ai/install.cmd](https://claude.ai/install.cmd) -o install.cmd && install.cmd && del install.cmd |
| 윈도우 (PowerShell) | X | irm [https://claude.ai/install.ps1](https://claude.ai/install.ps1) | iex |
| MacOS, Linux, WSL | X | curl -fsSL [https://claude.ai/install.sh](https://claude.ai/install.sh) | bash |
| Homebrew (Mac OS) | X | brew install --cask claude-code |
| NPM 설치 | O | npm install -g @anthropic-ai/claude-code |

# Claude 실행

```sql
>> claude
```
