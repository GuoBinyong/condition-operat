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

## 最简单的使用
```
// 求表达式 true 的值
conditionOperat(true));  //结果： false
```

## 对一组表达式进行与运算
对于基本类型的数据(如：boolean、number、string、symbol、undefined、null )都会被作为布尔值来对待，即会被简单的转为布尔类型；
```
// 对一组表达式做 与 运算；
var condExpr = [
  true,
  false,
  "字符串会作为布尔值对待",
  34,
  0, // 相当于 false
];

conditionOperat(condExpr);  //结果： false
```
或者
```
// 对一组表达式做 与 运算
var condExpr = [
  true,
  false,
  true
];

condExpr.rel = "and";   // rel 可设置为  "and" (与运算) 或  "or"(或运算)， 如果没设置 rel ，则默认会用 与运算 "and"

conditionOperat(condExpr);  //结果： false
```



## 对一组表达式进行或运算
```
// 对一组表达式做 与 运算
var condExpr = [
  true,
  false,
  true
];

condExpr.rel = "or"; //设置 数组中元素之间关系为 或 ； 即：对所有元素进行 或运算

conditionOperat(condExpr);  //结果： true
```


## 先或后非
```
// 对一组表达式做 与 运算
var condExpr = [
  true,
  false,
  true
];

condExpr.rel = "or"; //设置：数组中元素之间关系为 或 ； 即：对所有元素进行 或运算
condExpr.not = true; //设置：对运算结果 取反，即 对所有元素进行 或运算之后 再取反

conditionOperat(condExpr);  //结果： false
```


## 表达式可以嵌套
```
//里面的表达式
var innerExpr = [
  false,
  true
];

innerExpr.rel = "or";  


var condExpr = [
  true,
  innerExpr,   // 表达式可以嵌套表达式
  true
];
condExpr.not = true;  


conditionOperat(condExpr);  //结果： false
```

## 函数类型的表达式
函数也可作为表达式，运算时会将函数的返回值作新的表达式重新计算，如果函数返回的还是函数，则会对该返回的函数继续运算；
函数也可以返回一个 Promise，针对 Promise类型表达式的运算方式，详见[Promise类型的表达式][]
```
var condExpr = [
  function(){return false},   //表达式可以是个返回 另一个表达式的函数
  function(){return "返回其它类型的值"}, 
  function(){
    return ()=>{return 5}
  },  //函数表达式 可以返回 另一个函数表达式
  true,  //表达式的类型可以混合使用
];

conditionOperat(condExpr);  //结果： false
```


## Promise类型的表达式
Promise 也可以作为表达式，当 Promise 作为表达式时，会根据 resolve 的值来进行计算，如果 Promise 是被 reject 了，则会被作为 假 false 来处理；

Promise 决议的值也可以是其它复杂的条件表达式，如：函数、数组（条件集）等等；
```
var condExpr = [
  new Promise(function (resolve, reject) {
    setTimeout( ()=>{
      resolve(false)
    },1000)
  }),
  new Promise(function (resolve, reject) {
    setTimeout( resolve,2000,false)
  }),
  new Promise(function (resolve, reject) {
    setTimeout( ()=>{
      reject("reject的参数")   //被 reject 的 Promise 会被作为 假值 来对待
    },3000)
  }),
];

condExpr.rel = "or";  //设置各 Promise 之间是 或 的关系

conditionOperat(condExpr).then(function (res) {
console.log(res)
});  //3秒后输出： false
```




## 非运算
对于任何对象（比如：普通对象、函数、Promise、数组 等等），都可以通过向其添加 not 属性来设置 非运算；设置非运算后，会先对 该对象进行求值，然后再对求得的值取反；

### 普通对象的非运算
```
/*
 先对对象 求值，然后再取反；
 由于对象 转成布尔后 为 true，对 true 取反后 为 false ，所以 对 条件表达式 {not:true} 求值后 得 false
 */
var condExpr = {not:true};
conditionOperat(condExpr);  //结果： false
```

### 函数的非运算
```
/*
 先对函数 求值，然后再取反；
 选对函数 求值，得 true，再取反后，得 false
 */
var condExpr = function(){
  return true
};
condExpr.not = true;
conditionOperat(condExpr);  //结果： false
```

### Promise的非运算
```
/*
 先对 Promise 求值，然后再取反；
 选对 Promise 求值，得到异步的值 true，再取反后，得 false
 */
var condExpr = new Promise(function(resolve,reject){
  setTimeout(()=>{
    resolve(true)
  },1000)
});
condExpr.not = true;

conditionOperat(condExpr).then(function(vlaue){
  console.log(value);  //结果： false
});
```

### 条件集的非运算
```
/*
 先运算 数组中所有元素相或 的值，为 true，然后再取反，得 false
 */
var condExpr = [
  true,
  0,
  {}
];
condExpr.rel = "or";

condExpr.not = true;

conditionOperat(condExpr);  //结果： false
```



## Promise与其它类型的表达式混合使用
Promise类型的条件表达工也可以与其它类型的条件表达式混合使用；

对于带有 Promise 类型的条件表达式，conditionOperat(condExpr) 返回的结果可能是 布尔值，也可能是 Promise ；这取决于通过 非 Promise 的表达式是否能求出 condExpr 的值，如果能，则返回的是布尔值，如果不能，则 condExpr 的值只能依赖于 其中的 Promise 表达式，则 conditionOperat(condExpr) 就会返回一个 Promise ；

如果 返回的是 Promise ，侧 Promise 决义后的值值便是表达式 condExpr 的运算结果；
```
var condExpr = [
  true,  //布尔值作为条件，直接表示条件成立或失败
  false,
  3.5,  //数字会被转为布尔类型；
  0,   //0 相当于 false
  "字符串也可作为表达式",  //字符串也会被转为布尔类型；
  {},  //对象会被转为布尔类型；
  //对于任何对象（比如：函数、Promise、数组 等等），都可以通过向其添加 not 属性来设置 非运算；
  {not:true},    //对象会被转为 true，由于本身的 not 属性为 true，所以，还会对该对象本盘的值 true 再进行一次 非运算，所以该表达式的值为 false
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
调用 conditionOperat 函数对 条件表达式 condExpr 进行求值；
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





# 特性
- 可以指定条件条件表达式的间的逻辑关系：与、或、非；
- 条件表达式可以任意层级嵌套，即：条件集 可以 嵌套 条件集；
- 短路运算
   在对条件表达式进行运算的过程中，如果运算中途已经能够确认最终的运算结果，则便会停止对剩余表达式的计算，并返回计算结果；

- 简单优先
   为了提高运算效率，除了加入了短路运算的特性外，还加入了简单优先的计算原则，即：对于同一层级表达式，会按照下面的顺序优先计算：
   1. BaseCondition | FunCondition: 除了 Promise类型的条件 PromCondition、数组类型的条件集 ConditionSet 以外的所有其它数据类型的条件表达式，这些条件会被当作布尔值来计算；
   2. ConditionSet : 条件集类型 的条件表达式，即 数组类型；
   3. PromCondition : Promise类型的条件表达式；

