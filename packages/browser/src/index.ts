export * from './handleEvents';
export * from './load';
export * from './replace';
import { setupReplace } from './load';
import { initOptions, log } from 'zfleaves-monitor-core';
import { _global } from 'zfleaves-monitor-utils';
import { SDK_NAME, SDK_VERSION } from 'zfleaves-monitor-shared';
import { InitOptions } from 'zfleaves-monitor-type';

/**
 * 初始化 Web 端监控功能
 * 该函数会检查环境是否支持 XMLHttpRequest 以及是否禁用了监控功能，
 * 若满足条件则初始化选项并设置替换逻辑
 * @param {InitOptions} options - 初始化选项，默认为空对象
 */
function webInit(options: InitOptions = {}) {
    if (!('XMLHttpRequest' in _global) || options.disabled) return;
    initOptions(options);
    setupReplace();
}

/**
 * 初始化函数，用于调用 webInit 函数进行 Web 端监控的初始化
 * 该函数接收初始化选项，并将其传递给 webInit 函数
 * @param {InitOptions} options - 初始化选项，默认为空对象
 */
function init(options: InitOptions = {}) {
    webInit(options);
}

export { SDK_VERSION, SDK_NAME, init, log };