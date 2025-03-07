import { IMetrics, IPerformanceNavigationTiming, IReportHandler } from '../types';
import { isPerformanceSupported, isPerformanceObserverSupported } from '../utils/isSupported';
import { metricsName } from '../constants';
import metricsStore from '../lib/store';
import observe from '../lib/observe';
import { roundToDigits, validNumber } from '../utils';

/**
 * 获取页面导航性能的各项时间指标
 * @returns {Promise<IPerformanceNavigationTiming> | undefined} 一个 Promise，解析为包含导航性能指标的对象；如果浏览器不支持性能 API，则返回 undefined
 */
const getNavigationTiming = (): Promise<IPerformanceNavigationTiming> | undefined => {
    if (!isPerformanceSupported()) {
        console.warn('browser do not support performance');
        return;
    }

    const resolveNavigationTiming = (entry: PerformanceNavigationTiming, resolve): void => {
        const {
            domainLookupStart,
            domainLookupEnd,
            connectStart,
            connectEnd,
            secureConnectionStart,
            requestStart,
            responseStart,
            responseEnd,
            domInteractive,
            domContentLoadedEventStart,
            domContentLoadedEventEnd,
            loadEventStart,
            fetchStart,
        } = entry;

        // 计算各项导航性能指标，并使用 roundToDigits 函数进行四舍五入处理
        resolve({
            // DNS 查找时间
            dnsLookup: roundToDigits(domainLookupEnd - domainLookupStart),
            // 初始连接时间
            initialConnection: roundToDigits(connectEnd - connectStart),
            // SSL 握手时间，如果存在安全连接开始时间则计算，否则为 0
            ssl: secureConnectionStart ? roundToDigits(connectEnd - secureConnectionStart) : 0,
            // 首字节时间
            ttfb: roundToDigits(responseStart - requestStart),
            // 内容下载时间
            contentDownload: roundToDigits(responseEnd - responseStart),
            // DOM 解析时间
            domParse: roundToDigits(domInteractive - responseEnd),
            // 延迟脚本执行时间
            deferExecuteDuration: roundToDigits(domContentLoadedEventStart - domInteractive),
            // DOMContentLoaded 回调执行时间
            domContentLoadedCallback: roundToDigits(domContentLoadedEventEnd - domContentLoadedEventStart),
            // 资源加载时间
            resourceLoad: roundToDigits(loadEventStart - domContentLoadedEventEnd),
            // DOM 准备就绪时间
            domReady: roundToDigits(domContentLoadedEventEnd - fetchStart),
            // 页面加载时间
            pageLoad: roundToDigits(loadEventStart - fetchStart),
        });
    }

    return new Promise((resolve) => {
        if (
            isPerformanceObserverSupported() &&
            PerformanceObserver.supportedEntryTypes?.includes('navigation')
        ) {
            const entryHandler = (entry: PerformanceNavigationTiming) => {
                if (entry.entryType === 'navigation') {
                    if (po) {
                        po.disconnect();
                    }

                    resolveNavigationTiming(entry, resolve);
                }
            };

            const po = observe('navigation', entryHandler);
        } else {
             // 修改部分
            const navigationEntries = performance.getEntriesByType('navigation');
            const navigation = navigationEntries.length > 0 ? navigationEntries[0] : null;
            if (navigation) {
                resolveNavigationTiming(navigation as PerformanceNavigationTiming, resolve);
            } else {
                console.warn('No navigation performance entry found.');
            }
        }
    })
}

/**
 * 初始化页面导航性能指标的收集、存储和报告
 * @param store - 用于存储性能指标的对象
 * @param report - 报告性能指标的处理函数
 * @param immediately - 是否立即报告指标，默认为 true
 */
export const initNavigationTiming = (
    store: metricsStore,
    report: IReportHandler,
    immediately: boolean = true,
): void => {
    getNavigationTiming().then((navigationTiming) => {
        const metrics = { name: metricsName.NT, value: navigationTiming } as IMetrics;


        store.set(metricsName.NT, metrics);

        immediately && report(metrics);
    })
}