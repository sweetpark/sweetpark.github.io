---
title: "콜백함수 (함수객체, 템플릿)"
tags: [C++, 콜백함수, 함수객체, 템플릿]
created: 2026-09-05
modified: 2026-09-05
---

# 콜백함수 (함수객체, 템플릿)

1. 콜백함수  
2. 함수포인터를 사용할 경우  
3. 템플릿 사용 안할 경우  
4. 템플릿을 사용 할 경우

## 콜백함수

*   원하는 순간에 원하는 함수를 호출한다
*   인자로서 동작을 넘길때 사용 (유용)
*   함수 포인터의 경우 상태를 저장할 수 없으므로, 하드코딩해야한다

## 함수포인터를 사용할 경우

```cpp
class Item
{
public:

public:
	int _rarity = 0;
	int _ItemId = 0;
	int _ownerId = 0;
};

bool FindByOwnerId_FUNC(const Item* item)
{
	return (item->_ownerId == 100);
}

Item* FindItem(Item items[], int itemCount, bool(*selector)(const Item* item))
{
	for (int i = 0; i < itemCount; i++)
	{
		const Item* item = &items[i];

		// TODO : 조건 체크
		if(selector(item))
			return const_cast<Item*>item;
	}

	return nullptr;
}

int main()
{
    Item items[10];
    items[3]._ownerId = 100;
    items[8]._rarity = 2;
    
    bool (*fn)(const Item*);
    fn = FindByOwnerId_FUNC;

    Item* item1 = FindItem(items, 10, fn);
    
    if (item1)
    {
        std::cout << "Item found with ownerId 100" << std::endl;
    }
    else
    {
        std::cout << "Item not found" << std::endl;
    }
}
```

*   단점
    *   함수 포인터의 사용으로 상태값을 저장 할 수 없다 (-> 함수 객체 필요성)
    *   타입이 달라질 경우 FindItem() 함수의 인자를 새롭게 정의해야한다 (-> 템플릿의 필요성)
    *   (단, 동일한 타입(반환, 인자)을 가진 함수들의 사이에서는 함수포인터로 변경하며 사용할 수 있다)

## 템플릿을 사용 안할 경우 ( +함수 객체)

```cpp
class Item
{
public:

public:
	int _rarity = 0;
	int _ItemId = 0;
	int _ownerId = 0;
};

/* 함수 객체 */
class FindByOwnerId
{
public:
	bool operator()(const Item* item)
	{
		return (item->_ownerId == _ownerId);
	}
public:
	int _ownerId;
};

class FindByRarity
{
public:
	bool operator()(const Item* item)
	{
		return (item->_rarity >= _rarity);
	}
public:
	int _rarity;
};

Item* FindItem(Item items[], int itemCount, FindByRarity selector)
{
	for (int i = 0; i < itemCount; i++)
	{
		Item* item = &items[i];

		// TODO : 조건 체크
		if(selector(item))
			return item;
	}

	return nullptr;
}

int main()
{
    /* 함수객체 상태 저장 */
    FindByOwnerId func1;
    func1._ownerId = 100;

    FindByRarity func2;
    func2._rarity = 1;
    /*                   */
    
    //템플릿을 사용안하면, func2밖에 호출을 못함
    Item* item2 = FindItem(items, 10, func2);
}
```

*   장점
    *   함수 객체의 사용으로 상태값을 저장 할 수있다
*   단점
    *   템플릿을 사용하지 않으면 인자로서 한가지 함수객체 밖에 받지를 못한다 ( -> 템플릿의 필요성)

## 템플릿을 사용할 경우 ( +함수 객체)

```cpp
class Item
{
public:

public:
	int _rarity = 0;
	int _ItemId = 0;
	int _ownerId = 0;
};

class FindByOwnerId
{
public:
	bool operator()(const Item* item)
	{
		return (item->_ownerId == _ownerId);
	}
public:
	int _ownerId;
};

class FindByRarity
{
public:
	bool operator()(const Item* item)
	{
		return (item->_rarity >= _rarity);
	}
public:
	int _rarity;
};

template<typename T>
Item* FindItem(Item items[], int itemCount, T selector)
{
	for (int i = 0; i < itemCount; i++)
	{
		Item* item = &items[i];

		// TODO : 조건 체크
		if(selector(item))
			return item;
	}

	return nullptr;
}

int main()
{

	Item items[10];
	items[3]._ownerId = 100;
	items[8]._rarity = 2;

	FindByOwnerId func1;
	func1._ownerId = 100;

	FindByRarity func2;
	func2._rarity = 1;
	
	// 콜백 ( -> c++11이후 람다 )
	Item* item1 = FindItem(items, 10, func1);
	Item* item2 = FindItem(items, 10, func2);

	cout << item1->_ownerId << endl;
	cout << item2->_rarity << endl;
}
```

*   원하는 타입으로 변환하여, 원하는 함수를 호출 할 수 있음 (템플릿의 기능)

템플릿 + 함수 객체의 형식을 무조건 고수해야한다 (x)  
> 상황에 따라 함수포인터를 사용할수도, 함수객체를 사용할수도 있다.  
> 기능이 많아질수록 성능이 저하될 수 있다 ( ex) 템플릿 )
