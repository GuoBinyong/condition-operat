[API帮助文档]: ./API帮助文档.md

[赞赏码]: ./赞赏码.JPG

[git仓库]: https://github.com/GuoBinyong/condition-operat
[issues]: https://github.com/GuoBinyong/condition-operat/issues


# 1. 简介
conditionOperat 可以对一系列复杂的条件进行逻辑运算，条件可以是基本类型的数据，也可以是个函数，甚至可以是个异步条件，即 Promise；或者是个条件集，条件集也可以再嵌套条件集；可以指定条件之间的逻辑关系，如：与、或、非；

主页：<https://github.com/GuoBinyong/condition-operat>

**如果您在使用的过程中遇到了问题，或者有好的建议和想法，您都可以通过以下方式联系我，期待与您的交流：**  
- 给该仓库提交 [issues][]
- 给我 Pull requests
- 邮箱：<guobinyong@qq.com>
- QQ：guobinyong@qq.com
- 微信：keyanzhe



# 使用示例
```
//设置条件表达式
var condExpr = [
  true,  //布尔值作为条件，直接表示条件成立或失败
  false,
  3.5,  //数字会被转为布尔类型；
  0,   //0 相当于 false
  "字符串也可作为表达式",  //字符串也会被转为布尔类型；
  function () {return false},    //函数作为条件，会根据函数的返回值作为该条件的计算结果
  function () {return [false,45]},    //函数也可以返回 条件集
  [
    "",  // 空字符串相当于 false
    {mes:"对象也可作为表达式"},  //对象也可以作为条件，它会被当作真值来对待，即相当于 true
    new Promise(function (resolve, reject) {
      setTimeout( ()=> {
        resolve(true)
      },500)
    }),  // Promise 作为表达式，当被计算时，会根据 Promise 被 resolve 时的 value 来作为 计算结果；
    new Promise(function (resolve, reject) {
      var funCond = ()=>{return false};
      setTimeout( ()=> {
        resolve(funCond)
      },500)
    })     // Promise 作为表达式，当被计算时，会根据 Promise 被 resolve 时的 value 来作为 计算结果，如果 value 仍是复杂的表达式（比如：函数），还会继续计算；
  ], // 条件集，也就是数组，也可以作为条件表达式，会根据 该条件集的计算结果作为 该条件集 的结果
  new Promise(function (resolve, reject) {
    setTimeout( ()=> {
      reject("reject会被认为返回了假值")
    },300)
  })   // 如果 Promise 被 reject 了，则 该 Promise 表达式的计算结果为 false
];

condExpr.rel = "or";   //设置条件集中所有条件表达式的关系为 或
condExpr.not = true;  //对 条件集中所有表达式 进行 或运算(由rel属性指定) 之后，再对其结果取反，即：再进行 非运算；


/*
调用 conditionOperat 函数对 条件表达式 condExpr 进行求值；返回的
返回的结果可能是 布尔值，也可能是 Promise ；这取决于通过 非 Promise 的表达式是否能求出 condExpr 的值，如果能，则返回的是布尔值，如果不能，则 condExpr 的值只能依赖于 其中的 Promise 表达式，则 conditionOperat(condExpr) 就会返回一个 Promise ；
如果 返回的是 Promise ，侧 Promise 决义后的值值便是表达式 condExpr 的运算结果
 */
var res = conditionOperat(condExpr)

if (res instanceof Promise){
  res.then((value)=>{
    console.log("condExpr条件表达式的值是：",value);
  })
}else {
  console.log("condExpr条件表达式的值是：",res);
}
```



# 使用说明




# 特性：
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

