import { BreadCrumbTypes, ErrorTypes } from "zfleaves-monitor-shared";
import { getWxMiniDeviceInfo, targetAsString } from "./utils";
import {
    MiniRoute,
    WxLifeCycleBreadcrumb,
    WxOnShareAppMessageBreadcrumb,
    WxOnTabItemTapBreadcrumb,
} from './types';
import { EListenerTypes } from './constant';
import { core, utils, types } from "zfleaves-monitor-tools";
const { breadcrumb, handleConsole, httpTransform, transportData, options: sdkOptions } = core;
const {
    extractErrorStack, 
    getCurrentRoute, 
    getTimestamp, 
    isError, isHttpFail, 
    parseErrorString, 
    unknownToString, 
    _support, 
    Severity,
} = utils;

const HandleWxAppEvents = {
    /**
    * 处理微信小程序 App 的 onLaunch 生命周期事件
    * 当小程序初始化完成时，会触发 onLaunch 事件，此函数会在该事件触发时执行
    * @param options - 小程序启动时的参数，包含路径和查询参数等信息
    */
    onLaunch(options: WechatMiniprogram.App.LaunchShowOption) {
        sdkOptions.appOnLaunch(options);
        const data: WxLifeCycleBreadcrumb = {
            path: options.path,
            query: options.query,
        }
        breadcrumb.push({
            type: BreadCrumbTypes.APP_ON_LAUNCH,
            category: breadcrumb.getCategory(BreadCrumbTypes.APP_ON_LAUNCH),
            data,
            level: Severity.Info,
        })
    },
    /**
     * 处理微信小程序 App 的 onShow 生命周期事件
     * 当小程序启动，或从后台进入前台显示时，会触发 onShow 事件，此函数会在该事件触发时执行
     * @param options - 小程序启动或显示时的参数，包含路径和查询参数等信息
     */
    async onShow(options: WechatMiniprogram.App.LaunchShowOption) {
        _support.deviceInfo = await getWxMiniDeviceInfo();
        sdkOptions.appOnShow(options);
        const data: WxLifeCycleBreadcrumb = {
            path: options.path,
            query: options.query,
        }
        breadcrumb.push({
            type: BreadCrumbTypes.APP_ON_SHOW,
            category: breadcrumb.getCategory(BreadCrumbTypes.APP_ON_SHOW),
            data,
            level: Severity.Info,
        })
    },
    /**
     * 处理微信小程序 App 的 onHide 生命周期事件
     * 当小程序从前台进入后台时，会触发 onHide 事件，此函数会在该事件触发时执行
     */
    onHide() {
        sdkOptions.appOnHide();
        breadcrumb.push({
            type: BreadCrumbTypes.APP_ON_HIDE,
            category: breadcrumb.getCategory(BreadCrumbTypes.APP_ON_HIDE),
            data: null,
            level: Severity.Info,
        })
    },
    /**
    * 处理小程序运行时的错误事件
    * 当小程序代码运行过程中抛出错误时，此函数会被调用
    * @param error - 错误信息字符串
    */
    onerror(error: string) {
        const parsedError = parseErrorString(error);
        const data: types.ReportDataType = {
            ...parsedError,
            time: getTimestamp(),
            level: Severity.Normal,
            url: getCurrentRoute(),
            type: ErrorTypes.JAVASCRIPT_ERROR,
        };
        breadcrumb.push({
            type: BreadCrumbTypes.CODE_ERROR,
            category: breadcrumb.getCategory(BreadCrumbTypes.CODE_ERROR),
            data: { ...data },
            level: Severity.Error,
        })
        transportData.send(data);
    },

    /**
    * 处理未处理的 Promise 拒绝事件
    * 当小程序中存在未被处理的 Promise 拒绝时，会触发此事件，该函数会对该事件进行处理
    * @param ev - 未处理的 Promise 拒绝事件的回调结果，包含拒绝原因等信息
    */
    onunhandledrejection(ev: WechatMiniprogram.OnUnhandledRejectionCallbackResult) {
        let data: types.ReportDataType = {
            type: ErrorTypes.PROMISE_ERROR,
            message: unknownToString(ev.reason),
            url: getCurrentRoute(),
            // 错误名称写死为 'unhandledrejection'，因为小程序 onUnhandledRejection 回调中无 type 参数
            name: 'unhandledrejection',
            time: getTimestamp(),
            level: Severity.Low,
        };
        if (isError(ev.reason)) {
            data = {
                ...data,
                stack: extractErrorStack(ev.reason, Severity.Low),
                url: getCurrentRoute(),
            };
        }
        breadcrumb.push({
            type: BreadCrumbTypes.UNHANDLEDREJECTION,
            category: breadcrumb.getCategory(BreadCrumbTypes.UNHANDLEDREJECTION),
            data: { ...data },
            level: Severity.Error,
        })
        transportData.send(data);
    },

    /**
     * 处理小程序页面未找到的事件
     * 当小程序尝试打开一个不存在的页面时，会触发此事件，该函数会对该事件进行处理
     * @param data - 页面未找到事件的回调结果，包含路径和是否使用重定向等信息
     */
    onPageNotFound(data: WechatMiniprogram.OnPageNotFoundCallbackResult) {
        sdkOptions.onPageNotFound(data);
        breadcrumb.push({
            type: BreadCrumbTypes.ROUTE,
            category: breadcrumb.getCategory(BreadCrumbTypes.ROUTE),
            data,
            level: Severity.Error,
        })
    }
}

const HandleWxPageEvents = {
    onShow() {
        const page = getCurrentPages().pop();
        sdkOptions.pageOnShow(page);
        const data: WxLifeCycleBreadcrumb = {
            path: page.route,
            query: page.options,
        };
        breadcrumb.push({
            category: breadcrumb.getCategory(BreadCrumbTypes.PAGE_ON_SHOW),
            type: BreadCrumbTypes.PAGE_ON_SHOW,
            data,
            level: Severity.Info,
        });
    },

    /**
     * 处理微信小程序页面的 onHide 生命周期事件
     * 当页面隐藏时，会触发 onHide 事件，此函数会在该事件触发时执行
     */
    onHide() {
        const page = getCurrentPages().pop();
        sdkOptions.pageOnHide(page);
        const data: WxLifeCycleBreadcrumb = {
            path: page.route,
            query: page.options,
        };
        breadcrumb.push({
            category: breadcrumb.getCategory(BreadCrumbTypes.PAGE_ON_HIDE),
            type: BreadCrumbTypes.PAGE_ON_HIDE,
            data,
            level: Severity.Info,
        });
    },

    /**
     * 处理微信小程序页面的 onUnload 生命周期事件
     * 当页面卸载时，会触发 onUnload 事件，此函数会在该事件触发时执行
     */
    onUnload() {
        const page = getCurrentPages().pop();
        sdkOptions.pageOnUnload(page);
        const data: WxLifeCycleBreadcrumb = {
            path: page.route,
            query: page.options,
        };
        breadcrumb.push({
            category: breadcrumb.getCategory(BreadCrumbTypes.PAGE_ON_UNLOAD),
            type: BreadCrumbTypes.PAGE_ON_UNLOAD,
            data,
            level: Severity.Info,
        });
    },

    /**
    * 处理微信小程序页面的分享事件
    * 当用户点击页面的分享按钮时，会触发 onShareAppMessage 事件，此函数会在该事件触发时执行
    * @param options - 分享事件的选项，包含分享的标题、路径等信息
    */
    onShareAppMessage(options: WechatMiniprogram.Page.IShareAppMessageOption) {
        const page = getCurrentPages().pop();
        sdkOptions.onShareAppMessage({
            ...page,
            ...options,
        });
        const data: WxOnShareAppMessageBreadcrumb = {
            path: page.route,
            query: page.options,
            options,
        };
        breadcrumb.push({
            category: breadcrumb.getCategory(BreadCrumbTypes.PAGE_ON_SHARE_APP_MESSAGE),
            type: BreadCrumbTypes.PAGE_ON_SHARE_APP_MESSAGE,
            data,
            level: Severity.Info,
        });
    },

    /**
    * 处理微信小程序页面分享到朋友圈的事件
    * 当用户点击页面的分享到朋友圈按钮时，会触发 onShareTimeline 事件，此函数会在该事件触发时执行
    */
    onShareTimeline() {
        const page = getCurrentPages().pop();
        sdkOptions.onShareTimeline(page);
        const data: WxLifeCycleBreadcrumb = {
            path: page.route,
            query: page.options,
        };
        breadcrumb.push({
            category: breadcrumb.getCategory(BreadCrumbTypes.PAGE_ON_SHARE_TIMELINE),
            type: BreadCrumbTypes.PAGE_ON_SHARE_TIMELINE,
            data,
            level: Severity.Info,
        });
    },

    /**
    * 处理微信小程序页面底部 tab 栏项被点击的事件
    * 当用户点击页面底部的 tab 栏项时，会触发 onTabItemTap 事件，此函数会在该事件触发时执行
    * @param options - tab 栏项被点击事件的选项，包含被点击的 tab 栏项的信息
    */
    onTabItemTap(options: WechatMiniprogram.Page.ITabItemTapOption) {
        const page = getCurrentPages().pop();
        sdkOptions.onTabItemTap({
            ...page,
            ...options,
        });
        const data: WxOnTabItemTapBreadcrumb = {
            path: page.route,
            query: page.options,
            options,
        };
        breadcrumb.push({
            category: breadcrumb.getCategory(BreadCrumbTypes.PAGE_ON_TAB_ITEM_TAP),
            type: BreadCrumbTypes.PAGE_ON_TAB_ITEM_TAP,
            data,
            level: Severity.Info,
        });
    },

    /**
     * 处理微信小程序中的交互事件
     * 当用户在小程序中进行交互操作（如点击、触摸移动等）时，会触发此事件，该函数会对该事件进行处理
     * @param e - 微信小程序基础事件对象，包含事件类型、目标元素等信息
     */
    onAction(e: WechatMiniprogram.BaseEvent) {
        sdkOptions.triggerWxEvent(e);
        let type = BreadCrumbTypes.TOUCHMOVE;
        if (e.type === EListenerTypes.Tap) {
            type = BreadCrumbTypes.TAP;
        }
        breadcrumb.push({
            category: breadcrumb.getCategory(type),
            type,
            data: targetAsString(e),
            level: Severity.Info,
        });
    },
}

const HandleWxConsoleEvents = {
    console(data: types.Replace.TriggerConsole) {
        handleConsole(data);
    },
}

const HandleNetworkEvents = {
    /**
     * 处理网络请求事件
     * 该函数接收一个网络请求的数据对象，对其进行转换和处理，并根据请求状态记录面包屑和上报错误信息
     * @param data - 网络请求的数据对象，包含请求的相关信息
     */
    handleRequest(data: types.MonitorHttp): void {
        const result = httpTransform(data);
        result.url = getCurrentRoute();
        if (data.status === undefined) {
            result.message = data.errMsg;
        }
        const type = BreadCrumbTypes.XHR;
        breadcrumb.push({
            type,
            category: breadcrumb.getCategory(type),
            data: result,
            level: Severity.Info,
        });
        // 检查请求是否失败
        if (isHttpFail(data.status)) {
            breadcrumb.push({
                type,
                category: breadcrumb.getCategory(BreadCrumbTypes.CODE_ERROR),
                data: { ...result },
                level: Severity.Error,
            });
            transportData.send(result);
        }
    }
}

const HandleWxEvents = {
    /**
     * 处理小程序路由事件
     * 该函数接收一个路由数据对象，根据路由是否失败记录面包屑信息，并在路由失败时上报错误信息
     * @param data - 路由数据对象，包含路由的相关信息，如是否失败、错误消息、目标路径等
     */
    handleRoute(data: MiniRoute) {
        if (data.isFail) {
            breadcrumb.push({
                type: BreadCrumbTypes.ROUTE,
                category: breadcrumb.getCategory(BreadCrumbTypes.CODE_ERROR),
                data,
                level: Severity.Error,
            });

            const reportData = {
                type: ErrorTypes.ROUTE_ERROR,
                message: data.message,
                url: data.to,
                name: 'MINI_' + ErrorTypes.ROUTE_ERROR,
                level: Severity.Error,
            };

            return transportData.send(reportData);
        }
        breadcrumb.push({
            type: BreadCrumbTypes.ROUTE,
            category: breadcrumb.getCategory(BreadCrumbTypes.ROUTE),
            data,
            level: Severity.Info,
        });
    },
}

export {
    HandleWxAppEvents,
    HandleWxPageEvents,
    HandleWxConsoleEvents,
    HandleNetworkEvents,
    HandleWxEvents,
}