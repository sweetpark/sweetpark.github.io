---
title: "프론트엔드 기초 개념"
tags: [학습, 개발실무, 프론트엔드]
created: 2026-02-04
modified: 2026-09-05
---

# 프론트엔드 기초 개념

> [!NOTE]
> 실무에서 자주 쓰는 프론트엔드 기초: HTML/JSP·JSTL 구조, JavaScript·jQuery 문법과 DOM 조작·이벤트·AJAX, 그리고 실습 예제 모음.

## 📌 개념

## 1. HTML 기본 문법 및 개념

### 필수 개념

- **HTML 구조**: `<!DOCTYPE html>`, `<html>`, `<head>`, `<body>` 등 기본 구조 이해
- **태그와 속성**: `<div>`, `<span>`, `<table>`, `<form>`, `<input>`, `<select>`, `<option>` 등
- **폼(form) 관련**:
    - `<form>` 태그와 그 속성 (`action`, `method`, `target`)
    - 폼 요소 (`<input>`, `<select>`, `<textarea>` 등)
- **링크와 이미지**: `<a href="...">`와 `<img src="...">`의 사용법
- **JSP/JSTL 태그**:
    - JSP 디렉티브 (`<%@ ... %>`)
    - JSTL 코어 태그 (`<c:if>`, `<c:forEach>`, `<c:choose>`, `<c:when>`, `<c:otherwise>`)
    - Spring 태그 라이브러리 (`<spring:message>`, `<form:form>`, `<form:select>`, `<form:options>`)
- **HTML 주석**: `<!-- 주석 -->` 사용법

### 추가로 학습하면 좋은 내용

- **시멘틱 태그**: `<header>`, `<footer>`, `<nav>`, `<article>`, `<section>` 등 의미 있는 태그 사용
- **반응형 디자인**: 미디어 쿼리, Bootstrap 같은 프레임워크 활용

---

## 2. JavaScript 및 jQuery 문법

### 필수 개념

- **기본 문법**:
    - 변수 선언(`var`, `let`, `const`)
    - 함수 선언 및 호출
    - 조건문, 반복문, 객체와 배열 등
- **DOM 조작**:
    - `document.getElementById()`, `document.querySelector()` 등 순수 DOM 접근
    - jQuery 선택자 (`$(selector)`)와 메서드 (예: `.html()`, `.val()`, `.append()`)
- **이벤트 처리**:
    - `$(document).ready()`로 DOM 준비 확인
    - `.click()`, `.change()`, `.on()` 등 이벤트 바인딩
- **AJAX**: jQuery의 `$.ajax()`, `$.get()`, `$.post()` 사용법
- **윈도우 관련**:
    - `window.open()`으로 새 창 열기
    - `window.location`으로 페이지 이동 제어

### 추가 공부

- **ES6+ 문법**: arrow function, template literals, destructuring, promises, async/await
- **모듈 시스템**: ES Modules, CommonJS 등 (대규모 프로젝트에서 중요)
- **JavaScript 디자인 패턴**: 모듈 패턴, 옵저버 패턴 등
- **프론트엔드 프레임워크 기초**: React, Vue, Angular 같은 현대적인 프레임워크(기본 개념만이라도 살펴보기)

| 기능 | v-JS | jQuery |
| --- | --- | --- |
| 원하는 HTML 요소 가져오기 | document.getElement~ | $('선택자') |
| 원하는 요소 내용 가져오기 | .innerText | .text() |
| 원하는 내용으로 바꾸기 | .innerText = '바꿀값' | .text('바꿀값') |
| 태그 포함해서 바꾸기 | .innerHTML = '바꿀값' | .html('바꿀값') |
| 버튼 클릭 이벤트 | .addEventListener('click', 함수) | .click(함수) |
| input 값 가져오기 | .value | .val() |
| input 값 초기화 | .value = '' | .val('') |
| 속성 변경 | .속성이름
.getAttribute
.setAttribute | .attr() |
| 스타일 변경 | .style.속성 = '값' | .css() |

## 💻 예시

### JavaScript 예제

```jsx
//변수설정
const MY_NUM=3;
{
    var qwer="kim", age, addr, test; // 전역변수
    let permitIn="test"; //지역변수
    const MY_NUM2=5; // 전역 공간/지역공간 나뉨 (상수처리)
    
    name ="park"; // 전역변수
    age = 10; // 전역변수
    addr = "seoul"; // 전역변수

}
console.log(qwer, name, age, addr, test, MY_NUM); // print

// IF 문
test=10;

if(test == 10){
    console.log("test : 10");
}else if(test == 20){
    console.log('test : 20');
}else{
    console.log("test : ", test);
}

// Switch 문 
switch(test){
    case 10:
        console.log("(switch) test : 10");
        break;
    case 20:
        console.log("(Switch) test : 20");
        break;
    default:
        console.log("(switch) test : ", test);
}

//for문
for(let i = 0; i< 10; i++){
    console.log(i);
}

// for ~ in 문
obj = {
    "name" : "park",
    "age" : 10
}
for(key in obj){ // 객체 key 순회
    console.log(key);
    console.log(obj.name, obj.age);
}

//for ~ of 문
array = ['array1', 'array2', 'array3'];
for(value of array){ // 반복 순회 가능한 객체
    console.log(value);
}

//foeeach문
array.forEach(element => { // lamda (주로 사용)
    console.log(element);    
});

//While 문
let i = 3;
i=5; // 지역변수로 설정됨 (이미 let으로 선언되었기에)
while(i>0){
    console.log("while문 도는 중 : ", i);
    i--;
}

//함수 설정
testFunc();

function testFunc(){
    console.log("func1");
}

const obj2={
    make : "honda",
    model : "y",
    year : 2020
};
function testFunc2(obj){
    obj.make = "hyundai"
}
testFunc2(obj2);
console.log(obj2);

// 익명함수
const square = function (number){
    return number * number;
}

function testFunc3(square){ // 함수를 넘길 수 있음
    return square * square;
}

//중첩 함수
function outside(){
    var x = 10;
    function inside(x){
        return x * 10;
    }

    return inside;
}

//outside()(20) -> inside(20); 
console.log(outside()(20));

//함수 표현식
console.log((function(x){
    return x*x*x;
})(10));

//클로저 (파라미터를 변수로 자동 저장하고 있음)
const createPet = function(name){
    let gender;

    const pet = {

        setName(newName){
            name = newName
        },
        getName(){
            return name;
        },
        getGender(){
            return gender;
        },
        setGender(newGender){
            if( typeof newGender === "string" && (newGender.toLowerCase() ==="male" || newgender.toLowerCase() === "female"))
            {
                gender = newGender;
            }
        }
    };

    return pet;
};
const pet = createPet("Vivie"); // name파라미터값이 pet에서 계속해서 접근할 수 있도록 남아져있다 ==> 클로저
pet.getName();
pet.setName("Oliver");
pet.setGender("male");
console.log(pet.getGender());
console.log(pet.getName());
```

### jQuery 예제

```html
<html>
    <head>
        <script src="jquery-3.7.1.min.js">
        </script>
        <script>
            // 1. 버튼 클릭
            $(document).ready(function(){
                $("button").click(function(){
                    $("p").hide();
                });
            });
        </script>
        <script>
            // 2. 마우스 포인터 올리기
            $(document).ready(function(){
                $("button.testButton").mouseenter(function(){
                    $("p.choice").hide();
                });
            });
        </script>
        <script>
            // 3. input 색상 변환
            $(document).ready(function(){
                $("input").focus(function(){
                    $(this).css("background-color", "yellow");
                });
                $("input").blur(function(){
                    $(this).css("background-color", "green");
                });
            });
            
        </script>
        <script>
            // 4. 태그 on()메서드 적용
            $(document).ready(function(){
                $("#mousePointer").on({
                    // 마우스 올리기
                    mouseenter: function(){
                        $(this).css("background-color", "lightgray");
                    },  
                    // 마우스 떠나기
                    mouseleave: function(){
                        $(this).css("background-color", "lightblue");
                    }, 
                    // 마우스로 클릭
                    click: function(){
                        $(this).css("background-color", "yellow");
                    }
                });
            });
        
        </script>
        <script>
            // 5. each 반복문 예제
            $(document).ready(function(){
                var fruits = ['apple', 'banana', 'cherry'];
                $.each(fruits, function(index, value){
                    $('#arrayList').append('<li>인덱스 ' + index + ': ' + value + '</li>');
                });

                var person = {
                    이름 : '홍길동',
                    나이 : 30,
                    직업 : '개발자'
                };
                $.each(person, function(key, value){
                    $('ul.objectList').append('<li>' + key + ': ' + value + '</li>');
                });
            });
        </script>
        <script>
            //6. ajax 예제 (비동기 통신)
            $(document).ready(function(){
                $('#loadUsers').click(function(){
                    $.ajax({
                        url : 'https://localhost:8080/api/users',
                        type: 'GET',
                        dataType : 'json',
                        success: function(data){
                            $('#userList').empty();
                            $.each(data, function(index, user){
                                $("#userList").append('<li>' + user.name + ' (' + user.email + ')' + '</li>');
                            });
                        },
                        error : function(){
                            alert('데이터 로딩 실패');
                        }
                    });
                });
            });
        </script>
    </head>

<!-- 
    
태그 선택자: $("태그명") 예: 모든 <p> 태그 선택: $("p")

ID 선택자: $("#id명") 예: ID가 "header"인 요소 선택: $("#header")

클래스 선택자: $(".클래스명") 예: 클래스가 "active"인 모든 요소 선택: $(".active")

-->
    <body>
    <!-- body 예제 -->
        <p id="mousePointer">
            hello
        </p>
        <p class="choice">
            fade out
        </p>
        <button>
            Click Me to hide paragraph All
        </button>
        <button class="testButton">
            Touch Me to hide paragraph fade out
        </button>
        NAME : <input type="text" name="fullname"> 

        <ul id="arrayList"></ul>
        <ul class="objectList"></ul>

        <button id="loadUsers">사용자 데이터 가져오기</button>
        <ul id="userList"></ul>
    </body>

</html>
```
