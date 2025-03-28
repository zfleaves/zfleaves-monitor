import { types } from "zfleaves-monitor-tools";

export interface MiniRoute {
    from: string;
    to: string;
    isFail?: boolean;
    message?: string;
}

export interface WxOnShareAppMessageBreadcrumb {
    path: string;
    query: types.IAnyObject;
    options: WechatMiniprogram.Page.IShareAppMessageOption;
}

export interface WxOnTabItemTapBreadcrumb {
    path: string;
    query: types.IAnyObject;
    options: WechatMiniprogram.Page.ITabItemTapOption;
}

export interface WxRequestErrorBreadcrumb {
    requestOptions: WechatMiniprogram.RequestOption;
    errMsg: string;
}

export interface WxLifeCycleBreadcrumb {
    path: string;
    query: types.IAnyObject;
}
