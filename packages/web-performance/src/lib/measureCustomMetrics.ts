import { isPerformanceSupported } from '../utils/isSupported';


/**
 * 测量自定义的性能指标
 * @param customMetrics - 自定义的性能指标名称
 * @param markName - 性能标记的基础名称，用于构建起始和结束标记名
 * @returns 包含测量结果的 PerformanceEntry 对象，如果浏览器不支持性能测量则返回 undefined
 */
export const measure = (customMetrics: string, markName): PerformanceEntry | undefined => {
    if (!isPerformanceSupported()) {
        console.error('browser do not support performance');
        return;
    }

    performance.measure(customMetrics, `${markName}_start`, `${markName}_end`);

    return performance.getEntriesByName(customMetrics).pop();
};