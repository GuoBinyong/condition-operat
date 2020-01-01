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
    not?: boolean;
}
/**
 * 布尔条件
 * 代表那些可直接被当作布尔值来计算的 真假 和 假值；
 */
declare type BoolCondition = boolean | number | string | symbol | undefined | null;
/**
 * 异步条件
 * 根据决议的值反复地进行条件运算，直到计算到得到 布尔结果 为止；
 */
interface PromCondition<ThisValue, Args> extends Promise<CondExpression<ThisValue, Args>>, NotExpression {
}
/**
 * 函数条件
 * 带有逻辑的函数，会对其返回值反复地进行条件运算，直到计算到得到 布尔结果 为止；
 */
interface FunCondition<ThisValue, Args> extends NotExpression {
    (this: ThisValue, ...args: Args extends any[] ? Args : []): CondExpression<any, any>;
}
/**
 * 条件的类型
 * 条件是用来表达 真 或 假 的基本运算单元；
 */
declare type Condition<ThisValue, Args> = BoolCondition | FunCondition<ThisValue, Args> | PromCondition<ThisValue, Args> | NotExpression;
/**
 * 关系类型
 */
declare type Relationship = "and" | "or";
/**
 * 运算结果的类型
 */
declare type OperatedResult = boolean | Promise<boolean>;
/**
 * 条件集
 * 条件集 ConditionSet 是用来表达 多个条件表达式 相与 或者 相或 关系的一种表达式；它包含多个条件表达式，并携带有关系信息（与、或）；
 */
interface ConditionSet<ThisValue, Args> extends Array<CondExpression<ThisValue, Args>>, NotExpression {
    /**
     * 各个条件表达式之间的关系；
     * 默认值："and"
     */
    rel?: Relationship;
}
/**
 * 条件表达式
 * 条件集 ConditionSet 和 条件 Condition 统称为 条件表达式
 */
declare type CondExpression<ThisValue, Args> = ConditionSet<ThisValue, Args> | Condition<ThisValue, Args>;
interface conditionOperat<ThisValue, Args> {
    create(expr: CondExpression<ThisValue, Args>): (thisValue?: any, args?: any[]) => OperatedResult;
    create(options: CreateOptions<ThisValue, Args>): (...rest: any[]) => OperatedResult;
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
export declare function conditionOperat<ThisValue, Args>(condExpress: CondExpression<ThisValue, Args>, thisValue?: ThisValue, args?: Args): OperatedResult;
export declare namespace conditionOperat {
    var create: typeof import("./conditionOperat").create;
}
/**
 * 创建快捷运算函数时的配置选项对象；
 */
interface CreateOptions<ThisValue, Args> {
    expr?: CondExpression<ThisValue, Args>;
    this?: ThisValue;
    args?: Args;
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
export declare function create<ThisValue, Args>(expr: CondExpression<ThisValue, Args>): (thisValue?: ThisValue, args?: Args) => OperatedResult;
/**
 * create(options:CreateOptions<any,any>): (...rest: any[])=>OperatedResult
 *
 * @param options:CreateOptions<any,any>   创建选项对象
 * @return `(...rest: any[])=>OperatedResult`  返回一个函数，该函数可接收 选项对象 options 中没有提供的剩余参数，剩余的参数按照 `expr、this、args` 顺序（即 条件运算函数 `conditionOperat()` 的参数顺序）进行排列；
 *
 */
export declare function create(options: CreateOptions<any, any>): (...rest: any[]) => OperatedResult;
export default conditionOperat;
