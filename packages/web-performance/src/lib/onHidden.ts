import { OnHiddenCallback } from "../types";

/**
 * 监听页面隐藏或页面卸载事件，并在满足特定条件时执行回调函数
 * @param cb - 当满足特定条件时要执行的回调函数
 * @param once - 可选参数，若为 true，则回调函数仅执行一次，之后移除事件监听器
 */
export const onHidden = (cb: OnHiddenCallback, once?: boolean) => {
    const onHiddenOrPageHide = (event: Event) => {
        if (event.type === 'pagehide' && document.visibilityState === 'visible') {
            cb(event);
            if (once) {
                removeEventListener('visibilitychange', onHiddenOrPageHide, true);
                removeEventListener('pagehide', onHiddenOrPageHide, true);
            }
        }
    }
    addEventListener('visibilitychange', onHiddenOrPageHide, true);
    addEventListener('pagehide', onHiddenOrPageHide, true);
}