---
title: "CS189/289 Lecture 2: Data Tools"
date: 2026-01-26 17:35:00
updated: 2026-01-27 14:31:02
categories:
  - [ml, cs189, lecture2]
tags:
  - ML
  - CS189
  - 课程笔记
katex: true
---

# source

- **课件**: https://eecs189.org/fa25/lecture/lec02

---


### series
一维 (index,value)
index可以是随机字符串吗

### dataframe

多个相同index的series -- 拼接 --> dataframe

#### new

使用如下方式搞几个小例子，言简意赅，使我了解api
```
You can create a DataFrame:
- From a CSV file   maybe:  pd.read_csv("data/uc_berkeley_events.csv", index_col='Year')
- Using a dictionary   
- Using a list and column names    maybe: pd.DataFrame(data) ?
- From Series
```

#### utility functions

```
head()and tail(),  括号里填不填入参是有区别的
• info(),
• describe(),
• sample(),  .sample(n=#)  .sample(frac=#)  .sample(n=#, replace=True)  .sample(n=#, random_state=42)
• value_counts(), and 
• unique().
size
shape
sort_values()  single column, multiple columns
```



select
```
iloc 子矩阵定位 by list, exclusive right-hand side slice, single value
loc 子矩阵定位 by list, inclusive right-hand side slice, single value. strong label index

[] context sensitive
[] only takes one argument, which may be:
○ A slice of row numbers.
○ A list of column labels.
○ A single column label.
[]里面放bool表达式，选择
mask = df['Height'] > 100
df[mask]
mask 类型：Series[bool]

index 和 df.index 对齐

含义：
👉 True 的行留下

这是 pandas 官方推荐的行筛选方式之一。
```

```
# add
df['Experience'] = [2, 5, 1, 8, 4]
df['Height_Increase'] = df['Height'] * 0.1

# drop
df.drop(columns=['Experience']) 看inplace
```

Handling Missing Values
```
isnull()
dropna()
fillna()
```

Aggregating
```
sum()
mean()
median()
min()
max()
count()
nunique()
prod()
std()
var()
sem()
skew()
any()
all()
first()
last()
idxmin()
idxmax()

```

group
```
A .groupby() operation involves some combination of splitting the 
object, applying a function, and combining the results.

directly .mean()
.agg(mean)

df.groupby('Type').agg(['mean', 'max', 'min']) 笛卡尔积

等价：.agg(sum)；.agg(np.sum)；.agg("sum")，分别是python内置、numpy、pandas内置

augmented_df.groupby(['Type', 'Campus'])[['Height']].agg('max') 多级索引，等价于pd.pivot_table(
    augmented_df,
    index='Type',
    columns='Campus',
    values='Height',
    aggfunc='max'
)  它解决的是“多维分类数据如何被表达”的问题。


```

join
```
join
merge
Inner Join: Returns only the rows with matching keys in both DataFrames.
• Outer Join: Returns all rows from both DataFrames, filling missing values 
with NaN where there is no match.
• Left Join: Returns all rows from the left DataFrame and matching rows from 
the right DataFrame.
• Right Join: Returns all rows from the right DataFrame and matching rows 
from the left DataFrame.
```

