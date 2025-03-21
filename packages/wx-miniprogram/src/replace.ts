import {
    WxAppEvents,
    WxPageEvents,
    WxRouterEvents,
    WxEvents,
    EventTypes,
    HttpTypes,
    voidFun,
} from "zfleaves-monitor-shared";
import { getNavigateBackTargetUrl } from './utils';
import { EListenerTypes } from './constant';
import { MiniRoute } from './types';
import { HandleWxAppEvents, HandleWxPageEvents } from './handleWxEvents';
import { core, utils, types } from "zfleaves-monitor-tools";
const {
    options: sdkOptions,
    setTraceId,
    subscribeEvent,
    transportData,
    triggerHandlers,
} = core;
const {
    getTimestamp,
    replaceOld,
    throttle,
    getFlag,
    isEmptyObject,
    variableTypeDetection,
    getCurrentRoute,
} = utils;

function isFilterHttpUrl(url: string) {
    return sdkOptions.filterXhrUrlRegExp && sdkOptions.filterXhrUrlRegExp.test(url);
}

function replace(type: WxEvents | EventTypes) {
    switch (type) {
        case EventTypes.CONSOLE:
            replaceConsole();
            break;
        case EventTypes.XHR:
            replaceNetwork();
            break;
        case EventTypes.MINI_ROUTE:
            replaceRoute();
        default:
            break;
    }
}


export function addReplaceHandler(handler: core.ReplaceHandler) {
    if (!subscribeEvent(handler)) return;
    replace(handler.type as WxEvents);
}

/**
 * 替换小程序 App 方法，对小程序 App 的生命周期方法进行劫持和处理
 * 该函数会遍历指定的 App 生命周期方法，为每个方法添加替换处理逻辑
 * 并在原方法执行前后触发相应的钩子函数
 */
export function replaceApp() {
    // 检查全局 App 函数是否存在
    if (App) {
        // 保存原始的 App 函数
        const originApp = App;
        // 重写 App 函数
        App = function (appOptions: WechatMiniprogram.App.Option) {
            // 定义需要处理的 App 生命周期方法数组
            const methods = [
                WxAppEvents.AppOnLaunch,
                WxAppEvents.AppOnShow,
                WxAppEvents.AppOnError,
                WxAppEvents.AppOnUnhandledRejection,
                WxAppEvents.AppOnPageNotFound,
                WxAppEvents.AppOnHide,
            ];
            // 遍历每个方法
            methods.forEach(method => {
                // 检查该方法是否已经处理过，如果处理过则跳过
                if (getFlag(method)) return;
                // 添加替换处理逻辑
                addReplaceHandler({
                    // 回调函数，调用 HandleWxAppEvents 中对应的方法处理数据
                    callback: (data) => HandleWxAppEvents[method.replace('AppOn', 'on')](data),
                    // 事件类型
                    type: method,
                });
                // 替换原方法
                replaceOld(
                    appOptions,
                    // 将方法名中的 'AppOn' 替换为 'on'
                    method.replace('AppOn', 'on'),
                    (originMethod: voidFun) => {
                        return function (...args: any): void {
                            // 让原本的函数比抛出的hooks先执行，便于埋点判断是否重复
                            if (originMethod) {
                                originMethod.apply(this, args);
                            }
                            triggerHandlers.apply(null, [method, ...args]);
                        };
                    },
                    true,
                );
            })

            // 返回原始 App 函数的执行结果
            return originApp(appOptions);
        } as WechatMiniprogram.App.Constructor;
    }
}

const pageLifeMethods = [
    WxPageEvents.PageOnShow,
    WxPageEvents.PageOnHide,
    WxPageEvents.PageOnShareAppMessage,
    WxPageEvents.PageOnShareTimeline,
    WxPageEvents.PageOnTabItemTap,
    WxPageEvents.PageOnUnload,
];

/**
 * 替换页面生命周期方法
 * 该函数会遍历预设的页面生命周期方法列表，对传入的页面或组件选项中的对应方法进行替换
 * 替换后的方法会先触发相应的事件处理函数，然后再执行原有的生命周期方法
 * @param options - 页面或组件的选项对象，包含生命周期方法
 */
function replacePageLifeMethods(
    // 接收页面或组件的选项对象
    options:
        | WechatMiniprogram.Page.Options<
            WechatMiniprogram.Page.DataOption,
            WechatMiniprogram.Page.CustomOption
        >
        | WechatMiniprogram.Component.MethodOption,
) {
    pageLifeMethods.forEach((method) => {
        replaceOld(
            options,
            method.replace('PageOn', 'on'),
            (originMethod: (args: any) => void) => {
                return function (...args: any[]): void {
                    // 先触发相应的事件处理函数
                    triggerHandlers.apply(null, [method, ...args]);
                    // 如果原生命周期方法存在，则执行原方法
                    if (originMethod) {
                        return originMethod.apply(this, args);
                    }
                };
            },
            true,
        );
    });
}

export function replacePage() {
    if (!Page) {
        return;
    }
    const originPage = Page;

    pageLifeMethods.forEach((method) => {
        if (getFlag(method)) return;
        addReplaceHandler({
            callback: (data) => HandleWxPageEvents[method.replace('PageOn', 'on')](data),
            type: method,
        });
    });

    Page = function (pageOptions): WechatMiniprogram.Page.Constructor {
        replacePageLifeMethods(pageOptions);
        replaceAction(pageOptions);
        return originPage.call(this, pageOptions);
    }
}

/**
 * 替换小程序组件构造函数
 * 该函数用于重写小程序的 Component 构造函数，以支持对组件方法的替换和事件处理
 * 主要用于处理使用 Component 构造页面时的上报逻辑，重写组件方法中的生命周期函数和手势处理方法
 * @returns {void}
 */
export function replaceComponent() {
    if (!Component) {
        return;
    }

    const originComponent = Component;

    Component = function (componentOptions) {
        if (!isEmptyObject(componentOptions.methods)) {
            /*
             * 兼容用Component构造页面的上报
             * 当用Component构造页面时，页面的生命周期函数应写在methods定义段中，所以重写componentOptions.methods中的对应周期函数
             */
            replacePageLifeMethods(componentOptions.methods);
            replaceAction(componentOptions.methods);
        }
        return originComponent.call(this, componentOptions);
    } as WechatMiniprogram.Component.Constructor;
}

/**
 * 替换小程序 Behavior 构造函数
 * 该函数用于重写小程序的 Behavior 构造函数，以支持对 Behavior 方法的替换和事件处理
 * 主要用于处理使用 Behavior 时的手势行为监听逻辑，重写 Behavior 方法中的手势处理方法
 * @returns {void}
 */
export function replaceBehavior() {
    if (!Behavior) {
        return;
    }

    const originBehavior = Behavior;
    Behavior = function (behaviorOptions) {
        if (!isEmptyObject(behaviorOptions.methods)) {
            /*
             * 当使用Component直接构造页面时，用到的behavior中如果有onShow等页面生命周期函数是不会被触发的，所以只用监听手势行为
             */
            replaceAction(behaviorOptions.methods);
        }
        return originBehavior.call(this, behaviorOptions);
    } as WechatMiniprogram.Behavior.Constructor;
}

/**
 * 监听配置项下的手势处理方法
 */
function replaceAction(
    options:
        | WechatMiniprogram.Page.Options<
            WechatMiniprogram.Page.DataOption,
            WechatMiniprogram.Page.CustomOption
        >
        | WechatMiniprogram.Component.MethodOption,
): void {
    function gestureTrigger(e) {
        e.monitorWorked = true; // 给事件对象增加特殊的标记，避免被无限透传
        triggerHandlers(EventTypes.DOM, e);
    }

    const throttleGesturetrigger = throttle(gestureTrigger, sdkOptions.throttleDelayTime);

    const listenerTypes = [EListenerTypes.Touchmove, EListenerTypes.Tap];

    if (options) {
        Object.keys(options).forEach(m => {
            if ('function' !== typeof options[m]) {
                return;
            }
            replaceOld(
                options,
                m,
                (originMethod: (args: any) => void) => {
                    return function (...args: any): void {
                        const e = args[0];
                        if (e && e.type && e.currentTarget && !e.monitorWorked) {
                            if (listenerTypes.indexOf(e.type) > -1) {
                                throttleGesturetrigger(e);
                            }
                        }
                        return originMethod.apply(this, args);
                    };
                },
                true,
            )
        });
    }
}

/**
 * 替换控制台日志方法
 * 该函数会遍历控制台的日志方法（如 log、debug、info 等），并对其进行替换
 * 替换后的方法会在执行原日志方法前触发相应的事件处理函数
 */
function replaceConsole() {
    if (console && variableTypeDetection.isObject(console)) {
        const logType = ['log', 'debug', 'info', 'warn', 'error', 'assert'];
        logType.forEach((level: string) => {
            if (!(level in console)) return;
            replaceOld(console, level, (originalConsole) => {
                return function (...args: any[]): void {
                    if (originalConsole) {
                        triggerHandlers(EventTypes.CONSOLE, { args, level });
                        originalConsole.apply(console, args);
                    }
                };
            });
        })
    }
}

/**
 * 替换微信小程序的网络请求方法
 * 该函数会劫持微信小程序的 request、downloadFile 和 uploadFile 方法，在请求前后添加监控逻辑
 * 用于收集请求信息并触发事件处理函数，同时支持过滤特定 URL 和添加请求头信息
 * @returns {void}
 */
export function replaceNetwork() {
    const hookMethods = ['request', 'downloadFile', 'uploadFile'];
    hookMethods.forEach((hook) => {
        const originRequest = wx[hook];
        // 使用 Object.defineProperty 重写微信小程序的请求方法
        Object.defineProperty(wx, hook, {
            writable: true,
            enumerable: true,
            configurable: true,
            value(...args: any[]) {
                const options:
                    | WechatMiniprogram.RequestOption
                    | WechatMiniprogram.DownloadFileOption
                    | WechatMiniprogram.UploadFileOption = args[0];
                let method: string;

                if ((options as WechatMiniprogram.RequestOption).method) {
                    method = (options as WechatMiniprogram.RequestOption).method;
                } else if (hook === 'downloadFile') {
                    method = types.EMethods.Get;
                } else {
                    method = types.EMethods.Post;
                }
                const { url } = options;
                let { header } = options;
                !header && (header = {});

                if (
                    (method === types.EMethods.Post && transportData.isSdkTransportUrl(url)) ||
                    isFilterHttpUrl(url)
                ) {
                    return originRequest.call(this, options);
                }
                let reqData;
                if (hook === 'request') {
                    reqData = (options as WechatMiniprogram.RequestOption).data;
                } else if (hook === 'downloadFile') {
                    reqData = {
                        filePath: (options as WechatMiniprogram.DownloadFileOption).filePath,
                    };
                } else {
                    // uploadFile
                    reqData = {
                        filePath: (options as WechatMiniprogram.UploadFileOption).filePath,

                        name: (options as WechatMiniprogram.UploadFileOption).name,
                    };
                }
                const data: types.MonitorHttp = {
                    type: HttpTypes.XHR,
                    method,
                    url,
                    reqData,
                    sTime: getTimestamp(),
                };
                // 设置跟踪 ID 并添加到请求头中
                setTraceId(url, (headerFieldName, traceId) => {
                    data.traceId = traceId;
                    header[headerFieldName] = traceId;
                });
                function setRequestHeader(key: string, value: string) {
                    header[key] = value;
                }
                sdkOptions.beforeAppAjaxSend &&
                    sdkOptions.beforeAppAjaxSend({ method, url }, { setRequestHeader });

                const successHandler:
                    | WechatMiniprogram.RequestSuccessCallback
                    | WechatMiniprogram.DownloadFileSuccessCallback
                    | WechatMiniprogram.UploadFileFailCallback = function (res) {
                        const endTime = getTimestamp();
                        data.responseText =
                            (variableTypeDetection.isString(res.data) ||
                                variableTypeDetection.isObject(res.data)) &&
                            res.data;
                        data.elapsedTime = endTime - data.sTime;
                        data.status = res.statusCode;
                        data.errMsg = res.errMsg;
                        data.time = endTime;

                        triggerHandlers(EventTypes.XHR, data);
                        if (typeof options.success === 'function') {
                            return options.success(res);
                        }
                    };
                const _fail = options.fail;
                const failHandler:
                    | WechatMiniprogram.RequestFailCallback
                    | WechatMiniprogram.DownloadFileFailCallback
                    | WechatMiniprogram.UploadFileFailCallback = function (err) {
                        // 系统和网络层面的失败
                        const endTime = getTimestamp();
                        data.elapsedTime = endTime - data.sTime;
                        data.errMsg = err.errMsg;
                        data.status = 0;
                        triggerHandlers(EventTypes.XHR, data);
                        if (variableTypeDetection.isFunction(_fail)) {
                            return _fail(err);
                        }
                    };
                const actOptions = {
                    ...options,
                    success: successHandler,
                    fail: failHandler,
                };
                return originRequest.call(this, actOptions);
            },
        });
    });
}

/**
 * 替换小程序路由跳转方法
 * 该函数会遍历预设的路由跳转方法列表，对微信小程序的路由跳转方法进行替换
 * 替换后的方法会在执行路由跳转前后触发相应的事件处理函数，用于收集路由跳转信息
 * @returns {void}
 */
export function replaceRoute() {
    const methods = [
        WxRouterEvents.SwitchTab,
        WxRouterEvents.ReLaunch,
        WxRouterEvents.RedirectTo,
        WxRouterEvents.NavigateTo,
        WxRouterEvents.NavigateBack,
        WxRouterEvents.NavigateToMiniProgram,
    ];
    methods.forEach((method) => {
        const originMethod = wx[method] as Function;
        Object.defineProperty(wx, method, {
            writable: true,
            enumerable: true,
            configurable: true,
            value(
                options:
                    | WechatMiniprogram.SwitchTabOption
                    | WechatMiniprogram.ReLaunchOption
                    | WechatMiniprogram.RedirectToOption
                    | WechatMiniprogram.NavigateToOption
                    | WechatMiniprogram.NavigateBackOption
                    | WechatMiniprogram.NavigateToMiniProgramOption,
            ) {
                let toUrl;
                if (method === WxRouterEvents.NavigateBack) {
                    toUrl = getNavigateBackTargetUrl(
                        (options as WechatMiniprogram.NavigateBackOption)?.delta,
                    );
                } else {
                    toUrl = (options as WechatMiniprogram.SwitchTabOption).url;
                }
                const data = {
                    from: getCurrentRoute(),
                    to: toUrl,
                };
                triggerHandlers(EventTypes.MINI_ROUTE, data);
                if (
                    variableTypeDetection.isFunction(options.complete) ||
                    variableTypeDetection.isFunction(options.success) ||
                    variableTypeDetection.isFunction(options.fail)
                ) {
                    const _fail = options.fail;
                    const failHandler:
                        | WechatMiniprogram.SwitchTabFailCallback
                        | WechatMiniprogram.ReLaunchFailCallback
                        | WechatMiniprogram.RedirectToFailCallback
                        | WechatMiniprogram.NavigateToFailCallback
                        | WechatMiniprogram.NavigateBackFailCallback = function (res) {
                            const failData: MiniRoute = {
                                ...data,
                                isFail: true,
                                message: res.errMsg,
                            };
                            triggerHandlers(EventTypes.MINI_ROUTE, failData);
                            if (variableTypeDetection.isFunction(_fail)) {
                                return _fail(res);
                            }
                        };
                    options.fail = failHandler;
                }
                if (
                    method === WxRouterEvents.NavigateToMiniProgram &&
                    variableTypeDetection.isFunction(sdkOptions.wxNavigateToMiniProgram)
                ) {
                    options = sdkOptions.wxNavigateToMiniProgram(options);
                }
                return originMethod.call(this, options);
            }
        })
    });
}