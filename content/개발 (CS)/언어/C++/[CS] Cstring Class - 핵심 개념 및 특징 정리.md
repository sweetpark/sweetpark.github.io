---
title: "Cstring Class"
tags: [학습, 개발-CS, 언어, C++, 개발, 문자열, 유니코드]
created: 2026-09-05
modified: 2026-09-05
---

# Cstring Class

> [!NOTE]
> MFC `CString` 클래스 — 유니코드 문자열 처리와 `wchar_t`.

## 📌 개념

### CString 클래스

- unicode로 문자열 표현

> [!NOTE]
> 필요한 Include
> - stdafx.h
> - tchar.h
> - locale.h ⇒ locale (한국어 지정), 사용법: `_wsetlocale(LC_ALL, L"Korean");`

- `char` ⇒ `wchar_t` (새로운 자료형): char와 동일하지만 멀티바이트에서도 사용 가능

> [!NOTE]
> 사용법: `wchar_t* wszName2 = L"[문자열]"`
> ⇒ `L` 필수로 들어가야 함 (소문자 `l`은 안 됨)

- 문자 1개당 2byte 처리 (공백도 2byte 처리)

### 출력

- `%s`, `%ls`, `%ws` 사용

```cpp
int _tmain(int argc, _TCHAR* argv[])
{
    wchar_t  wszName1[100];
    wchar_t  wszName2[100];
    wchar_t* wszName3 = L"예시 문자열";

    FILE* pFile = fopen("Unicode.txt", "wt");

    _wsetlocale(LC_ALL, L"Korean");

    _getws(wszName2);
    wcscpy(wszName1, _T("흑염룡이 내 안에서 숨쉰다"));
    wcscat(wszName1, _T(" 내 생이 끝날 때까지!"));

    wprintf(L"%s\n",  argv[0]);
    wprintf(L"%ls\n", wszName1);
    wprintf(L"%ws\n", wszName2);
    wprintf(L"%ws\n", wszName3);

    // 파일 출력
    fwprintf(pFile, wszName1);
    fwprintf(pFile, L"\n");
    fwprintf(pFile, wszName2);
    fwprintf(pFile, L"\n");
    fwprintf(pFile, wszName3);
    fwprintf(pFile, L"\n");
    fclose(pFile);

    return 0;
}
```
