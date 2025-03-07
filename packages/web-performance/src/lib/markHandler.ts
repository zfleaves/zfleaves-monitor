import { isPerformanceSupported } from "../utils/isSupported";

const hasMark = (markName: string) => {
    if (!isPerformanceSupported()) {
        console.error('browser do not support performance');
        return;
    }

    return performance.getEntriesByName(markName).length > 0;
};

/**
 * 获取指定名称的性能标记
 * @param markName - 要获取的性能标记的名称
 * @returns 如果浏览器支持性能 API，返回该标记的性能条目；否则返回 undefined
 */
const getMark = (markName: string) => {
    if (!isPerformanceSupported()) {
        console.error('browser do not support performance');
        return;
    }

    return performance.getEntriesByName(markName).pop();
};

/**
 * 设置一个新的性能标记
 * @param markName - 要设置的性能标记的名称
 */
const setMark = (markName: string): void | undefined => {
    if (!isPerformanceSupported()) {
        console.error('browser do not support performance');
        return;
    }

    performance.mark(markName);
};

/**
 * 清除指定名称的性能标记
 * @param markName - 要清除的性能标记的名称
 */
const clearMark = (markName: string): void | undefined => {
    if (!isPerformanceSupported()) {
        return;
    }

    performance.clearMarks(markName);
};

export { hasMark, getMark, setMark, clearMark };