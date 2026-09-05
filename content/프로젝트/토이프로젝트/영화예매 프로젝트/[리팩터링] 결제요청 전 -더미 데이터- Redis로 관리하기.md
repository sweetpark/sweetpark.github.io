---
title: "[리팩터링] 결제요청 전 \"더미 데이터\" Redis로 관리하기"
tags: [프로젝트, 영화예매 프로젝트]
created: 2026-09-05
modified: 2026-09-05
---

# [리팩터링] 결제요청 전 "더미 데이터" Redis로 관리하기

## 현재 결제데이터 흐름도..

```text
[결제 요청] → [HOST 서버] → Pay 객체 생성 → DB에 즉시 저장
                                    │
                       (결제 성공/취소/오류 여부와 무관하게 저장됨)
                                    │
                         결제 도중 취소·오류 발생 시
                                    ▼
                          DB에 dummy data로 남음
```

위와 같이, 현재 HOST서버에서는 결제 객체를 만들면서 DB에 결제를 저장시킨다.  
결제가 성공적인 과정을 통해 이루어진다면, 별로 문제가 되지 않을 수 있지만 결제를 하던 도중 취소하거나 결제중 문제가 생겨 제대로된 처리가 되지 않았을 경우에 dummy data가 발생하게 되는 문제가 있었다..  
  
결제 전에 데이터를 미리 저장한 이유는, 결제 도중 취소되거나 오류가 발생하더라도 추후 문제 확인을 위해 데이터를 남겨두는 것이 바람직하다고 판단했기 때문이다. 저장하지 않고 객체를 GC에 맡기는 방식도 가능하지만, 결제 정보에 대한 기록은 유지할 필요가 있다고 보았다.

그렇다면, 할 수 있는 방법들은 무엇이 있을까에 대해 고민하기 시작했다..

## Redis 선정이유

각 방식을 비교하여 선정 이유를 정리하면 다음과 같다.

1) DB에 그대로 저장하고 관리하기  
- 기존 코드 변경을 최소화하며 빠르게 적용할 수 있는 방법이다. 하지만 결제 전 dummy data가 계속 누적되고, 주기적으로 삭제 쿼리를 실행해야 하는 부담이 있어 성능상 불리하다고 판단하여 배제하였다.  
  
2) Local Cache 사용하기  
- DB 쿼리 대비 빠른 속도와 간편한 정리(remove)가 가능하다는 장점이 있다. 다만 결제 데이터는 어느 정도의 영속성이 필요한데, 서버가 재시작되면 Local Cache의 데이터가 모두 소실된다는 문제가 있어 배제하였다 (memcached도 동일한 이유로 배제).  
  
3) **Redis 사용하기**  
- Redis는 In-memory 기반으로 데이터를 저장하면서도 백업이 가능하고, TTL을 설정하여 유효기간이 지나면 자동으로 삭제할 수 있다. 외부 서버이므로 네트워크 비용이 발생하지만, 이 상황에서는 가장 적합한 선택이라 판단하여 Redis를 도입하였다.

## 실제 프로젝트 적용..

```text
[결제 요청] → Redis 저장 (key: pay:pending:{UUID}, value: Pay JSON, TTL 30분)
                       │
        ┌──────────────┴──────────────┐
        ▼                              ▼
   결제 성공                       TTL 만료 / 취소
        │                              │
   MariaDB에 저장                 Redis에서 자동 삭제
   (Redis 데이터 삭제)            (dummy data 미발생)
```

Provider를 두어서, "결제전" 상태를 key값에 부여하였다. (ex : pay:pending:UUID)  
value 값은 Json 형태로 저장하고, 결제 과정 자체는 30분의 제한시간(TTL)을 설정하였다. 정상적으로 결제가 완료되면 MariaDB에 저장한다.  
  
Pay와 PayDetail은 1:N 관계로 설정되어 있는데, 초기 구현에서는 Pay 객체와 PayDetail 객체를 각각 save()하여 동일한 트랜잭션 내 쿼리가 여러 번 발생하는 문제가 있었다.  
  
Pay가 PayDetail을 리스트로 가지도록 구조를 개선하고 Redis로 관리하여, 결제 성공 시 MariaDB에 저장함으로써 Dummy Data 문제를 해결하였다.  
  
(참고, MariaDB에서 PayDetail의 기본키는 AutoIncrement로 설정되어 있어 Redis에는 null로 저장되지만, 실제 저장 시점에는 MariaDB에서 값이 채워지므로 문제가 되지 않는다.)

## Git 정보

[https://github.com/sweetpark/StoreProject/tree/main/src/main/java/project/movie/store/repository/redis](https://github.com/sweetpark/StoreProject/tree/main/src/main/java/project/movie/store/repository/redis)

 [StoreProject/src/main/java/project/movie/store/repository/redis at main · sweetpark/StoreProject

Contribute to sweetpark/StoreProject development by creating an account on GitHub.

github.com](https://github.com/sweetpark/StoreProject/tree/main/src/main/java/project/movie/store/repository/redis)

(RedisService)

```bash
public class RedisService {
    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    public void saveRedis(Pay pay) {
        try{
            String payCode = pay.getPayCode();
            String payJson = objectMapper.writeValueAsString(pay);
            redisTemplate.opsForValue().set("pay:pending:"+payCode, payJson, Duration.ofMinutes(30));
            log.info("결제 정보 : pay:pending:"+payCode);
        }catch(Exception e){
            throw new CustomApiException("결제 데이터 json 변환 저장 오류");
        }

    }

    public Pay getFromRedis(String payCode){
        try{
            String payJson = redisTemplate.opsForValue().get("pay:pending:"+payCode);
            return objectMapper.readValue(payJson, Pay.class);
        }catch (Exception e){
            throw new CustomApiException("결제 데이터 json 변환 조회 오류");
        }

    }

    public void deleteFromRedis(String payCode){
        if(redisTemplate.delete("pay:pending:"+payCode)){
            log.info("결제 전 데이터 삭제 : " + payCode);
        }else{
            log.warn("결제 전 데이터 삭제 실패 : " + payCode);
        }
    }
}
```
