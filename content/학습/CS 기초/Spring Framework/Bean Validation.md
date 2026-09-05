---
title: "Bean Validation"
tags: [Spring Framework, SPRING]
created: 2026-09-05
modified: 2026-09-05
---

# Bean Validation

Bean Validation

## Bean Validation 사전 준비

*   Bean Validation 사용 전 gradle 추가

```
 implementation 'org.springframework.boot:spring-boot-starter-validation'
```

## 검증 Annotation

*   @NotBlank
    *   빈값 + 공백만 있는 경우를 허용하지 않는다
*   @NotNull
    *   null을 허용하지 않는다
*   @Range(min=숫자1, max= 숫자2)
    *   숫자1 ~ 숫자2 범위까지 가능
*   @Max(숫자)
    *   지정 숫자까지 최대 지정 가능

## Bean Validation 검증 순서

1.  @ModelAttribute로 객체로 변환 ( -> 실패시, typeMistMatch로 FieldError 추가 == Bean Validation 적용 x)
2.  객체로 변환될시, Validator 적용

## Bean Validation 에러코드

*   Validation과 동일하게 bean validation도 BindingResult의 규율에 따르게 됨
*   메시지를 이용하여 에러 메시지 작성 가능 -> errors.properties
*   예시)
    *   @NotBlank
        *   NotBlank.item.itemName
        *   NotBlank.itemName
        *   NotBlank.java.lang.String
        *   NotBlank

## Bean Validation 기본

```java
@Getter
@Setter
public class Item{
    
    
    private Long id;
    
    @NotBlank
    private String itemName;
    
    @NotNull
    @Range(min=1000, max=100000)
    private Integer price;
    
    @NotNull
    private Integer quantity;
}

@Controller
public class Controller{
    
    @Autowired private final ItemRepository itemRepository;
    
    @PostMapping("/add")
    public String addFunc(@Validated @ModelAttribute("item") Item item, BindingResult bindingResult, RedirectAttributes redirectAttributes){
        
        if (bindingResult.hasErrors()){
            return "rollback View";
        }
        
        Item savedItem = itemRepository.save(item);
        redirectAttributes.addAttribute("itemId", savedItem.getId());
        redirectAttributes.addAttribute("status", true);
        return "redirect:/[URL]";
  }
  ...
  
}
```

## Bean Validation 한계

*   같은 객체에서, 각기 다른 폼에 대입되어 검증을 진행할 수 없음 (같은 객체 , 검증기준은 여러개)
    *   해결책)
        *   groups
        *   Form 객체
*   groups
    *   인터페이스 생성
    *   적용하고 싶은 group에 Bean Validation 적용

```java
public interface SaveCheck{}
public interface UpdateCheck{}

@Data
 public class Item {
    
    @NotNull(groups = UpdateCheck.class) //수정시에만 적용 
    private Long id;
    
    @NotBlank(groups = {SaveCheck.class, UpdateCheck.class})
    private String itemName;
    
    @NotNull(groups = {SaveCheck.class, UpdateCheck.class})
    @Range(min = 1000, max = 1000000, groups = {SaveCheck.class,UpdateCheck.class})
    private Integer price;

....
}

@PostMapping("/add")
public String addfunc(@Validated(SaveCheck.class) @ModelAttribute Item item,BindingResult bindingResult, RedirectAttributes redirectAttributes) {
//...
}

@PostMapping("/edit")
public String editfunc(@Validated(UpdateCheck.class) @ModelAttribute Item item, BindingResult bindingResult, RedirectAttributes redirectAttributes){
//...
}
```

*   Form 객체  
    *   과정 : HTML -> Controller ( 객체변환 -> ItemSaveForm OR ItemUpdateForm ) -> 검증 -> Item 객체로 변환 -> View 렌더링

```java
@Data
 public class Item {
     private Long id;
     private String itemName;
     private Integer price;
     private Integer quantity;
}

 @Data
 public class ItemSaveForm {
     @NotBlank
     private String itemName;
     
     @NotNull
     @Range(min = 1000, max = 1000000)
     private Integer price;
     
     @NotNull
     @Max(value = 9999)
     private Integer quantity;
}

@Data
 public class ItemUpdateForm {
     @NotNull
     private Long id;
     
     @NotBlank
     private String itemName;
     
     @NotNull
     @Range(min = 1000, max = 1000000)
     private Integer price; 
    
     //수정에서는 수량은 자유롭게 변경할 수 있다.  
     private Integer quantity;
}

@Controller
public class Controller{

@PostMapping("/add")
public String addfunc(@Validated @ModelAttribute("itemSaveForm") ItemSaveForm itemSaveForm,
BindingResult bindingResult, RedirectAttributes redirectAttributes)
{
    //검증에 걸림
    if (bindingResult.hasErrors()){
        return "[view]";
    }
    
    //검증 통과
    Item item = new Item(itemSaveForm.getItemName(), itemSaveForm.getPrice(), itemSaveForm.getQuantity());
    Item savedItem = itemRepository.save(item);
    redirectAttributes.addAttribute("itemId", savedItem.getId());
    redirectAttributes.addAttribute("status", true);
    return "redirect:/[URL]";
}
}
```

*   정리
    *   Group은 인터페이스를 활용하여, 옵션을 이용한 처리
    *   Form 객체는 각기다른 Form HTML 별로 객체를 준비해서 검증이 끝난후, 진짜 객체에 저장함

## Bean Validation의 메시지 컨버터

```java
@Slf4j
@RestController
@RequestMapping("/validation/api/items")
public class ValidationItemApiController {
     
     @PostMapping("/add")
     public Object addItem(@RequestBody @Validated ItemSaveForm form,BindingResult bindingResult) {
         
         log.info("API 컨트롤러 호출");

         if (bindingResult.hasErrors()) {
             log.info("검증 오류 발생 errors={}", bindingResult); 
             return bindingResult.getAllErrors();
         }
         
         log.info("성공 로직 실행");
         return form;
     }
}
```

*   @RequestBody를 이용하여 Json형태로도 검증이 가능
*   bindingResult.getAllErrors()의 경우 모든 오류 메시지 관련 내용을 가지고 있음
    *   해당 부분에서 필요한 부분만 필터해서, RequestBody로 전달 가능
*   Return 값으로 객체 전달 (form)

> 원문: https://gradualprecision.tistory.com/90
