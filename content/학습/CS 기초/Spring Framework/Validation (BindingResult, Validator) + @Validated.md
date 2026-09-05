---
title: Validation (BindingResult, Validator) + @Validated
tags: [Spring Framework, SPRING]
created: 2026-09-05
modified: 2026-09-05
---

# Validation (BindingResult, Validator) + @Validated

Validation

## Validation 방법

1.  HashMap 과 StringUtils를 이용한 JAVA 직접 구현 (+ RedirectAttrubutes)
2.  BindigResult를 이용
3.  Validator 분리

## Validatie 구현

*   HashMap 과 StringUtils 및 Redirect 를 이용한 방법
    *   HashMap : error 담을 바구니
    *   StringUtils : Null 체크
    *   redirectAttributes : 리다이렉트시 정보 전달

```java
@PostMapping("url")
public String func(@ModelAttribute("item") Item item, RedirectAttributes redirectAttributes, Model model){
    
    Map<String, String>errors = new HashMap<>();
    
    if(!StringUtils.hasText(item.getItemName())){
        errors.put("itemName", "상품 이름은 필수입니다.");
    }
    
    ...
    
    if(!errors.isEmpty()){
        model.addAttribute("errors", errors);
        return "[view]"; //원래 페이지
     }
     
     Item savedItem = itemRepository.save(item);
     redirectAttributes.addAttribute("itemId", savedItem.getId());
     redirectAttributes.addAttribute("status", true);
     return "redirect:/[View]";
     
}
```

*   BindingResult를 사용
    *   error.properties 를 사용해서 errorCode로 이용
    *   BindingResult의 순서가 중요하다 ( @ModelAttribute 뒤에 BindingResult를 위치시킨다 )
    *   FieldError 와 ObjectError 객체를 사용한다
        *   FieldError 생성자 / ObjectError 생성자

```
public FieldError(String objectName, String field, String defaultMessage)
public FieldError(String objectName, String field, @Nullable Object rejectedValue, boolean bindingFailure, @Nullable String[] codes, @Nullable Object[] arguments, @Nullable String defaultMessage)

//파라미터 목록
/*
`objectName` : 오류가 발생한 객체 이름     
`field` : 오류 필드
`rejectedValue` : 사용자가 입력한 값(거절된 값)
`bindingFailure` : 타입 오류 같은 바인딩 실패인지, 검증 실패인지 구분 값 
`codes` : 메시지 코드
`arguments` : 메시지에서 사용하는 인자
`defaultMessage` : 기본 오류 메시지
*/

public ObjectError(String objectName, @Nullable String defaultMessage)
public ObjectError(String objectName, @Nullable String[] codes, @Nullable Object[] arguments, @Nullable String defaultMessage)
```

```java
/* errors.properties : 메시지 사용 
`src/main/resources/errors.properties` ```
required.item.itemName=상품 이름은 필수입니다.
range.item.price=가격은 {0} ~ {1} 까지 허용합니다.
max.item.quantity=수량은 최대 {0} 까지 허용합니다.
totalPriceMin=가격 * 수량의 합은 {0}원 이상이어야 합니다. 현재 값 = {1}
*/

public String func(@ModelAttribute("item") Item item, BindingResult bindingResult, RedirectAttributes redirectAttributes){
    
    if(!StringUtils.hasText(item.getItemName())){
        bindingResult.addError(new FieldError("item", "itemName", item.getItemName(), false, new String[]{"required.item.itemName"}, null, "이름은 필수값");
    }
    ...
    
    if(item.getPrice() != null && item.getQuantity() != null){
        int resultPrice = item.getPrice() * item.getQuantity();
        if (resultPrice < 10000){
            bindingResult.addError(new ObjectError("item", new String[]{"totalPriceMin"), new Object[]{10000, resultPrice}, null));
        }
    }
    
   ...
 }
```

*   BindingResult의 rejectValue() 와 reject()
    *   rejectValue() 와 reject()는 fieldError/ObjectError 객체를 생성하지 않아도됨
        *   **rejectValue()** 는 필드검사
            *   "default void rejectValue(@Nullable String field, String errorCode)"
        *   **reject()**는 객체 검사
            *   "void reject(String errorCode, @Nullable Object[] errorArgs, @Nullable String defaultMessage);"
    *   BindingResult가 어떤 객체인지, 객체 이름까지 알 수 있다. (@ModelAttribute를 기반으로)

```java
public String func(@ModelAttribute Item item, BindingResult bindingResult, RedirectAttributes redirectAttributes){
    
    if (!StringUtils.hasText(item.getItemName())){
        bindingResult.rejectValue("itemName", "required");
    }
    
    
    ...
    
    if(item.getPrice() != null && item.getQunantity() !=null){
        int resultPrice = item.getPrice * item.getQuantity();
        if (resultPrice < 10000){
            bindingResult.reject("totalPriceMin", new Object[]{10000, resultPrice}, null);
        }
    }
```

*   MessageCodesResolver
    *   검증 오류 코드로 메시지 코드를 생성함
        *   객체 오류시
            *   1. code + "." + objectName
            *   2. code
        *   필드 오류
            *   1. code + "." + object name + "." field
            *   2. code + "." + field
            *   3. code + "." + field type
            *   4. code
        *   필드오류 코드 예시
            *   오류코드 : typeMismatch, object name "user",  field "age", field type: int
                *   "typeMismatch.user.age"
                *   "typeMismatch.age"
                *   "typeMistmatch.int"
                *   "typeMismatch"

## Validator 분리

*   validator 인터페이스 상속
    *   supports() / validate() 오버라이딩
    *   supports()
        *   검증 받아야할 객체 넣기
    *   validate()
        *   검증 로직 구현

```java
@Component
public class ItemValidator implements Validator {
    @Override
    public boolean supports(Class<?> clazz) {
        return Item.class.isAssignableFrom(clazz);
    }

    @Override
    public void validate(Object target, Errors errors) {

        Item item = (Item) target;

        ValidationUtils.rejectIfEmptyOrWhitespace(errors,"itemName","required");

        //검증 로직
        if (!StringUtils.hasText(item.getItemName())){
            errors.rejectValue("itemName", "required");
        }
        if(item.getPrice() == null || item.getPrice() < 1000 || item.getPrice() > 1000000){
            errors.rejectValue("price","range",new Object[]{1000,1000000},null);
        }
        if(item.getQuantity() == null || item.getQuantity() > 9999){
            errors.rejectValue("quantity","max",new Object[]{9999}, null);
        }

        //특정 필드가 아닌 복합 룰 검증
        if(item.getPrice() != null && item.getQuantity() != null){
            int resultPrice = item.getPrice() * item.getQuantity();
            if(resultPrice < 10000){
                errors.reject("totalPriceMin",new Object[]{10000,resultPrice}, null);
            }
        }
    }
}
```

## Validator 호출 방법

*   Validator 직접 호출  
    *   의존성 주입 (생성자 | 필드 | 메서드 | 수정자 주입 활용)

```java
@Controller
public ...{
    
    @Autowired public final ItemValidator itemValidator;
    
    @PostMapping(" ~ ")
	public String func(@ModelAttribute Object object, BindingResult bindingResult, RedirectAttributes redirectAttributes){
        
        itemValidator.validate(object, bindingResult);
        ...
        
    }   
}
```

*   @Validated 사용
    *   annotation을 활용한 검증 방법
    *   미리, 검증기 구현체를 등록시켜 놓는다

```java
@Controller
public ... {
    ...
    
    
    @InitBinder
    public void init(WebDataBinder dataBinder){
        dataBinder.addValidators(itemValidator);
    }
    
    @PostMapping("URL")
    public String func(@Validated @ModelAttribute Object object, BindingResult bindingResult, RedirectAttributes redirectAttributes){
        
        // 자동 검증 등록되어 사용됨 (@Validated)
        ...
    }
    
    
    ...
}
```

> 원문: https://gradualprecision.tistory.com/89
