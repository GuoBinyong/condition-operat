//布尔条件的类型
type BoolCondition = Exclude<any, Function | Promise<any> | Array<any>>;

//Promise条件的类型
type PromCondition = Promise<Condition>

//函数条件的类型
type FunCondition = ()=>(BoolCondition | PromCondition)

//条件的类型
type Condition = BoolCondition | FunCondition | PromCondition

//关系类型
type Relationship = "and" | "or"

//布尔运算的结果的类型
type LogicOperationResult = boolean | Promise<BoolCondition>

//带有关系，并含有多个条件的集合
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

//条件表达式
type CondExpression = ConditionSet | Condition


/**
 * 条件运算
 * 对一系列条件进行逻辑运算；
 * @param condExpress : CondExpression   条件表达式
 */
export function conditionOperat(condExpress:CondExpression):LogicOperationResult {

  if (Array.isArray(condExpress)){
    var condSet:ConditionSet = condExpress as ConditionSet
  }else {
    condSet = [condExpress]
  }

  let notOper:(b:boolean)=>boolean = condSet.not ? function(b){return !b} : function(b){return b}

  let proCondArr:PromCondition[] = []
  let condSetArr:ConditionSet = []

  if (condSet.rel === "or"){

    //先对计算 不是 数组 和 不是 Promise 的 条件进行计算
    let orRes = condSet.some(function (condExp) {
      if (!condExp){
        return false
      }

      //先跳过数组类型
      if (Array.isArray(condExp)){
        condSetArr.push(condExp)
        return false
      }

      if (typeof condExp === "function"){
        condExp = condExp()
        if (!(condExp instanceof Promise)){
          return condExp
        }
      }

      //先跳过 Promise 类型
      if (condExp instanceof Promise){
        proCondArr.push(condExp)
        return false
      }

      return condExp

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
      if (!condExp){
        return false
      }

      //先跳过数组类型
      if (Array.isArray(condExp)){
        condSetArr.push(condExp)
        return true
      }

      if (typeof condExp === "function"){
        condExp = condExp()
        if (!(condExp instanceof Promise)){
          return condExp
        }
      }

      //先跳过 Promise 类型
      if (condExp instanceof Promise){
        proCondArr.push(condExp)
        return true
      }

      return condExp

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
