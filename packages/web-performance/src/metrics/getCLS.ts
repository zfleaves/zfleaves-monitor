import { isPerformanceObserverSupported } from '../utils/isSupported';
import observe from '../lib/observe';
import metricsStore from '../lib/store';
import { IReportHandler, LayoutShift, IMetrics, IScoreConfig } from '../types';
import { metricsName } from '../constants';
import { roundToDigits } from '../utils';
import { onHidden } from '../lib/onHidden';
import calcScore from '../lib/calculateScore';

/**
 * 获取累积布局偏移（CLS）指标
 * @param cls - 用于存储 CLS 值的对象
 * @returns 如果浏览器支持 PerformanceObserver，则返回一个 PerformanceObserver 实例；否则返回 undefined
 */
const getCLS = (cls: any): PerformanceObserver | undefined => {
    if (!isPerformanceObserverSupported()) {
        console.warn('browser do not support performanceObserver');
        return;
    }

    const entryHandler = (entry: LayoutShift) => {
        if (!entry.hadRecentInput) {
            cls.value += entry.value;
        }
    }

    return observe('layout-shift', entryHandler);
}

/**
 * 初始化累积布局偏移（CLS）指标的监控和报告
 * @param store - 用于存储性能指标的存储对象
 * @param report - 用于报告性能指标的处理函数
 * @param immediately - 是否立即报告指标，默认为 true
 * @param scoreConfig - 用于计算指标得分的配置对象
 */
export const initCLS = (
    store: metricsStore,
    report: IReportHandler,
    immediately: boolean = true,
    scoreConfig: IScoreConfig,
): void => {
    const cls = { value: 0 };

    const po = getCLS(cls);

    const stopListening = () => {
        if (po?.takeRecords) {
            po.takeRecords().map((entry: LayoutShift) => {
                if (!entry.hadRecentInput) {
                    cls.value += entry.value;
                }
            });
        }

        po?.disconnect();

        const metrics = {
            name: metricsName.CLS,
            value: roundToDigits(cls.value),
            score: calcScore(metricsName.CLS, cls.value, scoreConfig),
        } as IMetrics;

        store.set(metricsName.CLS, metrics);

        if (immediately) {
            report(metrics);
        }
    }

    onHidden(stopListening, true);
}