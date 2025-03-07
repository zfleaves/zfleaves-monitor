import { IMetrics, IReportHandler, IReportData, IMetricsObj } from '../types';

/**
 * 创建一个报告处理器函数，用于处理指标数据的报告。
 * 
 * @param sessionId - 会话的唯一标识符。
 * @param appId - 应用的唯一标识符。
 * @param version - 应用的版本号。
 * @param callback - 处理报告数据的回调函数。
 * @returns 返回一个报告处理器函数，该函数接受指标数据并触发报告。
 */
const createReporter = (
    sessionId: string,
    appId: string,
    version: string,
    callback: Function
): IReportHandler =>
    (data: IMetrics | IMetricsObj) => {
        const reportData: IReportData = {
            sessionId,
            appId,
            version,
            data,
            timestamp: +new Date(),
        };

        if ('requestIdleCallback' in window) {
            (window as any).requestIdleCallback(
                () => {
                    callback(reportData);
                },
                { timeout: 3000 },
            );
        } else {
            callback(reportData);
        }
    };

export default createReporter;