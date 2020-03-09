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
 * 判断目标是否是对象类型
 * @param target : any   目标对象
 *
 * 仅通过 target instanceof Object 判断是不行的，因为 对于 Object.create(null) 创建的对象 通过 ` Object.create(null) instanceof Object ` 来判断 返回的是 false
 * 即：通过 Object.create(null) 创建的对象是不被 instanceof  认为是继续于 Object 的
 *
 * typeof null 也返回 "object"
 */
function isObject(target) {
    // return target instanceof Object || typeof target === "object"
    var tarType = typeof target;
    return target && (tarType === "object" || tarType === "function");
}
/**
 * NotExpression 的类型守卫
 */
function isNotExpression(expr) {
    return isObject(expr);
}
/**
 * MapCondition 的类型守卫
 */
function isMapCondition(cond) {
    let condType = typeof cond;
    return condType === "string" || condType === "number" || condType === "symbol" || cond instanceof String || cond instanceof Number;
}
/**
 * ConditionMap 的类型守卫
 */
function isConditionMap(condMap) {
    return isObject(condMap);
}
/**
 * ObjCondition 的类型守卫
 */
function isObjCondition(cond) {
    return cond && cond instanceof Object && !(isConditionSet(cond) || isFunCondition(cond) || isPromCondition(cond));
}
/**
 * BoolCondition 的类型守卫
 */
function isBoolCondition(cond) {
    return typeof cond === "boolean" || cond == undefined || cond instanceof Boolean || isObjCondition(cond);
}
/**
 * PromCondition 的类型守卫
 */
function isPromCondition(cond) {
    return cond instanceof Promise;
}
/**
 * FunCondition 的类型守卫
 */
function isFunCondition(cond) {
    return typeof cond === "function";
}
/**
 * Condition 的类型守卫
 */
function isCondition(cond) {
    return isFunCondition(cond) || isPromCondition(cond) || isMapCondition(cond) || isBoolCondition(cond);
}
/**
 * ConditionSet 的类型守卫
 */
function isConditionSet(expr) {
    return Array.isArray(expr);
}
/**
 * CondExpression 的类型守卫
 */
function isCondExpression(expr) {
    return isConditionSet(expr) || isCondition(expr);
}
/**
 * 对 target 做一系列连续的 非操作，
 * @param target : any    操作的目标，如果 target 有 valueOf() 方法，会将 valueOf() 方法返回的值作为布尔值来对象，否则，会直接将 target 作为布尔值来对待
 * @param notSequ : NotSequence    指示非操作序列的数组
 * @return boolean     非操作后的结果
 */
function notOperat(target, notSequ) {
    return notSequ.reduce(function (res, not) {
        return not && not.valueOf() ? !res : res;
    }, Boolean(target && target.valueOf ? target.valueOf() : target));
}
/**
 * 扁平化 递归条件 RecursiveCondition
 * @param operatOptions : OperatOptions   运算选项类型
 *
 * 函数条件 FunCondition 可能还会返回 函数条件 FunCondition，返回的 函数条件 FunCondition 可能还会返回 函数条件 FunCondition，可以无休止地这样延续下去；映射条件 MapCondition 也是；像这样的条件称为 递归条件
 * 本方法的作用就是对递归条件进行运算，直到返回的不是递归条件为止
 */
function flatCondition(operatOptions) {
    let { expr, "this": thisValue, args, notSequ, ...otherProp } = operatOptions;
    let condMap = otherProp;
    if (!notSequ) {
        notSequ = isNotExpression(expr) ? [expr.not] : [];
    }
    if (isMapCondition(expr)) {
        var mapKey = (isObject(expr) ? expr.valueOf() : expr);
        var nextExpr = condMap[mapKey];
    }
    else if (isFunCondition(expr)) {
        // @ts-ignore
        nextExpr = expr.apply(thisValue, args);
    }
    else {
        return {
            expr: expr,
            notSequ: notSequ
        };
    }
    let nextOperOpts = { ...operatOptions, expr: nextExpr, notSequ: undefined };
    var exprOpts = flatCondition(nextOperOpts);
    exprOpts.notSequ = notSequ.concat(exprOpts.notSequ);
    return exprOpts;
}
/**
 * ExpressionOptions 的类型守卫
 */
function isExpressionOptions(opts) {
    return opts && (opts.expr || opts.this || opts.args || opts.full || opts.notSequ);
}
/**
 * OperatOptions 的类型守卫
 */
function isOperatOptions(opts) {
    return isConditionMap(opts) || isExpressionOptions(opts);
}
export function conditionOperat(exprOrOptions, ...operatOptions) {
    let finalOperOpts = Object.assign({}, exprOrOptions, ...operatOptions);
    /*
    在以下任一情况下，都需要将 exprOrOptions 作为 表达式来用
    - finalOperOpts 中没有表达式 expr 属性；
    - exprOrOptions 不是 OperatOptions 类型；
    */
    if (!("expr" in finalOperOpts && isOperatOptions(exprOrOptions))) {
        finalOperOpts.expr = exprOrOptions;
    }
    if (finalOperOpts.full) {
        return conditionOperatForFull(finalOperOpts);
    }
    return conditionOperatForFast(finalOperOpts);
}
/**
 * 以短路的方式进行条件运算
 * conditionOperatForFast<ThisValue,Args>(operatOptions:OperatOptions<ThisValue,Args>):OperatedResult
 * @param operatOptions : OperatOptions  关于条件的选项对象
 *
 * @returns OperatedResult   返回 OperatedResult 类型的结果，即 布尔类型 或者 返回布尔类型的 Promise 类型 的值；
 * 只有依靠 异步条件 才能决定最后的运算结果时，conditionOperat 才会返回 Promise 类型的 异步运算结果
 */
function conditionOperatForFast(operatOptions) {
    let finalOperOpts = { ...operatOptions };
    let { "this": thisValue, args, ...condMap } = finalOperOpts;
    let { expr: condExpress, notSequ } = flatCondition(finalOperOpts);
    if (isPromCondition(condExpress)) {
        return condExpress.then(function (expr) {
            finalOperOpts.expr = expr;
            finalOperOpts.notSequ = notSequ;
            return conditionOperatForFast(finalOperOpts);
        }, function (reason) {
            return notOperat(false, notSequ);
        });
    }
    else if (isConditionSet(condExpress)) {
        var condSet = condExpress;
    }
    else {
        return notOperat(condExpress, notSequ);
    }
    let notOper = function (b) {
        return notOperat(b, notSequ);
    };
    let proCondArr = [];
    let condSetArr = [];
    if (condSet.rel === "or") {
        //先计算 不是 数组 和 不是 Promise 的 条件进行计算
        let orRes = condSet.some(function (condExp) {
            let operOpts = { ...finalOperOpts, expr: condExp, notSequ: undefined };
            let { expr: finalExpr, notSequ } = flatCondition(operOpts);
            if (isConditionSet(finalExpr)) {
                condSetArr.push(finalExpr);
                return false;
            }
            else if (isPromCondition(finalExpr)) {
                proCondArr.push(finalExpr);
                return false;
            }
            else {
                return notOperat(finalExpr, notSequ);
            }
        });
        if (orRes) {
            return notOper(true);
        }
        //  专门 计算 数组条件的 运算结果
        if (condSetArr.length > 0) {
            let condSetArrRes = condSetArr.some(function (condSet) {
                let operOpts = { ...finalOperOpts, expr: condSet, notSequ: undefined };
                let cond = conditionOperatForFast(operOpts);
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
            return Promise.allSettled(proCondArr).then(function (proCondArrResArr) {
                let proCondResArr = proCondArrResArr.map(function (proRes) {
                    return proRes.status === "fulfilled" ? proRes.value : false;
                });
                proCondResArr.rel = condSet.rel;
                let operOpts = { ...finalOperOpts, expr: proCondResArr, notSequ };
                return conditionOperatForFast(operOpts);
            });
        }
        return notOper(orRes);
    }
    else {
        //先计算 不是 数组 和 不是 Promise 的 条件进行计算
        let andRes = condSet.every(function (condExp) {
            let operOpts = { ...finalOperOpts, expr: condExp, notSequ: undefined };
            let { expr: finalExpr, notSequ } = flatCondition(operOpts);
            if (isConditionSet(finalExpr)) {
                condSetArr.push(finalExpr);
                return true;
            }
            else if (isPromCondition(finalExpr)) {
                proCondArr.push(finalExpr);
                return true;
            }
            else {
                return notOperat(finalExpr, notSequ);
            }
        });
        if (!andRes) {
            return notOper(false);
        }
        //  专门 计算 数组条件的 运算结果
        if (condSetArr.length > 0) {
            let condSetArrRes = condSetArr.every(function (condSet) {
                let operOpts = { ...finalOperOpts, expr: condSet, notSequ: undefined };
                let cond = conditionOperatForFast(operOpts);
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
            return Promise.allSettled(proCondArr).then(function (proCondArrResArr) {
                let proCondResArr = proCondArrResArr.map(function (proRes) {
                    return proRes.status === "fulfilled" ? proRes.value : false;
                });
                proCondResArr.rel = condSet.rel;
                let operOpts = { ...finalOperOpts, expr: proCondResArr, notSequ };
                return conditionOperatForFast(operOpts);
            });
        }
        return notOper(andRes);
    }
}
/**
 * 以全量的方式进行条件运算
 * conditionOperatForFull<ThisValue,Args>(operatOptions:OperatOptions<ThisValue,Args>):OperatedResult
 * @param operatOptions : OperatOptions  关于条件的选项对象
 *
 * @returns OperatedResult   返回 OperatedResult 类型的结果，即 布尔类型 或者 返回布尔类型的 Promise 类型 的值；
 * 只有依靠 异步条件 才能决定最后的运算结果时，conditionOperat 才会返回 Promise 类型的 异步运算结果
 */
function conditionOperatForFull(operatOptions) {
    let finalOperOpts = { ...operatOptions };
    let { "this": thisValue, args, ...condMap } = finalOperOpts;
    let { expr: condExpress, notSequ } = flatCondition(finalOperOpts);
    if (isPromCondition(condExpress)) {
        return condExpress.then(function (expr) {
            finalOperOpts.expr = expr;
            finalOperOpts.notSequ = notSequ;
            return conditionOperatForFull(finalOperOpts);
        }, function (reason) {
            return notOperat(false, notSequ);
        });
    }
    else if (isConditionSet(condExpress)) {
        var condSet = condExpress;
        var condSetRes = condSet.map(function (condExp) {
            let operOpts = { ...finalOperOpts, expr: condExp, notSequ: undefined };
            return conditionOperatForFull(operOpts);
        });
    }
    else {
        return notOperat(condExpress, notSequ);
    }
    let notOper = function (b) {
        return notOperat(b, notSequ);
    };
    let proCondArr = [];
    if (condSet.rel === "or") {
        //通过 不是 Promise 的 结果来确定 condSet 的值
        let orRes = condSetRes.some(function (condExp) {
            if (condExp instanceof Promise) {
                proCondArr.push(condExp);
                return false;
            }
            return condExp;
        });
        if (orRes) {
            return notOper(true);
        }
        //通过 Promise 的 结果来确定 condSet 的值
        if (proCondArr.length > 0) {
            return Promise.allSettled(proCondArr).then(function (proCondArrResArr) {
                let proCondResArr = proCondArrResArr.map(function (proRes) {
                    return proRes.status === "fulfilled" ? proRes.value : false;
                });
                proCondResArr.rel = condSet.rel;
                let operOpts = { ...finalOperOpts, expr: proCondResArr, notSequ };
                return conditionOperatForFull(operOpts);
            });
        }
        return notOper(orRes);
    }
    else {
        //通过 不是 Promise 的 结果来确定 condSet 的值
        let andRes = condSetRes.every(function (condExp) {
            if (condExp instanceof Promise) {
                proCondArr.push(condExp);
                return true;
            }
            return condExp;
        });
        if (!andRes) {
            return notOper(false);
        }
        //通过 Promise 的 结果来确定 condSet 的值
        if (proCondArr.length > 0) {
            return Promise.allSettled(proCondArr).then(function (proCondArrResArr) {
                let proCondResArr = proCondArrResArr.map(function (proRes) {
                    return proRes.status === "fulfilled" ? proRes.value : false;
                });
                proCondResArr.rel = condSet.rel;
                let operOpts = { ...finalOperOpts, expr: proCondResArr, notSequ };
                return conditionOperatForFull(operOpts);
            });
        }
        return notOper(andRes);
    }
}
export function create(exprOrOptions, ...operatOptions) {
    var finalOperOpts = Object.assign({}, exprOrOptions, ...operatOptions);
    if (!isOperatOptions(exprOrOptions)) {
        finalOperOpts.expr = exprOrOptions;
    }
    function operatWith(...operOpts) {
        return conditionOperat(finalOperOpts, ...operOpts);
    }
    return operatWith;
}
conditionOperat.create = create;
export default conditionOperat;
