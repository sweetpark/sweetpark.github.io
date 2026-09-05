---
title: "maven"
tags: [학습, 개발-CS, 인프라, 개발환경, 개발, maven]
created: 2026-02-03
modified: 2026-09-05
---

# maven

> [!NOTE]
> Maven 의존성 트리 확인과, 삭제된 아티팩트(`javax.activation:1.0.2`)로 인한 다운로드 실패를 `dependencyManagement`로 해결한 사례 정리.

## 📌 개념

- **문제 상황**: `javax.activation:1.0.2` JAR이 저장소에서 삭제되어 다운로드 실패
- 문제 원인 2가지
    1. `org.jvnet.jax-ws-commons.spring` → `activation 1.0.2` 다운로드 시도
    2. `org.jvnet.staxex` → 버전 변경으로 인한 error
- **해결 방향**: `dependencyManagement`로 버전을 상위에서 고정(우선순위 주입)

## 💻 예시

### 의존성 트리 확인

```bash
# mvn or mvnd
mvnd dependency:tree
```

트리 출력(발췌):

```text
[INFO] kr.co.mirincom:evcm-apt:war:2.0.0
[INFO] +- org.springframework:spring-context:jar:3.2.4.RELEASE:compile
[INFO] +- org.jvnet.jax-ws-commons.spring:jaxws-spring:jar:1.8:compile
[INFO] |  +- com.sun.xml.ws:jaxws-rt:jar:2.1.3:compile
[INFO] |  |  \- javax.activation:activation:jar:1.1:compile
[INFO] |  +- org.jvnet.staxex:stax-ex:jar:1.7.8:compile
[INFO] \- org.apache.poi:poi:jar:3.9:compile
```

### 문제 의존성 (exclusions 적용)

```xml
<dependency>
    <groupId>org.jvnet.jax-ws-commons.spring</groupId>
    <artifactId>jaxws-spring</artifactId>
    <version>1.8</version>
    <exclusions>
        <exclusion>
            <groupId>org.springframework</groupId>
            <artifactId>spring</artifactId>
        </exclusion>
        <exclusion>
            <groupId>javax.xml.bind</groupId>
            <artifactId>jaxb-api</artifactId>
        </exclusion>
        <exclusion>
            <groupId>com.sun.xml.bind</groupId>
            <artifactId>jaxb-impl</artifactId>
        </exclusion>
    </exclusions>
</dependency>
```

### 해결 — dependencyManagement로 버전 고정

```xml
<dependencyManagement>
    <dependencies>
        <!-- activation 버전 업 (1.1) -->
        <dependency>
            <groupId>javax.activation</groupId>
            <artifactId>activation</artifactId>
            <version>1.1</version>
        </dependency>

        <!-- stax-ex 버전 업 -->
        <dependency>
            <groupId>org.jvnet.staxex</groupId>
            <artifactId>stax-ex</artifactId>
            <version>1.7.8</version>
        </dependency>

        <dependency>
            <groupId>com.sun.xml.stream.buffer</groupId>
            <artifactId>streambuffer</artifactId>
            <version>1.5</version>
        </dependency>
    </dependencies>
</dependencyManagement>
```

## 🔗 참고

- [Maven Repository — javax.activation:activation:1.0.2](https://mvnrepository.com/artifact/javax.activation/activation/1.0.2)
