import { metricsName } from "../constants";

/**
 * 定义性能指标的默认评分配置。
 * 每个指标都有一个中位数（median）和第 10 百分位数（p10）的阈值。
 */
const config: Record<string, any> = {
    /**
     * 首次绘制（First Paint）指标的配置。
     *  - median: 中位数阈值，单位为毫秒。
     *  - p10: 第 10 百分位数阈值，单位为毫秒。
     */
    [metricsName.FP]: {
        median: 3000, // 首次绘制时间的中位数阈值
        p10: 1800,    // 首次绘制时间的第 10 百分位数阈值
    },
    /**
     * 首次内容绘制（First Contentful Paint）指标的配置。
     *  - median: 中位数阈值，单位为毫秒。
     *  - p10: 第 10 百分位数阈值，单位为毫秒。
     */
    [metricsName.FCP]: {
        median: 3000, // 首次内容绘制时间的中位数阈值
        p10: 1800,    // 首次内容绘制时间的第 10 百分位数阈值
    },
    /**
     * API 完成时间（API Complete Time）指标的配置。
     *  - median: 中位数阈值，单位为毫秒。
     *  - p10: 第 10 百分位数阈值，单位为毫秒。
     */
    [metricsName.ACT]: {
        median: 3500, // API 完成时间的中位数阈值
        p10: 2300,    // API 完成时间的第 10 百分位数阈值
    },
    /**
     * 最大内容绘制（Largest Contentful Paint）指标的配置。
     *  - median: 中位数阈值，单位为毫秒。
     *  - p10: 第 10 百分位数阈值，单位为毫秒。
     */
    [metricsName.LCP]: {
        median: 4000, // 最大内容绘制时间的中位数阈值
        p10: 2500,    // 最大内容绘制时间的第 10 百分位数阈值
    },
    /**
     * 自定义内容绘制（Custom Contentful Paint）指标的配置。
     *  - median: 中位数阈值，单位为毫秒。
     *  - p10: 第 10 百分位数阈值，单位为毫秒。
     */
    [metricsName.CCP]: {
        median: 4000, // 自定义内容绘制时间的中位数阈值
        p10: 2500,    // 自定义内容绘制时间的第 10 百分位数阈值
    },
    /**
     * 首次输入延迟（First Input Delay）指标的配置。
     *  - median: 中位数阈值，单位为毫秒。
     *  - p10: 第 10 百分位数阈值，单位为毫秒。
     */
    [metricsName.FID]: {
        median: 300,  // 首次输入延迟时间的中位数阈值
        p10: 100,     // 首次输入延迟时间的第 10 百分位数阈值
    },
    /**
     * 累积布局偏移（Cumulative Layout Shift）指标的配置。
     *  - median: 中位数阈值，无单位。
     *  - p10: 第 10 百分位数阈值，无单位。
     */
    [metricsName.CLS]: {
        median: 0.25, // 累积布局偏移的中位数阈值
        p10: 0.1,     // 累积布局偏移的第 10 百分位数阈值
    },
};

export default config;