---
title: "[SQL] 인덱스"
tags: [프로그래밍 언어, SQL]
created: 2026-09-05
modified: 2026-09-05
---

# [SQL] 인덱스

1. 인덱스 사용이유  
2. 인덱스 주의할점  
3. 인덱스 예시

## 인덱스 사용이유

*   DB의 경우, 데이터를 저장할 때에 순서없이 저장하는 기능을 한다
*   DB는 원하는 결과가 있을시에, Full Scan을 통해서 데이터를 읽어온다
*   인덱스는 Select 조회시, 빠른 결과를 얻기 위해서 사용한다

## 인덱스 주의할점

*   인덱스는 테이블에서 색인이 필요한 열(column)을 저장하기 위해서 따로 파일로 저장
*   아무리 적은 데이터 양이라도, 인덱스가 쌓이다 보면 DB 저장 공간이 줄어든다
*   빈번하게 데이터값이 수정되고 변경되는 경우, 인덱스 파일 또한 수정되어야하기에 DB성능에 좋지않은 영향을 미친다
*   **INSERT / UPDATE / DELETE 사용시 주의**
*   **데이터 중복도가 높은 열(column)의 경우 인덱스의 효용이 없다 (예: 성별, 타입이 별로 없는 경우)**

## 인덱스 예시

*   **인덱스의 경우, rowID를 통하여 데이터를 저장하고 조회하게 된다**

rowId 란?  
 데이터베이스 내 데이터 공유의 주소를 일컫음.  
총 10Byte의 크기를 가지는 sector로, "오브젝트 번호 + 상대 파일번호+ 블록번호 + 데이터 번호"로  
구성되어있다 (데이터베이스 내에 고유한 ID 값)

*   **인덱스는 열(column) 단위로 생성된다**
*   **외래키가 사용되는 열**(column)**에는 인덱스를 사용하는 것이 좋다**
*   **Join에 자주 사용되는 열**(column)**에는 인덱스를 생성하는 것이 좋다** 

```sql
Create Table IndexTest (
    ID INT NOT NULL,
    username VARCHAR(100),
    age INT,
    address VARCHAR(100),
    PRIMARY KEY (ID)
);

Create Table UserDetails (
    username VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    PRIMARY KEY (username)
);

-- IndexTest 외래키 추가
ALTER TABLE IndexTest ADD CONSTRAINT info_username FOREIGN KEY (username) REFERENCES UserDetails(username);

-- Index 추가
CREATE INDEX idx ON IndexTest(username);
    
-- Index가 적용되어, 조회됨
select IndexTest.ID, IndexTest.age, UserDetails.username, UserDetails.email
from IndexTest
JOIN UserDetails ON IndexTest.username = UserDetails.username
Where IndexTest.username='test';
```
