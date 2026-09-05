---
title: "\"[프로젝트] 영업일 계산기 만들기 - 공휴일·주말을 고려한 날짜 계산 CLI\""
tags: [학습, 토이프로젝트, Python, CLI]
created: 2026-09-05
modified: 2026-09-05
---

# 영업일 계산기 만들기 - 공휴일·주말을 고려한 날짜 계산 CLI

> [!NOTE]
> 공휴일과 주말을 제외하고, 지정한 영업일 수만큼 뒤의 날짜를 계산해주는 파이썬 커맨드라인 툴이다.

## 🧱 기술 스택
- Python 3.8+
- `pytimekr` (한국 공휴일 조회)
- `pyinstaller` (실행 파일 빌드, 선택)

## ⚙️ 구현

### 사전 준비

```bash
pip install pytimekr
pip install pyinstaller   # 실행 파일로 빌드하고 싶을 때만
```

### 사용법

```bash
python3 calenderCalc.py [year/month/day] [day_count]

# 예시: 2023-09-12로부터 10 영업일 뒤 날짜 계산
python3 calenderCalc.py 2023/09/12 10
```

- `year/month/day`: 기준 날짜 (`/`로 구분)
- `day_count`: 기준일을 1일차로 포함해 세는 영업일 수

### 동작 방식

1. `pytimekr.holidays()`로 공휴일 목록을 가져온다.
2. 기준 날짜부터 하루씩 순회하면서, 평일(월~금)일 때마다 남은 카운트를 1씩 줄인다.
3. 순회 중인 날짜가 평일이면서 공휴일 목록에 있는 날이면, 방금 줄인 카운트를 다시 1 더해 상쇄한다(해당 날짜는 영업일로 치지 않기 위함). 이미 주말인 날짜는 공휴일 여부와 무관하게 중복으로 보정하지 않는다.
4. 카운트가 0이 되는 순간의 날짜를 결과로 출력한다.

### 소스코드

```python
import datetime
import sys
from pytimekr import pytimekr

def printUsage():
    print(
        "\n",
        "Usage: python3 calenderCalc.py [year/month/day] [day_count]\n",
        "EX:\n",
        "python3 calenderCalc.py 2023/09/12 10\n")

def excludeHoliday(holiday_list, time, weekDay, count):
    # 공휴일 제외
    for i in holiday_list:
        if time == i:
            # 주말 = 공휴일 중복 제외
            if weekDay > 4:
                break

            count = count + 1
            break
    return count

def excludeWeekend(holiday_list, timeCalc, weekDay, count):
    while True:
        # 주말 제외
        if weekDay < 5:
            count = count - 1
            if count == 0:
                print(timeCalc)
                break
            timeCalc = timeCalc + datetime.timedelta(days=1)
            weekDay = timeCalc.weekday()
        else:
            timeCalc = timeCalc + datetime.timedelta(days=1)
            weekDay = timeCalc.weekday()

        count = excludeHoliday(holiday_list, timeCalc, weekDay, count)

def main():
    try:
        # input
        if len(sys.argv) != 3:
            sys.exit()
        input = list(sys.argv[1].split('/'))
        # 초기 변수
        date = datetime.date(int(input[0]), int(input[1]), int(input[2]))
        holiday_list = pytimekr.holidays()
        timeCalc = date
        weekDay = timeCalc.weekday()
        count = int(sys.argv[2])

        excludeWeekend(holiday_list, timeCalc, weekDay, count)

    except:
        printUsage()
        sys.exit()

main()
```

### 참고: 사용한 `datetime` API

구현 과정에서 확인해본 `datetime` 관련 API는 다음과 같다.

| API | 설명 | 예시 |
| --- | --- | --- |
| `datetime.date(y, m, d)` | 특정 연/월/일로 날짜 객체 생성 | `datetime.date(2023, 9, 19)` → `2023-09-19` |
| `date + datetime.timedelta(days=n)` | 날짜에 n일을 더한 새 날짜 계산 | `2023-09-19` + 20일 → `2023-10-09` |
| `date.weekday()` | 요일을 정수로 반환 (월=0 ~ 일=6) | `2023-09-19`(화) → `1` |

### 실행 파일로 빌드하기 (선택)

```bash
pyinstaller --onefile calenderCalc.py
```

`dist/` 폴더에 단일 실행 파일이 생성되며, 파이썬 설치 없이도 배포/실행할 수 있다.

## 💡 배운 점
- `pytimekr`처럼 국가별 공휴일 데이터를 제공하는 라이브러리를 활용하면, 공휴일 판단 로직을 직접 구현하지 않아도 된다.
- "N 영업일 뒤"를 계산할 때 주말 제외와 공휴일 제외를 동시에 처리하려면, 하루씩 순회하며 카운트를 보정하는 방식이 직관적이면서도 버그를 줄이기 쉽다.
- 커맨드라인 인자 파싱에서 예외 상황(인자 개수 오류, 잘못된 날짜 형식 등)을 `try/except`로 감싸고 사용법(`printUsage`)을 안내하면 CLI 도구의 사용성이 좋아진다.
