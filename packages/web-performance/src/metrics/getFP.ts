import { isPerformanceObserverSupported, isPerformanceSupported } from '../utils/isSupported';
import { IMetrics, IReportHandler } from '../types';
import { roundToDigits } from '../utils';
import { metricsName } from '../constants';
import metricsStore from '../lib/store';
import observe from '../lib/observe';
import getFirstHiddenTime from '../lib/getFirstHiddenTime';
import calcScore from '../lib/calculateScore';


const getFP = (): Promise<PerformanceEntry> | undefined => {
    return new Promise((resolve, reject) => {
        if (!isPerformanceObserverSupported()) {
            if (!isPerformanceSupported()) {
                reject(new Error('browser do not support performance'));
            } else {
                const [entry] = performance.getEntriesByName(metricsName.FP);

                if (entry) {
                    resolve(entry);
                }

                reject(new Error('browser has no fp'));
            }
        } else {
            const entryHandler = (entry: PerformanceEntry) => {
                if (entry.name === metricsName.FP) {
                    if (po) {
                        po.disconnect();
                    }

                    if (entry.startTime < getFirstHiddenTime().timeStamp) {
                        resolve(entry);
                    }
                }
            };

            const po = observe('paint', entryHandler);
        }
    })
}

/**
 * 初始化首次绘制（FP）指标的收集、存储和报告
 * @param store - 用于存储性能指标的对象
 * @param report - 报告性能指标的处理函数
 * @param immediately - 是否立即报告指标，默认为 true
 * @param scoreConfig - 计算指标得分的配置对象
 */
export const initFP = (
    store: metricsStore,
    report: IReportHandler,
    immediately = true,
    scoreConfig,
): void => {
    getFP()?.then((entry: PerformanceEntry) => {
        const metrics = {
            name: metricsName.FP,
            value: roundToDigits(entry.startTime, 2),
            score: calcScore(metricsName.FP, entry.startTime, scoreConfig),
        } as IMetrics;

        store.set(metricsName.FP, metrics);

        immediately && report(metrics);
    }).catch((err) => {
        console.error(err);
    })
}