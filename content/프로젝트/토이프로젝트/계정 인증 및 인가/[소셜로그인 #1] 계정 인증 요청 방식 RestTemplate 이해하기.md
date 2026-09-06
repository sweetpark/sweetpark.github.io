---
title: "[소셜로그인 #1] 계정 인증 요청 방식 RestTemplate 이해하기"
tags: [토이프로젝트, 계정 인증 및 인가]
created: 2026-09-05
modified: 2026-09-05
---

# [소셜로그인 #1] 계정 인증 요청 방식 RestTemplate 이해하기

> [!NOTE] 실행 환경
> 이 폴더의 노트에는 Spring/Java 버전이 명시되어 있지 않다. 다만 같은 폴더의 "[소셜로그인 #2]" 노트의 예시 코드에 `jakarta.servlet` 패키지(Spring Boot 3.x 계열의 네임스페이스)가 등장하므로, 참고용으로만 Spring Boot 3.x 기준일 가능성을 추정한다 (확정 정보 아님).

## RestTemplate을 왜 사용해야하는가?

HTTP 통신을 위한 Client 사용 이유?  
- 웹브라우저를 이용한다면, 검색 공간에서 해당 URL 혹은 검색을 통해 정보를 얻을 수 있다.  
- Application 서버의 경우, 적절한 Client를 이용하여 URL을 통하여 검색 결과를 얻을 수 있다.  
(Application 서버 뿐만아니라, command line에서도 확인 가능)

## 웹 브라우저 없이 호출하기

1. CURL

command line상에서 URL을 이용하여 HTTP 통신을 할 수 있게 도와주는 tool  
(API  서버의 경우, 프론트(화면)없이 응답값을 제공하는 경우가 있으므로 Curl로 확인이 가능하다)
CURL 알아야할 옵션  
-X : Http Method 방식 ( GET / POST/ PUT / DELETE )  
-H : Http Header에 붙일 내용 ( -H "Content-Type: application/json")  
-d : Http Body에 담을 정보 ( [FORM DATA] -d "parma1=value1&param2=value2" / [JSON] -d '{"test":"java"}' )  
-f : 잘못된 요청이나 오류시 오류내용 최소화  
-i : 응답 헤더 내용 출력  
-o <file> : 응답 내용 파일  출력 (기본 콘솔 출력)  
-v : 응답의 세부 내용 출력
```java
curl -X POST \
-H "Content-Type:Application/x-www-form-urlencode" \
-d "param1=value1" \
-d "param2=value2" \
www.naver.com

curl -X POST \
-H "Content-Type: application/json" \
-d '{"key":"value"}'
www.naver.com
```

### 2. RestTemplate 이용하기

Application 안에서 Http 요청을 위해서 사용  
(Http 요청을 위해서 RestTemplate이라는 라이브러리를 이용하여 전달)
RestTemplate에서 알아야할 내용  
(기본적으로, Http 통신이기에 header와 body가 필요하다)  
- exchange() : Http 요청을 보내는 메서드 ( 필요한 파라미터들을 입력하여 Http 요청을 보낸다 )  
- getForEntity() : URL 템플릿을 이용하여, Http 요청을 보낼때 사용 (GET 요청에 주로 사용)

a) POST/PUT 요청

```java
ResponseEntity<String> response = restTemplate.exchange(
    "https://example.com/api", // URL 정보
    HttpMethod.POST, // HTTP 메서드 방식
    requestEntity, // body와 header 내용
    String.class // 응답 형태
);
```

b) GET 요청

```java
//GET 요청 (URL Template사용)
ResponseEntity<String> response = restTemplate.getForEntity(
                urlTemplate,  // URL 템플릿
                String.class, // 응답 형태
                uriVariables /* pathVariable 값 */
            );
```
```java
//GET 요청 (QueryParmeter 사용)
ResponseEntity<String> response = restTemplate.exchange(
    uriQueryParam.toUriString(), // URI를 parameter를 포함해서 작성 (UriComponentsBuilder 사용)
    HttpMethod.GET, // GET 방식
    null, // GET은 보통 HttpEntity 생략
    String.class // 응답 형태
);
```

### 3. header와 body 구성

보내는 형태에 따라서, body를 담는 방식과 , header에 담는 값들이 다름
1. FORM 데이터 전송 방식  
- Body의 경우 한개의 key에 여러개의 value가 들어갈 수 있으므로, 키값에 따른 여러개의 value들을 저장할 수 있는 자료구조가 필요 (MultiValueMap 사용)  
- Header 정보에는 Content-Type 명시 ( Application/x-www-form-urlencode )
```java
//body 내용
MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
body.add("colors", "red");
body.add("colors", "blue");

//header 내용
HttpHeaders headers = new HttpHeaders();
headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

// requestEntity로 묶음 (body + header)
HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(body, headers);
```

2. JSON 전송 방식  
- 한개의 key 값에 한개의 value 바인딩 (Map 사용)  
- Header 정보에는 Content-Type 명시 (application/json)
```java
// header
HttpHeaders headers = new HttpHeaders();
headers.setContentType(MediaType.APPLICATION_JSON);

// body
Map<String, Object> jsonBody = new HashMap<>();
jsonBody.put("param1", "value1");
jsonBody.put("param2", "value2");

// 요청 entity(header + body)
HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(jsonBody, headers);
```

3. Qurey Parameter 전송 방식  
- URL에 같이 ?key=value&key2=value2 형식으로 요청문 사용  
- GET 방식에 주로 사용
```java
// 기본 URL
String url = "https://example.com/api";

// UriComponentsBuilder를 통해 쿼리 파라미터 추가
UriComponentsBuilder uriQueryParam = UriComponentsBuilder.fromHttpUrl(url)
    .queryParam("param1", "value1")
    .queryParam("param2", "value2");
    // https://example.com/api?param1=value1&param2=value2
```

### 추가 고민) RestClient..? WebClient..? 로 변환??

현재 프로젝트에서는 RestTemplate을 활용하여 애플리케이션 내부의 HTTP 통신을 처리하고 있습니다. 과거에는 동기 방식의 RestTemplate이 널리 사용되었으나, Spring 5 업데이트 이후 WebFlux와 같은 비동기 처리 메커니즘이 도입되면서 변화의 흐름을 맞이하고 있습니다.  
  
RestTemplate은 동기 방식으로 동작하기 때문에, 대량의 요청이 동시에 유입될 경우 스레드 자원을 효율적으로 활용하지 못할 가능성이 있습니다. 반면, Spring WebFlux와 같은 비동기 클라이언트는 논블로킹 I/O를 지원하여 높은 동시성 환경에서도 효율적으로 동작합니다. 이러한 변화 속에서 RestTemplate의 사용 영역은 점차 축소되고 있습니다.  
  
하지만 우리 프로젝트의 경우, 소셜 로그인을 처리하는 데 RestTemplate을 사용하고 있습니다. 소셜 로그인은 다음 로직으로 진행하기 위해 반드시 응답값이 필요합니다. 비동기 방식으로 전환하더라도 응답 이벤트가 도착하기 전까지는 다음 로직을 진행할 수 없으므로, 동기 방식과 큰 차이가 없습니다. 게다가, 소셜 로그인 관련 스레드는 로그인 완료 전까지 다른 작업을 수행할 필요가 없으므로, 응답을 기다리는 동기 방식이 오히려 구현이 간단하고 효율적이라고 판단하였습니다.  
  
물론, 향후 RestTemplate에 대한 지원이 종료되는 경우에는 WebClient와 같은 비동기 클라이언트로 전환하여 동기적 처리 방식을 유지하거나 비동기 처리로 전환하는 방안을 고려할 수 있겠습니다. 현재로서는 RestTemplate의 지원이 계속되고 있으므로, 기존 구현을 유지하기로 결정하였습니다.

## 관련 문서

- [[소셜로그인 #2] 소셜로그인 OAuth2.0 적용하기 (+디자인패턴 : 전략&팩토리)]([소셜로그인%20%232]%20소셜로그인%20OAuth2.0%20적용하기%20(+디자인패턴%20-%20전략&팩토리).md) — 이 글에서 다룬 RestTemplate을 실제 소셜로그인 OAuth2.0 흐름에 적용하는 다음 편
