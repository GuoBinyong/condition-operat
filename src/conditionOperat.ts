/**
 * 非表达式的类型
 */
interface NotExpression {
  /**
   * 对该表达式的值取反
   */
  not?:boolean
}


/**
 * NotExpression 的类型守卫
 * @param condExp : CondExpression 表达式
 */
function isNotExpression(condExp:CondExpression): condExp is NotExpression {
  return isObject(condExp)
}





/**
 * 布尔类型的条件的类型
 * 该类型的值可直接将其自身作为布尔值来运算
 */
type BoolCondition = boolean | number | string | symbol | undefined | null

/**
 * BoolCondition 的类型守卫
 * @param condExp : CondExpression 表达式
 */
function isBoolCondition(condExp:CondExpression): condExp is BoolCondition {
  return !isObject(condExp)
}


/**
 * Promise条件的类型
 */
interface PromCondition extends Promise<CondExpression>,NotExpression {}



/**
 * PromCondition 的类型守卫
 * @param condExp : CondExpression 表达式
 */
function isPromCondition(condExp:CondExpression): condExp is PromCondition {
  return condExp instanceof Promise
}



/**
 * 函数条件的类型
 */
interface FunCondition extends NotExpression {
  ():CondExpression;
}


/**
 * FunCondition 的类型守卫
 * @param condExp : CondExpression 表达式
 */
function isFunCondition(condExp:CondExpression): condExp is FunCondition {
  return typeof condExp === "function"
}




/**
 * 条件的类型
 */
type Condition = BoolCondition | FunCondition | PromCondition | NotExpression

/**
 * 基础条件的类型；
 * 该类型的条件不需要经过复杂的运算，可根据 not 属性(如果有)，直接将其自身的值作为布尔值来来运算
 */
type BaseCondition = Exclude<Condition, FunCondition | PromCondition>


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
 * 带有关系，并含有多个条件的集合
 */
interface ConditionSet  extends Array<CondExpression>,NotExpression{
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
function isConditionSet(condExp:CondExpression): condExp is ConditionSet {
  return Array.isArray(condExp)
}




/**
 * 条件表达式的类型
 */
type CondExpression = ConditionSet | Condition









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
 *
 * 函数返回可能还会返回函数条件，返回的函数条件可能还会返回函数条件，可以无休止地这样延续下去；
 * 本方法的作用就是对函数条件进行运算，直到返回的不是函数条件为止
 */
function flatFunCondition(condExp: CondExpression): Exclude<CondExpression, FunCondition> {
  if (isFunCondition(condExp)) {
    let notSequ = [condExp.not]
    let funRes = condExp()

    if (isNotExpression(funRes)) {
      funRes.not = notOperat(funRes.not, notSequ)
      return flatFunCondition(funRes)
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
 */
function isObject(target:any):boolean {
return target instanceof Object || typeof target === "object"
}





/**
 * 条件运算
 * 对一系列条件进行逻辑运算；
 * @param condExpress : CondExpression   条件表达式
 * @return OperatedResult 返回布尔 或者 Promise
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
 *    1. BaseCondition | FunCondition: 除了 Promise类型的条件 PromCondition、数组类型的条件集 ConditionSet 以外的所有其它数据类型的条件表达式，这些条件会被当作布尔值来计算；
 *    2. ConditionSet : 条件集类型 的条件表达式，即 数组类型；
 *    3. PromCondition : Promise类型的条件表达式；
 */
export function conditionOperat(condExpress:CondExpression):OperatedResult {

  if (!isObject(condExpress)){
    return !!condExpress
  }

  if (Array.isArray(condExpress)){
    var condSet:ConditionSet = condExpress as ConditionSet
  }else {
    condSet = [condExpress]
  }

  let notSequ = [condSet.not];
  let notOper = function(b:boolean){
    return notOperat(b,notSequ)
  };

  let proCondArr:PromCondition[] = []
  let condSetArr:ConditionSet = []

  if (condSet.rel === "or"){

    //先对计算 不是 数组 和 不是 Promise 的 条件进行计算
    let orRes = condSet.some(function (condExp) {

      condExp = flatFunCondition(condExp)

      if (isBoolCondition(condExp)){
        return condExp
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

      return cond
    });
    if (condSetArrRes) {
      return notOper(true)
    }
  }

    //  专门 计算 Promise 条件的 运算结果
  if (proCondArr.length > 0){
    // @ts-ignore
    return  Promise.allSettled(proCondArr).then(function (proCondArrResArr:{status:"fulfilled"|"rejected",value:any}[]) {
      let proCondResArr:ConditionSet =  proCondArrResArr.map(function (proRes) {
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
      condExp = flatFunCondition(condExp)

      if (isBoolCondition(condExp)){
        return condExp
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

        return cond
      });
      if (!condSetArrRes) {
        return notOper(false)
      }
    }

    //  专门 计算 Promise 条件的 运算结果
    if (proCondArr.length > 0){
      // @ts-ignore
      return  Promise.allSettled(proCondArr).then(function (proCondArrResArr:{status:"fulfilled"|"rejected",value:any}[]) {
        let proCondResArr:ConditionSet =  proCondArrResArr.map(function (proRes) {
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




export default conditionOperat
