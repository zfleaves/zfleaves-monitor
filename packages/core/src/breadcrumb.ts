// 导入面包屑类型和分类的定义
import { BreadCrumbTypes, BreadCrumbCategory } from "zfleaves-monitor-shared";
// 导入日志记录器、选项验证函数、时间戳获取函数、静默控制台作用域函数和支持对象
import { logger, validateOption, getTimestamp, silentConsoleScope, _support } from "zfleaves-monitor-utils";
// 导入面包屑推送数据类型和初始化选项类型
import { BreadcrumbPushData, InitOptions } from "zfleaves-monitor-type";

/**
 * 面包屑类，用于管理和记录应用程序中的事件信息。
 */
export class Breadcrumb {
    maxBreadcrumbs = 10;
    beforePushBreadcrumb: unknown = null;
    stack: BreadcrumbPushData[] = [];
    constructor() { }

    push(data: BreadcrumbPushData): void {
        if (typeof this.beforePushBreadcrumb === 'function') {
            let result: BreadcrumbPushData = null;
            const beforePushBreadcrumb = this.beforePushBreadcrumb;
            silentConsoleScope(() => {
                result = beforePushBreadcrumb(this, data);
            });
            if (!result) return;
            this.immediatePush(result);
            return;
        }
        this.immediatePush(data);
    }
    immediatePush(data: BreadcrumbPushData): void {
        data.time || (data.time = getTimestamp());
        if (this.stack.length >= this.maxBreadcrumbs) {
            this.shift();
        }
        this.stack.push(data);
        this.stack.sort((a, b) => a.time - b.time);
        logger.log(this.stack);
    }
    shift(): boolean {
        return this.stack.shift() !== undefined;
    }
    clear(): void {
        this.stack = [];
    }
    getStack(): BreadcrumbPushData[] {
        return this.stack;
    }
    getCategory(type: BreadCrumbTypes) {
        switch (type) {
            case BreadCrumbTypes.XHR:
            case BreadCrumbTypes.FETCH:
                return BreadCrumbCategory.HTTP;
            case BreadCrumbTypes.CLICK:
            case BreadCrumbTypes.ROUTE:
            case BreadCrumbTypes.TAP:
            case BreadCrumbTypes.TOUCHMOVE:
                return BreadCrumbCategory.USER;
            case BreadCrumbTypes.CUSTOMER:
            case BreadCrumbTypes.CONSOLE:
                return BreadCrumbCategory.DEBUG;
            case BreadCrumbTypes.APP_ON_LAUNCH:
            case BreadCrumbTypes.APP_ON_SHOW:
            case BreadCrumbTypes.APP_ON_HIDE:
            case BreadCrumbTypes.PAGE_ON_SHOW:
            case BreadCrumbTypes.PAGE_ON_HIDE:
            case BreadCrumbTypes.PAGE_ON_SHARE_APP_MESSAGE:
            case BreadCrumbTypes.PAGE_ON_SHARE_TIMELINE:
            case BreadCrumbTypes.PAGE_ON_TAB_ITEM_TAP:
                return BreadCrumbCategory.LIFECYCLE;
            case BreadCrumbTypes.UNHANDLEDREJECTION:
            case BreadCrumbTypes.CODE_ERROR:
            case BreadCrumbTypes.RESOURCE:
            case BreadCrumbTypes.VUE:
            case BreadCrumbTypes.REACT:
            default:
                return BreadCrumbCategory.EXCEPTION;
        }
    }
    bindOptions(options: InitOptions = {}): void {
        const { maxBreadcrumbs, beforePushBreadcrumb } = options;
        validateOption(maxBreadcrumbs, 'maxBreadcrumbs', 'number') &&
            (this.maxBreadcrumbs = maxBreadcrumbs);
        validateOption(beforePushBreadcrumb, 'beforePushBreadcrumb', 'function') &&
            (this.beforePushBreadcrumb = beforePushBreadcrumb);
    }
}
const breadcrumb = _support.breadcrumb || (_support.breadcrumb = new Breadcrumb());
export { breadcrumb };