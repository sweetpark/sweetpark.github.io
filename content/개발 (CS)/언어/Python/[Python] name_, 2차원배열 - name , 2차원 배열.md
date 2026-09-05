---
title: "__name__, 2차원배열"
tags: [학습, 개발-CS, 언어, Python, 개발, 리스트, 배열]
created: 2026-09-05
modified: 2026-09-05
---

# __name__ , 2차원 배열

> [!NOTE]
> Python의 `__name__` 관례, 2차원 배열 생성/접근, 리스트 다루기.

## 📌 개념

### __name__

- Python 파일 이름을 지칭함
- Python 파일이 시작점(프로그램 진입점)일 경우 `__name__ == "__main__"`이 된다
- 사용 이유 → 파이썬은 시작점이 정해진 언어가 아니므로, 모듈과 main을 분리하기 위해 사용

```python
if __name__=="__main__":
    host="192.168.3.101"
    print("START SNIFFING at [%s]" %host)
    parsing(host)

# main 파일이면 if문이 실행되고, 모듈로 사용될 경우 함수만 가져다 쓸 수 있게 됨
```

> [!NOTE]
> 예) `first.py` (← `import second.py`)
> - first.py 파일에서 `__name__`은 `"__main__"`
> - second.py 파일에서 `__name__`은 `"second"`

### 2차원 배열

- 생성 방법: `a = [[표현값 for j in range(column)] for i in range(rows)]`
- 접근 방법: 리스트의 리스트 형태 `[ [a,b,c], [...], ... ]`

```python
for i in range(len(2차원배열리스트)):
    a, b, c = list[i]
    print(a)
    print(b)
    print(c)
```

- 추가 방법: `list.append([x,y])`
- 초기화: `list = [['.'] * 개수 for _ in range(행길이)]` ⇒ `.`으로 초기화

### 리스트

- `list.index(값)` : 리스트 안에서 값의 인덱스 추출
- `[표현식(+임시변수) for 임시변수 in 리스트]` : 리스트 값들을 표현식에 넣어 결과 확인
- `list.sort()` : 복사 안 됨 → 기존 값 정렬
    - `list.sort(reverse=True)` : 반대로 정렬
    - `sorted(list)[::-1]` : 반대로 정렬

## 🔗 참고

- [python os.name의 리턴 nt, posix의 의미](https://bskyvision.com/entry/CSS-%ED%85%8D%EC%8A%A4%ED%8A%B8%EC%97%90-%EA%B7%B8%EB%A6%BC%EC%9E%90-%EB%84%A3%EA%B8%B0)

> [!NOTE]
> 위 참고 링크의 제목과 실제 URL(다른 주제의 블로그 글)이 일치하지 않을 수 있습니다.
