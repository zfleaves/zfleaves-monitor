import { utils, types } from "zfleaves-monitor-tools";
const { setUrlQuery, variableTypeDetection } = utils;

/**
 * 获取页面返回时的目标 URL
 * @param delta - 返回的页面数，如果未提供则默认为 1。如果 delta 大于现有页面数，则返回到首页
 * @returns 返回目标页面的 URL，如果在 App 里调用且页面还未生成则返回 'App'，如果 getCurrentPages 不是函数则返回空字符串
 */
export function getNavigateBackTargetUrl(delta: number | undefined) {
    if (!variableTypeDetection.isFunction(getCurrentPages)) {
        return '';
    }
    const pages = getCurrentPages(); // 在App里调用该方法，页面还没有生成，长度为0
    if (!pages.length) {
        return 'App';
    }
    delta = delta || 1;
    const toPage = pages[pages.length - delta];
    // 将目标页面的路由和参数组合成完整的 URL 并返回
    return setUrlQuery(toPage.route, toPage.options);
}

/**
 * 将微信小程序事件的目标元素信息转换为字符串表示
 * @param e - 微信小程序的基础事件对象
 * @returns 返回一个字符串，该字符串包含目标元素的 id 和数据集信息
 */
export function targetAsString(e: WechatMiniprogram.BaseEvent): string {
    const id = e.currentTarget?.id ? ` id="${e.currentTarget?.id}"` : '';
    const dataSets = Object.keys(e.currentTarget.dataset).map((key) => {
        return `data-${key}=${e.currentTarget.dataset[key]}`;
    });
    return `<element ${id} ${dataSets.join(' ')}/>`;
}

/**
 * 获取微信小程序的设备信息
 * @returns 返回一个 Promise，该 Promise 解析为一个包含设备信息的对象
 */
export async function getWxMiniDeviceInfo(): Promise<types.DeviceInfo> {
    // 同步获取系统信息，提取像素比、屏幕高度和屏幕宽度
    const { pixelRatio, screenHeight, screenWidth } = wx.getSystemInfoSync();
    // 异步获取微信小程序的网络类型
    const netType = await getWxMiniNetWorkType();
    // 返回包含设备信息的对象
    return {
        // 设备像素比
        ratio: pixelRatio,
        // 设备屏幕高度
        clientHeight: screenHeight,
        // 设备屏幕宽度
        clientWidth: screenWidth,
        // 设备网络类型
        netType,
    };
}
/**
 * 获取微信小程序的网络类型
 * @returns 返回一个 Promise，该 Promise 解析为一个字符串，表示微信小程序的网络类型。
 *          如果获取成功，返回具体的网络类型（如 'wifi', '4g' 等）；
 *          如果获取失败，返回 'getNetWorkType failed'。
 */
export async function getWxMiniNetWorkType(): Promise<string> {
    return new Promise((resolve) => {
        wx.getNetworkType({
            success(res) {
                resolve(res.networkType);
            },
            fail(err) {
                console.error(`获取微信小程序网络类型失败:${err}`);
                resolve('getNetWorkType failed');
            },
        });
    });
}
