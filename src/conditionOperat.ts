/**
 * 布尔条件的类型
 */
type BoolCondition = Exclude<any, Function | Promise<any> | Array<any>>;

/**
 * Promise条件的类型
 */
type PromCondition = Promise<CondExpression>

/**
 * 函数条件的类型
 */
type FunCondition = ()=>CondExpression

/**
 * 条件的类型
 */
type Condition = BoolCondition | FunCondition | PromCondition

/**
 * 关系类型
 */
type Relationship = "and" | "or"

/**
 * 运算结果的类型
 */
type OperatedResult = boolean | Promise<BoolCondition>

/**
 * 条件集
 * 带有关系，并含有多个条件的集合
 */
interface ConditionSet  extends Array<CondExpression>{
  /**
   * 各个条件表达式之间的关系；
   * 默认值："and"
   */
  rel?:Relationship;

  /**
   * 对所有条件表达式进行 `rel` 关系 运算之后，再进行一次 非运算
   */
  not?:boolean;
}

/**
 * 条件表达式的类型
 */
type CondExpression = ConditionSet | Condition









/**
 * 非值的类型
 */
type NotValue = ConditionSet["not"]

/**
 * 非值的序列
 */
type NotSequence = NotValue[]


/**
 * 对 target 做一系列连续的 非操作，
 * @param target : BoolCondition    操作的目标
 * @param notSequ : NotSequence    指示非操作序列的数组
 * @return BoolCondition     非操作后的结果
 */
function notOperat(target:BoolCondition,notSequ:NotSequence):BoolCondition {
  return notSequ.reduce(function (res,not) {
    return not ? !res : res;
  },target);
}




/**
 * 扁平化 函数条件
 * @param condExp : CondExpression   条件表达式；如果 condExp 不是函数条件，则不作处理 返回 condExp 自身
 *
 * 函数返回可能还会返回函数条件，返回的函数条件可能还会返回函数条件，可以无休止地这样延续下去；
 * 本方法的作用就是对函数条件进行运算，直到返回的不是函数条件为止
 */
function flatFunCondition(condExp: CondExpression): PromCondition | BoolCondition {
  if (typeof condExp === "function") {
    let notSequ = [condExp.not]
    let funRes = condExp()

    if (funRes instanceof Object) {
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
 *    1. BoolCondition : 除了函数、Promise、ConditionSet（即：数组）以外的所有其它数据类型的条件表达式，这些条件会被当作布尔值来计算；
 *    2. FunCondition : 函数类型的条件表达式；
 *    3. ConditionSet : 条件集类型 的条件表达式，即 数组类型；
 *    4. PromCondition : Promise类型的条件表达式；
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
    return !!notOperat(b,notSequ)
  };

  let proCondArr:PromCondition[] = []
  let condSetArr:ConditionSet = []

  if (condSet.rel === "or"){

    //先对计算 不是 数组 和 不是 Promise 的 条件进行计算
    let orRes = condSet.some(function (condExp) {

      condExp = flatFunCondition(condExp)

      if (!isObject(condExp)){
        return condExp
      }

      //先跳过数组类型
      if (Array.isArray(condExp)){
        condSetArr.push(condExp)
        return false
      }


      //先跳过 Promise 类型
      if (condExp instanceof Promise){
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
      if (cond instanceof Promise){
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

      if (!isObject(condExp)){
        return condExp
      }

      //先跳过数组类型
      if (Array.isArray(condExp)){
        condSetArr.push(condExp)
        return true
      }


      //先跳过 Promise 类型
      if (condExp instanceof Promise){
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
        if (cond instanceof Promise){
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
