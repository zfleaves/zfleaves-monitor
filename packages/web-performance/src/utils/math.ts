import { Curve } from "../types";


/**
 * 计算误差函数 erf(x) 的近似值。
 * 误差函数是一个在概率论、统计学以及偏微分方程中常用的特殊函数，定义为 erf(x) = (2 / √π) ∫₀ˣ e⁻ᵗ² dt。
 * 由于该积分没有初等函数的解析解，因此使用多项式近似来计算其值。
 * 
 * @param x - 输入值，误差函数的自变量。
 * @returns 误差函数 erf(x) 的近似值。
 */
function internalErf_(x: number): number {
    // erf 函数是奇函数，即 erf(-x) = -erf(x)
    // 记录输入值的符号，后续将 x 转换为绝对值进行计算，最后再恢复符号
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);

    // 定义用于多项式近似的系数
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    // 另一个用于近似计算的常量
    const p = 0.3275911;
    // 计算中间变量 t，用于后续的多项式计算
    const t = 1 / (1 + p * x);
    // 使用霍纳法则计算多项式的值
    // 霍纳法则可以减少乘法和加法的次数，提高计算效率
    const y = t * (a1 + t * (a2 + t * (a3 + t * (a4 + t * a5))));
    // 根据误差函数的近似公式计算最终结果
    // 并恢复之前记录的符号
    return sign * (1 - y * Math.exp(-x * x));
}

/**
 * 根据给定的分布曲线和特定值计算对应的分位数。
 * 
 * @param curve - 分布曲线，包含 `podr`、`median` 和 `p10` 等信息。
 * @param value - 要计算分位数的特定值。
 * @returns 特定值在分布曲线中对应的分位数。
 */
export function QUANTILE_AT_VALUE(curve: Curve, value: number): number {
    // 从分布曲线对象中解构出 podr、median 和 p10
    const { podr, median, p10 } = curve;

    // 定义一个临时变量 _podr，初始值为 podr
    let _podr = podr;
    // 如果 podr 不存在，则调用 derivePodrFromP10 函数根据 median 和 p10 计算 podr
    if (!podr) {
        _podr = derivePodrFromP10(median, p10);
    }

    // 计算中位数的自然对数，作为对数位置参数
    const location = Math.log(median);

    // 计算 _podr 与 median 比值的自然对数
    const logRatio = Math.log(_podr / median);
    // 根据 logRatio 计算形状参数 shape，用于描述分布的形状特征
    const shape = Math.sqrt(1 - 3 * logRatio - Math.sqrt((logRatio - 3) * (logRatio - 3) - 8)) / 2;

    // 计算标准化值，将 value 转换为符合特定分布的标准值
    const standardizedX = (Math.log(value) - location) / (Math.SQRT2 * shape);
    // 调用 internalErf_ 函数计算标准化值的误差函数近似值
    // 用 1 减去误差函数值，并将结果除以 2，得到最终的分位数
    return (1 - internalErf_(standardizedX)) / 2;
}

/**
 * 计算误差函数的反函数 erf⁻¹(x) 的近似值。
 * 误差函数的反函数是误差函数的逆运算，用于从给定的误差函数值反推自变量的值。
 * 
 * @param x - 输入值，误差函数反函数的自变量，取值范围通常在 -1 到 1 之间。
 * @returns 误差函数反函数 erf⁻¹(x) 的近似值。
 */
function internalErfInv_(x: number): number {
    // erf⁻¹ 函数是奇函数，即 erf⁻¹(-x) = -erf⁻¹(x)
    // 记录输入值的符号，后续将 x 转换为绝对值进行计算，最后再恢复符号
    const sign = x < 0 ? -1 : 1;
    // 定义一个常量 a，用于后续的多项式近似计算
    const a = 0.147;

    // 计算 1 - x² 的自然对数，这是中间计算步骤
    const log1x = Math.log(1 - x * x);
    // 计算中间变量 p1，它是根据公式 2 / (π * a) + log1x / 2 得到的
    const p1 = 2 / (Math.PI * a) + log1x / 2;
    // 计算 p1² - log1x / a 的平方根，这是另一个中间计算步骤
    const sqrtP1Log = Math.sqrt(p1 * p1 - log1x / a);
    // 根据公式计算最终结果，并恢复之前记录的符号
    return sign * Math.sqrt(sqrtP1Log - p1);
}
/**
 * 根据给定的分布曲线和分位数计算对应的特定值。
 * 该函数与 QUANTILE_AT_VALUE 函数相反，后者是根据特定值计算分位数，而此函数是根据分位数计算特定值。
 * 
 * @param curve - 分布曲线，包含 `podr`、`median` 和 `p10` 等信息。
 * @param quantile - 要计算对应值的分位数，取值范围通常在 0 到 1 之间。
 * @returns 分位数在分布曲线中对应的特定值。
 */
export function VALUE_AT_QUANTILE(curve: Curve, quantile): number {
    // 从分布曲线对象中解构出 podr、median 和 p10
    const { podr, median, p10 } = curve;

    // 定义一个临时变量 _podr，初始值为 podr
    let _podr = podr;
    // 如果 podr 不存在，则调用 derivePodrFromP10 函数根据 median 和 p10 计算 podr
    if (!podr) {
        _podr = derivePodrFromP10(median, p10);
    }

    // 计算中位数的自然对数，作为对数位置参数
    const location = Math.log(median);
    // 计算 _podr 与 median 比值的自然对数
    const logRatio = Math.log(_podr / median);
    // 根据 logRatio 计算形状参数 shape，用于描述分布的形状特征
    const shape = Math.sqrt(1 - 3 * logRatio - Math.sqrt((logRatio - 3) * (logRatio - 3) - 8)) / 2;

    // 计算 1 - 2 * quantile 的误差函数反函数值
    // 这里使用 internalErfInv_ 函数计算误差函数反函数的近似值
    // 再将结果乘以 shape 和 Math.SQRT2 后与对数位置参数 location 相加
    // 最后对这个和取指数得到最终的特定值
    return Math.exp(location + shape * Math.SQRT2 * internalErfInv_(1 - 2 * quantile));
}

/**
 * 根据中位数和第 10 百分位数推导 podr 值。
 * podr 通常代表某个分布中的一个特定分位数。
 * 此函数基于对数正态分布的特性，通过中位数和第 10 百分位数来计算 podr。
 * 
 * @param median - 数据分布的中位数。
 * @param p10 - 数据分布的第 10 百分位数，即有 10% 的数据小于该值。
 * @returns 推导得到的 podr 值。
 */
function derivePodrFromP10(median: number, p10: number): number {
    // 计算中位数的自然对数，作为对数均值 u
    // 假设数据在对数尺度上有特定分布，这里的 u 是分布的一个参数
    const u = Math.log(median);
    // 计算形状参数 shape
    // 先计算第 10 百分位数的自然对数与对数均值 u 的差值，并取绝对值
    // 再将该差值除以一个常量（Math.SQRT2 * 0.9061938024368232）得到 shape
    // shape 用于描述数据分布的特征，如宽窄程度
    const shape = Math.abs(Math.log(p10) - u) / (Math.SQRT2 * 0.9061938024368232);
    // 计算中间变量 inner1
    // 先计算 -3 乘以 shape
    // 再计算 4 加上 shape 的平方的平方根
    // 最后将两者相减得到 inner1
    const inner1 = -3 * shape - Math.sqrt(4 + shape * shape);
    // 计算并返回 podr 值
    // 先计算 (shape / 2) 乘以 inner1
    // 再将结果与对数均值 u 相加
    // 最后对这个和取指数得到最终的 podr 值
    return Math.exp(u + (shape / 2) * inner1);
}