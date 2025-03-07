import { IMetrics, IPageInformation, IReportHandler } from '../types';
import { metricsName } from '../constants';
import metricsStore from '../lib/store';

/**
 * 获取当前页面的详细信息
 * @returns {IPageInformation} 包含页面信息的对象，如果浏览器不支持 location 对象则返回 undefined
 */
const getPageInfo = (): IPageInformation => {
    // 检查浏览器是否支持 location 对象
    if (!location) {
        // 若不支持，在控制台输出警告信息
        console.warn('browser do not support location');
        return;
    }
    // 从 location 对象中解构出所需的页面信息属性
    const { host, hostname, href, protocol, origin, port, pathname, search, hash } = location;
    // 从 window.screen 对象中解构出屏幕的宽度和高度
    const { width, height } = window.screen;

    // 返回包含页面信息和屏幕分辨率的对象
    return {
        // 主机名和端口号
        host,
        // 主机名
        hostname,
        // 完整的 URL
        href,
        // 协议类型
        protocol,
        // 源地址
        origin,
        // 端口号
        port,
        // 路径名
        pathname,
        // 查询字符串
        search,
        // 锚点
        hash,
        // 用户代理信息
        userAgent: 'userAgent' in navigator ? navigator.userAgent : '',
        // 屏幕分辨率，格式为宽度 x 高度
        screenResolution: `${width}x${height}`,
    };
}

export const initPageInfo = (
    store: metricsStore,
    report: IReportHandler,
    immediately: boolean = true,
): void => {
    const pageInfo: IPageInformation = getPageInfo();

    const metrics = { name: metricsName.PI, value: pageInfo } as IMetrics;

    store.set(metricsName.PI, metrics);

    if (immediately) {
        report(metrics);
    }
}