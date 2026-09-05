---
title: "form 및 여러 입력 태그 (<form>,<input>,<select>,<textarea>,<progress>)"
tags: [프로그래밍 언어, HTML]
created: 2026-09-05
modified: 2026-09-05
---

# form 및 여러 입력 태그 (`<form>`,`<input>`,`<select>`,`<textarea>`,`<progress>`)

1. Form  
2. 입력 `<input>`  
3. input 이외 입력 태그

## Form

*   `<form>`
    *   method : 해당 폼을 서버로 전송하는 방법 ( Get 또는 Post 방식 )
    *   action : 해당 매핑되어있는 URL로 전송
*   `<input>`
    *   type : 텍스트, 패스워드 등, 유형에 따라 결정
    *   id : label과 연계 또는 해당 태그의 고유 속성값 부여
    *   **name : 서버로 전송 시, 해당 값을 보고 판단 (기준)**
*   `<label>`
    *   `<input>` 태그와 같이 사용되며, 해당 input 박스의 텍스트 설명으로 주로 사용됨
        *   for : `<input>`의 id 속성과 동일하게 사용하여 매핑

```html
<form method="post" action="/submit">
    <label for="username">아이디</label>
    <input type="text" id="username" name="username">
    <input type="submit" value="전송">
</form>
```

## `<input>`

*   `<input>` 일반 속성
    *   placeholder : 입력 전에 표시되는 텍스트
*   **text**
    *   텍스트 입력
    *   maxlength : 최대 길이 설정
    *   size : 입력 공간 size 설정
*   **password**
    *   입력 시 비공개 처리
*   number
    *   개수 설정 가능
    *   min : 최소 개수
    *   max : 최대 개수
    *   step : 증가 폭 설정
*   color
    *   색상 설정
*   **button VS submit**
    *   button
        *   클릭할 수 있다
        *   그 외 다른 기능은 존재하지 않음 (주의 : submit과 혼동하기 쉬움)
    *   **submit**
        *   클릭 가능
        *   입력된 값을 서버로 전달 가능 (주로 form에서 많이 사용)
*   radio
    *   동일 name으로 설정된 값 중 하나만 선택 가능
*   checkbox
    *   동일 name으로 설정된 값들 중 여러 개 선택 가능

```html
<input type="text" placeholder="이름을 입력하세요" maxlength="10">
<input type="password" name="pw">
<input type="number" min="1" max="10" step="1">
<input type="color" name="favColor">
<input type="radio" name="gender" value="m"> 남
<input type="radio" name="gender" value="f"> 여
<input type="checkbox" name="agree" value="yes"> 약관 동의
```

## `<input>` 이외의 태그

*   `<select>`
    *   선택 가능한 값을 드롭다운 형태로 제공
    *   value : 서버로 넘길 값 설정
    *   selected : 처음으로 보여줄 값
    *   size : 한 번에 보여줄 개수
    *   multiple : 여러 개 선택 가능
    *   `<option>` : `<select>`에 포함될 값
*   `<textarea>`
    *   행, 열 크기를 지정하여 한 번에 보여주는 여러 줄 텍스트 입력창
    *   cols : 최대 몇 자를 보여줄지
    *   rows : 최대 몇 줄을 보여줄지
*   `<progress>`
    *   진척도를 표시
    *   value : 현재 진척도
    *   max : 최대 진척도

```html
<select name="fruit">
    <option value="apple" selected>사과</option>
    <option value="banana">바나나</option>
</select>

<textarea cols="30" rows="5" placeholder="내용을 입력하세요"></textarea>

<progress value="70" max="100"></progress>
```

> 원문: https://gradualprecision.tistory.com/106
