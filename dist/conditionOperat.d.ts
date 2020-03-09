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
 * 映射条件类型
 * 表示 在 条件映射对象 ConditionMap 中，条件表达式对应的 key
 */
declare type MapCondition = string | number | (String & NotExpression) | (Number & NotExpression) | symbol;
/**
 * ConditionMap 的 属性类型
 */
declare type ConditionMapKey = string | number;
/**
 * 条件映射对象的类型
 * 映射条件 可通过 该类型的对象来查找其对应的条件；
 *
 * 接口的索引签名类型不能用联合类型
 */
declare type ConditionMap<ThisValue, Args> = {
    [prop in ConditionMapKey]: CondExpression<ThisValue, Args>;
} & ThisType<ThisValue>;
/**
 * 对象条件类型
 * 表示那些除  函数条件 FunCondition 、异步条件 PromCondition 外 的 对象；当这些对象被作为 条件 时，会将其valueOf()方法返回的值转换成 布尔值，然后作 布尔条件 来用
 */
interface ObjCondition extends NotExpression {
}
/**
 * 布尔条件
 * 代表那些可直接被当作布尔值来计算的 真假 和 假值；
 */
declare type BoolCondition = boolean | undefined | null | Boolean | ObjCondition;
/**
 * PromCondition 类型的条件返回的结果的类型
 */
declare type PromConditionResult<ThisValue, Args> = BoolCondition | FunCondition<ThisValue, Args> | MapCondition | ConditionSet<ThisValue, Args>;
/**
 * 异步条件
 * 根据决议的值反复地进行条件运算，直到计算到得到 布尔结果 为止；
 */
declare type PromCondition<ThisValue, Args> = Promise<PromConditionResult<ThisValue, Args>> & NotExpression;
/**
 * 函数条件
 * 带有逻辑的函数，会对其返回值反复地进行条件运算，直到计算到得到 布尔结果 为止；
 */
interface FunCondition<ThisValue, Args> extends NotExpression {
    (this: ThisValue, ...args: Args extends any[] ? Args : []): CondExpression<ThisValue, Args>;
}
/**
 * 条件的类型
 * 条件是用来表达 真 或 假 的基本运算单元；
 */
declare type Condition<ThisValue, Args> = BoolCondition | FunCondition<ThisValue, Args> | PromCondition<ThisValue, Args> | MapCondition;
/**
 * 关系类型
 */
declare type Relationship = "and" | "or";
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
/**
 * 非值的类型
 */
declare type NotValue = NotExpression["not"];
/**
 * 非值的序列
 */
declare type NotSequence = NotValue[];
/**
 * 条件选项类型
 */
interface ExpressionOptions<ThisValue, Args> {
    expr?: CondExpression<ThisValue, Args>;
    this?: ThisValue;
    /**
     * 设置条件表达式中 函数条件 的 参数序列；即该参数是个数组，里面包含传递给 条件函数 的参数
     *
     * 注意：
     * thisValue 和 args 会被应用到所有的 函数条件，包括那些 运算过程 中产生的函数条件，比如：函数条件返回的函数条件、异步条件决议时传递出的 函数条件
     */
    args?: Args;
    /**
     * 是否要对表达式进行全量运算，默认是短路计算；全量计算会对条件集中的每个条件进行计算；
     *
     * # 全景运算
     * 会对表达式中的所有条件依次且完全地进行运算
     *
     * # 短路运算
     * 在对条件表达式进行运算的过程中，如果运算中途已经能够确认最终的运算结果，则便会停止对剩余表达式的计算，并返回计算结果；
     *
     * ## 简单优先
     * 为了提高运算效率，除了加入了短路运算的特性外，还加入了简单优先的计算原则，即：对于同一层级表达式，会按照下面的顺序优先计算：
     * 1. BoolCondition | RecursiveCondition: 布尔条件 BoolCondition 和 扁平化后 布尔条件 BoolCondition 的 递归条件 RecursiveCondition；
     * 2. ConditionSet : 条件集；
     * 3. PromCondition : 异步条件；
     */
    full?: boolean;
    notSequ?: NotSequence;
}
/**
 * 条件运算的选项的类型
 */
declare type OperatOptions<ThisValue, Args> = ExpressionOptions<ThisValue, Args> & ConditionMap<ThisValue, Args>;
/**
 * 运算结果的类型
 */
declare type OperatedResult = boolean | Promise<boolean>;
/**
 * conditionOperat 接口
 */
export interface conditionOperat {
    create<ThisValue, Args>(...operatOptions: OperatOptions<ThisValue, Args>[]): (...operatOptions: OperatOptions<ThisValue, Args>[]) => OperatedResult;
    create<ThisValue, Args>(condExpress: CondExpression<ThisValue, Args>, ...operatOptions: OperatOptions<ThisValue, Args>[]): (...operatOptions: OperatOptions<ThisValue, Args>[]) => OperatedResult;
}
/**
 * 条件运算
 * 对一系列条件进行逻辑运算；
 *
 * @returns OperatedResult   返回 OperatedResult 类型的结果，即 布尔类型 或者 返回布尔类型的 Promise 类型 的值；
 * 只有依靠 异步条件 才能决定最后的运算结果时，conditionOperat 才会返回 Promise 类型的 异步运算结果
 */
/**
 * 接口1
 * conditionOperat<ThisValue,Args>(...operatOptions:OperatOptions<ThisValue,Args>[]):OperatedResult
 * @param operatOptions : OperatOptions  conditionOperat 接收一系列关于条件的选项对象
 *
 */
export declare function conditionOperat<ThisValue, Args>(...operatOptions: OperatOptions<ThisValue, Args>[]): OperatedResult;
export declare namespace conditionOperat {
    var create: typeof import("./conditionOperat").create;
}
/**
 * 接口2
 * @param condExpress : CondExpression   条件表达式
 * @param operatOptions : OperatOptions   一系列关于条件的选项对象
 *
 */
export declare function conditionOperat<ThisValue, Args>(condExpress: CondExpression<ThisValue, Args>, ...operatOptions: OperatOptions<ThisValue, Args>[]): OperatedResult;
export declare namespace conditionOperat {
    var create: typeof import("./conditionOperat").create;
}
/**
 * 创建快捷运算函数
 * 快捷运算函数 是带有默认选项的条件运算函数；
 */
/**
* 接口1
* create<ThisValue,Args>(...operatOptions:OperatOptions<ThisValue,Args>[]): (...operatOptions:OperatOptions<ThisValue,Args>[])=>OperatedResult
* @param operatOptions : OperatOptions  conditionOperat 接收一系列关于条件的选项对象
*/
export declare function create<ThisValue, Args>(...operatOptions: OperatOptions<ThisValue, Args>[]): (...operatOptions: OperatOptions<ThisValue, Args>[]) => OperatedResult;
/**
 * 接口2
 * create<ThisValue,Args>(condExpress:CondExpression<ThisValue,Args>,...operatOptions:OperatOptions<ThisValue,Args>[]): (...operatOptions:OperatOptions<ThisValue,Args>[])=>OperatedResult
 * @param condExpress : CondExpression   条件表达式
 * @param operatOptions : OperatOptions   一系列关于条件的选项对象
 */
export declare function create<ThisValue, Args>(condExpress: CondExpression<ThisValue, Args>, ...operatOptions: OperatOptions<ThisValue, Args>[]): (...operatOptions: OperatOptions<ThisValue, Args>[]) => OperatedResult;
export default conditionOperat;
