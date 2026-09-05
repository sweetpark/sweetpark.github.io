---
title: "[리펙토링] 결제요청 전 \"더미 데이터\" Redis로 관리하기"
tags: [프로젝트, 영화예매 프로젝트]
created: 2026-09-05
modified: 2026-09-05
---

# [리펙토링] 결제요청 전 "더미 데이터" Redis로 관리하기

## 현재 결제데이터 흐름도..

![](https://blog.kakaocdn.net/dna/cdGdU8/btsLFJFhijU/AAAAAAAAAAAAAAAAAAAAAJMIwA6OBtMjOIMyCkdTyy1Ns9Ejf2lJvaxibWIuOX8g/img.jpg?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=abCljDYhHq%2Ftw8RVkgGYc8ykUs4%3D)

위와 같이, 현재 HOST서버에서는 결제 객체를 만들면서 DB에 결제를 저장시킨다.  
결제가 성공적인 과정을 통해 이루어진다면, 별로 문제가 되지 않을 수 있지만 결제를 하던 도중 취소하거나 결제중 문제가 생겨 제대로된 처리가 되지 않았을 경우에 dummy data가 발생하게 되는 문제가 있었다..  
  
 왜(?) 굳이 결제전에 데이터를 저장했는가(?) 를 생각해본다면, 결제란 것이 민감한 문제여서 추후 문제가 생길때를 방지하여 데이터를 남겨야한다는 생각을 가지고 있었다.. 그래서 DB에 결제가 진행이 안되더라도 저장하고 있는 것이 바람직하다 생각이 들었었다..  
  
객체를 만들고 저장하지 않은채로, 사용되지 않는다면 GC에 의해 알아서 정리가 될것인데 지금의 나로서도 결제 정보에 대한 저장은 하고있어야한다 생각이 들었다..  
  
그렇다면, 할 수 있는 방법들은 무엇이 있을까에 대해 고민하기 시작했다..

## Redis 선정이유

지금부터 비교를 통한 선정이유에 대해 말해보고자 한다..  
  
1) DB에 그대로 저장하고 관리하기  
- 이 방법이 현재 코드에서 덜 수정한채로 빠르게 고칠 수 있는 방법이다. 하지만, 실제 서비스가 이루어지는 공간이면 성능도 무시하지 못하는 상황이 될 수 있을거라 생각이 들었다. DB는 무한하지 않기에 결제 전 dummy data가 기하급수적으로 쌓이는 문제가 존재하였고, 주기적으로 DB에 쿼리를 날려서 삭제해줘야하는 부분이 성능에 이롭지 못하다는 판단이 들어 배제하게 되었다.  
  
  
2) Local Cache 사용하기  
- Local Cache를 사용하게 된다면 DB쿼리를 날리는 효율 대비 원활한 속도와 remove를 통한 정리가 쉽게 가능하다는 점에서 좋겠다라는 생각이 들었다.. 하지만, 이 문제를 저장하는 목적이 맞지 않을 수 있다 생각이 들어 포기하게 되었다.. 지금 당면한 문제의 목적은 결제 데이터이다 보니 어느정도의 영속성을 가져야하고 어느시점이 지났을때 관리가 되어야하는 문제인데, 서버가 내려가게 된다면 Local Cache에 있던 데이터가 전부 소실될 수 있다는 문제가 있어 배제하게 되었다 (memcached도 백업 불가능으로 배제...)  
  
  
3) **Redis 사용하기**  
- Redis는 **In-momory** 기반으로 데이터를 저장하고, **백업**도 가능하다는 특징이 있다. 또한 **TTL**값을 설정하여 유효기간이 지나면 삭제하는 방식이 존재한다.  
Redis는 외부 서버이어서 어느정도의 네트워크 비용만 지불이 필요하지만, 지금의 상황에서는 최고의 선택이라고 생각이들었다. 따라서 지금부터 Redis를 도입하여 더 안전한 결제 Flow의 리펙토링을 진행하고자 한다

## 실제 프로젝트 적용..

![](https://blog.kakaocdn.net/dna/cMbIMe/btsLGkFcovg/AAAAAAAAAAAAAAAAAAAAAPdI269J1DBogJ1816xC11V6aaXNYYW-ByLChdnJMe8-/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=Aj9XHR0f%2BySRLBn%2B21ZEase%2Fsrg%3D)

Provider를 두어서, "결제전"이라고 key값에 부여하였다. (ex : pay:pending:UUID)  
value 값은 Json을 이용해서 저장을 진행하였고,결제 과정자체는 30분 제한시간을 걸어두었다. (TTL)  
그리고 정상적으로 결제가 완료되었을시에 Maria DB에 저장하도록 진행하였다..  
  
여기에서.. Pay 와 PayDetail이 1:N으로 설정되어있었는데, Pay객체 정보만해서 save()하고 PayDetail 객체를 만들고 또 save()하고 동일한 쿼리를 여러번 날리는 실수를 반복하고 있었다.. (반성...)  
  
Pay에 PayDetail을 리스트로 가지고 있으면서, Redis로 관리하였고 결제 성공시 MariaDB에 저장하여 Dummy Data의 문제를 해결 할 수 있었다.  
  
(참고, Maria에서 PayDetail을 저장할때는 기본키를 AutoIncrement로 설정해두었는데 Redis에는 null로 들어감)  
(-> 어차피 Maria에 들어갈때는 적용이 되니 크게 신경쓰지 않아도 될것같다..)

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

> 원문: https://gradualprecision.tistory.com/245
