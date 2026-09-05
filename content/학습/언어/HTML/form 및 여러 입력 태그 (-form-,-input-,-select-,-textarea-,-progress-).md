---
title: form 및 여러 입력 태그 (<form>,<input>,<select>,<textarea>,<progress>)
tags: [프로그래밍 언어, HTML]
created: 2026-09-05
modified: 2026-09-05
---

# form 및 여러 입력 태그 (<form>,<input>,<select>,<textarea>,<progress>)

1. Form  
2. 입력 <input>  
3. input 이외 입력 태그

## Form

![](https://blog.kakaocdn.net/dna/G714n/btsJ7nDrUpp/AAAAAAAAAAAAAAAAAAAAAOc2EabRlZjvT3BPCPDmQ7ngiF8JmVg844eYycmcs_BY/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=KbcYydLEUQtzx5t%2BIg8aj1WgkdU%3D)

*   <form>
    *   method : 해당 폼을 서버로 전송하는 방법 ( Get 또는 Post 방식 )
    *   action : 해당 맵핑되어있는 URL로 전송
*   <input>
    *   type : 텍스트, 패스워드 등, 유형에 따라 결정
    *   id : label 과 연계 또는 해당 태그의 고유 속성값 부여
    *   **name : 서버로 전송시, 해당 값을 보고 판단 (기준)**
*    <label>
    *   <input> 태그와 같이 사용되며, 해당 input 박스의 텍스트 설명으로 주로 사용됨
        *   for : <input> id속성과 동일하게 사용하여 맵핑

## <Input>

![](https://blog.kakaocdn.net/dna/btm9tu/btsJ6et8y46/AAAAAAAAAAAAAAAAAAAAABCEl2GiTq0S3KggdggFnXr07DAdrIsPYZdwUMxl8Z1C/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=23QYAGYMlQLiJYpcKhZaYq8BTUY%3D)

*   <input>
    *   일반 속성
        *   placeholder : 입력전에 표시되는 텍스트
    *   **text**
        *   텍스트 입력
        *   maxlenth : 최대 길이 설정
        *   size : 입력 공간 size 설정
    *   **password**
        *   입력시 비공개 처리
    *   number
        *   개수 설정 가능
        *   min : 최소 개수
        *   max : 최대 개수
        *   step : 증가 폭 설정
    *   color
        *   색상 설정
    *   **button VS submit**
        *    button
            *   클릭할 수 있다
            *   외의, 다른 기능은 존재하지 않음 (주의 : submit)
        *   **submit**
            *   클릭 가능
            *   입력된 값 서버로 전달 가능 (주로 form에서 많이 사용)
    *   radio
        *   동일 name으로 설정된 값 중에 하나
    *   checkbox
        *   동일 name으로 설정된 값들 선택 (여러개 가능)

## <input> 이외의 태그

![](https://blog.kakaocdn.net/dna/cnF8TK/btsJ6rmDvE0/AAAAAAAAAAAAAAAAAAAAAN_oNHP2DWug32xl9A-fjbzSxqCg9BHI0kf5n8Zm6gP1/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=NYSqVk4vFl%2BTklLJhzjpFIt%2FX%2Bc%3D)

*   <select>
    *   선택 가능
    *   value : 서버로 넘길 값 설정
    *   selected : 처음으로 보여줄 값
    *   size : 한번에 보여줄 개수
    *   multiple : 여러개 선택 가능
    *   <option> : <select>에 포함될 값
*   <textara>
    *   행,열 크기를 지정하여 한번에 보여주는 텍스트
    *   cols : 최대 몇자를 보여줄지
    *   rows : 최대 몇줄을 보여줄지
*   <progress>
    *   진척도
    *   value: 현재 진척도
    *   max : 최대 진척도

> 원문: https://gradualprecision.tistory.com/106
