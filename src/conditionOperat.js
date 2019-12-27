/**
 * NotExpression 的类型守卫
 * @param condExp : CondExpression 表达式
 */
function isNotExpression(condExp) {
    return isObject(condExp);
}
/**
 * BoolCondition 的类型守卫
 * @param condExp : CondExpression 表达式
 */
function isBoolCondition(condExp) {
    return !isObject(condExp);
}
/**
 * PromCondition 的类型守卫
 * @param condExp : CondExpression 表达式
 */
function isPromCondition(condExp) {
    return condExp instanceof Promise;
}
/**
 * FunCondition 的类型守卫
 * @param condExp : CondExpression 表达式
 */
function isFunCondition(condExp) {
    return typeof condExp === "function";
}
/**
 * ConditionSet 的类型守卫
 * @param condExp : CondExpression 表达式
 */
function isConditionSet(condExp) {
    return Array.isArray(condExp);
}
/**
 * 对 target 做一系列连续的 非操作，
 * @param target : any    操作的目标，会直接将其作为布尔值来对待
 * @param notSequ : NotSequence    指示非操作序列的数组
 * @return boolean     非操作后的结果
 */
function notOperat(target, notSequ) {
    return !!(notSequ.reduce(function (res, not) {
        return not ? !res : res;
    }, target));
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
function flatFunCondition(condExp, thisValue, args) {
    if (isFunCondition(condExp)) {
        let notSequ = [condExp.not];
        // @ts-ignore
        let funRes = condExp.apply(thisValue, args);
        if (isNotExpression(funRes)) {
            funRes.not = notOperat(funRes.not, notSequ);
            return flatFunCondition(funRes, thisValue, args);
        }
        return notOperat(funRes, notSequ);
    }
    return condExp;
}
/**
 * 判断目标是否是对象类型
 * @param target : any   目标对象
 *
 * 仅通过 target instanceof Object 判断是不行的，因为 对于 Object.create(null) 创建的对象 通过 ` Object.create(null) instanceof Object ` 来判断 返回的是 false
 * 即：通过 Object.create(null) 创建的对象是不被 instanceof  认为是继续于 Object 的
 */
function isObject(target) {
    return target instanceof Object || typeof target === "object";
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
export function conditionOperat(condExpress, thisValue, args) {
    if (isBoolCondition(condExpress)) {
        return !!condExpress;
    }
    if (isConditionSet(condExpress)) {
        var condSet = condExpress;
    }
    else {
        condSet = [condExpress];
    }
    let notSequ = [condSet.not];
    let notOper = function (b) {
        return notOperat(b, notSequ);
    };
    let proCondArr = [];
    let condSetArr = [];
    if (condSet.rel === "or") {
        //先对计算 不是 数组 和 不是 Promise 的 条件进行计算
        let orRes = condSet.some(function (condExp) {
            condExp = flatFunCondition(condExp, thisValue, args);
            if (isBoolCondition(condExp)) {
                return condExp;
            }
            //先跳过数组类型
            if (isConditionSet(condExp)) {
                condSetArr.push(condExp);
                return false;
            }
            //先跳过 Promise 类型
            if (isPromCondition(condExp)) {
                proCondArr.push(condExp);
                return false;
            }
            return notOperat(condExp, [condExp.not]);
        });
        if (orRes) {
            return notOper(true);
        }
        //  专门 计算 数组条件的 运算结果
        if (condSetArr.length > 0) {
            let condSetArrRes = condSetArr.some(function (condSet) {
                let cond = conditionOperat(condSet);
                //先跳过 Promise 类型
                if (isPromCondition(cond)) {
                    proCondArr.push(cond);
                    return false;
                }
                return cond;
            });
            if (condSetArrRes) {
                return notOper(true);
            }
        }
        //  专门 计算 Promise 条件的 运算结果
        if (proCondArr.length > 0) {
            // @ts-ignore
            return Promise.allSettled(proCondArr).then(function (proCondArrResArr) {
                let proCondResArr = proCondArrResArr.map(function (proRes) {
                    if (proRes.status === "fulfilled") {
                        return proRes.value;
                    }
                    else {
                        return false;
                    }
                });
                proCondResArr.rel = condSet.rel;
                proCondResArr.not = condSet.not;
                return conditionOperat(proCondResArr);
            });
        }
        return notOper(orRes);
    }
    else {
        //先对计算 不是 数组 和 不是 Promise 的 条件进行计算
        let andRes = condSet.every(function (condExp) {
            condExp = flatFunCondition(condExp, thisValue, args);
            if (isBoolCondition(condExp)) {
                return condExp;
            }
            //先跳过数组类型
            if (isConditionSet(condExp)) {
                condSetArr.push(condExp);
                return true;
            }
            //先跳过 Promise 类型
            if (isPromCondition(condExp)) {
                proCondArr.push(condExp);
                return true;
            }
            return notOperat(condExp, [condExp.not]);
        });
        if (!andRes) {
            return notOper(false);
        }
        //  专门 计算 数组条件的 运算结果
        if (condSetArr.length > 0) {
            let condSetArrRes = condSetArr.every(function (condSet) {
                let cond = conditionOperat(condSet);
                //先跳过 Promise 类型
                if (isPromCondition(cond)) {
                    proCondArr.push(cond);
                    return true;
                }
                return cond;
            });
            if (!condSetArrRes) {
                return notOper(false);
            }
        }
        //  专门 计算 Promise 条件的 运算结果
        if (proCondArr.length > 0) {
            // @ts-ignore
            return Promise.allSettled(proCondArr).then(function (proCondArrResArr) {
                let proCondResArr = proCondArrResArr.map(function (proRes) {
                    if (proRes.status === "fulfilled") {
                        return proRes.value;
                    }
                    else {
                        return false;
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
function isCreateOptions(opts) {
    return opts && (opts.expr || opts.this || opts.args);
}
export function create(exprOrOpts) {
    if (isCreateOptions(exprOrOpts)) {
        var { expr, "this": thisValue, args } = exprOrOpts;
    }
    else {
        expr = exprOrOpts;
    }
    let argArr = [expr, thisValue, args];
    function operatWith(...rest) {
        var finalArgArr = argArr.map(function (argItem) {
            if (argItem === undefined) {
                return rest.shift();
            }
            return argItem;
        });
        return conditionOperat(...finalArgArr);
    }
    return operatWith;
}
conditionOperat.create = create;
