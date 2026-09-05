---
title: [String] substring()
tags: [프로그래밍 언어, JAVA]
created: 2026-09-05
modified: 2026-09-05
---

# [String] substring()

## Substring 메서드

문자열 파싱하기 위한 메서드
```java
public String substring(int beginIndex) {
        return substring(beginIndex, length());
    }

    /**
     * Returns a string that is a substring of this string. The
     * substring begins at the specified {@code beginIndex} and
     * extends to the character at index {@code endIndex - 1}.
     * Thus the length of the substring is {@code endIndex-beginIndex}.
     * <p>
     * Examples:
     * <blockquote><pre>
     * "hamburger".substring(4, 8) returns "urge"
     * "smiles".substring(1, 5) returns "mile"
     * </pre></blockquote>
     *
     * @param      beginIndex   the beginning index, inclusive.
     * @param      endIndex     the ending index, exclusive.
     * @return     the specified substring.
     * @throws     IndexOutOfBoundsException  if the
     *             {@code beginIndex} is negative, or
     *             {@code endIndex} is larger than the length of
     *             this {@code String} object, or
     *             {@code beginIndex} is larger than
     *             {@code endIndex}.
     */
    public String substring(int beginIndex, int endIndex) {
        int length = length();
        checkBoundsBeginEnd(beginIndex, endIndex, length);
        if (beginIndex == 0 && endIndex == length) {
            return this;
        }
        int subLen = endIndex - beginIndex;
        return isLatin1() ? StringLatin1.newString(value, beginIndex, subLen)
                          : StringUTF16.newString(value, beginIndex, subLen);
    }
```

## substring() 초기화

*   인자 1개
    *   beginIndex ~ 끝까지 출력

public String substring(int beginIndex){ return substring (beginIndex, length() ) }
ex)  
String str = "hello";  
System.out.println(str.substring(2));  
  
[출력] "llo"

*   인자 2개
    *   beginIndex ~ endIndex 미만 까지 (beginIndex 포함, endIndex 미포함)

public String substring(int beginIndex, int endIndex) { //.. (위에 코드 참고) }
ex)  
String str = "hello";  
System.out.println(str.substring(1,2));  
  
[출력] "e"

> 원문: https://gradualprecision.tistory.com/187
