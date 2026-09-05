---
title: "HTML 문서 기본 구조"
tags: [프로그래밍 언어, HTML]
created: 2026-09-05
modified: 2026-09-05
---

# HTML 문서 기본 구조

HTML 문서 기본 구조

## **HTML 문서 기본 구조**

```html
<!DOCTYPE html>

<html lang="ko">
    <head>
        <meta charset="utf-8">
        <title> 홈페이지 제목 </title>
    </head>
    <body>
        홈페이지 본문
    </body>
</html>
```

#### **<!DOCTYPE html>**

*   문서 형식 선언
    *   HTML5를 사용하겠다는 문서 형식 선언
    *   다른 마크업 언어들과는 구분 되게 하기 위해서 필요
*   다른 문서 형식 선언

```html
XHTML 1.0

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Frameset//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-frameset.dtd">
```
```html
XHTML 1.1

<!DOCTYPE html PUBLIC  "-//W3C//DTD XHTML 1.1//EN"    "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
```
```html
HTML 4.01

<!DOCTYPE HTML PUBLIC
     "-//W3C//DTD HTML 4.01//EN"
     "http://www.w3.org/TR/html4/strict.dtd">
<!DOCTYPE HTML PUBLIC
     "-//W3C//DTD HTML 4.01 Transitional//EN"
     "http://www.w3.org/TR/html4/loose.dtd">
<!DOCTYPE HTML PUBLIC
     "-//W3C//DTD HTML 4.01 Frameset//EN"
     "http://www.w3.org/TR/html4/frameset.dtd">
```

#### **문서의 시작과 끝 <html lang= "ko">**

*   HTML 문서를 시작할 때와 끝날때 html 태그를 이용해서 지시해줘야함
*   html 속성
    *   lang :  문서의 주요 언어를 표기
    *   ( 한국 : ko , 영어 : en, 일본어 : ja ... )

#### **문서의 정보 <head>**

*   태그안에 들어갈 내용
    *   <script> ~ </script>
        *   javascript처럼 문법적인 내용이 들어가는 태그
    *   <link href ="~/css" rel="stylesheet">
        *   css 파일 지정 태그
    *   <style>
        *   CSS를 직접 작성
        *   간단하게 사용 가능
    *   <title>
        *   웹사이트 제목으로 사용
    *   <meta>
        *   charset : 인코딩 설정
        *   viewport : 화면 배율 설정 (기기마다 다른 배율 보완)
        *   description : 웹페이지에 대한 설명
        *   author : 웹페이지 저자 설정
    *   meta 예시
        *   <meta name="author" content="tester">
        *   <meta name="description" content="예시를 위한 웹페이지">
        *   <meta name="keywords" content="메타데이터, meta, HTML, 프론트엔드, 백엔드">
        *   **<meta name="viewport" content="width=device-width, initial-scale=1.0"> -> 가장 자주 사용**

#### **문서의 본문**

*   웹 브라우저 화면에 표시될 콘텐츠를 입력하는 태그
*   여러 태그들을 이용해서 웹페이지를 표현

> 원문: https://gradualprecision.tistory.com/100
