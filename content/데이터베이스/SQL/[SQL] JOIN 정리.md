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

![](https://blog.kakaocdn.net/dna/duLxsF/btsKeel5EI7/AAAAAAAAAAAAAAAAAAAAAFbilNRBgcsaLY4uEqdB_O6G6JXOTsvuSYpS6tbnQUCg/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=5q4Ry5eyDSIxKBgpx9Gs8dnAR4w%3D)

## Left Join

*   왼쪽 테이블(table1)의 모든 데이터와 오른쪽 테이블(table2)의 일치하는 데이터 반환

```sql
SELECT [Columns] FROM [Table 1] 
Left Join [Table 2] ON Table1.column = Table2.column;
```

![](https://blog.kakaocdn.net/dna/bVxjq5/btsKc2GRnDx/AAAAAAAAAAAAAAAAAAAAANrM2xMqTvo2DBCOfRLnUauA0ubrh4dxwC0lk4cUP7yG/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=%2BmrrQ4EUdHOeyz9eK5DNQwGJPzY%3D)

## Right Join

*   오른쪽 테이블(table2)의 모든 데이터와 왼쪽 테이블(table1)의 일치하는 데이터 반환

```sql
SELECT [Columns] FROM [Table 1] 
Right Join [Table 2] ON Table1.column = Table2.column;
```

![](https://blog.kakaocdn.net/dna/cGtPJ7/btsKeBH3CpL/AAAAAAAAAAAAAAAAAAAAALVTWWwbC35WfeCO1Qka7RdXE74xs5GKdP5-4SrbApgW/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=K4FcdL5IMKpYJV8tGiZSckL4k%2BQ%3D)

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
select table1.ID , table1.name, table1.age, table2.address, table2.money FROM table1 Cross Join table2 ON table1.name = table2.name;
```

> 원문: https://gradualprecision.tistory.com/131
