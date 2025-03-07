import { PerformanceEntryHandler } from "../types";

/**
 * 创建并返回一个 PerformanceObserver 实例，用于观察特定类型的性能条目
 * @param type - 要观察的性能条目的类型，例如 'navigation'、'resource' 等
 * @param callback - 当观察到指定类型的性能条目时，调用此回调函数进行处理
 * @returns 若浏览器支持观察该类型的性能条目，返回 PerformanceObserver 实例；否则返回 undefined
 */
const observe = (
    type: string,
    callback: PerformanceEntryHandler,
): PerformanceObserver | undefined => {
    try {
        if (PerformanceObserver.supportedEntryTypes?.includes(type)) {
            const po: PerformanceObserver = new PerformanceObserver((l) => l.getEntries().map(callback));

            po.observe({ type, buffered: true });
            return po;
        }
    } catch (e) {
        throw e;
    }
}

export default observe;