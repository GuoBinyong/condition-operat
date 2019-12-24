# 条件运算函数
`conditionOperat()` 函数 是用来对 条件表达式 进行 运算的，其类型如下：
```
conditionOperat(condExpress: CondExpression): OperatedResult;
```
- @param condExpress : CondExpression   条件表达式
- @return OperatedResult 返回布尔类型 或者 返回布尔类型的Promise类型 的值


# 条件表达式 CondExpression
条件集 ConditionSet 和 条件 Condition 统称为 条件表达式
```
type CondExpression = ConditionSet | Condition
```


# 条件集 ConditionSet
条件集 ConditionSet 是用来表达 多个条件表达式 相与 或者 相或 关系的一种表达式；它包含多个条件表达式，并携带有关系信息（与、或）；

```
/**
 * 条件集
 * 条件集 ConditionSet 是用来表达 多个条件表达式 相与 或者 相或 关系的一种表达式；它包含多个条件表达式，并携带有关系信息（与、或）；
 */
interface ConditionSet  extends Array<CondExpression>,NotExpression{
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
type Condition = BoolCondition | FunCondition | PromCondition | NotExpression
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
interface FunCondition extends NotExpression {
  ():CondExpression;
}
```


# 异步条件 PromCondition
异步条件；根据决议的值反复地进行条件运算，直到计算到得到 布尔结果 为止；

Promise 决议的是 CondExpression 类型的值；这意味着 Promise 还可以再返回一个异步条件，也可以返回一个 函数条件 FunCondition ，甚至是更复杂的条件的表达式，它会被一直被计算，直到计算到得到 布尔结果 为止；
```
interface PromCondition extends Promise<CondExpression>,NotExpression {}
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
`conditionOperat(condExpr)` 函数 返回 OperatedResult 类型的数据；

OperatedResult 就是 布尔 或者 返回布尔的 Promise ；

`conditionOperat(condExpr)` 函数 返回的是 布尔 还是 Promise ，这取决于通过 非 异步条件 PromCondition 是否能求出 condExpr 的值，如果能，则返回的是布尔值，如果不能，则 condExpr 的值只能依赖于 其中的 异步条件，则 `conditionOperat(condExpr)` 就会返回一个 Promise ；

为了提高运算效率，`conditionOperat(condExpr)` 加入了短路运算的特性、简单优先的计算原则；对于同一层级表达式，会按照下面的顺序优先计算：
1. BaseCondition | FunCondition: 除了 异步条件 PromCondition、条件集 ConditionSet 以外的所有其它数据类型的条件表达式，这些条件会被当作布尔值来计算；
2. ConditionSet : 条件集；
3. PromCondition : 异步条件；

在对条件表达式进行运算的过程中，如果运算中途已经能够确认最终的运算结果，则便会停止对剩余表达式的计算，并返回计算结果；

```
type OperatedResult = boolean | Promise<boolean>
```




# 创建快捷运算函数
`create()` 函数是用来 快捷运算函数 的工具，其类型如下：
```
export function create<ThisValue,Args>(expr:CondExpression<ThisValue,Args>): (thisArg?:ThisValue, args?:Args)=>OperatedResult;
export function create(options:CreateOptions<any,any>): (...rest: any[])=>OperatedResult;
```