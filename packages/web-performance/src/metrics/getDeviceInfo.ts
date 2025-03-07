import { IDeviceInformation, IMetrics, IReportHandler } from '../types';
import { isPerformanceSupported, isNavigatorSupported } from '../utils/isSupported';
import { convertToMB } from '../utils';
import { metricsName } from '../constants';
import metricsStore from '../lib/store';

const getDeviceInfo = (): IDeviceInformation | undefined => {
    if (!isPerformanceSupported()) {
        console.warn('browser do not support performance');
        return;
    }

    if (!isNavigatorSupported()) {
        console.warn('browser do not support navigator');
        return;
    }

    return {
        // @ts-ignore
        deviceMemory: 'deviceMemory' in navigator ? navigator['deviceMemory'] : 0,
        hardwareConcurrency: 'hardwareConcurrency' in navigator ? navigator['hardwareConcurrency'] : 0,
        jsHeapSizeLimit:
          'memory' in performance ? convertToMB(performance['memory']['jsHeapSizeLimit']) : 0,
        totalJSHeapSize:
          'memory' in performance ? convertToMB(performance['memory']['totalJSHeapSize']) : 0,
        usedJSHeapSize:
          'memory' in performance ? convertToMB(performance['memory']['usedJSHeapSize']) : 0,
      };
}

/**
 * 初始化设备信息的收集和报告
 * @param store - 用于存储性能指标的存储对象
 * @param report - 用于报告性能指标的处理函数
 * @param immediately - 是否立即报告指标，默认为 true
 */
export const initDeviceInfo = (
   store: metricsStore,
   report: IReportHandler,
   immediately: boolean = true, 
): void => {
    const deviceInfo = getDeviceInfo();
    const metrics = {
        name: metricsName.DI,
        value: deviceInfo,
    } as IMetrics;

    store.set(metricsName.DI, metrics);

    if (immediately) {
        report(metrics);
    }
}