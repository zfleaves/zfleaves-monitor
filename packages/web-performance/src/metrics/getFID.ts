import observe from '../lib/observe';
import getFirstHiddenTime from '../lib/getFirstHiddenTime';
import { onHidden } from '../lib/onHidden';
import { isPerformanceObserverSupported } from '../utils/isSupported';
import { metricsName } from '../constants';
import metricsStore from '../lib/store';
import { IReportHandler, IScoreConfig, PerformanceEventTiming } from '../types';
import { roundToDigits } from '../utils';
import calcScore from '../lib/calculateScore';

const getFID = (): Promise<PerformanceEntry> | undefined => {
    if (!isPerformanceObserverSupported()) {
        console.warn('browser do not support performanceObserver');
        return;
    }

    const firstHiddenTime = getFirstHiddenTime();

    return new Promise((resolve) => {
        const eventHandler = (entry: PerformanceEventTiming) => {
            if (entry.startTime < firstHiddenTime.timeStamp) {
                if (po) {
                    po.disconnect();
                }

                resolve(entry);
            }
        }

        const po = observe('first-input', eventHandler);

        if (po) {
            onHidden(() => {
                if (po?.takeRecords) {
                    po.takeRecords().map(eventHandler);
                }
                po.disconnect();
            }, true);
        }
    })
}

/**
 * 初始化首次输入延迟（FID）指标的收集、存储和报告
 * @param store - 用于存储性能指标的对象
 * @param report - 报告性能指标的处理函数
 * @param immediately - 是否立即报告指标，默认为 true
 * @param scoreConfig - 计算指标得分的配置对象
 */
export const initFID = (
    store: metricsStore,
    report: IReportHandler,
    immediately: boolean = true,
    scoreConfig: IScoreConfig,
): void => {
    getFID().then((entry: PerformanceEventTiming) => {
        const metrics = {
            name: metricsName.FID,
            value: {
                // 事件名称
                eventName: entry.name,
                // 事件目标元素的类名
                targetCls: entry.target?.className,
                // 事件开始时间，保留两位小数
                startTime: roundToDigits(entry.startTime, 2),
                // 输入延迟时间，即处理开始时间减去事件开始时间，保留两位小数
                delay: roundToDigits(entry.processingStart - entry.startTime, 2),
                // 事件处理时间，即处理结束时间减去处理开始时间，保留两位小数
                eventHandleTime: roundToDigits(entry.processingEnd - entry.processingStart, 2),
            },
            score: calcScore(
                metricsName.FID,
                roundToDigits(entry.processingStart - entry.startTime, 2),
                scoreConfig,
            ),
        }

        store.set(metricsName.FID, metrics);

        immediately && report(metrics);
    }).catch((err) => {
        console.warn(err);
    })
}