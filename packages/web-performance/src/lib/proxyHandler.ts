/**
 * 对 XMLHttpRequest 的 open 方法进行代理，在请求前后执行自定义处理函数
 * @param beforeHandler - 请求发送前执行的处理函数
 * @param afterHandler - 请求结束后执行的处理函数
 */
function proxyXhr(
    beforeHandler: (...args: Array<any>) => void,
    afterHandler: (...args: Array<any>) => void,
): void {
    // 检查浏览器是否支持 XMLHttpRequest 且未进行过代理
    if ('XMLHttpRequest' in window && !window.__monitor_xhr__) {
        const origin = window.XMLHttpRequest;
        const originOpen = origin.prototype.open;
        // 设置代理标志
        window.__monitor_xhr__ = true;
        origin.prototype.open = function (this: XMLHttpRequest, ...args: Array<any>) {
            beforeHandler && beforeHandler(args[1]);
            // 调用原始的 open 方法
            originOpen.apply(this, args);
            // 监听请求结束事件
            this.addEventListener('loadend', () => {
                afterHandler && afterHandler(args[1]);
            });
        };
    }
}

/**
 * 对 window.fetch 方法进行代理，在请求前后执行自定义处理函数
 * @param beforeHandler - 请求发送前执行的处理函数
 * @param afterHandler - 请求结束后执行的处理函数
 */
function proxyFetch(
    beforeHandler: (...args: Array<any>) => void,
    afterHandler: (...args: Array<any>) => void,
): void {
    // 检查浏览器是否支持 fetch API 且未进行过代理
    if ('fetch' in window && !window.__monitor_fetch__) {
        const origin = window.fetch;
        // 设置代理标志
        window.__monitor_fetch__ = true;
        // 重写 window.fetch 方法
        window.fetch = function (resource: string, init: Partial<Request>) {
            beforeHandler && beforeHandler(resource);
            return origin.call(window, resource, init).then(
                (res: Response) => {
                    afterHandler && afterHandler(resource, init);
                    return res;
                },
                (err: Error) => {
                    return err;
                }
            )
        }
    }
}

/**
 * 对 window.history 的 pushState 和 replaceState 方法进行代理
 * 当调用这两个方法时，会执行传入的处理函数
 * @param handler - 处理函数，在 pushState 或 replaceState 调用时执行
 */
function proxyHistory(handler: (...args: Array<any>) => void) {
   if (window.history) {
        const originPushState = history.pushState;
        const originReplaceState = history.replaceState;

        history.pushState = function (...args: Array<any>) {
            handler && handler(...args, 'pushState');
            originPushState.apply(history, args);
        };

        history.replaceState = function (...args: Array<any>) {
            handler && handler(...args, 'replaceState');
            originReplaceState.apply(history, args); 
        }
   } 
}

export { proxyXhr, proxyFetch, proxyHistory };