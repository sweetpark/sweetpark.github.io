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
*   **왜 이 조인을 쓰는가**: 두 테이블 모두에 대응하는 값이 있을 때만 의미가 있는 조회에 사용한다. 예를 들어 "주문과 그 주문의 상품 정보"처럼 한쪽만 있으면 데이터가 불완전한 경우, INNER JOIN이 짝이 없는 행을 자동으로 걸러줘 결과가 더 명확해진다. 반대로 "짝이 없는 행도 보고 싶다"면 아래 OUTER JOIN(LEFT/RIGHT/FULL)을 써야 한다.

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
*   **왜 이 조인을 쓰는가**: "기준이 되는 테이블의 모든 행은 반드시 다 보고 싶다"는 요구에 맞는다. 예를 들어 "모든 회원과, 있으면 그 회원의 최근 주문"처럼 기준 테이블(회원)의 행 수를 그대로 유지하면서 관련 정보를 덧붙일 때 사용한다. INNER JOIN을 쓰면 주문이 없는 회원이 결과에서 통째로 사라져 버리므로 결과의 의미가 달라진다.

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
*   **왜 이 조인을 쓰는가**: LEFT JOIN에서 두 테이블의 순서만 바꾼 것과 동치다. 실무에서는 가독성을 위해 "기준 테이블을 항상 왼쪽에 두고 LEFT JOIN만 사용"하는 컨벤션을 쓰는 경우가 많아 RIGHT JOIN은 상대적으로 덜 쓰인다.

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
*   **왜 이 조인을 쓰는가**: 양쪽 테이블 모두에서 "빠진 쪽"을 확인해야 할 때 쓴다(예: 재고 목록과 판매 목록을 비교해 어느 한쪽에만 있는 상품을 찾는 경우). 다만 두 테이블의 카디널리티가 크면 결과가 급격히 커질 수 있어 남용하지 않는 것이 좋다.

> [!TIP] DB 엔진
> `FULL JOIN`은 MySQL 8.0까지 직접 지원하지 않는다(Oracle/PostgreSQL/SQL Server는 지원). MySQL에서는 `LEFT JOIN ... UNION ... RIGHT JOIN`으로 흉내 내야 한다.

```sql
SELECT [Columns] FROM [Table 1] 
Full Join [Table 2] ON Table1.column = Table2.column;
```
```sql
select table1.ID , table1.name, table1.age, table2.address, table2.money FROM table1 Full Join table2 ON table1.name = table2.name;
```

## Cross Join

*   두 테이블의 모든 조합 반환 (카티션 곱, table1 행수 × table2 행수)
*   **왜 이 조인을 쓰는가**: ON 조건 없이 모든 조합이 필요한 경우(예: 모든 상품 × 모든 사이즈 조합표 생성)에 의도적으로 사용한다. ON 절을 빼먹고 실수로 CROSS JOIN이 되는 경우가 흔한 사고 유형이므로, 결과 행 수가 예상보다 크게 나오면 이 실수를 의심해봐야 한다.

```sql
SELECT [Columns] FROM [Table 1] 
Cross Join [Table 2]
```
```sql
select table1.ID , table1.name, table1.age, table2.address, table2.money FROM table1 Cross Join table2;
```
