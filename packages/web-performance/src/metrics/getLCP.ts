import { isPerformanceObserverSupported } from '../utils/isSupported';
import getFirstHiddenTime from '../lib/getFirstHiddenTime';
import { onHidden } from '../lib/onHidden';
import { metricsName } from '../constants';
import { IMetrics, IReportHandler, IScoreConfig } from '../types';
import metricsStore from '../lib/store';
import { roundToDigits } from '../utils';
import observe from '../lib/observe';
import calcScore from '../lib/calculateScore';

const getLCP = (lcp): PerformanceObserver | undefined => {
    if (!isPerformanceObserverSupported()) {
        console.warn('browser do not support performanceObserver');
        return;
    }

    const firstHiddenTime = getFirstHiddenTime();

    const entryHandler = (entry: PerformanceEntry) => {
        if (entry.startTime < firstHiddenTime.timeStamp) {
            lcp.value = entry;
        }
    };

    return observe(metricsName.LCP, entryHandler);
}

/**
 * 初始化最大内容绘制（LCP）指标的收集、存储和报告
 * @param store - 用于存储性能指标的对象
 * @param report - 报告性能指标的处理函数
 * @param immediately - 是否立即报告指标，默认为 true
 * @param scoreConfig - 计算指标得分的配置对象
 */
export const initLCP = (
    store: metricsStore,
    report: IReportHandler,
    immediately: boolean = true,
    scoreConfig: IScoreConfig,
): void => {
    // 初始化一个对象用于存储最大内容绘制的性能条目
    const lcp = { value: {} as PerformanceEntry };
    const po = getLCP(lcp);

    const stopListening = () => {
        if (po) {
            // 遍历性能观察器的记录，找到最大内容绘制的性能条目
            if (po.takeRecords) {
                // 遍历性能观察器的记录，找到最大内容绘制的性能条目
                po.takeRecords().forEach((entry: PerformanceEntry) => {
                    const firstHiddenTime = getFirstHiddenTime();
                    if (entry.startTime < firstHiddenTime.timeStamp) {
                        lcp.value = entry;
                    }
                });
            }
            po.disconnect();
        }
        // 如果 store 中还没有存储 LCP 指标
        if (!store.has(metricsName.LCP)) {
            const value = lcp.value;
            const metrics = {
                name: metricsName.LCP,
                value: roundToDigits(value.startTime, 2),
                score: calcScore(metricsName.LCP, value.startTime, scoreConfig)
            } as IMetrics;

            store.set(metricsName.LCP, metrics);

            immediately && report(metrics);
        }
    }

    onHidden(stopListening, true);

    ['click', 'keydown'].forEach((event: string) => {
        window.addEventListener(event, stopListening, { once: true });
    })
}