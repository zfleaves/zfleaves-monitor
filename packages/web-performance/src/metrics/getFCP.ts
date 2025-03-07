import { isPerformanceSupported, isPerformanceObserverSupported } from '../utils/isSupported';
import { IMetrics, IReportHandler, IScoreConfig } from '../types';
import { roundToDigits } from '../utils';
import { metricsName } from '../constants';
import metricsStore from '../lib/store';
import observe from '../lib/observe';
import getFirstHiddenTime from '../lib/getFirstHiddenTime';
import calcScore from '../lib/calculateScore';

const getFCP = (): Promise<PerformanceEntry> => {
    return new Promise((resolve, reject) => {
        if (!isPerformanceObserverSupported()) {
            if (!isPerformanceSupported()) {
                reject(new Error('browser do not support performance'));
            } else {
                const [entry] = performance.getEntriesByName(metricsName.FCP);

                if (entry) {
                    resolve(entry);
                }

                reject(new Error('browser has no fcp'));
            }
        } else {
            const entryHandler = (entry: PerformanceEntry) => {
                if (entry.name === metricsName.FCP) {
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

export const initFCP = (
    store: metricsStore,
    report: IReportHandler,
    immediately = true,
    scoreConfig: IScoreConfig,
): void => {
    getFCP()
        ?.then((entry: PerformanceEntry) => {
            const metrics = {
                name: metricsName.FCP,
                value: roundToDigits(entry.startTime, 2),
                score: calcScore(metricsName.FCP, entry.startTime, scoreConfig),
            } as IMetrics;

            store.set(metricsName.FCP, metrics);

            immediately && report(metrics);
        })
        .catch((err) => {
            console.error(err);
        })
}