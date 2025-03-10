import { EventTypes } from "zfleaves-monitor-shared";
import {
    HandleWxConsoleEvents,
    HandleNetworkEvents,
    HandleWxEvents,
    HandleWxPageEvents,
} from './handleWxEvents';
import {
    addReplaceHandler,
    replaceApp,
    replacePage,
    replaceComponent,
    replaceBehavior,
} from './replace';


/**
 * 设置替换逻辑
 * 此函数用于初始化小程序中各种事件处理和替换逻辑，包括替换 App、Page、Component 和 Behavior 等的默认行为，
 * 并为不同类型的事件添加替换处理程序。
 */
export function setupReplace() {
    // 替换小程序 App 方法，对小程序 App 的生命周期方法进行劫持和处理
    replaceApp();
    // 替换小程序 Page 方法，对小程序 Page 的生命周期方法进行劫持和处理
    replacePage();
    // 替换小程序 Component 方法，对小程序 Component 的生命周期方法进行劫持和处理
    replaceComponent();
    // 替换小程序 Behavior 方法，对小程序 Behavior 的生命周期方法进行劫持和处理
    replaceBehavior();
    // 添加路由事件的替换处理程序
    addReplaceHandler({
        // 当捕获到路由事件时，调用 HandleWxEvents.handleRoute 方法处理数据
        callback: (data) => HandleWxEvents.handleRoute(data),
        // 事件类型为路由事件
        type: EventTypes.MINI_ROUTE,
    });
    // 添加网络请求事件的替换处理程序
    addReplaceHandler({
        // 当捕获到网络请求事件时，调用 HandleNetworkEvents.handleRequest 方法处理数据
        callback: (data) => HandleNetworkEvents.handleRequest(data),
        // 事件类型为网络请求事件
        type: EventTypes.XHR,
    });
    // 添加控制台日志事件的替换处理程序
    addReplaceHandler({
        // 当捕获到控制台日志事件时，调用 HandleWxConsoleEvents.console 方法处理数据
        callback: (data) => HandleWxConsoleEvents.console(data),
        // 事件类型为控制台日志事件
        type: EventTypes.CONSOLE,
    });
    // 添加 DOM 事件的替换处理程序
    addReplaceHandler({
        // 当捕获到 DOM 事件时，调用 HandleWxPageEvents.onAction 方法处理数据
        callback: (data) => HandleWxPageEvents.onAction(data),
        // 事件类型为 DOM 事件
        type: EventTypes.DOM,
    });
}