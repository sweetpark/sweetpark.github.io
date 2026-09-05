---
title: [SQL] 집계함수, 스칼라함수
tags: [프로그래밍 언어, SQL]
created: 2026-09-05
modified: 2026-09-05
---

# [SQL] 집계함수, 스칼라함수

1. 집계함수  
2. 스칼라 함수

## 집계함수

*   집계함수는 한번에 모아서 처리하는 (집계) 역할이기에, 다른 column(열)과 함께 조회하려면 GROUP BY 절을 이용

| 함수 | 설명 | 사용법 |
| --- | --- | --- |
| Count | 레코드의 개수를 반환 | SELECT COUNT(*) from [테이블명] GROUP BY [다른 column(열)]; |
| Sum | 특정 열의 합계 계산 | SELECT SUM(num) FROM [테이블명] GROUP BY [다른 column(열)]; |
| Avg | 특정 열의 평균값 | SELECT AVG(num) FROM [테이블명] GROUP BY [다른 column(열)]; |
| Max | 특정 열의 최대 값 | SELECT MAX(num) FROM [테이블명] GROUP BY [다른 column(열)]; |
| Min | 특정 열의 최소 값 | SELECT Min(num) FROM [테이블명] GROUP BY [다른 column(열)]; |

## 스칼라 함수

*   스칼라함수는 행마다 결과를 반환
*   1) 문자열함수

| 함수 | 설명 | 사용법 |
| --- | --- | --- |
| Concat | 여러 문자열을 연결 | Select CONCAT( first, ' ', last ) AS first_value from [테이블명]; |
| Len, Length | 문자열 길이 반환 | Select LEN(name) FROM [ 테이블명]; |
| Upper | 문자열을 대문자로 변환 | Select Upper(username) From [테이블명]; |
| Lower | 문자열을 소문자로 변환 | Select Lower(username) From [테이블명]; |
| Substring, substr | 문자열의 일부 반환substr('열', 위치, 반환개수) | Select Substr(username,2,2) From [테이블명]; |
| Replace | 문자열 대체replace('열', '바뀔문자', '변경후문자') | Select Replace(username, 'test', 'sql') from [테이블명]; |

*   2) 수치함수

| 함수 | 설명 | 사용법 |
| --- | --- | --- |
| Round | 숫자 반올림round('열', 소수점 반올림위치) | Select Round(num, 2) From [테이블명]; |
| Ceil | 숫자 올림 | Select CEIL(5.2); |
| Floor | 숫자 내림 | Select FLOOR(5.8); |
| Abs | 숫자 절대값 | Select ABS(-10); |

*   3) 날짜함수

| 함수 | 설명 | 사용법 |
| --- | --- | --- |
| Now | 현재 날짜와 시간을 반환 | SELECT NOW(); |
| Curdate | 현재 날짜 반환 | Select CURDATE(); |
| Dateadd | 날짜에 특정기간 더함 | SELECT DATEADD(DAY, 7, '2024-10-10); |
| Datediff | 두 날짜 차이 반환 | Select DATEDIFF('2024-10-10', '2024-11-01'); |
| Date_Format | 날짜 형식 지정 | Select DATE_FORMAT(Now(), '%y-%m-%d'); |

*   4) 조건함수

| 함수 | 설명 | 사용법 |
| --- | --- | --- |
| IF | 조건에 따라 다른값 반환 | Select If(age >20, 'adult', 'child') From [테이블명]; |
| CASE | 조건에 따라 여러값 반환 | SELECT CASE WHEN age>60 THEN 'senior' WHEN age Between 20 AND 60 THEN 'adult' ELSE 'child'END AS age_typeFrom [테이블명]; |

> 원문: https://gradualprecision.tistory.com/128
