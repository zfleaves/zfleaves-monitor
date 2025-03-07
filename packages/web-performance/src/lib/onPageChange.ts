import { OnPageChangeCallback } from "../types";
import { proxyHistory } from "./proxyHandler";

/**
 * 统一处理 URL，去除协议和主机部分，并对 URL 进行解码
 * @param href - 需要处理的 URL 字符串
 * @returns 处理后的 URL 字符串，去除了协议和主机部分并进行了解码
 */
const unifiedHref = (href) => {
    // 返回解码后的 URL，同时去除协议和主机部分
    return decodeURIComponent(href?.replace(`${location?.protocol}//${location?.host}`, ''));
};

const lastHref = unifiedHref(location?.href);

/**
 * 监听页面 URL 变化的函数，当 URL 变化时执行传入的回调函数
 * @param cb - 页面 URL 变化时要执行的回调函数
 */
export const onPageChange = (cb: OnPageChangeCallback) => {
    // 监听 hashchange 事件，当 URL 的 hash 值发生变化时触发回调
    window.addEventListener('hashchange', function (e) {
        cb(e);
    })

    // 监听 popstate 事件，当用户点击浏览器前进或后退按钮时触发回调
    window.addEventListener('popstate', function (e) {
        cb(e);
    });

    // 对 history 的 pushState 和 replaceState 方法进行代理
    proxyHistory((...args) => {
        // 获取当前操作的 URL 并进行统一处理
        const currentHref = unifiedHref(args?.[2]);
        // 比较当前 URL 和上一次的 URL，如果不同则触发回调
        if (lastHref !== currentHref) {
            cb();
        }
    });
}