---
title: [사전 준비] Redis Server 설치하기
tags: [프로젝트, 영화예매 프로젝트]
created: 2026-09-05
modified: 2026-09-05
---

# [사전 준비] Redis Server 설치하기

## Redis를 설치하는 이유..

In-memory로서 빠르게 조회하고 데이터 관리를 용이하게 하기 위해서 Redis를 설치하고자 한다..  
  
Redis는 세션관리 혹은 결제 데이터 처리 및 잠깐의 데이터가 흘러가는(?) 그런 곳에 사용하여 RDBMS에서 관리하는 것보다 더 빠른 처리를 도와주는 역할이다..  
  
여기서 쓴이의 경우 결제 전 데이터가 더미데이터가 되는 것을 방지하고자 사용하려고 한다..

## Redis설치

*   [https://redis.io/downloads/](https://redis.io/downloads/)

 [Downloads - Redis

Faster starts now Download what you need to start building.

redis.io](https://redis.io/downloads/)

참고로, Redis는 윈도우는 지원을 하지 않는다.. WSL을 이용하여 리눅스 환경에서 설치하는 방법이 있다..

*   Mac 일 경우,

```bash
// redis server 설치
brew install redis

// redis 서비스 시작
brew services start redis

// redis 서비스 확인
brew services info redis
```

## Redis 명령어

*   [https://redis.io/docs/latest/develop/tools/cli/](https://redis.io/docs/latest/develop/tools/cli/)

 [Redis CLI

Overview of redis-cli, the Redis command line interface

redis.io](https://redis.io/docs/latest/develop/tools/cli/)

```bash
// redis 접속
redis-cli

// redis key로 호출
get [key]

// redis 서버 연결 확인
ping 
//(pong)으로 응답옴
```

## * Redis 기본정보 (+ spring boot 설정)

기본 주소 : localhost  
기본 포트 : 6379  
  
[java 연동]  
- Jedis : https://redis.io/docs/latest/develop/clients/jedis/ (간소화 Redis 기능)  
- Lettuce :  https://redis.io/docs/latest/develop/clients/lettuce/ (일반 Redis 기능)
[Jedis]  
- 사용자의 편의성을 중요시해서 기능적지만 가벼운 제품  
- Jedis의 경우 스레드 간에 Jedis를 공유할경우 오류를 터뜨림 (expected '$' but got ' ')  
- 클러스터와 동기적으로 작동  
  
[Lettuce]  
- Jedis는 사용자의 편의성에 중점을 두었다면, Lettuce는 기능에 좀더 초점을 둠  
- 동기 및 비동기 통신 모두 지원  
- 센티넬, 파이프라이닝, 코덱, 클러스터 지원

[https://redis.io/blog/jedis-vs-lettuce-an-exploration/](https://redis.io/blog/jedis-vs-lettuce-an-exploration/)

 [Jedis vs. Lettuce: An Exploration - Redis

Jedis and Lettuce are popular Redis clients for Java developers. Check out this deep dive into the main differences between Jedis vs Lettuce.

redis.io](https://redis.io/blog/jedis-vs-lettuce-an-exploration/)

### Spring boot 설정

```
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

```bash
@Configuration
public class RedisConfig {

    @Value("${spring.redis.host}")
    private String redisHost;

    @Value("${spring.redis.port}")
    private int redisPort;

    @Bean
    public RedisConnectionFactory redisConnectionFactory(){
        return new LettuceConnectionFactory(
                new RedisStandaloneConfiguration(redisHost, redisPort)
        );
    }

    @Bean
    public RedisTemplate<String, String> redisTemplate() {
        StringRedisTemplate redisTemplate = new StringRedisTemplate();
        redisTemplate.setConnectionFactory(redisConnectionFactory());
        return redisTemplate;
    }

}
```
Spring에서는 역시나, 인터페이스를 이용하여 Redis의 Connection부분을 담당하고 있었다..  
이번에도 편하게 인터페이스를 이용하였고 (RedisConnectionFactory) , 구현체로는 LettuceConnectionFactory를 사용하였다..  
  
지금 나는 key:value 형태의 Redis에서 value에는 json 형태로 저장할 것이기 때문에, 굳이 set/hash/list/sorted 등등의 자료형 대신해서 String만 RedisTermplate으로 생성해주었다..  
*(자세한 내용은 "[리펙토링] 결제 전 Redis 사용" 참고)

(참고문헌 : LettuceConnectionFactory)

[https://docs.spring.io/spring-data/redis/docs/current/api/org/springframework/data/redis/connection/lettuce/LettuceConnectionFactory.html](https://docs.spring.io/spring-data/redis/docs/current/api/org/springframework/data/redis/connection/lettuce/LettuceConnectionFactory.html)

 [LettuceConnectionFactory (Spring Data Redis 3.4.1 API)

java.lang.Object org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory All Implemented Interfaces: DisposableBean, InitializingBean, Lifecycle, Phased, SmartLifecycle, PersistenceExceptionTranslator, ReactiveRedisConnectionFactory, Red

docs.spring.io](https://docs.spring.io/spring-data/redis/docs/current/api/org/springframework/data/redis/connection/lettuce/LettuceConnectionFactory.html)

> 원문: https://gradualprecision.tistory.com/246
