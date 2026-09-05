---
title: "[SQL] JOIN 정리"
tags: [프로그래밍 언어, SQL]
created: 2026-09-05
modified: 2026-09-05
---

# [SQL] JOIN 정리

1. Inner Join  
2. LEFT Join  
3. Right Join  
4. FULL Join  
5. Cross Join

## Inner Join

*   두 테이블에서 일치하는 데이터만 반환
*   inner를 생략하고, JOIN만 사용해도 됨

```sql
SELECT [Columns] FROM [Table 1] 
Inner Join [Table 2] ON Table1.column = Table2.column;
```

예시 테이블:

`table1` (ID, name, age)

| ID | name | age |
| --- | --- | --- |
| 1 | kim | 25 |
| 2 | park | 32 |
| 3 | lee | 28 |
| 4 | choi | 19 |

`table2` (name, address, money)

| name | address | money |
| --- | --- | --- |
| kim | 서울 | 15000 |
| park | 부산 | 22000 |
| jung | 대구 | 9000 |
| choi | 인천 | 5000 |

실행 결과 (table1.name = table2.name 기준 Inner Join, 양쪽에 모두 존재하는 name만 반환):

| ID | name | age | address | money |
| --- | --- | --- | --- | --- |
| 1 | kim | 25 | 서울 | 15000 |
| 2 | park | 32 | 부산 | 22000 |
| 4 | choi | 19 | 인천 | 5000 |

## Left Join

*   왼쪽 테이블(table1)의 모든 데이터와 오른쪽 테이블(table2)의 일치하는 데이터 반환

```sql
SELECT [Columns] FROM [Table 1] 
Left Join [Table 2] ON Table1.column = Table2.column;
```

실행 결과 (table1의 모든 행 + 일치하는 table2 데이터, 일치하지 않으면 NULL, 위 예시 테이블 기준):

| ID | name | age | address | money |
| --- | --- | --- | --- | --- |
| 1 | kim | 25 | 서울 | 15000 |
| 2 | park | 32 | 부산 | 22000 |
| 3 | lee | 28 | NULL | NULL |
| 4 | choi | 19 | 인천 | 5000 |

## Right Join

*   오른쪽 테이블(table2)의 모든 데이터와 왼쪽 테이블(table1)의 일치하는 데이터 반환

```sql
SELECT [Columns] FROM [Table 1] 
Right Join [Table 2] ON Table1.column = Table2.column;
```

실행 결과 (table2의 모든 행 + 일치하는 table1 데이터, 일치하지 않으면 NULL, 위 예시 테이블 기준):

| ID | name | age | address | money |
| --- | --- | --- | --- | --- |
| 1 | kim | 25 | 서울 | 15000 |
| 2 | park | 32 | 부산 | 22000 |
| NULL | jung | NULL | 대구 | 9000 |
| 4 | choi | 19 | 인천 | 5000 |

## Full Join

*   두 테이블의 모든 데이터 반환, 일치하지 않으면 NULL 반환

```sql
SELECT [Columns] FROM [Table 1] 
Full Join [Table 2] ON Table1.column = Table2.column;
```
```sql
select table1.ID , table1.name, table1.age, table2.address, table2.money FROM table1 Full Join table2 ON table1.name = table2.name;
```

## Cross Join

*   두 테이블의 모든 조합 반환

```sql
SELECT [Columns] FROM [Table 1] 
Cross Join [Table 2]
```
```sql
select table1.ID , table1.name, table1.age, table2.address, table2.money FROM table1 Cross Join table2;
```

> 원문: https://gradualprecision.tistory.com/131
