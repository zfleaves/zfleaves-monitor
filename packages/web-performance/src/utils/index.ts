import { pathToRegexp } from 'path-to-regexp';

/**
 * 对给定的数字进行四舍五入，并保留指定的小数位数。
 *
 * @param num - 需要进行四舍五入的数字。
 * @param digits - 要保留的小数位数，默认为 4。
 * @returns 四舍五入后保留指定小数位数的数字。如果过程中出现错误，则返回原始数字。
 */
export const roundToDigits = (num: number, digits = 4) => {
    try {
        return parseFloat(num.toFixed(digits));
    } catch (error) {
        return num;
    }
}

/**
 * 将字节数转换为兆字节（MB），并对结果进行四舍五入处理。
 * 
 * @param bytes - 需要转换的字节数。
 * @returns 转换后的兆字节数，保留四位小数；如果传入的不是有效的数字，则返回 null。
 */
export const convertToMB = (bytes: number): number | null => {
    if (typeof bytes !== 'number') {
        return null;
    }

    return roundToDigits(bytes / Math.pow(1024, 2));
}

export const afterLoad = (callback) => {
    if (document.readyState === 'complete') {
        // 使用 requestAnimationFrame 替代 setTimeout(0)，它会在浏览器下次重绘之前执行回调，性能更好
        requestAnimationFrame(callback);
        // setTimeout(callback, 0);
    } else {
        addEventListener('pageshow', callback);
    }
}

export const beforeUnload = (callback) => {
    window.addEventListener('beforeunload', callback);
};

export const unload = (callback) => {
    window.addEventListener('unload', callback);
};

export const validNumber = (nums: number | Array<number>) => {
    if (Array.isArray(nums)) {
        return nums.every((n) => n >= 0);
    } else {
        return nums >= 0;
    }
};

/**
 * 检查数组 arr1 中的所有元素是否都包含在数组 arr2 中。
 * 
 * @param arr1 - 要检查的元素所在的数组。
 * @param arr2 - 被检查是否包含 arr1 元素的数组。
 * @returns 如果 arr1 中的所有元素都包含在 arr2 中，则返回 true；否则返回 false。
 */
export const isIncludeArr = (arr1: Array<string>, arr2: Array<string>): boolean => {
    // 检查输入数组是否为空或未定义
    if (!arr1 || arr1.length === 0 || !arr2 || arr2.length === 0) {
        return false;
    }

    if (arr1.length > arr2.length) {
        return false;
    }

    // 将 arr2 转换为 Set，以提高查找效率
    const set2 = new Set(arr2);

    // 遍历 arr1 中的每个元素
    for (let i = 0; i < arr1.length; i++) {
        // 如果 Set 中不包含当前元素，返回 false
        if (!set2.has(arr1[i])) {
            return false;
        }
    }

    return true;
};

/**
 * 判断两个字符串数组是否相等，不考虑元素顺序
 * @param arr1 - 第一个字符串数组
 * @param arr2 - 第二个字符串数组
 * @returns 如果两个数组包含相同的元素（不考虑顺序），则返回 true；否则返回 false
 */
export const isEqualArr = (arr1: Array<string>, arr2: Array<string>): boolean => {
    if (!arr1 || arr1.length === 0 || !arr2 || arr2.length === 0) {
        return false;
    }

    if (arr1.length !== arr2.length) {
        return false;
    }

    const sortArr1 = arr1.sort();
    const sortArr2 = arr2.sort();

    return sortArr1.join() === sortArr2.join();
};

export const getApiPath = (url: string): string => {
    const reg = /(?:http(?:s|):\/\/[^\/\s]+|)([^#?]+).*/;

    if (url) {
        return url.match(reg)?.[1];
    }
    return '';
};

/**
 * 检查目标字符串是否能匹配路径数组中的任意一个路径
 * @param paths - 路径字符串数组，每个字符串会被转换为正则表达式
 * @param target - 要检查的目标字符串
 * @returns 如果目标字符串匹配路径数组中的任意一个路径，返回 true；否则返回 false
 */
export const isExistPath = (paths: Array<string>, target: string) => {
    const regArr = paths.map((path) => pathToRegexp(path));

    for (let i = 0; i < regArr.length; i++) {
        if (regArr[i].exec(target)) {
            return true;
        }
    }

    return false;
};