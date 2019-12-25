
<!-- TOC -->

- [条件运算函数 `conditionOperat()`](#条件运算函数-conditionoperat)
- [条件表达式 CondExpression](#条件表达式-condexpression)
- [条件集 ConditionSet](#条件集-conditionset)
- [条件 Condition](#条件-condition)
- [布尔条件 BoolCondition](#布尔条件-boolcondition)
- [函数条件 FunCondition](#函数条件-funcondition)
- [异步条件 PromCondition](#异步条件-promcondition)
- [非运算表达式 NotExpression](#非运算表达式-notexpression)
- [运算结果 OperatedResult](#运算结果-operatedresult)
- [基本条件 BaseCondition](#基本条件-basecondition)
- [创建快捷运算函数 `create()`](#创建快捷运算函数-create)
    - [`create(expr)`](#createexpr)
    - [`create(options)`](#createoptions)
- [创建选项 CreateOptions](#创建选项-createoptions)

<!-- /TOC -->



`conditionOperat()`相关
==================


# 条件运算函数 `conditionOperat()`
`conditionOperat()` 函数 是用来对 条件表达式 进行 运算的，其类型如下：
```
conditionOperat<ThisValue,Args>(condExpress:CondExpression<ThisValue,Args>,thisValue?:ThisValue, args?:Args):OperatedResult
```
- @param condExpress : CondExpression   条件表达式
- @param thisValue ？: any   设置条件表达式中 函数条件 的 this 的值
- @param args ？: any[]   设置条件表达式中 函数条件 的 参数序列； 即该参数是个数组，里面包含传递给 条件函数 的参数

- @return OperatedResult 返回布尔类型 或者 返回布尔类型的Promise类型 的值


**注意：**  
thisValue 和 args 会被应用到所有的 函数条件，包括那些 运算过程 中产生的函数条件，比如：函数条件返回的函数条件、异步条件决议时传递出的 函数条件


# 条件表达式 CondExpression
条件集 ConditionSet 和 条件 Condition 统称为 条件表达式
```
type CondExpression<ThisValue,Args> = ConditionSet<ThisValue,Args> | Condition<ThisValue,Args>
```


# 条件集 ConditionSet
条件集 ConditionSet 是用来表达 多个条件表达式 相与 或者 相或 关系的一种表达式；它包含多个条件表达式，并携带有关系信息（与、或）；

```
interface ConditionSet<ThisValue,Args>  extends Array<CondExpression<ThisValue,Args>>,NotExpression{
  /**
   * 各个条件表达式之间的关系；
   * 默认值："and"
   */
  rel?:Relationship;
}

/**
 * 关系类型
 */
type Relationship = "and" | "or";
```


# 条件 Condition
条件是用来表达 真 或 假 的基本运算单元；

有以下几类：
- BoolCondition : 布尔条件；代表那些可直接被当作布尔值来计算的 真假 和 假值；
- FunCondition : 函数条件；带有逻辑的函数，根据其返回值来进行条件运算；
- PromCondition : 异步条件；根据决议的值来进行条件运算；
- NotExpression : 非运算表达式；表示对原来的值取反；
```
type Condition<ThisValue,Args> = BoolCondition | FunCondition<ThisValue,Args> | PromCondition<ThisValue,Args> | NotExpression
```



# 布尔条件 BoolCondition
布尔条件；代表那些可直接被当作布尔值来计算的 真假 和 假值；

在进行条件运算时，这个类型的条件会直接作为布尔类型对待，即会被自动转为布尔类型；
```
type BoolCondition = boolean | number | string | symbol | undefined | null
```


# 函数条件 FunCondition
函数条件；带有逻辑的函数，会对其返回值反复地进行条件运算，直到计算到得到 布尔结果 为止；

函数可以返回 CondExpression 类型的值；这意味着函数条件还可以再返回一个函数条件，也可以返回一个 异步条件 PromCondition ，甚至是更复杂的条件的表达式，它会被一直被计算，直到计算到得到 布尔结果 为止；
```
interface FunCondition<ThisValue,Args> extends NotExpression {
  (this:ThisValue,...args:Args extends any[] ? Args : []):CondExpression<any,any>;
}
```


# 异步条件 PromCondition
异步条件；根据决议的值反复地进行条件运算，直到计算到得到 布尔结果 为止；

Promise 决议的是 CondExpression 类型的值；这意味着 Promise 还可以再返回一个异步条件，也可以返回一个 函数条件 FunCondition ，甚至是更复杂的条件的表达式，它会被一直被计算，直到计算到得到 布尔结果 为止；
```
interface PromCondition<ThisValue,Args> extends Promise<CondExpression<ThisValue,Args>>,NotExpression {}
```

# 非运算表达式 NotExpression
非运算表达式 用来表示对原来的值取反；

非运算 的表示方法 就是给对象添加一个 not 属性，并设置值为 true；在进行计算时，会对原来的值 取反；

如果 原来的值是普通的对象（不是函数、数组、Promise 类型的对象），则会自动将该对象转为布尔类型，然后再对其取反；
```
interface NotExpression {
  /**
   * 对原来的值取反
   */
  not?:boolean
}
```



# 运算结果 OperatedResult
`conditionOperat()` 函数 返回 OperatedResult 类型的数据；

OperatedResult 就是 布尔 或者 返回布尔的 Promise ；

`conditionOperat()` 函数 返回的是 布尔 还是 Promise ，这取决于通过 非 异步条件 PromCondition 是否能求出 condExpr 的值，如果能，则返回的是布尔值，如果不能，则 condExpr 的值只能依赖于 其中的 异步条件，则 `conditionOperat()` 就会返回一个 Promise ；

为了提高运算效率，`conditionOperat()` 加入了短路运算的特性、简单优先的计算原则；对于同一层级表达式，会按照下面的顺序优先计算：
1. BaseCondition | FunCondition: 除了 异步条件 PromCondition、条件集 ConditionSet 以外的所有其它数据类型的条件表达式，这些条件会被当作布尔值来计算；
2. ConditionSet : 条件集；
3. PromCondition : 异步条件；

在对条件表达式进行运算的过程中，如果运算中途已经能够确认最终的运算结果，则便会停止对剩余表达式的计算，并返回计算结果；

```
type OperatedResult = boolean | Promise<boolean>
```




# 基本条件 BaseCondition
该类型的条件不需要经过复杂的运算，可根据 not 属性(如果有)，直接将其自身的值作为布尔值来来运算
```
type BaseCondition = Exclude<Condition<any,any>, FunCondition<any,any> | PromCondition<any,any>>
```




`create()`相关
===============


# 创建快捷运算函数 `create()`
`create()` 函数是用来创建 快捷运算函数 的工具；快捷运算函数 是带有一部分参数值，只接收剩余参数 的条件运算函数；其类型如下：

## `create(expr)`
```
create<ThisValue,Args>(expr:CondExpression<ThisValue,Args>): (thisValue?:ThisValue, args?:Args)=>OperatedResult;
```
- @param expr:CondExpression<ThisValue,Args>   条件表达式
- @return `(thisValue?:ThisValue, args?:Args)=>OperatedResult`  返回一个函数，该函数可接收 thisValue 和 args 两个参数；



## `create(options)`
```
create(options:CreateOptions<any,any>): (...rest: any[])=>OperatedResult;
```
- @param options:CreateOptions<any,any>   创建选项对象
- @return `(...rest: any[])=>OperatedResult`  返回一个函数，该函数可接收 选项对象 options 中没有提供的剩余参数，剩余的参数按照 `expr、this、args` 顺序（即 条件运算函数 `conditionOperat()` 的参数顺序）进行排列；




# 创建选项 CreateOptions
创建快捷运算函数时的配置选项对象；
```
interface CreateOptions<ThisValue,Args> {
  expr?:CondExpression<ThisValue,Args>,   //条件表达式
  this?:ThisValue,    //设置条件表达式中 函数条件 的 this 的值
  args?:Args    //设置条件表达式中 函数条件 的 参数序列；即该参数是个数组，里面包含传递给 条件函数 的参数
}
```