conditionOperat(condExpress: CondExpression): OperatedResult
条件运算

对一系列条件进行逻辑运算；
- @param condExpress : CondExpression   条件表达式
- @return OperatedResult 返回布尔 或者 Promise


特性：
- 可以指定条件条件表达式的间的逻辑关系：与、或、非；
- 条件表达式可以任意层级嵌套，即：条件集 可以 嵌套 条件集；

- 短路运算
   在对条件表达式进行运算的过程中，如果运算中途已经能够确认最终的运算结果，则便会停止对剩余表达式的计算，并返回计算结果；

- 简单优先
   为了提高运算效率，除了加入了短路运算的特性外，还加入了简单优先的计算原则，即：对于同一层级表达式，会按照下面的顺序优先计算：
   1. BoolCondition : 除了函数、Promise、ConditionSet（即：数组）以外的所有其它数据类型的条件表达式，这些条件会被当作布尔值来计算；
   2. FunCondition : 函数类型的条件表达式；
   3. ConditionSet : 条件集类型 的条件表达式，即 数组类型；
   4. PromCondition : Promise类型的条件表达式；








布尔条件的类型
```
declare type BoolCondition = Exclude<any, Function | Promise<any> | Array<any>>;
```

Promise条件的类型
```
declare type PromCondition = Promise<Condition>;
```

函数条件的类型
```
declare type FunCondition = ()=>(BoolCondition | PromCondition | ConditionSet);
```

条件的类型
```
declare type Condition = BoolCondition | FunCondition | PromCondition;
```

关系类型
```
declare type Relationship = "and" | "or";
```

运算结果的类型
```
declare type OperatedResult = boolean | Promise<BoolCondition>;
```

条件集
带有关系，并含有多个条件的集合
```
interface ConditionSet extends Array<CondExpression> {
    /**
     * 各个条件表达式之间的关系；
     * 默认值："and"
     */
    rel?: Relationship;

    /**
     * 对所有条件表达式进行 `rel` 关系 运算之后，再进行一次 非运算
     */
    not?: boolean;
}
```

条件表达式的类型
```
declare type CondExpression = ConditionSet | Condition;
```