import { setUrlQuery, variableTypeDetection, generateUUID } from "zfleaves-monitor-utils";
import { STORAGE_KEY } from '../constant';

/**
 * 空函数，不执行任何操作
 * 通常用于占位或作为默认回调函数
 * @returns {void}
 */
export function noop() { }

/**
 * 获取设备 ID
 * 该函数会尝试从本地存储中获取设备 ID，如果未找到则生成一个新的 UUID 作为设备 ID 并存储到本地
 * @returns {string} 设备 ID
 */
export function getDeviceId(): string {
    let deviceId: string = wx.getStorageSync(STORAGE_KEY.deviceId);
    if (!deviceId) {
        deviceId = generateUUID();
        wx.setStorageSync(STORAGE_KEY.deviceId, deviceId);
    }
    return deviceId;
}

/**
 * 获取当前页面的 URL
 * @param {boolean} [setQuery=true] - 是否将页面参数添加到 URL 中，默认为 true
 * @returns {string} 当前页面的 URL，如果无法获取则返回空字符串或 'App'
 */
export function getPageUrl(setQuery = true): string {
    if (!variableTypeDetection.isFunction(getCurrentPages)) return '';

    const pages = getCurrentPages(); // 在App里调用该方法，页面还没有生成，长度为0
    if (pages.length === 0) return 'App';

    const page = pages[pages.length - 1];
    return setQuery ? setUrlQuery(page.route, page.options) : page.route;
}