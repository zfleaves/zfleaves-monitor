import { EventTypes, WxEvents } from "zfleaves-monitor-shared";
import { Breadcrumb, TransportData, Options } from '../core';
import { Logger } from './logger';
import { variableTypeDetection } from "./is";
import { DeviceInfo } from "../types";

// Monitor的全局变量
export interface MonitorSupport {
    logger: Logger;
    breadcrumb: Breadcrumb;
    transportData: TransportData;
    replaceFlag: { [key in EventTypes]?: boolean };
    record?: any[];
    deviceInfo?: DeviceInfo;
    options?: Options;
    track?: any;
}

interface MonitorGlobal {
    console?: Console;
    __Monitor__?: MonitorSupport;
}

export const isNodeEnv = variableTypeDetection.isProcess(
    typeof process !== 'undefined' ? process : 0,
);

export const isWxMiniEnv =
    variableTypeDetection.isObject(typeof wx !== 'undefined' ? wx : 0) &&
    variableTypeDetection.isFunction(typeof App !== 'undefined' ? App : 0);

export const isBrowserEnv = variableTypeDetection.isWindow(
    typeof window !== 'undefined' ? window : 0,
);
/**
 * 获取全局变量
 *
 * ../returns Global scope object
 */
export function getGlobal<T>() {
    if (isBrowserEnv) return window as unknown as MonitorGlobal & T;
    if (isWxMiniEnv) return wx as unknown as MonitorGlobal & T;
    if (isNodeEnv) return process as unknown as MonitorGlobal & T;
}

const _global = getGlobal<Window>();
const _support = getGlobalMonitorSupport();

export { _global, _support };

_support.replaceFlag = _support.replaceFlag || {};
const replaceFlag = _support.replaceFlag;
export function setFlag(replaceType: EventTypes | WxEvents, isSet: boolean): void {
    if (!replaceFlag) {
        throw new Error('replaceFlag is not defined');
    }
    if (replaceFlag[replaceType]) return;
    replaceFlag[replaceType] = isSet;
}

export function getFlag(replaceType: EventTypes | WxEvents): boolean {
    return replaceFlag[replaceType] ? true : false;
}

/**
 * 获取全部变量__Monitor__的引用地址
 *
 * ../returns global variable of Monitor
 */
export function getGlobalMonitorSupport(): MonitorSupport {
    _global.__Monitor__ = _global.__Monitor__ || ({} as MonitorSupport);
    return _global.__Monitor__;
}

export function supportsHistory(): boolean {
    // 尝试从全局对象获取 chrome 对象
    const chrome = (_global as any).chrome; 
    // 检查是否为 Chrome 打包应用环境
    const isChromePackagedApp = chrome && chrome.app && chrome.app.runtime; 
    // 检查全局对象是否支持 History API
    const hasHistoryApi =
        'history' in _global && !!_global.history.pushState && !!_global.history.replaceState;

    // 如果不是 Chrome 打包应用环境且支持 History API，则返回 true
    return !isChromePackagedApp && hasHistoryApi; 
}