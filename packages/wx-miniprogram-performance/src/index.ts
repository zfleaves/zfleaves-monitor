import { isWxMiniEnv } from "zfleaves-monitor-utils";
import {
    initBatteryInfo,
    initMemoryWarning,
    initNetworkInfo,
    initWxHideReport,
    initWxPerformance,
    initWxNetwork,
} from "./wx";
import Store from './core/store';
import { version } from "../package.json";
import { WxPerformanceInitOptions } from './types/index';

class WxPerformance {
    appId: string;
    version: string;
    private store: Store;

    /**
     * 构造函数，用于初始化微信小程序性能监控实例
     * @param {WxPerformanceInitOptions} options - 初始化配置选项
     * @param {string} options.appId - 应用的唯一标识符
     * @param {(data: any[]) => void} options.report - 数据上报函数
     * @param {boolean} [options.immediately=true] - 是否立即上报数据，默认为 true
     * @param {string[]} [options.ignoreUrl] - 需要忽略的 URL 列表
     * @param {number} [options.maxBreadcrumbs=10] - 最大面包屑数量，默认为 10
     * @param {boolean} [options.needNetworkStatus=true] - 是否需要网络状态信息，默认为 true
     * @param {boolean} [options.needBatteryInfo=true] - 是否需要电池信息，默认为 true
     * @param {boolean} [options.needMemoryWarning=true] - 是否需要内存警告信息，默认为 true
     * @param {boolean} [options.onAppHideReport=true] - 是否在应用隐藏时上报数据，默认为 true
     */
    constructor(options: WxPerformanceInitOptions) {
        // 检查是否在微信小程序环境中，如果不是则直接返回
        if (!isWxMiniEnv) return;

        // 解构赋值，从 options 中提取配置项，并设置默认值
        const {
            appId,
            report,
            immediately = true,
            ignoreUrl,
            maxBreadcrumbs = 10,
            needNetworkStatus = true,
            needBatteryInfo = true,
            needMemoryWarning = true,
            onAppHideReport = true,
        } = options;

        // 将 appId 赋值给实例属性
        this.appId = appId;
        // 将版本号赋值给实例属性
        this.version = version;

        // 创建一个 Store 实例，用于存储和管理性能数据
        const store = new Store({ appId, report, immediately, ignoreUrl, maxBreadcrumbs });
        // 将 Store 实例赋值给实例属性
        this.store = store;

        // 初始化电池信息监控
        initBatteryInfo(store, needBatteryInfo);
        // 初始化网络信息监控
        initNetworkInfo(store, needNetworkStatus);
        // 初始化内存警告监控
        initMemoryWarning(store, needMemoryWarning);
        // 如果 immediately 为 false，会在 appHide 的时候发送数据
        initWxHideReport(store, immediately, onAppHideReport);
        // 初始化微信小程序性能监控
        initWxPerformance(store);
        // 初始化微信小程序网络性能监控
        initWxNetwork(store);
    }

    /**
     * 调用自定义绘制相关的性能数据记录方法
     * 该方法会调用 store 实例的 customPaint 方法，用于记录自定义绘制的性能数据
     */
    customPaint() {
        // 调用 store 实例的 customPaint 方法
        this.store.customPaint();
    }
}

export { WxPerformance };