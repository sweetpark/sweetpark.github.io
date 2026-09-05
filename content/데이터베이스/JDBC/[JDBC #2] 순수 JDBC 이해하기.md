---
title: "[JDBC #2] 순수 JDBC 이해하기"
tags: [데이터베이스, JDBC]
created: 2026-09-05
modified: 2026-09-05
---

# [JDBC #2] 순수 JDBC 이해하기

```text
[Java Application] --(URL, USERNAME, PASSWORD)--> [DriverManager] --> [Connection] --> [DB]
```
DriverManager에 접속 정보(URL, 계정)를 넘기면 매번 새로운 Connection을 생성해 DB와 연결한다. (커넥션 풀 없이 요청마다 연결/해제)

## DB와 연결하기

*   JDBC는 DB를 연결시켜주는 인터페이스 이므로, DB에 접근하기 위한 정보들이 필요하다
*   DB의 주소 (Ex: URL), DB 접근 계정 정보 (Ex: ID / PASSWORD)들이 필요하다
*   DriverManager 혹은 DataSource를 사용 (**DriverManager를 활용한 JDBC를 사용해보고자 한다.**)

## DriverManager의 장단점

| 장점 | 단점 |
| --- | --- |
| 단순하고 직관적이다 | 커넥션 풀 미지원 (매번 DB 연결/해제) |
| 외부 의존 없이 동작 | 매번 연결/닫기를 수동으로 처리해야 한다 |
| JDBC 표준 API이므로 범용성 있음 | 트랜잭션, 커넥션 재사용 등 고급 기능 부족 |

DriverManager의 경우, 간단하거나 순수 JDBC를 연습할때는 사용할만하지만 커넥션을 매번 맺고 끊어야하기에 리소스 낭비가 발생할 수 있으므로 사용시에 충분한 고려가 필요하다 **(커넥션 풀 미지원)**

## DriverManger 사용법

```java
public DBUtil{
//...
public static Connection getConnection(){
    return DriverManager.getConnection(
            ConnectionConst.URL,
            ConnectionConst.USERNAME,
            ConnectionConst.PASSWORD);
}
}
```

*   **DB의 주소 (URL), DB 접근계정(USERNAME, PASSWORD)를 파라미터로 넘기면 DB와 연결을 시도한다.**

* * *

## JDBC 기본 구조

1. Connection : DB연결을 위한 자바 인터페이스  
2. PreparedStatement  : sql 구문 정의  
3. ResultSet  : DB 결과 응답 값 저장
```java
Connection con = null; // DB 연결
    PreparedStatement pstmt = null; // SQL 구문 
    ResultSet rs = null; // 결과값

try{
    con = DBUtil.getConnection(URL, USERNAME, PASSWORD);
    pstmt = con.prepareStatement("sql구문");
    pstmt.setString() // sql에 필요한 인자값 셋팅
    pstmt.executeUpdate() // 쿼리 실행
}
catch ( SQLException e ){
    // ...
}
finally{

     if(rs != null) rs.close();
     if(pstmt != null) pstmt.close(); 
     if(con != null) con.close(); 
 }
```

## JDBC  사용 방법

1) Connection 사용 방법  
  
- DriverManager를 사용 (DB와 연결)  
   Ex) DriverManager.getConnection( URL, USERNAME, PASSWORD);   
  
  
2) PrepareStateMent 사용 방법  
  
- setXXX :  String, int, Array, Blob ... 등 여러가지 데이터 타입을 지정하여 SQL 인자로 넣을 수 있다.  
   Ex) prepareStatement.setString(1, member.getName());  
  
- executeXXX..() : SQL 실행 메서드 ( 반환값 유무에 따라 다른 메서드를 사용 )  
    Ex) executeUpdate() : 결과값 없이 SQL 구문 실행 ( Insert, Update, Delete ..)  
    Ex) executeQuery() : 결과값이 있는(ResultSet이 존재하는) SQL 구문 실행 (SELECT)   
  
  
3) ResultSet 사용 방법  
  
- 사용 방식 : 원하는 객체형태로 역직렬화과정이 필요  
- 추출 방식 : index 혹은 Label 정보를 통한 값 추출 가능  
- ResultSet의 경우, 반복문을 통해 row 한개씩 찾으며, 값을 추출한다.

## JDBC 예제

```java
public void save(Member member) throws SQLException{
    try{
        con = DBConnectionUtil.getConnection();
        pstmt = con.prepareStatement("INSERT INTO MEMBER(name, age, addr) VALUES (?,?,?)");
        pstmt.setString(1, member.getName());
        pstmt.setInt(2, member.getAge());
        pstmt.setString(3, member.getAddr());
        pstmt.executeUpdate();
    }catch (SQLException e){
        log.error("[JDBC] save() error {}",e.getMessage());
        throw new RuntimeException("save() error!", e);
    }finally{
        if(rs != null) rs.close();
        if(pstmt != null) pstmt.close();
        if(con != null) con.close();
    }

}

public List<Member> findAll() throws SQLException{
    try{
        con = DBConnectionUtil.getConnection();
        pstmt = con.prepareStatement("SELECT name, age, addr FROM MEMBER");
        rs = pstmt.executeQuery();
        List<Member> result = new ArrayList<>();
        while(rs.next()){
            Member member = new Member();
            member.setName(rs.getString("name"));
            member.setAge(rs.getInt("age"));
            member.setAddr(rs.getString("addr"));
            result.add(member);
        }

        return result;
    }catch(SQLException e){
        throw new RuntimeException("findAll() Error!");
    }finally {
        if(rs != null) rs.close();
        if(pstmt != null) pstmt.close();
        if(con!= null )con.close();
    }

}
```

> 원문: https://gradualprecision.tistory.com/156
