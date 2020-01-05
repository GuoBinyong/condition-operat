/**
 * conditionOperat 可以对一系列复杂的条件进行逻辑运算，条件可以是基本类型的数据，也可以是个函数，甚至可以是个异步条件，即 Promise；或者是个条件集，条件集也可以再嵌套条件集；可以指定条件之间的逻辑关系，如：与、或、非；
 * 
 * - 主页：<https://github.com/GuoBinyong/condition-operat>
 * 
 * **如果您在使用的过程中遇到了问题，或者有好的建议和想法，您都可以通过以下方式联系我，期待与您的交流：**
 * - 给该仓库提交 issues
 * - 给我 Pull requests
 * - 邮箱：<guobinyong@qq.com>
 * - QQ：guobinyong@qq.com
 * - 微信：keyanzhe
 */



/**
 * 非运算表达式
 */
interface NotExpression {
  /**
   * 对原来的值取反
   */
  not?:boolean
}


/**
 * NotExpression 的类型守卫
 * @param condExp : CondExpression 表达式
 */
function isNotExpression(condExp:CondExpression<any,any>): condExp is NotExpression {
  return isObject(condExp)
}





/**
 * 布尔条件
 * 代表那些可直接被当作布尔值来计算的 真假 和 假值；
 */
type BoolCondition = boolean | number | string | symbol | undefined | null



/**
 * BoolCondition 的类型守卫
 * @param condExp : CondExpression 表达式
 */
function isBoolCondition(condExp:CondExpression<any,any>): condExp is BoolCondition {
  return !isObject(condExp)
}


/**
 * 异步条件
 * 根据决议的值反复地进行条件运算，直到计算到得到 布尔结果 为止；
 */
interface PromCondition<ThisValue,Args> extends Promise<CondExpression<ThisValue,Args>>,NotExpression {}



/**
 * PromCondition 的类型守卫
 * @param condExp : CondExpression 表达式
 */
function isPromCondition<ThisValue,Args>(condExp:CondExpression<ThisValue,Args>): condExp is PromCondition<ThisValue,Args> {
  return condExp instanceof Promise
}



/**
 * 函数条件
 * 带有逻辑的函数，会对其返回值反复地进行条件运算，直到计算到得到 布尔结果 为止；
 */
interface FunCondition<ThisValue,Args> extends NotExpression {
  (this:ThisValue,...args:Args extends any[] ? Args : []):CondExpression<any,any>;
}


/**
 * FunCondition 的类型守卫
 * @param condExp : CondExpression 表达式
 */
function isFunCondition<ThisValue,Args>(condExp:CondExpression<ThisValue,Args>): condExp is FunCondition<ThisValue,Args> {
  return typeof condExp === "function"
}




/**
 * 条件的类型
 * 条件是用来表达 真 或 假 的基本运算单元；
 */
type Condition<ThisValue,Args> = BoolCondition | FunCondition<ThisValue,Args> | PromCondition<ThisValue,Args> | NotExpression

/**
 * 基础条件的类型；
 * 该类型的条件不需要经过复杂的运算，可根据 not 属性(如果有)，直接将其自身的值作为布尔值来来运算
 */
type BaseCondition = Exclude<Condition<any,any>, FunCondition<any,any> | PromCondition<any,any>>


/**
 * 关系类型
 */
type Relationship = "and" | "or"

/**
 * 运算结果的类型
 */
type OperatedResult = boolean | Promise<boolean>

/**
 * 条件集
 * 条件集 ConditionSet 是用来表达 多个条件表达式 相与 或者 相或 关系的一种表达式；它包含多个条件表达式，并携带有关系信息（与、或）；
 */
interface ConditionSet<ThisValue,Args>  extends Array<CondExpression<ThisValue,Args>>,NotExpression{
  /**
   * 各个条件表达式之间的关系；
   * 默认值："and"
   */
  rel?:Relationship;
}


/**
 * ConditionSet 的类型守卫
 * @param condExp : CondExpression 表达式
 */
function isConditionSet<ThisValue,Args>(condExp:CondExpression<ThisValue,Args>): condExp is ConditionSet<ThisValue,Args> {
  return Array.isArray(condExp)
}




/**
 * 条件表达式
 * 条件集 ConditionSet 和 条件 Condition 统称为 条件表达式
 */
type CondExpression<ThisValue,Args> = ConditionSet<ThisValue,Args> | Condition<ThisValue,Args>









/**
 * 非值的类型
 */
type NotValue = NotExpression["not"]

/**
 * 非值的序列
 */
type NotSequence = NotValue[]


/**
 * 对 target 做一系列连续的 非操作，
 * @param target : any    操作的目标，会直接将其作为布尔值来对待
 * @param notSequ : NotSequence    指示非操作序列的数组
 * @return boolean     非操作后的结果
 */
function notOperat(target:any,notSequ:NotSequence):boolean {
  return !!(notSequ.reduce(function (res,not) {
    return not ? !res : res;
  },target))
}




/**
 * 扁平化 函数条件
 * @param condExp : CondExpression   条件表达式；如果 condExp 不是函数条件，则不作处理 返回 condExp 自身
 * @param thisValue ?:  any   可选；函数条件的 this 的值
 * @param args ?:any[]      可选；函数条件的 参数
 *
 * 函数条件可能还会返回函数条件，返回的函数条件可能还会返回函数条件，可以无休止地这样延续下去；
 * 本方法的作用就是对函数条件进行运算，直到返回的不是函数条件为止
 */
function flatFunCondition<ThisValue,Args>(condExp: CondExpression<ThisValue,Args>,thisValue?:ThisValue, args?:Args): Exclude<CondExpression<ThisValue,Args>, FunCondition<ThisValue,Args>> {
  if (isFunCondition(condExp)) {
    let notSequ = [condExp.not]
    // @ts-ignore
    let funRes = condExp.apply(thisValue,args)

    if (isNotExpression(funRes)) {
      funRes.not = notOperat(funRes.not, notSequ)
      return flatFunCondition(funRes,thisValue,args)
    }

    return notOperat(funRes, notSequ)
  }

  return condExp
}


/**
 * 判断目标是否是对象类型
 * @param target : any   目标对象
 *
 * 仅通过 target instanceof Object 判断是不行的，因为 对于 Object.create(null) 创建的对象 通过 ` Object.create(null) instanceof Object ` 来判断 返回的是 false
 * 即：通过 Object.create(null) 创建的对象是不被 instanceof  认为是继续于 Object 的
 * 
 * typeof null 也返回 "object"
 */
function isObject(target:any):boolean {
// return target instanceof Object || typeof target === "object"
return  target && typeof target === "object"
}



interface conditionOperat<ThisValue,Args> {
  create(expr:CondExpression<ThisValue,Args>): (thisValue?:any, args?:any[])=>OperatedResult;
  create(options:ConditionOptions<ThisValue,Args>): (...rest: any[])=>OperatedResult;
}







/**
 * 条件运算
 * 对一系列条件进行逻辑运算；
 * @param condExpress : CondExpression   条件表达式
 * @param thisValue ？: any   设置条件表达式中 函数条件 的 this 的值
 * @param args ？: any[]   设置条件表达式中 函数条件 的 参数序列； 即该参数是个数组，里面包含传递给 条件函数 的参数
 *
 * @return OperatedResult 返回布尔类型 或者 返回布尔类型的Promise类型 的值
 * 
 * 注意：
 * thisValue 和 args 会被应用到所有的 函数条件，包括那些 运算过程 中产生的函数条件，比如：函数条件返回的函数条件、异步条件决议时传递出的 函数条件
 *
 *
 * 特性：
 * - 可以指定条件条件表达式的间的逻辑关系：与、或、非；
 * - 条件表达式可以任意层级嵌套，即：条件集 可以 嵌套 条件集；
 * - 短路运算
 *    在对条件表达式进行运算的过程中，如果运算中途已经能够确认最终的运算结果，则便会停止对剩余表达式的计算，并返回计算结果；
 *
 * - 简单优先
 *    为了提高运算效率，除了加入了短路运算的特性外，还加入了简单优先的计算原则，即：对于同一层级表达式，会按照下面的顺序优先计算：
 *    1. BaseCondition | FunCondition: 除了 异步条件 PromCondition、条件集 ConditionSet 以外的所有其它数据类型的条件表达式，这些条件会被当作布尔值来计算；
 *    2. ConditionSet : 条件集；
 *    3. PromCondition : 异步条件；
 */
export function conditionOperat<ThisValue,Args>(...exprOptions:ExpressionOptions<ThisValue,Args>[]):OperatedResult;
export function conditionOperat<ThisValue,Args>(condExpress:CondExpression<ThisValue,Args>,...exprOptions:ExpressionOptions<ThisValue,Args>[]):OperatedResult;
export function conditionOperat<ThisValue,Args>(exprOrOptions:CondExpression<ThisValue,Args>|ExpressionOptions<ThisValue,Args>,...exprOptions:ExpressionOptions<ThisValue,Args>[]):OperatedResult {

  
  if (isExpressionOptions<ThisValue,Args>(exprOrOptions)){
    var firstExprOpts = exprOrOptions;
  }else {
    firstExprOpts = {expr:exprOrOptions};
  }

  var finalExprOptions = Object.assign({},firstExprOpts,...exprOptions);


  if (isBoolCondition(condExpress)){
    return !!condExpress
  }

  if (isConditionSet(condExpress)){
    var condSet:ConditionSet<ThisValue,Args> = condExpress as ConditionSet<ThisValue,Args>
  }else {
    condSet = [condExpress]
  }

  let notSequ = [condSet.not];
  let notOper = function(b:boolean){
    return notOperat(b,notSequ)
  };

  let proCondArr:PromCondition<ThisValue,Args>[] = []
  let condSetArr:ConditionSet<ThisValue,Args> = []

  if (condSet.rel === "or"){

    //先对计算 不是 数组 和 不是 Promise 的 条件进行计算
    let orRes = condSet.some(function (condExp) {

      condExp = flatFunCondition(condExp,thisValue,args)

      if (isBoolCondition(condExp)){
        return condExp as boolean
      }

      //先跳过数组类型
      if (isConditionSet(condExp)){
        condSetArr.push(condExp)
        return false
      }


      //先跳过 Promise 类型
      if (isPromCondition(condExp)){
        proCondArr.push(condExp)
        return false
      }

      return notOperat(condExp,[condExp.not])
    });

    if (orRes){
      return notOper(true)
    }

  //  专门 计算 数组条件的 运算结果
  if (condSetArr.length > 0){
    let condSetArrRes = condSetArr.some(function (condSet) {
      let cond = conditionOperat(condSet);

      //先跳过 Promise 类型
      if (isPromCondition(cond)){
        proCondArr.push(cond)
        return false
      }

      return cond as boolean
    });
    if (condSetArrRes) {
      return notOper(true)
    }
  }

    //  专门 计算 Promise 条件的 运算结果
  if (proCondArr.length > 0){
    // @ts-ignore
    return  Promise.allSettled(proCondArr).then(function (proCondArrResArr:{status:"fulfilled"|"rejected",value:CondExpression<ThisValue,Args>}[]) {
      let proCondResArr:ConditionSet<ThisValue,Args> =  proCondArrResArr.map(function (proRes) {
        if (proRes.status === "fulfilled"){
          return proRes.value
        }else {
          return false
        }
      });

      proCondResArr.rel = condSet.rel;
      proCondResArr.not = condSet.not;
      return conditionOperat(proCondResArr);
    });

  }

  return notOper(orRes) ;




  }else {



    //先对计算 不是 数组 和 不是 Promise 的 条件进行计算
    let andRes = condSet.every(function (condExp) {
      condExp = flatFunCondition(condExp,thisValue,args)

      if (isBoolCondition(condExp)){
        return condExp as boolean
      }

      //先跳过数组类型
      if (isConditionSet(condExp)){
        condSetArr.push(condExp)
        return true
      }


      //先跳过 Promise 类型
      if (isPromCondition(condExp)){
        proCondArr.push(condExp)
        return true
      }

      return notOperat(condExp,[condExp.not])
    });

    if (!andRes){
      return notOper(false)
    }

    //  专门 计算 数组条件的 运算结果
    if (condSetArr.length > 0){
      let condSetArrRes = condSetArr.every(function (condSet) {
        let cond = conditionOperat(condSet);

        //先跳过 Promise 类型
        if (isPromCondition(cond)){
          proCondArr.push(cond)
          return true
        }

        return cond as boolean
      });
      if (!condSetArrRes) {
        return notOper(false)
      }
    }

    //  专门 计算 Promise 条件的 运算结果
    if (proCondArr.length > 0){
      // @ts-ignore
      return  Promise.allSettled(proCondArr).then(function (proCondArrResArr:{status:"fulfilled"|"rejected",value:CondExpression<ThisValue,Args>}[]) {
        let proCondResArr:ConditionSet<ThisValue,Args> =  proCondArrResArr.map(function (proRes) {
          if (proRes.status === "fulfilled"){
            return proRes.value
          }else {
            return false
          }
        });

        proCondResArr.rel = condSet.rel;
        proCondResArr.not = condSet.not;
        return conditionOperat(proCondResArr);
      });

    }

    return notOper(andRes);



  }




}






/* 
条件map
条件选项
表达式选项

export function conditionOperat<ThisValue,Args>(condOptions):OperatedResult;
export function conditionOperat<ThisValue,Args>(condExpress:CondExpression<ThisValue,Args>,condMapOrOptions):OperatedResult;
export function conditionOperat<ThisValue,Args>(condExpress:CondExpression<ThisValue,Args>,condMap):OperatedResult;
export function conditionOperat<ThisValue,Args>(condExpress:CondExpression<ThisValue,Args>,condOptions,condMap):OperatedResult;
export function conditionOperat<ThisValue,Args>(condExpress:CondExpression<ThisValue,Args>,condOptions):OperatedResult;
 */





/**
 * 条件选项类型
 */
interface ConditionOptions<ThisValue,Args> {
  expr?:CondExpression<ThisValue,Args>,   //条件表达式
  this?:ThisValue,    //设置条件表达式中 函数条件 的 this 的值
  args?:Args    //设置条件表达式中 函数条件 的 参数序列；即该参数是个数组，里面包含传递给 条件函数 的参数
}

function isConditionOptions<ThisValue,Args>(opts:any): opts is ConditionOptions<ThisValue,Args> {
  return opts && (opts.expr || opts.this || opts.args)
}



/**
 * 条件映射类型；条件Map
 */
/* type ConditionMap<ThisValue, Args> = {
  [key in string | number | symbol]: CondExpression<ThisValue, Args>
} */
interface ConditionMap<ThisValue, Args>  {
  [prop : string]: CondExpression<ThisValue, Args>;
}


function isConditionMap<ThisValue,Args>(opts:any): opts is ConditionMap<ThisValue,Args> {
  return opts && typeof opts === "object" && !Array.isArray(opts)
}


/**
 * 条件选项类型
 */
type ExpressionOptions<ThisValue,Args> = ConditionOptions<ThisValue,Args> & ConditionMap<ThisValue, Args> 

function isExpressionOptions<ThisValue,Args>(opts:any): opts is ExpressionOptions<ThisValue,Args> {
  return isConditionOptions<ThisValue,Args>(opts) || isConditionMap<ThisValue,Args>(opts)
}







/**
 * 创建快捷运算函数
 * 快捷运算函数 是带有一部分参数值，只接收剩余参数 的条件运算函数；
 *
 * 创建指定条件表达式的快捷运算函数
 */

/**
 * create<ThisValue,Args>(expr:CondExpression<ThisValue,Args>): (thisValue?:ThisValue, args?:Args)=>OperatedResult
 *
 * @param expr:CondExpression<ThisValue,Args>   条件表达式
 * @return `(thisValue?:ThisValue, args?:Args)=>OperatedResult`  返回一个函数，该函数可接收 thisValue 和 args 两个参数；
 * 
 */
export function create<ThisValue,Args>(expr:CondExpression<ThisValue,Args>): (thisValue?:ThisValue, args?:Args)=>OperatedResult;

/**
 * create(options:ConditionOptions<any,any>): (...rest: any[])=>OperatedResult
 * 
 * @param options:ConditionOptions<any,any>   创建选项对象
 * @return `(...rest: any[])=>OperatedResult`  返回一个函数，该函数可接收 选项对象 options 中没有提供的剩余参数，剩余的参数按照 `expr、this、args` 顺序（即 条件运算函数 `conditionOperat()` 的参数顺序）进行排列；
 * 
 */
export function create(options:ConditionOptions<any,any>): (...rest: any[])=>OperatedResult;
export function create<ThisValue,Args>(exprOrOpts: CondExpression<ThisValue,Args>|ConditionOptions<ThisValue,Args>){

  if (isConditionOptions(exprOrOpts)){
    var {expr,"this":thisValue,args} = exprOrOpts
  }else {
    expr = exprOrOpts
  }

  let argArr = [expr,thisValue,args];

  function operatWith(...rest: any[]):OperatedResult {
    var finalArgArr = argArr.map(function (argItem) {
      if (argItem === undefined) {
        return rest.shift()
      }

      return argItem
    });


    return  conditionOperat(...finalArgArr as [CondExpression<ThisValue,Args>, ThisValue, Args] );
  }



  return operatWith;
}


conditionOperat.create = create;


export default conditionOperat
