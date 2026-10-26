---
title: "[설정] vimrc (C/C++ 개발용)"
description: "플러그인 없이 C/C++ 개발에 쓰는 최소 ~/.vimrc 설정. 표시·검색·들여쓰기·ctags·cscope·man·헤더 템플릿·netrw·WSL 클립보드까지 항목별로 정리했습니다."
tags: [학습, 개발-CS, 인프라, Linux, vim, vimrc, ctags, cscope, netrw]
created: 2026-10-26
modified: 2026-10-26
---

# [설정] vimrc (C/C++ 개발용)

> [!NOTE]
> C/C++ 개발용 최소 `~/.vimrc` (플러그인 없음). 기본 명령어는 [VIM 사용법](개발%20%28CS%29/인프라/Linux/기본%20사용·명령어/[CS]%20명령어%20VIM%20사용법%20-%20핵심%20개념%20및%20특징%20정리.md) 참고.

> [!WARNING]
> 원본에서 깨져 있던 두 곳(cscope 등록 줄, WSL 클립보드 `clip.exe` 경로)은 동작하도록 고쳐서 실었다. 경로·프로젝트명은 환경에 맞게 바꿔 쓴다.

## 📌 개념

`~/.vimrc`는 Vim이 시작할 때 읽는 개인 설정 파일이다. 아래 설정은 외부 플러그인 없이 Vim 내장 기능(ctags, cscope, netrw, quickfix, man 플러그인)만으로 코드 탐색·검색·포맷을 해결하는 구성이다. `<leader>`는 `,` 키로 지정했다.

| 영역 | 키 / 명령 | 동작 |
|---|---|---|
| 검색 강조 해제 | `,/` | `:nohlsearch` |
| 포맷 | `,f` | `clang-format`으로 전체(또는 선택 영역) 정리 |
| 태그 생성 | `,t` | 현재 디렉터리에서 `ctags -R .` |
| 정의 이동 / 복귀 | `Ctrl+]` / `Ctrl+T` | ctags 기반 |
| man 페이지 | `K` / `3K` | 커서 단어 man (섹션 3) |
| 프로젝트 검색 | `:Grep 패턴`, `,g` | 결과를 quickfix 창에 표시 |
| quickfix 이동 | `]q` / `[q` | 다음 / 이전 결과 |
| 파일 탐색기 | `F2` | netrw 토글 (인자 없이 `vim` 실행 시 자동 오픈) |

## 💻 예시

### 전체 설정

```vim
" ~/.vimrc  (C/C++ 개발용 최소 설정, 플러그인 없음)

set nocompatible
syntax on
filetype plugin indent on
let mapleader = ","

" --- 표시 ---
set number norelativenumber
set ruler showcmd
set cursorline
set scrolloff=5
" 검색 하이라이트: 배경은 노랑, 글자는 검정
hi Search ctermbg=Yellow ctermfg=Black guibg=Yellow guifg=Black

" --- 검색 ---
set hlsearch incsearch ignorecase smartcase
nnoremap <leader>/ :nohlsearch<CR>

" --- 들여쓰기 / 포맷 ---
set tabstop=4 shiftwidth=4 expandtab
set autoindent cindent
nnoremap <leader>f :%!clang-format<CR>
vnoremap <leader>f :!clang-format<CR>

" --- 이동: ctags ---
" 프로젝트 루트에서 `ctags -R .` 실행.  Ctrl+] 정의 이동 / Ctrl+T 복귀
set tags=./tags;,tags;
nnoremap <leader>t :!ctags -R .<CR>

" --- man 페이지: K (커서 단어), 3K (섹션 3) ---
runtime ftplugin/man.vim
set keywordprg=:Man

" --- 클립보드: y/p 가 OS 클립보드와 공유 (vim 이 +clipboard 지원 시) ---
if has('clipboard')
  set clipboard=unnamedplus
endif

" --- 프로젝트 전체 검색: :Grep 패턴 -> quickfix ---
command! -nargs=+ Grep execute 'silent grep! -rn <args> .' | copen
nnoremap <leader>g :Grep<Space>
nnoremap ]q :cnext<CR>
nnoremap [q :cprev<CR>

" --- 기타 ---
set hidden
set mouse=a
set wildmenu
set backspace=indent,eol,start

" --- 헤더 신규 생성 시 템플릿 (include guard + 필요 목록 주석) ---
function! s:HeaderTemplate()
  let l:g = toupper(substitute(expand('%:t'), '[^A-Za-z0-9]', '_', 'g'))
  call setline(1, [
    \ '/*',
    \ ' * ' . expand('%:t'),
    \ ' *',
    \ ' * [필요한 것]  (예: uint32_t -> <stdint.h>)',
    \ ' *  - ',
    \ ' *',
    \ ' * [제공하는 것]',
    \ ' *  - ',
    \ ' */',
    \ '#ifndef ' . l:g,
    \ '#define ' . l:g,
    \ '',
    \ '',
    \ '',
    \ '#endif /* ' . l:g . ' */'])
  call cursor(13, 1)
endfunction
autocmd BufNewFile *.h,*.hpp call s:HeaderTemplate()

" --- 파일 탐색기 (netrw 내장): F2 토글, 인자 없이 vim 실행 시 자동 오픈 ---
let g:netrw_liststyle = 3
let g:netrw_banner = 0
let g:netrw_winsize = 25
let g:netrw_browse_split = 4
let g:netrw_altv = 1
nnoremap <F2> :Lexplore<CR>
autocmd VimEnter * if argc() == 0 | Lexplore | endif

" --- cscope ---
if has("cscope")
  set nocscopeverbose
  " <프로젝트경로>를 실제 경로로 바꾼다.  cscope.out 이 없으면 먼저 `cscope -Rb`
  cs add <프로젝트경로>/cscope.out <프로젝트경로>
  set cscopeverbose
endif

" --- WSL 클립보드: y(yank) 한 내용을 Windows 클립보드로 복사 ---
augroup WSLYank
  autocmd!
  autocmd TextYankPost * if v:event.operator ==# 'y' | call system('/mnt/c/Windows/System32/clip.exe', @0) | endif
augroup END
```

### 항목별 메모

- **검색 하이라이트**: `hi Search`로 노란 배경 + 검정 글자를 지정해 다크 테마에서도 매치가 눈에 띈다. `ignorecase smartcase`는 소문자로만 검색하면 대소문자를 무시하고, 대문자가 섞이면 구분한다.
- **들여쓰기**: 탭 대신 공백 4칸(`expandtab`). 전체 정리는 `,f`(clang-format 필요).
- **ctags**: `set tags=./tags;,tags;`의 `;`는 상위 디렉터리로 거슬러 올라가며 `tags` 파일을 찾으라는 뜻이라, 하위 폴더에서 열어도 프로젝트 루트의 `tags`가 잡힌다. 자세한 사용법은 [ctags](개발%20%28CS%29/인프라/Linux/소스%20코드%20분석/[Bash]%20명령어%20ctags%20-%20핵심%20개념%20및%20특징%20정리.md) 참고.
- **`:Grep`**: `-nargs=+`라 인자 필수이며, `grep!`(느낌표)로 첫 결과로 자동 점프하지 않고 `copen`으로 quickfix 목록만 연다.
- **헤더 템플릿**: 새 `.h`/`.hpp` 파일을 만들 때만(`BufNewFile`) include guard와 "필요한 것/제공하는 것" 주석을 넣고 커서를 13행(본문 위치)에 둔다.
- **netrw**: `netrw_browse_split=4`는 파일을 이전 창에서 열고, `netrw_winsize=25`는 탐색기 폭을 25%로 한다.
- **cscope**: `cs add`는 `cscope.out` 경로와 프로젝트 루트 두 인자가 필요하다. 원본에서는 `cs add ... set csverb`가 한 줄로 붙어 있어 `set`이 인자로 들어가므로, 줄을 분리했다. 대응 옵션은 `csverb` = `cscopeverbose`.
- **WSL 클립보드**: `clipboard=unnamedplus`는 WSL의 Vim이 `+clipboard`를 지원하지 않으면 동작하지 않는다. 그 대안으로 yank 직후 `clip.exe`에 레지스터 `0`을 넘겨 Windows 클립보드로 복사한다. 원본의 `/mnt/c/Windows/System32/` 경로가 여러 번 반복된 오타는 한 번으로 정리했다. `has('clipboard')`가 참인 환경에서는 이 블록이 필요 없다.
- **적용 확인**: `vim --version | grep clipboard`에서 `+clipboard`면 OS 클립보드 직접 공유, `-clipboard`면 위 `clip.exe` 방식을 쓴다.
