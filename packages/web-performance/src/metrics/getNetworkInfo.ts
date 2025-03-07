import { INetworkInformation, IMetrics, IReportHandler } from '../types';
import { isNavigatorSupported } from '../utils/isSupported';
import { metricsName } from '../constants';
import metricsStore from '../lib/store';

/**
 * 获取当前网络连接的相关信息
 * @returns {INetworkInformation | undefined} 如果浏览器支持且成功获取到网络信息，返回包含网络信息的对象；否则返回 undefined
 */
const getNetworkInfo = (): INetworkInformation | undefined => {
    if (!isNavigatorSupported()) {
        console.warn('browser do not support performance');
        return;
    }

    const connection = (
        'connection' in navigator ? navigator['connection'] : {}
    ) as INetworkInformation;
    // 从 connection 对象中解构出所需的网络信息属性
    const { downlink, effectiveType, rtt } = connection;

    return {
        // 下行速度
        downlink,
        // 有效的连接类型
        effectiveType,
        // 往返时间
        rtt,
    };
}


export const initNetworkInfo = (
    store: metricsStore,
    report: IReportHandler,
    immediately: boolean = true,
): void => {
    const networkInfo: INetworkInformation = getNetworkInfo();

    const metrics = { name: metricsName.NI, value: networkInfo } as IMetrics;

    store.set(metricsName.NI, metrics);

    if (immediately) {
        report(metrics);
    }
}