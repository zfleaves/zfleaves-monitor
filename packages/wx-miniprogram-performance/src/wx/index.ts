import Store from '../core/store'
import { WxPerformanceDataType, WxPerformanceItemType } from '../constant'
import HandleEvents from './handleEvents'
import { replaceApp, replaceComponent, replaceNetwork, replacePage } from './replace'
import { WxPerformanceItem } from '../types/index'

/**
 * 初始化内存警告监听
 * @param {Store} store - 用于存储性能数据的 Store 实例
 * @param {boolean} need - 是否需要开启内存警告监听
 */
export function initMemoryWarning(store: Store, need: boolean) {
    if (!need) return
    // 监听小程序内存警告事件
    wx.onMemoryWarning((res: WechatMiniprogram.OnMemoryWarningCallbackResult) => {
        store.push(WxPerformanceDataType.MEMORY_WARNING, res as WxPerformanceItem)
    })
}

/**
 * 当无法获取网络类型时，返回一个默认的网络类型信息
 * @template T - 继承自 WechatMiniprogram.GetNetworkTypeOption 的泛型类型
 * @param {T} [option] - 获取网络类型的选项，可选参数
 * @returns {WechatMiniprogram.PromisifySuccessResult<T, WechatMiniprogram.GetNetworkTypeOption>} - 返回一个 Promise，解析为包含默认网络类型信息的对象
 */
export function noNetworkType<T extends WechatMiniprogram.GetNetworkTypeOption = WechatMiniprogram.GetNetworkTypeOption>(
    option?: T
): WechatMiniprogram.PromisifySuccessResult<T, WechatMiniprogram.GetNetworkTypeOption> {
    // Bug 修复：删除多余的换行符，让 return 和 Promise.resolve 处于同一行
    return Promise.resolve({
        networkType: 'unknown',
        signalStrength: 0
    }) as WechatMiniprogram.PromisifySuccessResult<T, WechatMiniprogram.GetNetworkTypeOption>;
}

/**
 * 初始化网络信息获取方法
 * @param {Store} store - 用于存储性能数据的 Store 实例
 * @param {boolean} need - 是否需要使用原生的 wx.getNetworkType 方法获取网络信息
 */
export function initNetworkInfo(store: Store, need: boolean): void {
    // 根据 need 参数决定使用原生的 wx.getNetworkType 方法还是 noNetworkType 方法
    // 若 need 为 true，使用 wx.getNetworkType；若为 false，使用 noNetworkType 返回默认网络信息
    store.getNetworkType = need ? wx.getNetworkType : noNetworkType;
}

// 电量
function noBatteryInfo(): WechatMiniprogram.GetBatteryInfoSyncResult {
    return {
        level: '0',
        isCharging: false
    }
}

/**
 * 初始化电量信息获取方法
 * @param {Store} store - 用于存储性能数据的 Store 实例
 * @param {boolean} need - 是否需要使用原生的 wx.getBatteryInfoSync 方法获取电量信息
 */
export function initBatteryInfo(store: Store, need: boolean): void {
    store.getBatteryInfo = need ? wx.getBatteryInfoSync : noBatteryInfo
}

/**
 * 初始化微信小程序性能监控
 * @param {Store} store - 用于存储性能数据的 Store 实例
 */
export function initWxPerformance(store: Store) {
    const performance = wx.getPerformance()
    // 创建一个性能观察者，当性能数据发生变化时触发回调函数
    const observer = performance.createObserver((entryList) => {
        store.push(WxPerformanceDataType.WX_PERFORMANCE, entryList.getEntries())
    })
    // 开始观察指定类型的性能数据
    observer.observe({ entryTypes: ['navigation', 'render', 'script'] })
}

/**
 * 初始化微信小程序在应用隐藏时的数据上报功能
 * @param {Store} store - 用于存储性能数据的 Store 实例
 * @param {boolean} immediately - 是否立即上报数据
 * @param {boolean} onAppHideReport - 是否在应用隐藏时上报数据
 */
export function initWxHideReport(store: Store, immediately: boolean, onAppHideReport: boolean) {
    if (immediately || !onAppHideReport) return
    wx.onAppHide(() => {
        // 当应用隐藏时，调用 store 的 reportLeftData 方法上报剩余数据
        store.reportLeftData()
    })
}

/**
 * 初始化微信小程序的网络相关性能监控
 * @param {Store} store - 用于存储性能数据的 Store 实例
 */
// 网络请求性能和点击时间
export function initWxNetwork(store: Store) {
    // 遍历 HandleEvents 对象，为每个事件类型注册事件处理函数
    for (let k in HandleEvents) {
        // 为 store 实例注册事件监听器，当指定类型的事件触发时，调用对应的处理函数
        store.on(k as WxPerformanceItemType, HandleEvents[k])
    }
    replaceApp(store)
    replacePage(store)
    replaceComponent(store)
    replaceNetwork(store)
}
