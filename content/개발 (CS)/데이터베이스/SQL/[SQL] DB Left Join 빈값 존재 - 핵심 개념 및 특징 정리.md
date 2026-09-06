---
title: "[DB] Left Join 빈값 존재"
tags: [학습, 개발-CS, 데이터베이스, SQL]
modified: 2026-09-05
---

# [DB] Left Join 빈값 존재

> [!NOTE]
> LEFT JOIN과 INNER JOIN의 결과 차이(빈값 처리) 정리 노트.

## 📌 개념

- LEFT JOIN: FROM 테이블을 기준으로 값이 없어도 null로 결과 출력
- INNER JOIN: FROM 테이블 및 INNER JOIN 기준으로 결과 출력(INNER JOIN 및 FROM 테이블의 정보가 없을 시 결과 출력 안 됨)
- 필요에 따라 LEFT JOIN과 INNER JOIN을 구분해서 사용해야 한다.

```sql
--[LEFT JOIN Example]
SELECT *
FROM MEMBER AS M
LEFT JOIN LOG AS L ON M.ID = L.ID
LEFT JOIN BOOK AS B ON B.ID = M.ID;

/*
id | member_name | member_age | id | log_name | log_msg | id | book_name | book_price
1  |    test     |     14     |  1 |   log1   |  test   |    |          |
2  |    test     |     14     |  2 |   log1   |  test   |  2 |   java    |  1000
*/

--[INNER JOIN Example]
SELECT *
FROM MEMBER AS M
LEFT JOIN LOG AS L ON M.ID = L.ID
INNER JOIN BOOK AS B ON B.ID = M.ID;

/*
id | member_name | member_age | id | log_name | log_msg | id | book_name | book_price
2  |    test     |     14     |  2 |   log1   |  test   |  2 |   java    |  1000
*/
```
