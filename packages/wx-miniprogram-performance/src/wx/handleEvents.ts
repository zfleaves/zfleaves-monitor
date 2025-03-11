import Store from '../core/store';
import { WxPerformanceDataType, WxPerformanceItemType } from '../constant'
import { WxPerformanceItem, WxPerformanceAnyObj } from '../types/index'

/**
 * 向存储中推送小程序生命周期相关的性能数据
 * @param {Store} store - 用于存储性能数据的 Store 实例
 * @param {WxPerformanceItemType} itemType - 性能数据的类型，指示具体的生命周期事件
 * @returns {void}
 */
function pushLife(store: Store, itemType: WxPerformanceItemType) {
    // 调用 store 的 push 方法，将小程序生命周期类型的数据推送到存储中
    // 数据包含类型为 WX_LIFE_STYLE，具体的生命周期事件类型和当前时间戳
    store.push(WxPerformanceDataType.WX_LIFE_STYLE, { itemType, timestamp: Date.now() })
}

function pushAction(store: Store, data: WxPerformanceItem) {
    store.push(WxPerformanceDataType.WX_USER_ACTION, { ...data, timestamp: Date.now() })
}

function pushNetwork(store: Store, data: WxPerformanceItem) {
    store.push(WxPerformanceDataType.WX_NETWORK, { ...data, timestamp: Date.now() })
}

const Events = {
    [WxPerformanceItemType.AppOnLaunch](args: any[]) {
        const _this = this as Store
        const now = Date.now()
        _this.setLaunchTime(now)
        _this.push(WxPerformanceDataType.WX_LIFE_STYLE, { itemType: WxPerformanceItemType.AppOnLaunch, timestamp: now })
    },
    [WxPerformanceItemType.AppOnShow]() {
        pushLife(this, WxPerformanceItemType.AppOnShow)
    },
    [WxPerformanceItemType.PageOnLoad]() {
        pushLife(this, WxPerformanceItemType.PageOnLoad)
    },
    [WxPerformanceItemType.PageOnReady]() {
        pushLife(this, WxPerformanceItemType.PageOnReady)
    },
    [WxPerformanceItemType.PageOnUnload]() {
        pushLife(this, WxPerformanceItemType.PageOnUnload)
    },
    [WxPerformanceItemType.UserTap](event: WxPerformanceAnyObj) {
        pushAction(this, { ...event, itemType: WxPerformanceItemType.UserTap })
    },
    [WxPerformanceItemType.UserTouchMove](event: WxPerformanceAnyObj) {
        pushAction(this, { ...event, itemType: WxPerformanceItemType.UserTouchMove })
    },
    [WxPerformanceItemType.WxRequest](data: WxPerformanceItem) {
        pushNetwork(this, data)
    },
    [WxPerformanceItemType.WxDownloadFile](data: WxPerformanceItem) {
        pushNetwork(this, data)
    },
    [WxPerformanceItemType.WxUploadFile](data: WxPerformanceItem) {
        pushNetwork(this, data)
    }
}

export default Events;