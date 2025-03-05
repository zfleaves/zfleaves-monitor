import {
    _global,
    on,
    off,
    getTimestamp,
    replaceOld,
    throttle,
    getLocationHref,
    isExistProperty,
    variableTypeDetection,
    supportsHistory,
} from 'zfleaves-monitor-utils';
import {
    transportData,
    options,
    setTraceId,
    triggerHandlers,
    ReplaceHandler,
    subscribeEvent,
} from 'zfleaves-monitor-core';
import { EMethods, MonitorHttp, MonitorXMLHttpRequest } from 'zfleaves-monitor-type';
import { voidFun, EventTypes, HttpTypes, HttpCodes } from 'zfleaves-monitor-shared';

/**
 * 判断给定的 URL 是否需要被过滤
 * @param url - 待判断的 URL 字符串
 * @returns 如果 URL 需要被过滤则返回 true，否则返回 false
 */
function isFilterHttpUrl(url: string) {
    return options.filterXhrUrlRegExp && options.filterXhrUrlRegExp.test(url);
}

function replace(type: EventTypes) {
    switch (type) {
        case EventTypes.XHR:
            xhrReplace();
            break;
        case EventTypes.FETCH:
            fetchReplace();
            break;
        case EventTypes.ERROR:
            listenError();
            break;
        case EventTypes.CONSOLE:
            consoleReplace();
            break;
        case EventTypes.HISTORY:
            historyReplace();
            break;
        case EventTypes.UNHANDLEDREJECTION:
            unhandledrejectionReplace();
            break;
        case EventTypes.DOM:
            domReplace();
            break;
        case EventTypes.HASHCHANGE:
            listenHashchange();
            break;
        default:
            break;
    }
}

export function addReplaceHandler(handler: ReplaceHandler) {
    if (!subscribeEvent(handler)) return;
    replace(handler.type as EventTypes);
}
/**
 * 替换 XMLHttpRequest 的原生方法，用于监控 XHR 请求
 * 此函数会重写 XMLHttpRequest 的 open 和 send 方法，以收集请求和响应信息
 * @returns {void}
 */
function xhrReplace(): void {
    if (!('XMLHttpRequest' in _global)) return;
    const originalXhrProto = XMLHttpRequest.prototype;
    replaceOld(originalXhrProto, 'open', (originalOpen: voidFun): voidFun => {
        return function (this: MonitorXMLHttpRequest, ...args: any[]): void {
            this.monitor_xhr = {
                method: variableTypeDetection.isString(args[0]) ? args[0].toUpperCase() : '',
                url: args[1],
                sTime: getTimestamp(),
                type: HttpTypes.XHR,
            }
            originalOpen.apply(this, args);
        }
    })
    replaceOld(originalXhrProto, 'send', (originalSend: voidFun): voidFun => {
        return function (this: MonitorXMLHttpRequest, ...args: any[]): void {
            const { method, url } = this.monitor_xhr;
            setTraceId(url, (headerFieldName: string, traceId: string) => {
                this.monitor_xhr.traceId = traceId;
                this.setRequestHeader(headerFieldName, traceId);
            })
            options.beforeAppAjaxSend && options.beforeAppAjaxSend({ method, url }, this);
            on(this, 'loadend', function (this: MonitorXMLHttpRequest) {
                if (
                    (method === EMethods.Post && transportData.isSdkTransportUrl(url)) ||
                    isFilterHttpUrl(url)
                )
                    return;
                const { responseType, response, status } = this;
                this.monitor_xhr.reqData = args[0];
                const eTime = getTimestamp();
                this.monitor_xhr.time = this.monitor_xhr.sTime;
                this.monitor_xhr.status = status;
                if (['', 'json', 'text'].indexOf(responseType) !== -1) {
                    this.monitor_xhr.responseText =
                        typeof response === 'object' ? JSON.stringify(response) : response;
                }
                this.monitor_xhr.elapsedTime = eTime - this.monitor_xhr.sTime;
                triggerHandlers(EventTypes.XHR, this.monitor_xhr);
            });
            originalSend.apply(this, args);
        }
    })
}

/**
 * 替换全局的 fetch 方法，用于监控 fetch 请求
 * 此函数会重写全局的 fetch 方法，以收集请求和响应信息
 * @returns {void}
 */
function fetchReplace(): void {
    if (!('fetch' in _global)) return;
    replaceOld(_global, EventTypes.FETCH, (originalFetch: voidFun) => {
        return function (url: string, config: Partial<Request> = {}): void {
            const sTime = getTimestamp();
            const method = (config && config.method).toUpperCase() || EMethods.Get;
            let handlerData: MonitorHttp = {
                type: HttpTypes.FETCH,
                method,
                reqData: config && config.body,
                url,
            };
            const headers = new Headers(config.headers || {});
            Object.assign(headers, {
                setRequestHeader: headers.set,
            });
            setTraceId(url, (headerFieldName: string, traceId: string) => {
                handlerData.traceId = traceId;
                headers.set(headerFieldName, traceId);
            });
            options.beforeAppAjaxSend && options.beforeAppAjaxSend({ method, url }, headers);
            config = {
                ...config,
                headers,
            };

            return originalFetch.apply(_global, [url, config]).then(
                (res: Response) => {
                    const tempRes = res.clone();
                    const eTime = getTimestamp();
                    handlerData = {
                        ...handlerData,
                        elapsedTime: eTime - sTime,
                        status: tempRes.status,
                        // statusText: tempRes.statusText,
                        time: sTime,
                    };
                    tempRes.text().then((data) => {
                        if (method === EMethods.Post && transportData.isSdkTransportUrl(url)) return;
                        if (isFilterHttpUrl(url)) return;
                        handlerData.responseText = tempRes.status > HttpCodes.UNAUTHORIZED && data;
                        triggerHandlers(EventTypes.FETCH, handlerData);
                    });
                    return res;
                },
                (err: Error) => {
                    const eTime = getTimestamp();
                    if (method === EMethods.Post && transportData.isSdkTransportUrl(url)) return;
                    if (isFilterHttpUrl(url)) return;
                    handlerData = {
                        ...handlerData,
                        elapsedTime: eTime - sTime,
                        status: 0,
                        // statusText: err.name + err.message,
                        time: sTime,
                    };
                    triggerHandlers(EventTypes.FETCH, handlerData);
                    throw err;
                },
            );
        };
    });
}

/**
 * 监听全局错误事件，当全局发生错误时触发相应的处理逻辑
 * 此函数通过监听全局对象的错误事件，将错误信息传递给事件处理函数
 * @returns {void}
 */
function listenError(): void {
    on(
        _global,
        EventTypes.ERROR,
        function (e: ErrorEvent) {
            triggerHandlers(EventTypes.ERROR, e);
        },
        true,
    );
}

/**
 * 监听全局的 hashchange 事件
 * 此函数会检查全局对象是否支持 onpopstate 属性，如果不支持则监听 hashchange 事件
 * 当 hashchange 事件触发时，调用 triggerHandlers 函数处理该事件
 * @returns {void}
 */
function listenHashchange(): void {
    if (!isExistProperty(_global, 'onpopstate')) {
        on(_global, EventTypes.HASHCHANGE, function (e: HashChangeEvent) {
            triggerHandlers(EventTypes.HASHCHANGE, e);
        });
    }
}

/**
 * 替换全局 console 对象的部分方法，用于监控 console 输出
 * 此函数会重写 console 的 log、debug、info、warn、error、assert 方法，
 * 在调用这些方法时触发事件处理逻辑，并保留原有的 console 方法功能
 * @returns {void}
 */
function consoleReplace(): void {
    if (!('console' in _global)) return;
    const logType = ['log', 'debug', 'info', 'warn', 'error', 'assert'];
    logType.forEach(function (level: string): void {
        if (!(level in _global.console)) return;
        replaceOld(_global.console, level, (originalConsole: () => any): voidFun => {
            return function (...args: any[]): void {
                if (originalConsole) {
                    triggerHandlers(EventTypes.CONSOLE, { args, level });
                    originalConsole.apply(_global.console, args);
                }
            };
        });
    });
}

// last time route
let lastHref: string;
lastHref = getLocationHref();
/**
 * 替换浏览器历史记录操作相关的方法，用于监控页面路由变化
 * 此函数会重写 onpopstate 事件处理函数以及 history 对象的 pushState 和 replaceState 方法，
 * 当页面路由发生变化时，触发相应的事件处理逻辑
 * @returns {void}
 */
function historyReplace(): void {
    if (!supportsHistory()) return;
    const oldOnpopstate = _global.onpopstate;
    _global.onpopstate = function (this: WindowEventHandlers, ...args: any[]): any {
        const to = getLocationHref();
        const from = lastHref;
        lastHref = to;
        triggerHandlers(EventTypes.HISTORY, { from, to });
        oldOnpopstate && oldOnpopstate.apply(this, args);
    }
    function historyReplaceFn(originalHistoryFn: voidFun): voidFun {
        return function (this: History, ...args: any[]): void {
            const url = args.length > 2 ? args[2] : undefined;
            if (url) {
                const from = lastHref;
                const to = String(url);
                lastHref = to;
                triggerHandlers(EventTypes.HISTORY, { from, to });
            }
            return originalHistoryFn.apply(this, args);
        }
    }
    replaceOld(_global.history, 'pushState', historyReplaceFn);
    replaceOld(_global.history, 'replaceState', historyReplaceFn);
}

/**
 * 替换未处理的 Promise 拒绝事件处理逻辑，用于监控未处理的 Promise 拒绝情况
 * 此函数会监听全局的未处理 Promise 拒绝事件，并在事件触发时调用 triggerHandlers 函数进行处理
 * @returns {void}
 */
function unhandledrejectionReplace(): void {
    on(_global, EventTypes.UNHANDLEDREJECTION, function (ev: PromiseRejectionEvent) {
        // ev.preventDefault() 阻止默认行为后，控制台就不会再报红色错误
        triggerHandlers(EventTypes.UNHANDLEDREJECTION, ev);
    });
}

/**
 * 替换 DOM 事件处理逻辑，用于监控 DOM 事件（如点击事件）
 * 此函数会监听 document 对象的点击事件，并对事件处理进行节流，同时保留了监听 keypress 事件的代码框架（目前被注释）
 * @returns {void}
 */
function domReplace(): void {
    if (!('document' in _global)) return;
    const clickThrottle = throttle(triggerHandlers, options.throttleDelayTime);
    on(
        _global.document,
        'click',
        function () {
            clickThrottle(EventTypes.DOM, {
                category: 'click',
                data: this,
            });
        },
        true,
    );
    // 暂时不需要keypress的重写
    // on(
    //   _global.document,
    //   'keypress',
    //   function (e: MonitorElement) {
    //     keypressThrottle('dom', {
    //       category: 'keypress',
    //       data: this
    //     })
    //   },
    //   true
    // )
}