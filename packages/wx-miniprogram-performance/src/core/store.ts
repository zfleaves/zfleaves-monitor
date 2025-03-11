import { noop, getDeviceId, getPageUrl } from "../utils";
import { generateUUID, validateOption, toStringValidateOption } from 'zfleaves-monitor-utils';
import { WxPerformanceDataType, WxPerformanceItemType } from '../constant';
import Event from "./event";
import {
    WxPerformanceData,
    WxPerformanceAnyObj,
    WxPerformanceInitOptions,
    WxNetworkType,
    WxPerformanceItem,
    WxPerformanceEntryObj,
} from '../types/index';

class Store extends Event {
    appId: string;
    report: (data: WxPerformanceData[]) => void;
    immediately?: boolean;
    ignoreUrl?: RegExp;
    maxBreadcrumbs?: number;

    private stack: WxPerformanceData[];

    // wx
    getBatteryInfo: () => WechatMiniprogram.GetBatteryInfoSyncResult;
    getNetworkType: <
        T extends WechatMiniprogram.GetNetworkTypeOption = WechatMiniprogram.GetNetworkTypeOption,
    >(
        option?: T,
    ) => WechatMiniprogram.PromisifySuccessResult<T, WechatMiniprogram.GetNetworkTypeOption>;
    systemInfo: WechatMiniprogram.SystemInfo;

    // 小程序launch时间
    wxLaunchTime: number;

    // 首次点击标志位
    private firstAction: boolean = false;

    // 路由跳转start时间记录
    private navigationMap: WxPerformanceAnyObj = {};

    constructor(options: WxPerformanceInitOptions) {
        super();
        const { appId, report, maxBreadcrumbs, immediately, ignoreUrl } = options;
        validateOption(appId, 'appId', 'string') && (this.appId = appId);
        validateOption(maxBreadcrumbs, 'maxBreadcrumbs', 'number') && (this.maxBreadcrumbs = maxBreadcrumbs);
        toStringValidateOption(ignoreUrl, 'ignoreUrl', '[object RegExp]') && (this.ignoreUrl = ignoreUrl);
        validateOption(immediately, 'immediately', 'boolean') && (this.immediately = immediately);

        this.report = validateOption(report, 'report', 'function') ? report : noop;
        this.stack = [];
    }

    async _pushData(data: WxPerformanceData[]) {
        if (this.immediately) {
            this.report(data);
            return;
        }
        this.stack = this.stack.concat(data);
        if (this.stack.length >= this.maxBreadcrumbs!) {
            this.reportLeftData();
        }
    }

    /**
     * 上报存储在栈中的剩余性能数据，并清空栈
     * 该方法会将存储在 stack 中的所有性能数据通过 report 方法进行上报，
     * 上报完成后，将 stack 数组清空，以便后续继续存储新的性能数据。
     */
    async reportLeftData() {
        this.report([...this.stack]);
        this.stack = [];
    }

    _getSystemInfo(): WechatMiniprogram.SystemInfo {
        !this.systemInfo && (this.systemInfo = wx.getSystemInfoSync());
        return this.systemInfo;
    }

    async _getNetworkType(): Promise<WxNetworkType> {
        let nk = {
            networkType: 'none',
            errMsg: '',
        } as WechatMiniprogram.GetNetworkTypeSuccessCallbackResult;
        try {
            nk = await wx.getNetworkType(); // 异步获取
        } catch (err) {
            console.warn(`getNetworkType err = `, err);
        }
        return nk.networkType;
    }

    async _createPerformanceData(
        type: WxPerformanceDataType,
        item: WxPerformanceItem[]
    ): Promise<WxPerformanceData> {
        const networkType = await this._getNetworkType();
        const date = new Date();
        return {
            appId: this.appId,
            timestamp: date.getTime(),
            time: date.toLocaleString(),
            uuid: generateUUID(),
            deviceId: getDeviceId(),
            networkType: networkType,
            batteryLevel: this.getBatteryInfo().level,
            systemInfo: this._getSystemInfo(),
            wxLaunch: this.wxLaunchTime,
            page: getPageUrl(),
            type: type,
            item: item,
        }
    }

    push(type: WxPerformanceDataType, data: WxPerformanceItem | Array<WxPerformanceItem>) {
        switch (type) {
            case WxPerformanceDataType.WX_LIFE_STYLE:
            case WxPerformanceDataType.WX_NETWORK:
                this.simpleHandle(type, data as WxPerformanceItem);
                break;
            case WxPerformanceDataType.MEMORY_WARNING:
                this.handleMemoryWarning(data as WechatMiniprogram.OnMemoryWarningCallbackResult);
                break;
            case WxPerformanceDataType.WX_PERFORMANCE:
                this.handleWxPerformance(data as Array<WxPerformanceItem>);
                break;
            case WxPerformanceDataType.WX_USER_ACTION:
                this.handleWxAction(data as WxPerformanceItem);
            default:
                break;
        }
    }

    async simpleHandle(type: WxPerformanceDataType, data: WxPerformanceItem) {
        let d = await this._createPerformanceData(type as WxPerformanceDataType, [data]);
        this._pushData([d]);
    }

    // 内存警告会立即上报
    async handleMemoryWarning(data: WechatMiniprogram.OnMemoryWarningCallbackResult) {
        let d = await this._createPerformanceData(WxPerformanceDataType.MEMORY_WARNING, [
            { ...data, itemType: WxPerformanceItemType.MemoryWarning, timestamp: Date.now() },
        ]);
        this.report([d]);
    }

    buildNavigationStart(entry: WxPerformanceEntryObj) {
        if (entry.entryType === 'navigation') {
            // appLaunch时没有navigationStart
            this.navigationMap[entry.path] = entry.navigationStart || entry.startTime;
        }
    }

    async handleWxPerformance(data: Array<WxPerformanceItem> = []) {
        const _data: Array<WxPerformanceItem> = data.map((d) => {
            this.buildNavigationStart(d);
            d.itemType = WxPerformanceItemType.Performance;
            d.timestamp = Date.now();
            return d;
        });
        const item = await this._createPerformanceData(WxPerformanceDataType.WX_PERFORMANCE, _data);
        this._pushData([item]);
    }

    // 只统计首次点击
    async handleWxAction(data: WxPerformanceItem) {
        if (!this.firstAction) {
            let d = await this._createPerformanceData(WxPerformanceDataType.WX_USER_ACTION, [data]);
            this._pushData([d]);
            this.firstAction = true;
        }
    }

    setLaunchTime(now: number) {
        this.wxLaunchTime = now;
    }

    filterUrl(url: string) {
        if (this.ignoreUrl && this.ignoreUrl.test(url)) return true;
        return false;
    }
    /**
     * 创建页面加载性能数据
     * 使用 _createPerformanceData 方法创建一个性能数据对象
     * 数据类型为 WxPerformanceDataType.WX_LIFE_STYLE，
     * 包含一个性能项，类型为 WxPerformanceItemType.WxCustomPaint
     * 记录了导航开始时间、时间戳和绘制持续时间
     */
    customPaint() {
        const now = Date.now();
        const path = getPageUrl(false);
        setTimeout(async () => {
            if (path && this.navigationMap[path]) {
                const navigationStart = this.navigationMap[path];
                const data = await this._createPerformanceData(WxPerformanceDataType.WX_LIFE_STYLE, [
                    {
                        itemType: WxPerformanceItemType.WxCustomPaint,
                        navigationStart: navigationStart,
                        timestamp: now,
                        duration: now - navigationStart,
                    },
                ]);
                this._pushData([data]);
            }
        }, 1000)
    }
}

export default Store;