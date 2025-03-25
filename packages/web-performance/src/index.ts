import 'core-js/es/array/includes';
import 'core-js/es/object/values';
import { IConfig, IWebVitals, IMetricsObj } from './types';
import generateUniqueID from './utils/generateUniqueID';
import { afterLoad, beforeUnload, unload } from './utils';
import { onHidden } from './lib/onHidden';
import createReporter from './lib/createReporter';
import MetricsStore from './lib/store';
import { measure } from './lib/measureCustomMetrics';
import { setMark, clearMark, getMark, hasMark } from './lib/markHandler';
import { initNavigationTiming } from './metrics/getNavigationTiming';
import { initDeviceInfo } from './metrics/getDeviceInfo';
import { initNetworkInfo } from './metrics/getNetworkInfo';
import { initPageInfo } from './metrics/getPageInfo';
// 初始化首次绘制（FP）指标的收集、存储和报告
import { initFP } from './metrics/getFP';
// 初始化首次内容绘制（FCP）指标的收集、存储和报告
import { initFCP } from './metrics/getFCP';
// 初始化首次输入延迟（FID）指标的收集、存储和报告
import { initFID } from './metrics/getFID';
// 初始化最大内容绘制（LCP）指标的收集、存储和报告
import { initLCP } from './metrics/getLCP';
// 初始化帧率（FPS）指标的收集、存储和报告
import { initFPS } from './metrics/getFPS';
// 初始化累积布局偏移（CLS）指标的监控和报告
import { initCLS } from './metrics/getCLS';
// 计算关键内容绘制（CCP）时间和资源加载（RL）信息，并将这些指标存储到指定的存储对象中
import { initCCP } from './metrics/getCCP';
import { metricsName } from './constants';

let metricsStore: MetricsStore;
let reporter: ReturnType<typeof createReporter>;

/**
 * 初始化 Web 性能指标的收集和报告
 * @param config - 配置对象，用于指定性能指标的收集和报告方式
 */

class WebVitals implements IWebVitals {
    immediately: boolean;
    private poorScoreThreshold: number;
    /**
     * 构造函数，初始化 WebVitals 实例
     * @param config - 配置对象，包含性能指标收集和报告所需的各种参数
     */
    constructor(config: IConfig) {
        // 从配置对象中解构出所需的参数，并设置默认值
        const {
            appId, // 应用的唯一标识符
            version, // 应用的版本号
            reportCallback, // 报告回调函数，用于处理性能指标的报告
            immediately = false, // 是否立即报告性能指标，默认为 false
            isCustomEvent = false, // 是否使用自定义事件，默认为 false
            logFpsCount = 5, // 计算帧率时记录的帧数，默认为 5
            apiConfig = {}, // API 配置对象
            hashHistory = true, // 是否使用哈希历史记录，默认为 true
            excludeRemotePath = [], // 排除的远程路径数组
            maxWaitCCPDuration = 30 * 1000, // 最大等待关键内容绘制的持续时间，默认为 30 秒
            scoreConfig = {}, // 计算指标得分的配置对象
            poorScoreThreshold = 60, // 定义评分较差的阈值，默认为60
        } = config;
    
        // 将是否立即报告的配置赋值给实例属性
        this.immediately = immediately;
        // 设置评分较差的阈值
        this.poorScoreThreshold = poorScoreThreshold;
    
        // 生成唯一的会话 ID
        const sessionId = generateUniqueID();
        // 将会话 ID 存储在 window 对象上
        window.__monitor_sessionId__ = sessionId;
        // 创建报告器，用于处理性能指标的报告
        reporter = createReporter(sessionId, appId, version, reportCallback);
        // 初始化性能指标存储对象
        metricsStore = new MetricsStore();
    
        // 初始化页面信息指标的收集和报告
        initPageInfo(metricsStore, reporter, immediately);
        // 初始化网络信息指标的收集和报告
        initNetworkInfo(metricsStore, reporter, immediately);
        // 初始化设备信息指标的收集和报告
        initDeviceInfo(metricsStore, reporter, immediately);
        // 初始化累积布局偏移（CLS）指标的监控和报告
        initCLS(metricsStore, reporter, immediately, scoreConfig);
        // 初始化最大内容绘制（LCP）指标的收集和报告
        initLCP(metricsStore, reporter, immediately, scoreConfig);
        // 初始化关键内容绘制（CCP）指标的收集和报告
        initCCP(
            metricsStore,
            reporter,
            isCustomEvent,
            apiConfig,
            hashHistory,
            excludeRemotePath,
            maxWaitCCPDuration,
            immediately,
            scoreConfig,
        );
    
        // 添加事件监听器，根据是否使用自定义事件选择监听的事件类型
        addEventListener(
            isCustomEvent ? metricsName.CCP : 'pageshow',
            () => {
                // 初始化首次绘制（FP）指标的收集和报告
                initFP(metricsStore, reporter, immediately, scoreConfig);
                // 初始化首次内容绘制（FCP）指标的收集和报告
                initFCP(metricsStore, reporter, immediately, scoreConfig);
            },
            { once: true, capture: true }, // 事件只触发一次，并且在捕获阶段触发
        );
    
        // 在页面加载完成后执行回调函数
        afterLoad(() => {
            // 初始化导航时间指标的收集和报告
            initNavigationTiming(metricsStore, reporter, immediately);
            // 初始化首次输入延迟（FID）指标的收集和报告
            initFID(metricsStore, reporter, immediately, scoreConfig);
            // 初始化帧率（FPS）指标的收集和报告
            initFPS(metricsStore, reporter, logFpsCount, immediately);
        });
    
        // 如果不立即报告指标，则在页面隐藏、即将卸载和卸载时报告指标
        [beforeUnload, unload, onHidden].forEach((fn) => {
            fn(() => {
                // 获取当前所有性能指标的值
                const metrics = this.getCurrentMetrics();
                // 如果存在性能指标且不立即报告，则调用报告器进行报告
                if (Object.keys(metrics).length > 0 && !immediately) {
                    reporter(metrics);
                }
            });
        });
    }
    /**
     * 获取当前所有性能指标的值
     * @returns {Object} 一个对象，key 是性能指标的名称，value 是对应的指标值
     */
    getCurrentMetrics(): IMetricsObj {
        return metricsStore.getValues();
    }

    /**
    * 静态方法，用于触发自定义事件
    * 此方法会创建一个自定义事件并在 document 对象上触发该事件
    */
    private static dispatchCustomEvent(): void {
        // 使用 CustomEvent 构造函数创建自定义事件，事件名称为 metricsName.CCP
        const event = new CustomEvent(metricsName.CCP, {
            bubbles: false, // 事件是否冒泡，设置为 false 表示该事件不会冒泡
            cancelable: true // 事件是否可以被取消，设置为 true 表示该事件可以被取消
        });
        // 在 document 对象上触发自定义事件
        document.dispatchEvent(event);
    }

    setStartMark(markName: string) {
        setMark(`${markName}_start`);
    }
     /**
     * 设置结束标记并计算性能指标
     * @param markName - 标记名称，用于标识性能测量的开始和结束点
     */
    setEndMark(markName: string): void {
        setMark(`${markName}_end`);

        if (hasMark(`${markName}_start`)) {
            const value = measure(`${markName}Metrics`, markName);
            this.clearMark(markName);

            const metrics = { name: `${markName}Metrics`, value };

            metricsStore.set(`${markName}Metrics`, metrics);
            if (this.immediately) {
                reporter(metrics);
            }
        } else {
            const value = getMark(`${markName}_end`)?.startTime;
            this.clearMark(markName);

            const metrics = { name: `${markName}Metrics`, value };

            metricsStore.set(`${markName}Metrics`, metrics);

            if (this.immediately) {
                reporter(metrics);
            }
        }
    }

    clearMark(markName: string) {
        clearMark(`${markName}_start`);
        clearMark(`${markName}_end`);
    }

    /**
     * 获取所有评分较差的性能指标
     * @returns {IMetricsObj} 评分较差的性能指标对象
     */
    getPoorMetrics(): IMetricsObj {
        const allMetrics = this.getCurrentMetrics();
        const poorMetrics: IMetricsObj = {};
        
        // 遍历所有指标，筛选出评分较差的指标
        Object.entries(allMetrics).forEach(([key, metrics]) => {
            if (metrics.score !== undefined && metrics.score < this.poorScoreThreshold) {
                poorMetrics[key] = metrics;
            }
        });
        
        return poorMetrics;
    }

    /**
     * 手动上报评分较差的性能指标
     */
    reportPoorMetrics(): void {
        const poorMetrics = this.getPoorMetrics();
        
        // 如果存在评分较差的指标，则进行上报
        if (Object.keys(poorMetrics).length > 0) {
            reporter(poorMetrics);
        }
    }
    /**
     * 触发自定义内容绘制事件
     * 该方法会在当前调用栈执行完毕后，触发一个自定义事件，用于通知相关的性能指标收集逻辑
     */
    customContentfulPaint() {
        setTimeout(() => {
            // 调用静态方法 dispatchCustomEvent 触发自定义事件
            WebVitals.dispatchCustomEvent();
        }, 0);
    }
}

export { WebVitals };