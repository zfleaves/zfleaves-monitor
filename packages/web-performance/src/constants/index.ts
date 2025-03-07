/**
 * 定义性能指标和信息类型的枚举
 */
export enum metricsName {
    /* performance metrics */
    /**
     * 导航时间指标，用于衡量页面导航的时间
     */
    NT = 'navigation-timing',
    /**
     * 首次绘制指标，记录页面首次绘制的时间
     */
    FP = 'first-paint',
    /**
     * 首次内容绘制指标，记录页面首次绘制文本、图像等内容的时间
     */
    FCP = 'first-contentful-paint',
    /**
     * 最大内容绘制指标，记录页面中最大内容元素绘制的时间
     */
    LCP = 'largest-contentful-paint',
    /**
     * 自定义内容绘制指标，可用于记录自定义的内容绘制时间
     */
    CCP = 'custom-contentful-paint',
    /**
     * 首次输入延迟指标，记录用户首次与页面交互时的延迟时间
     */
    FID = 'first-input-delay',
    /**
     * 资源加载指标，用于监控页面资源的加载情况
     */
    RL = 'resource-flow',
    /**
     * 累积布局偏移指标，衡量页面布局变化的累积程度
     */
    CLS = 'cumulative-layout-shift',
    /**
     * 帧率指标，记录页面的帧率
     */
    FPS = 'fps',
    /**
     * API 完成时间指标，记录 API 请求的完成时间
     */
    ACT = 'api-complete-time',
    /* information */
    /**
     * 设备信息，包含设备的相关信息
     */
    DI = 'device-information',
    /**
     * 网络信息，包含网络的相关信息
     */
    NI = 'network-information',
    /**
     * 页面信息，包含页面的相关信息
     */
    PI = 'page-information',
}