/**
 * FPS
 * fps,a frame rate is the speed at which the browser is able to recalculate, layout and paint content to the display.
 * */
import { IReportHandler } from '../types';
import { metricsName } from '../constants';
import metricsStore from '../lib/store';
import calculateFps from '../lib/calculateFps';

const getFPS = (logFpsCount: number): Promise<number> => {
    return calculateFps(logFpsCount);
};

/**
 * 初始化帧率（FPS）指标的收集、存储和报告
 * @param store - 用于存储性能指标的对象
 * @param report - 报告性能指标的处理函数
 * @param logFpsCount - 计算帧率时记录的帧数
 * @param immediately - 是否立即报告指标，默认为 true
 */
export const initFPS = (
    store: metricsStore,
    report: IReportHandler,
    logFpsCount: number,
    immediately: boolean = true,
): void => {
    getFPS(logFpsCount).then((fps: number) => {
        const metrics = { name: metricsName.FPS, value: fps };

        store.set(metricsName.FPS, metrics);

        if (immediately) {
            report(metrics);
        }
    });
}