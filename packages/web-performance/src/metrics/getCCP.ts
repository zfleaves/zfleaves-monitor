import { proxyFetch, proxyXhr } from '../lib/proxyHandler';
import getFirstVisitedState from '../lib/getFirstVisitedState';
import metricsStore from '../lib/store';
import { IReportHandler, IScoreConfig } from '../types';
import { getApiPath, isIncludeArr, isEqualArr, isExistPath, beforeUnload } from '../utils';
import getPath from '../utils/getPath';
import { isPerformanceSupported } from '../utils/isSupported';
import { metricsName } from '../constants';
import { onHidden } from '../lib/onHidden';
import { onPageChange } from '../lib/onPageChange';
import getFirstHiddenTime from '../lib/getFirstHiddenTime';
import calcScore from '../lib/calculateScore';



const remoteQueue = {
    hasStoreMetrics: false,
    queue: [],
};
const completeQueue = [];
let isDone = false;
let reportLock = true;

const storeMetrics = (name, value, store, scoreConfig) => {
    let score;

    let metrics;
    if (name === metricsName.ACT) {
        score = calcScore(name, value.time, scoreConfig);
        metrics = { name, value, score };
    } else if (name === metricsName.CCP) {
        score = calcScore(name, value, scoreConfig);
        metrics = { name, value, score };
    } else {
        metrics = { name, value };
    }

    store.set(name, metrics);
}
/**
 * 计算关键内容绘制（CCP）时间和资源加载（RL）信息，并将这些指标存储到指定的存储对象中
 * @param store - 用于存储计算得到的性能指标的对象
 * @param scoreConfig - 用于计算性能指标得分的配置对象
 */
const computeCCPAndRL = (store, scoreConfig) => {
    setTimeout(() => {
        // 选择页面上的所有 <img> 元素，并将其转换为数组
        // 然后筛选出未加载完成（!image.complete）且具有 src 属性的图片
        const images = Array.from(document.querySelectorAll('img')).filter((image) => {
            return !image.complete && image.src;
        });

        if (images.length > 0) {
            const imagePromises = images.map((image) => {
                return new Promise((resolve) => {
                    image.addEventListener('load', resolve);
                    image.addEventListener('error', resolve);
                });
            });

            Promise.all(imagePromises).then(() => {
                storeMetrics(metricsName.CCP, performance.now(), store, scoreConfig);
                storeMetrics(
                    metricsName.RL,
                    performance.getEntriesByType('resource'),
                    store,
                    scoreConfig,
                );
            });
        } else {
            // 如果没有未加载完成的图片，直接将当前时间作为 CCP 指标的值存储到 store 中
            storeMetrics(metricsName.CCP, performance.now(), store, scoreConfig);
            // 并将所有资源加载信息作为 RL 指标的值存储到 store 中
            storeMetrics(metricsName.RL, performance.getEntriesByType('resource'), store, scoreConfig);
        }
    });
};

/**
 * 前置处理函数，用于在特定条件下处理远程请求路径并添加到队列中
 * @param url - 远程请求的 URL
 * @param apiConfig - API 配置对象，可能包含特定路径的 API 配置信息
 * @param hashHistory - 用于处理哈希路由的相关信息
 * @param excludeRemotePath - 需要排除的远程请求路径数组
 */
const beforeHandler = (url, apiConfig, hashHistory, excludeRemotePath) => {
    if (isPerformanceSupported()) {
        const path = getPath(location, hashHistory);
        const firstVisitedState = getFirstVisitedState().state;
        if (firstVisitedState) {
            const remotePath = getApiPath(url);
            if (!isExistPath(excludeRemotePath, remotePath)) {
                if (apiConfig && apiConfig[path]) {
                    if (apiConfig[path].some((o) => remotePath === o)) {
                        remoteQueue.queue.push(remotePath);
                    }
                } else {
                    if (!isDone) {
                        remoteQueue.queue.push(remotePath);
                    }
                }
            }
        }
    } else {
        console.warn('browser do not support performance');
    }
};

const afterHandler = (url, apiConfig, store, hashHistory, excludeRemotePath, scoreConfig) => {
    if (isPerformanceSupported()) {
        const path = getPath(location, hashHistory);
        const firstVisitedState = getFirstVisitedState().state;
        if (firstVisitedState) {
            const remotePath = getApiPath(url);
            if (!isExistPath(excludeRemotePath, remotePath)) {
                completeQueue.push(remotePath);
                if (apiConfig && apiConfig[path]) {
                    if (isIncludeArr(remoteQueue.queue, completeQueue) && !remoteQueue.hasStoreMetrics) {
                        console.log('api list = ', remoteQueue.queue);
                        remoteQueue.hasStoreMetrics = true;
                        const now = performance.now();
                        if (now < getFirstHiddenTime().timeStamp) {
                            storeMetrics(
                                metricsName.ACT,
                                { time: now, remoteApis: remoteQueue.queue },
                                store,
                                scoreConfig,
                            );
                            computeCCPAndRL(store, scoreConfig);
                        }
                    }
                } else {
                    if (
                        isIncludeArr(remoteQueue.queue, completeQueue) &&
                        !remoteQueue.hasStoreMetrics &&
                        isDone
                    ) {
                        console.log('api list = ', remoteQueue.queue);
                        remoteQueue.hasStoreMetrics = true;
                        const now = performance.now();
                        if (now < getFirstHiddenTime().timeStamp) {
                            storeMetrics(
                                metricsName.ACT,
                                { time: now, remoteApis: remoteQueue.queue },
                                store,
                                scoreConfig,
                            );
                            computeCCPAndRL(store, scoreConfig);
                        }
                    }
                }
            }
        }
    } else {
        console.warn('browser do not support performance');
    }
};

const reportMetrics = (store: metricsStore, report) => {
    if (reportLock) {
        const act = store.get(metricsName.ACT);
        const ccp = store.get(metricsName.CCP);
        const rl = store.get(metricsName.RL);

        if (act && ccp) {
            if (act.value.time < ccp.value) {
                report(act);
                report(ccp);

                if (rl) {
                    report(rl);
                }
            }
        }

        if (!act && ccp) {
            report(ccp);

            if (rl) {
                report(rl);
            }
        }

        reportLock = false;
    }
};

const maxWaitTime4Report = (cb: () => void, maxWaitCCPDuration) => {
    setTimeout(cb, maxWaitCCPDuration);
};

export const initCCP = (
    store: metricsStore,          // 用于存储性能指标的对象
    report: IReportHandler,       // 报告处理器，用于发送性能数据
    isCustomEvent: boolean,       // 是否使用自定义事件
    apiConfig: { [prop: string]: string[] },  // API配置对象
    hashHistory: boolean,         // 是否使用hash路由
    excludeRemotePath: string[],  // 需要排除的远程请求路径
    maxWaitCCPDuration: number,  // 最大等待时间
    immediately: boolean,         // 是否立即报告
    scoreConfig: IScoreConfig,    // 评分配置
) => {
    // 根据是否使用自定义事件决定监听的事件类型
    const event = isCustomEvent ? metricsName.CCP : 'pageshow';
    addEventListener(
        event,
        () => {
            // 获取首次访问状态
            const firstVisitedState = getFirstVisitedState().state;
            if (firstVisitedState) {
                isDone = true;  // 标记已完成
                if (isPerformanceSupported()) {
                    const now = performance.now();
                    // 如果当前时间小于页面隐藏时间
                    if (now < getFirstHiddenTime().timeStamp) {
                        // 如果远程请求队列和完成队列相等，且尚未存储指标
                        if (isEqualArr(remoteQueue.queue, completeQueue) && !remoteQueue.hasStoreMetrics) {
                            console.log('api list = ', remoteQueue.queue);
                            remoteQueue.hasStoreMetrics = true;
                            // 存储ACT指标
                            storeMetrics(
                                metricsName.ACT,
                                { time: performance.now(), remoteApis: remoteQueue.queue },
                                store,
                                scoreConfig,
                            );
                        }
                        // 计算并存储CCP和RL指标
                        computeCCPAndRL(store, scoreConfig);
                    }
                }
            }
        },
        { once: true, capture: true },  // 只监听一次，使用捕获模式
    );

    // 如果立即报告
    if (immediately) {
        // 在页面卸载前报告指标
        beforeUnload(() => reportMetrics(store, report));

        // 在页面隐藏时报告指标
        onHidden(() => reportMetrics(store, report), true);

        // 在页面变化时报告指标
        onPageChange(() => reportMetrics(store, report));

        // 在最大等待时间后报告指标
        maxWaitTime4Report(() => reportMetrics(store, report), maxWaitCCPDuration);
    }

    // 代理XHR请求，在请求前后分别处理
    proxyXhr(
        (url) => beforeHandler(url, apiConfig, hashHistory, excludeRemotePath),
        (url) => afterHandler(url, apiConfig, store, hashHistory, excludeRemotePath, scoreConfig),
    );
    // 代理Fetch请求，在请求前后分别处理
    proxyFetch(
        (url) => beforeHandler(url, apiConfig, hashHistory, excludeRemotePath),
        (url) => afterHandler(url, apiConfig, store, hashHistory, excludeRemotePath, scoreConfig),
    );
}
