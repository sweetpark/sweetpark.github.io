---
title: "ctags·cscope 실전 설정과 활용"
tags: [학습, 개발-CS, 인프라, Linux, ctags, cscope, vim, quickfix]
created: 2026-09-16
modified: 2026-09-16
---

# ctags·cscope 실전 설정과 활용

> [!NOTE]
> IDE 없이 터미널에서 대규모 C/C++ 코드를 읽기 위한 실전 설정. **인덱스 생성 → vim 연동 → 검색 → 호출관계 추적** 순서로 정리한다. 기본적인 `tags` 생성·`Ctrl+]` 점프는 [ctags](../Linux/[Bash]%20명령어%20ctags%20-%20핵심%20개념%20및%20특징%20정리.md) 참고.

## 0. 역할 구분

`ctags`와 `cscope`는 둘 다 C/C++ 같은 소스 코드를 빠르게 탐색하기 위한 도구지만 목적이 다르다.

| 기능 | ctags | cscope |
| --- | --: | --: |
| 함수/변수/구조체/매크로 정의 찾기 | 매우 좋음 | 가능 |
| 함수 호출자 찾기 | 제한적 | 매우 좋음 |
| 함수가 호출하는 함수 찾기 | 제한적 | 좋음 |
| 문자열 검색 | 제한적 | 가능 |
| include 관계 | 제한적 | 가능 |
| 속도 | 매우 빠름 | 빠름 |
| DB 파일 | `tags` | `cscope.out` |

> **ctags = "어디에 정의됐나"** (정방향 점프) / **cscope = "누가 쓰고 있나"** (역방향 추적). 대체 관계가 아니라 보완 관계다 — `ctags + cscope + vim` 조합이 전통적으로 많이 쓰인다.

## 1. 설치

```bash
# Ubuntu / Debian
sudo apt update
sudo apt install universal-ctags cscope vim

# Fedora / RHEL / CentOS
sudo dnf install ctags cscope vim-enhanced
```

설치 확인:

```bash
ctags --version
cscope --version
vim --version | grep cscope     # +cscope 가 있어야 vim에서 쓸 수 있다
```

> [!WARNING] `-cscope` 로 나오면
> vim이 cscope 지원 없이 빌드된 것이다. `vim-enhanced`(RHEL 계열) 또는 `vim-nox`(Debian 계열)를 설치해야 한다.
> 운영 서버는 최소 설치가 많아서 기본 `vim-minimal`만 깔려 있는 경우가 흔하다.

## 2. 인덱스 생성

프로젝트 최상위 디렉터리에서 실행한다.

### 2-1. 간단하게 (소규모 프로젝트)

```bash
ctags -R .              # tags 생성
cscope -R -b -q         # cscope.out 생성
```

| 옵션 | 의미 |
| :--- | :--- |
| `-R` | 하위 디렉터리 재귀 탐색 |
| `-b` | 대화형 UI 없이 DB만 빌드 |
| `-q` | 역색인 생성 → 검색 속도 대폭 향상 (`cscope.in.out`, `cscope.po.out`) |

### 2-2. 제대로 (대규모 레거시)

빌드 산출물·벤더 코드까지 인덱싱하면 DB가 비대해지고 점프할 때 엉뚱한 곳으로 간다. 제외 목록을 명시한다.

```bash
ctags -R \
  --languages=C,C++ \
  --exclude=.git --exclude=build --exclude=out --exclude=vendor \
  -f tags .
```

cscope는 대상 파일 목록을 먼저 만든 뒤 DB를 만드는 쪽이 통제하기 쉽다.

```bash
find . -type f \
  \( -name '*.c' -o -name '*.h' -o -name '*.cc' \
     -o -name '*.cpp' -o -name '*.cxx' \
     -o -name '*.hpp' -o -name '*.hh' \) \
  -not -path './.git/*' -not -path './build/*' -not -path './out/*' \
  > cscope.files

cscope -b -q -i cscope.files
```

생성 파일:

```
tags              ← ctags
cscope.files      ← 인덱싱 대상 목록
cscope.out        ← cscope 본 DB
cscope.in.out     ← -q 역색인
cscope.po.out     ← -q 역색인
```

| 추가 옵션 | 의미 |
| :--- | :--- |
| `-i FILE` | 인덱싱 대상 파일 목록 지정 |
| `-k` | 시스템 헤더(`/usr/include`)를 검색에서 제외. 커널·펌웨어처럼 자체 헤더만 쓰는 프로젝트에 적합 |

## 3. vim 연동

일회성으로 붙일 때:

```vim
:cs add cscope.out
:cs show
:set tags=./tags;
```

> `set tags=./tags;` 뒤의 세미콜론은 **"현재 파일 위치에서 상위 디렉터리로 올라가며 tags를 찾아라"** 는 의미다.
> 소스 트리 깊은 곳에서 vim을 열어도 루트의 `tags`를 찾아준다.

### 권장 `~/.vimrc`

```vim
" 현재 위치부터 상위로 tags 탐색
set tags=./tags,tags;$HOME

" Ctrl-] 을 누르면 ctags보다 cscope를 먼저 조회
set cscopetag
set csto=0

" 검색 결과를 quickfix 창으로
set cscopequickfix=s-,c-,d-,i-,t-,e-

" 프로젝트 루트에 cscope.out 이 있으면 자동 로드
if filereadable("cscope.out")
    silent! cs add cscope.out
endif

" Ctrl+\ 뒤에 알파벳 → 커서 아래 단어로 검색
nnoremap <C-\>g :cs find g <C-R><C-W><CR>
nnoremap <C-\>c :cs find c <C-R><C-W><CR>
nnoremap <C-\>d :cs find d <C-R><C-W><CR>
nnoremap <C-\>s :cs find s <C-R><C-W><CR>
```

| 설정 | 효과 |
| :--- | :--- |
| `cscopetag` | `Ctrl-]` · `:tag` 가 cscope도 함께 조회 |
| `csto=0` | 조회 우선순위 — `0`은 cscope 먼저, `1`은 ctags 먼저 |
| `cscopequickfix` | 결과가 여러 개일 때 quickfix 목록으로. `:copen` / `:cnext` / `:cprevious` / `:cclose` 로 순회 |

## 4. ctags 조작 (정의로 점프)

| 동작 | 명령 |
| :--- | :--- |
| 정의로 이동 | `Ctrl-]` |
| 이동 전 위치로 복귀 (태그 스택 pop) | `Ctrl-t` |
| 일반 점프 위치로 복귀 | `Ctrl-o` |
| 정의 후보 목록 표시 | `g]` |
| 이름으로 정의 이동 | `:tag 함수이름` |
| 이름의 정의 후보 목록 | `:tselect 함수이름` (`:ts`) |
| 다음 / 이전 후보 | `:tnext` / `:tprevious` |

> [!TIP] 같은 이름이 여러 개일 때
> 레거시 C 코드는 `init()`, `process()` 같은 이름이 모듈마다 존재하는 경우가 많다.
> `Ctrl-]` 로 엉뚱한 곳에 도착하면 `Ctrl-t` 로 돌아와 `:ts 함수명` 으로 목록을 보고 고르는 게 빠르다.

## 5. cscope 검색 명령

```vim
:cs find <종류> <검색어>
```

| 명령 | 의미 | 언제 쓰나 |
| :--- | :--- | :--- |
| `:cs find s name` | 심볼이 **사용된 모든 위치** | 이 변수를 건드리면 어디가 영향받나 |
| `:cs find g name` | **전역 정의** 찾기 | 정의가 어디지 |
| `:cs find d name` | `name`이 **호출하는** 함수 | 이 함수가 내부에서 뭘 부르나 (순방향) |
| `:cs find c name` | `name`을 **호출하는** 함수 | 누가 이걸 부르나 (역방향) ⭐ 가장 많이 씀 |
| `:cs find t text` | 문자열 검색 | 로그 메시지로 코드 위치 찾기 |
| `:cs find e regex` | 정규식 검색 | |
| `:cs find f file.c` | 파일 찾기 | |
| `:cs find i header.h` | 이 헤더를 include하는 파일 | 헤더 수정 시 영향 범위 파악 |

커서 아래 단어를 명령줄에 삽입하려면 `Ctrl-r` `Ctrl-w`:

```vim
:cs find g <Ctrl-r><Ctrl-w>
```

## 6. 호출 관계 추적

`process_request()`를 **누가** 호출하는지 (역방향, 위로):

```vim
:cs find c process_request
```

`process_request()`가 **무엇을** 호출하는지 (순방향, 아래로):

```vim
:cs find d process_request
```

결과에서 상위 함수를 열고 다시 `:cs find c 상위함수` 를 반복하면 호출 경로를 위로 계속 거슬러 올라갈 수 있다.

```
    ???                        ← :cs find c main_loop  (계속 위로)
     │
  main_loop()
     │                         ← :cs find c process_request
     ▼
  process_request()
     │                         ← :cs find d process_request
     ▼
  parse_header()  send_reply()
```

> [!IMPORTANT] cscope는 정적 호출 관계다
> cscope가 보여주는 것은 **소스 코드상 그렇게 부를 수 있다**는 관계일 뿐, 실제 실행 중의 호출 스택이 아니다.
> 함수 포인터로 호출되는 경로(콜백 핸들러 등)는 잡히지 않는다.
> 실제 런타임 스택은 GDB로 확인한다 — [GDB 실전 디버깅]([Tool]%20GDB%20실전%20디버깅%20(멀티스레드·시그널).md) 참고.

## 7. DB 갱신

소스가 바뀌거나 파일이 추가되면 인덱스는 자동으로 갱신되지 않는다. **점프가 엉뚱한 줄로 가면 대부분 DB가 낡은 것이다.**

```bash
ctags -R --languages=C,C++ --exclude=.git --exclude=build -f tags .
cscope -b -q -i cscope.files
```

> [!TIP] 쉘 별칭으로 등록해두기
> ```bash
> alias mktags='ctags -R --languages=C,C++ --exclude=.git --exclude=build -f tags . && cscope -b -q -i cscope.files'
> ```
> git pull 후 습관적으로 `mktags` 한 번 치는 것을 권장.

## 8. 컴파일 에러 확인 (`:make` + quickfix)

ctags/cscope는 "코드를 읽는" 도구이고, 컴파일 에러 확인은 vim 내장 `:make` + quickfix만으로 충분하다. 별도 플러그인이 필요 없다.

```vim
:make
```

Makefile이 있는 디렉터리에서 실행하면 `make`가 돌고, 에러/경고가 **quickfix 목록**에 쌓인다.

| 명령 | 동작 |
| :--- | :--- |
| `:make` | Makefile 빌드 실행, 결과를 quickfix에 수집 |
| `:copen` | quickfix 창 열기 |
| `:cnext` / `:cprevious` (`:cn` / `:cp`) | 다음/이전 에러 위치로 이동 |
| `:cfirst` / `:clast` | 첫 번째 / 마지막 에러로 이동 |
| `:cc [n]` | n번째 에러로 바로 이동 |
| `:cclose` | quickfix 창 닫기 |

> [!TIP] 에러 난 파일을 직접 열 필요가 없다
> `:make`를 실행하면 에러가 있을 경우 커서가 **첫 번째 에러의 파일·줄로 자동 이동**한다.
> 이후 `:cnext`로 넘어갈 때 에러가 다른 파일에 있어도 vim이 **자동으로 그 파일을 열고** 해당 줄로 이동시켜준다.

> [!TIP] 다른 디렉터리의 Makefile을 쓸 때
> ```vim
> :set makeprg=make\ -C\ /path/to/project
> ```
> 서브 디렉터리에서 vim을 열어도 프로젝트 루트 Makefile로 빌드하도록 지정할 수 있다.

### 빌드할 때마다 tags/cscope도 같이 갱신

7번의 `mktags` 별칭을 Makefile 타겟으로 옮겨두면 `:make` 한 번이 "빌드 + 인덱스 갱신"을 동시에 해결한다.

```makefile
tags:
	ctags -R --languages=C,C++ --exclude=.git --exclude=build -f tags .
	cscope -Rbq

all: tags
	$(CC) $(CFLAGS) -o myprog $(SRCS)
```

## 9. 자동완성 (플러그인 없이)

폐쇄망이거나 vim이 오래된 버전(`+lua`, `+job` 없음)이면 `coc.nvim`, `nvim-cmp` 같은 LSP 기반 플러그인은 애초에 설치·구동이 안 된다.

```bash
vim --version | grep -E 'lua|job|channel'
```

결과가 전부 `-`(미포함)면 LSP 계열은 포기하고 **vim 내장 자동완성**만으로 구성한다.

| 단축키 | 방식 | 언제 쓰나 |
| :--- | :--- | :--- |
| `Ctrl-n` / `Ctrl-p` | 키워드 완성 (현재/다른 버퍼 + tags 파일) | 가장 자주 씀, 변수·함수 이름 |
| `Ctrl-x Ctrl-]` | 태그 기반 완성 | ctags 등록 심볼만 정확히 완성하고 싶을 때 |
| `Ctrl-x Ctrl-o` | omni completion (`ccomplete`) | `ptr->` 뒤 구조체 멤버 완성 |
| `Ctrl-x Ctrl-f` | 파일 경로 완성 | `#include "..."` 작성할 때 |

### 권장 `~/.vimrc` 추가

```vim
" 완성 후보 출처: 현재버퍼, 다른창, 버퍼, unloaded버퍼, tags, include
set complete=.,w,b,u,t,i
set completeopt=menu,menuone

" ptr->member, struct.member 자동완성
set omnifunc=ccomplete#Complete
```

> [!IMPORTANT] omni completion은 tags 파일에 의존한다
> `ccomplete#Complete`가 구조체 멤버를 알아내려면 ctags가 `--fields=+iaS` 옵션으로 멤버 정보까지 인덱싱해야 한다.
> ```bash
> ctags -R --fields=+iaS --extra=+q .
> ```
> 이 옵션 없이 만든 `tags`는 함수/변수 정의 점프는 되지만 멤버 자동완성은 부실하다.

> [!TIP] IDE 자동완성과의 차이
> LSP 기반(clangd 등) 자동완성은 실시간 타입 추론이지만, 위 방식은 **tags 파일 스냅샷** 기준이다.
> 코드를 크게 고친 뒤에는 7번의 `mktags`(또는 8번의 `:make`)로 갱신해야 최신 심볼이 완성 후보에 뜬다.

## 10. 요즘 LSP와는 어떤 차이가 있나

```text
ctags   → 문자/심볼 기반 정의 검색
cscope  → 소스 코드 참조 관계 검색
clangd  → 컴파일 정보까지 이해한 semantic 분석 (Go to Definition / Find References / Rename / Hover / Diagnostics / Completion)
```

`ctags/cscope`는 여전히 장점이 있다.

- 설정이 단순하고 DB가 가벼움
- 터미널 환경에서 잘 동작, 빌드 환경이 불완전해도 사용 가능
- 오래된/거대한 C 프로젝트, 임베디드/커널 소스 탐색에 유용

특히 **"컴파일은 당장 안 되지만 코드부터 읽어야 하는 상황"**에서는 ctags/cscope가 상당히 편하다.

## 참고 링크

- [Universal Ctags 매뉴얼](https://docs.ctags.io/en/latest/man/ctags.1.html)
- [Vim cscope 도움말](https://vimhelp.org/if_cscop.txt.html)

## 관련 문서

- [(Bash) 명령어 ctags - 핵심 개념 및 특징 정리]([Bash]%20명령어%20ctags%20-%20핵심%20개념%20및%20특징%20정리.md)
- [(Bash) 명령어 Makefile - 핵심 개념 및 특징 정리]([Bash]%20명령어%20Makefile%20-%20핵심%20개념%20및%20특징%20정리.md)
- [GDB 실전 디버깅 (멀티스레드·시그널)]([Tool]%20GDB%20실전%20디버깅%20(멀티스레드·시그널).md)
- [낯선 C 코드베이스 분석 순서 (방법론)]([Method]%20낯선%20C%20코드베이스%20분석%20순서%20(방법론).md)
- [(CS) 명령어 VIM 사용법 - 핵심 개념 및 특징 정리]([CS]%20명령어%20VIM%20사용법%20-%20핵심%20개념%20및%20특징%20정리.md)
