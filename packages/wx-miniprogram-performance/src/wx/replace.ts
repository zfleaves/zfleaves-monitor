import Store from '../core/store';
import HandleEvents from './handleEvents';
import { WxPerformanceItemType, WxListenerTypes } from '../constant';
import { WxPerformanceAnyObj } from '../types/index';
import { utils } from "zfleaves-monitor-tools";
const { replaceOld, isEmptyObject } = utils;

/**
 * 替换原生的 App 函数，用于注入性能监控逻辑
 * @param {Store} store - 用于存储性能数据的 Store 实例
 */
export function replaceApp(store: Store) {
    // 检查全局的 App 函数是否存在，如果不存在则直接返回
    if (!App) return;
    // 保存原始的 App 函数
    const originApp = App;
    // 重写 App 函数
    App = function (appOptions: WechatMiniprogram.App.Option) {
        // 从 HandleEvents 对象中筛选出所有以 'App' 开头的方法名
        const methods = Object.keys(HandleEvents).filter((m) => m.indexOf('App') !== -1);
        // 遍历筛选出的方法名
        methods.forEach((method) => {
            // 使用 replaceOld 函数替换 appOptions 中的对应方法
            replaceOld(
                appOptions,
                // 将方法名中的 'AppOn' 替换为 'on'，以匹配小程序的生命周期方法名
                method.replace('AppOn', 'on'),
                // 定义一个包装函数，用于在原始方法执行后触发事件
                (originMethod: () => void) => {
                    return function (...args: any): void {
                        // 确保原始方法先执行，方便后续埋点判断是否重复
                        if (originMethod) {
                            originMethod.apply(this, args);
                        }
                        // 触发事件，将方法名作为事件类型，参数传递给事件处理函数
                        store.emit(method as WxPerformanceItemType, args);
                    };
                },
                // 指示是否覆盖原方法
                true,
            );
        });
        // 调用原始的 App 函数并返回结果
        return originApp(appOptions);
    } as WechatMiniprogram.App.Constructor;
}

/**
 * 替换页面生命周期方法，用于注入性能监控逻辑
 * @param {WechatMiniprogram.Page.Options | WechatMiniprogram.Component.MethodOption} options - 页面或组件的配置选项
 * @param {Store} store - 用于存储性能数据的 Store 实例
 */
function replacePageLifeMethods(
    options:
        | WechatMiniprogram.Page.Options<
            WechatMiniprogram.Page.DataOption,
            WechatMiniprogram.Page.CustomOption
        >
        | WechatMiniprogram.Component.MethodOption,
    store: Store,
) {
    const pageLifeMethods = Object.keys(HandleEvents).filter((m) => m.indexOf('Page') !== -1);
    pageLifeMethods.forEach((method) => {
        replaceOld(
            options,
            method.replace('PageOn', 'on'),
            (originMethod: (args: any) => void) => {
                return function (...args: any[]): void {
                    store.emit(method as WxPerformanceItemType, args);
                    if (originMethod) {
                        return originMethod.apply(this, args);
                    }
                }
            },
            true,
        )
    })
}

/**
 * 替换页面或组件选项中的事件处理函数，用于注入性能监控逻辑
 * @param {WechatMiniprogram.Page.Options | WechatMiniprogram.Component.MethodOption} options - 页面或组件的配置选项
 * @param {Store} store - 用于存储性能数据的 Store 实例
 */
function replaceAction(
    options:
        | WechatMiniprogram.Page.Options<
            WechatMiniprogram.Page.DataOption,
            WechatMiniprogram.Page.CustomOption
        >
        | WechatMiniprogram.Component.MethodOption,
    store: Store,
) {
    const ListenerTypes = Object.keys(WxListenerTypes);
    if (options) {
        Object.keys(options).forEach((m) => {
            if ('function' !== typeof options[m]) return;
            replaceOld(
                options,
                m,
                (originMethod: (args: any) => void) => {
                    return function (...args: any[]): void {
                        const event = args.find((arg) => arg && arg.type && arg.currentTarget);
                        if (event && !event.monitorWorked && ListenerTypes.indexOf(event.type) > -1) {
                            store.emit(WxListenerTypes[event.type] as WxPerformanceItemType, event);
                            event.monitorWorked = true;
                        }
                        return originMethod.apply(this, args);
                    };
                },
                true,
            )
        })
    }
}

/**
 * 替换原生的 Page 函数，用于注入性能监控逻辑
 * @param {Store} store - 用于存储性能数据的 Store 实例
 */
export function replacePage(store: Store) {
    if (!Page) {
        return;
    }
    const originPage = Page;
    Page = function (pageOptions): WechatMiniprogram.Page.Constructor {
        // 调用 replacePageLifeMethods 函数，替换页面生命周期方法
        replacePageLifeMethods(pageOptions, store);
        // 调用 replaceAction 函数，替换页面或组件选项中的事件处理函数
        replaceAction(pageOptions, store);
        // 调用原始的 Page 函数并返回结果
        return originPage.call(this, pageOptions);
    };
}

/**
 * 替换原生的 Component 函数，用于注入性能监控逻辑
 * @param {Store} store - 用于存储性能数据的 Store 实例
 */
export function replaceComponent(store: Store) {
    if (!Component) return;

    const originComponent = Component;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    Component = function (componentOptions): WechatMiniprogram.Component.Constructor {
        // 检查组件选项中的 methods 对象是否为空
        if (!isEmptyObject(componentOptions.methods)) {
            // 调用 replacePageLifeMethods 函数，替换组件生命周期方法
            replacePageLifeMethods(componentOptions.methods, store);
            // 调用 replaceAction 函数，替换组件选项中的事件处理函数
            replaceAction(componentOptions, store);
        }
        // 调用原始的 Component 函数并返回结果
        return originComponent.call(this, componentOptions);
    };
}

/**
 * 替换小程序网络请求相关的方法，用于注入性能监控逻辑
 * @param {Store} store - 用于存储性能数据的 Store 实例
 */
export function replaceNetwork(store: Store) {
    const HOOKS = {
        request: WxPerformanceItemType.WxRequest,
        downloadFile: WxPerformanceItemType.WxDownloadFile,
        uploadFile: WxPerformanceItemType.WxUploadFile,
    };
    Object.keys(HOOKS).forEach((hook) => {
        const originRequest = wx[hook];
        Object.defineProperty(wx, hook, {
            writable: true,
            enumerable: true,
            configurable: true,
            value(...args: any[]) {
                const options:
                    | WechatMiniprogram.RequestOption
                    | WechatMiniprogram.DownloadFileOption
                    | WechatMiniprogram.UploadFileOption = args[0];
                const { url } = options;
                if (store.filterUrl(url)) {
                    return originRequest.call(this, options);
                }

                let reqData = {
                    startTime: Date.now(),
                    header: options.header || {},
                    url: options.url,
                } as WxPerformanceAnyObj;
                switch (hook) {
                    case 'request':
                        const { method } = options as WechatMiniprogram.RequestOption;
                        reqData = { ...reqData, method };
                        break;
                    case 'downloadFile':
                    case 'uploadFile':
                        const { filePath } = options as
                            | WechatMiniprogram.DownloadFileOption
                            | WechatMiniprogram.UploadFileOption;
                        reqData = { ...reqData, filePath, method: hook === 'downloadFile' ? 'GET' : 'POST' };
                        break;
                    default:
                        break;
                }

                const originFail = options.fail;
                const _fail:
                    | WechatMiniprogram.RequestFailCallback
                    | WechatMiniprogram.DownloadFileFailCallback
                    | WechatMiniprogram.UploadFileFailCallback = function (err) {
                        // 系统和网络层面的失败
                        const endTime = Date.now();
                        reqData.duration = endTime - reqData.startTime;
                        reqData.status = 0;
                        reqData.errMsg = err.errMsg;
                        reqData.endTime = endTime;
                        store.emit(HOOKS[hook], reqData);
                        if (typeof originFail === 'function') {
                            return originFail(err);
                        }
                    };

                const originSuccess = options.success;
                const _success:
                    | WechatMiniprogram.RequestSuccessCallback
                    | WechatMiniprogram.DownloadFileSuccessCallback
                    | WechatMiniprogram.UploadFileFailCallback = function (res) {
                        const endTime = Date.now();
                        reqData.duration = endTime - reqData.startTime;
                        reqData.status = res.statusCode;
                        reqData.errMsg = res.errMsg;
                        reqData.endTime = endTime;

                        store.emit(HOOKS[hook], reqData);
                        if (typeof originSuccess === 'function') {
                            return originSuccess(res);
                        }
                    };

                return originRequest.call(this, {
                    ...options,
                    success: _success,
                    fail: _fail,
                });
            },
        });
    });
}