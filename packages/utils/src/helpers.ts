import { IAnyObject, IntegrationError } from "zfleaves-monitor-type";
import { globalVar, HttpCodes, ErrorTypes } from "zfleaves-monitor-shared";
import { logger } from './logger';
import { nativeToString, variableTypeDetection } from './is';

export function getLocationHref(): string {
    if (typeof document === 'undefined' || document.location == null) return '';
    return document.location.href;
}

// 用到所有事件名称
type TotalEventName =
    | keyof GlobalEventHandlersEventMap
    | keyof XMLHttpRequestEventTargetEventMap
    | keyof WindowEventMap;

/**
* 添加事件监听器
*
* ../export
* ../param {{ addEventListener: Function }} target
* ../param {keyof TotalEventName} eventName
* ../param {Function} handler
* ../param {(boolean | Object)} options
* ../returns
*/
export function on(
    target: { addEventListener: Function },
    eventName: TotalEventName,
    handler: Function,
    options: boolean | unknown = false
): void {
    target.addEventListener(eventName, handler, options);
}

/**
* 移除事件监听器
* 
*../export
*../param {{ removeEventListener: Function }} target
*../param {keyof TotalEventName} eventName
*../param {Function} handler
*../param {(boolean | Object)} options
*../returns
*/
export function off(
    target: { removeEventListener: Function },
    eventName: TotalEventName,
    handler: Function,
    options: boolean | unknown = false
): void {
    target.removeEventListener(eventName, handler, options);
}

/**
 *
 * 重写对象上面的某个属性
 * ../param source 需要被重写的对象
 * ../param name 需要被重写对象的key
 * ../param replacement 以原有的函数作为参数，执行并重写原有函数
 * ../param isForced 是否强制重写（可能原先没有该属性）
 * ../returns void
 */
export function replaceOld<T extends (...args: any[]) => any>(
    source: IAnyObject,
    name: string,
    replacement: (original: T) => T,
    isForced = false,
): void {
    if (source === undefined || source === null) {
        throw new Error('source object cannot be undefined or null');
    }
    if (name in source || isForced) {
        const original = source[name] as T;
        const wrapped = replacement(original);
        if (typeof wrapped === 'function') {
            source[name] = wrapped;
        } else {
            throw new Error('replacement function must return a function');
        }
    }
}

/**
 * 用&分割对象，返回a=1&b=2
 * ../param obj 需要拼接的对象
 */

export function splitObjToQuery(obj: Record<string, unknown>): string {
    return Object.entries(obj).reduce((result, [key, value], index) => {
        if (index !== 0) {
            result += '&';
        }
        const valueStr =
            variableTypeDetection.isObject(value) || variableTypeDetection.isArray(value)
                ? JSON.stringify(value)
                : value;
        result += `${encodeURIComponent(key)}=${encodeURIComponent(String(valueStr))}`;
        return result;
    }, '');
}

export const defaultFunctionName = '<anonymous>';
/**
 * 需要获取函数名，匿名则返回<anonymous>
 * ../param {unknown} fn 需要获取函数名的函数本体
 * ../returns 返回传入的函数的函数名
 */
export function getFunctionName(fn: Function | null | undefined): string {
    if (!fn) {
        return defaultFunctionName;
    }
    return fn.name || defaultFunctionName;
}


// 函数防抖
/**
 *
 * ../param fn 需要防抖的函数
 * ../param delay 防抖的时间间隔
 * ../param isImmediate 是否需要立即执行，默认为false，第一次是不执行的
 * ../returns 返回一个包含防抖功能的函数
 */
export const debounce = <T extends (...args: any[]) => any>(
    fn: T,
    delay: number,
    isImmediate = false
): ((...args: Parameters<T>) => ReturnType<T>) => {
    if (delay < 0) {
        throw new Error('Delay must be a non-negative number');
    }
    let timer: ReturnType<typeof setTimeout> | null = null;
    return function (this: ThisParameterType<T>, ...args: Parameters<T>): ReturnType<T> {
        if (isImmediate) {
            const result = fn.apply(this, args);
            isImmediate = false;
            return result;
        }
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => {
            fn.apply(this, args);
        }, delay);
        return undefined as ReturnType<T>;
    };
};

// 函数节流
/**
 *
 * ../param fn 需要节流的函数
 * ../param delay 节流的时间间隔
 * ../returns 返回一个包含节流功能的函数
 */
export const throttle = <T extends (...args: any[]) => any>(
    fn: T,
    delay: number
): ((...args: Parameters<T>) => ReturnType<T>) => {
    if (delay < 0) {
        throw new Error('Delay must be a non-negative number');
    }
    let lastTime = 0;
    return function (this: ThisParameterType<T>, ...args: Parameters<T>): ReturnType<T> {
        const now = Date.now();
        if (now - lastTime >= delay) {
            lastTime = now;
            return fn.apply(this, args);
        }
        return undefined as ReturnType<T>;
    };
}

/**
 * 获取当前的时间戳
 * ../returns 返回当前时间戳
 */
export function getTimestamp(): number {
    return Date.now();
}

export function typeofAny(target: any, type: string): boolean {
    const targetType = typeof target;
    if (targetType === type) {
        return true;
    }
    // 处理数组和 null 的特殊情况
    if (type === 'array') {
        return Array.isArray(target);
    }
    if (type === 'null') {
        return target === null;
    }
    return false;
}

/**
 * 使用 Object.prototype.toString 方法判断目标值的类型是否与指定类型字符串匹配
 * @param target 要检查类型的目标值
 * @param type 期望的类型字符串，格式为 '[object 类型名]'
 * @returns 如果类型匹配返回 true，否则返回 false
 */
export function toStringAny(target: any, type: string): boolean {
    if (!/^\[object \w+\]$/.test(type)) {
        throw new Error('传入的类型字符串格式不正确，应为 [object 类型名]');
    }
    return nativeToString.call(target) === type;
}


//选中的代码定义了一个名为 validateOption 的函数，其主要功能是验证传入的目标值 target 是否为期望的类型 expectType
// ，并在不满足条件时记录错误日志
export function validateOption(target: any, targetName: string, expectType: string): boolean {
    if (typeofAny(target, expectType)) return true;
    typeof target !== 'undefined' &&
        logger.error(`${targetName}期望传入${expectType}类型，目前是${typeof target}类型`);
    return false;
}

/**
 * 使用 Object.prototype.toString 方法验证目标值的类型是否与期望类型匹配
 * @param target 要验证类型的目标值
 * @param targetName 目标值的名称，用于错误日志
 * @param expectType 期望的类型，格式为 '[object 类型名]'
 * @returns 如果类型匹配返回 true，否则返回 false
 */
export function toStringValidateOption(
    target: any,
    targetName: string,
    expectType: string,
): boolean {
    if (!/^\[object \w+\]$/.test(expectType)) {
        throw new Error('传入的期望类型字符串格式不正确，应为 [object 类型名]');
    }
    if (toStringAny(target, expectType)) return true;
    typeof target !== 'undefined' &&
        logger.error(
            `${targetName}期望传入${expectType}类型，目前是${nativeToString.call(target)}类型`,
        );
    return false;
}

export function silentConsoleScope(callback: Function) {
    globalVar.isLogAddBreadcrumb = false;
    callback();
    globalVar.isLogAddBreadcrumb = true;
}

export function generateUUID(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    // Set version bits to 4 (0100)
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    // Set variant bits to RFC 4122 (10xx)
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hexParts: string[] = [];
    for (let i = 0; i < bytes.length; i++) {
        hexParts.push(bytes[i].toString(16).padStart(2, '0'));
    }
    const hexString = hexParts.join('');
    return [
        hexString.substr(0, 8),
        hexString.substr(8, 4),
        hexString.substr(12, 4),
        hexString.substr(16, 4),
        hexString.substr(20, 12),
    ].join('-');
}

export function unknownToString(target: unknown): string {
    if (variableTypeDetection.isString(target)) {
        return target as string;
    }
    if (variableTypeDetection.isUndefined(target)) {
        return 'undefined';
    }
    if (variableTypeDetection.isNumber(target)) {
        return String(target);
    }
    if (variableTypeDetection.isBoolean(target)) {
        return String(target);
    }
    if (variableTypeDetection.isNull(target)) {
        return 'null';
    }
    return JSON.stringify(target);
}

export function getBigVersion(version: string) {
    return Number(version.split('.')[0]);
}


export function isHttpFail(code: number) {
    return code === 0 || code === HttpCodes.BAD_REQUEST || code > HttpCodes.UNAUTHORIZED;
}
/**
 * 给url添加query
 * @param url
 * @param query
 */
export function setUrlQuery(url: string, query: Record<string, string>) {
    const queryArr = [];
    Object.keys(query).forEach((k) => {
        queryArr.push(`${k}=${query[k]}`);
    });
    if (url.indexOf('?') !== -1) {
        url = `${url}&${queryArr.join('&')}`;
    } else {
        url = `${url}?${queryArr.join('&')}`;
    }
    return url;
}

export function interceptStr(str: string, interceptLength: number): string {
    if (variableTypeDetection.isString(str)) {
        return (
            str.slice(0, interceptLength) +
            (str.length > interceptLength ? `:截取前${interceptLength}个字符` : '')
        );
    }
    return '';
}

/**
 * 获取wx当前route的方法
 * 必须是在进入Page或Component构造函数内部才能够获取到currentPages
 * 否则都是在注册Page和Component时执行的代码，此时url默认返回'App'
 */
export function getCurrentRoute(): string {
    if (!variableTypeDetection.isFunction(getCurrentPages)) {
        return ''
    }
    const pages = getCurrentPages(); // 在App里调用该方法，页面还没有生成，长度为0
    if (pages.length === 0) {
        return 'App';
    }
    const currentPage = pages.pop();
    return setUrlQuery(currentPage?.route || '', currentPage?.options || {});
}

/**
 * 解析字符串错误信息，返回message、name、stack
 * @param str error string
 */
export function parseErrorString(str: string): IntegrationError {
    const splitLine: string[] = str.split('\n');
    if (splitLine.length < 2) return null;
    if (splitLine[0].indexOf('MiniProgramError') !== -1) {
        splitLine.splice(0, 1);
    }
    const message = splitLine.splice(0, 1)[0];
    const name = splitLine.splice(0, 1)[0].split(':')[0];
    const stack = [];
    splitLine.forEach((errorLine: string) => {
        const regexpGetFun = /at\s+([\S]+)\s+\(/; // 获取 [ 函数名 ]
        const regexGetFile = /\(([^)]+)\)/; // 获取 [ 有括号的文件 , 没括号的文件 ]
        const regexGetFileNoParenthese = /\s+at\s+(\S+)/; // 获取 [ 有括号的文件 , 没括号的文件 ]

        const funcExec = regexpGetFun.exec(errorLine);
        let fileURLExec = regexGetFile.exec(errorLine);
        if (!fileURLExec) {
            // 假如为空尝试解析无括号的URL
            fileURLExec = regexGetFileNoParenthese.exec(errorLine);
        }

        const funcNameMatch = Array.isArray(funcExec) && funcExec.length > 0 ? funcExec[1].trim() : '';
        const fileURLMatch = Array.isArray(fileURLExec) && fileURLExec.length > 0 ? fileURLExec[1] : '';
        const lineInfo = fileURLMatch.split(':');
        stack.push({
            args: [], // 请求参数
            func: funcNameMatch || ErrorTypes.UNKNOWN_FUNCTION, // 前端分解后的报错
            column: Number(lineInfo.pop()), // 前端分解后的列
            line: Number(lineInfo.pop()), // 前端分解后的行
            url: lineInfo.join(':'), // 前端分解后的URL
        });
    })
    return {
        message,
        name,
        stack
    }
}

